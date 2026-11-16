import { apiUrl } from "./api";
import { refreshAccessToken } from "./authService";

function extraerMensajeError(datos, status) {
  if (status === 401) {
    return "Sesión expirada. Vuelve a iniciar sesión.";
  }
  if (!datos || typeof datos !== "object") {
    if (status === 403) {
      return "No tienes permisos para esta acción";
    }
    return "Error en el servidor (HTTP " + status + ").";
  }

  if (typeof datos.detail === "string") {
    return datos.detail;
  }
  if (typeof datos.mensaje === "string") {
    return datos.mensaje;
  }
  if (Array.isArray(datos.errores) && datos.errores.length > 0) {
    return datos.errores.join(". ");
  }

  const campos = ["email", "correo", "clave_temporal", "password", "nombre", "rol", "non_field_errors"];
  for (let i = 0; i < campos.length; i++) {
    const campo = campos[i];
    if (Array.isArray(datos[campo]) && datos[campo].length > 0) {
      return String(datos[campo][0]);
    }
    if (typeof datos[campo] === "string") {
      return datos[campo];
    }
  }

  if (status === 403) {
    return "No tienes permisos para esta acción";
  }

  return "No se pudo completar la operación.";
}

async function peticionUsuarios(ruta, opciones = {}) {
  const { method = "GET", body } = opciones;
  const token = sessionStorage.getItem("access");

  const enviar = (access) =>
    fetch(apiUrl("/v1" + ruta), {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(access ? { Authorization: "Bearer " + access } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

  let respuesta;
  try {
    respuesta = await enviar(token);
  } catch (error) {
    throw new Error("No se pudo conectar con Django. Verifica que el backend esté encendido.");
  }

  if (respuesta.status === 401 && sessionStorage.getItem("refresh")) {
    try {
      const nuevoToken = await refreshAccessToken();
      respuesta = await enviar(nuevoToken);
    } catch (error) {
      sessionStorage.removeItem("access");
      sessionStorage.removeItem("refresh");
      sessionStorage.removeItem("usuario");
      window.location.href = "/login";
      throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
    }
  }

  if (respuesta.status === 401) {
    sessionStorage.removeItem("access");
    sessionStorage.removeItem("refresh");
    sessionStorage.removeItem("usuario");
    window.location.href = "/login";
    throw new Error("Sesión expirada. Vuelve a iniciar sesión.");
  }

  if (respuesta.status === 204) {
    return null;
  }

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(extraerMensajeError(datos, respuesta.status));
  }

  return datos;
}

export async function obtenerUsuarios(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.rol) {
    params.append("rol", filtros.rol);
  }
  if (filtros.activo !== "" && filtros.activo !== undefined) {
    params.append("activo", filtros.activo);
  }
  const query = params.toString();
  const ruta = query ? "/usuarios?" + query : "/usuarios";
  const data = await peticionUsuarios(ruta);

  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  if (Array.isArray(data?.usuarios)) {
    return data.usuarios;
  }
  return [];
}

export function crearUsuario(datos) {
  return peticionUsuarios("/usuarios", {
    method: "POST",
    body: datos,
  });
}

export function editarUsuario(id, datos) {
  return peticionUsuarios("/usuarios/" + encodeURIComponent(id), {
    method: "PATCH",
    body: datos,
  });
}

export function desactivarUsuario(id) {
  return peticionUsuarios("/usuarios/" + encodeURIComponent(id), {
    method: "DELETE",
  });
}

export function restablecerClaveUsuario(id, claveTemporal) {
  return peticionUsuarios("/usuarios/" + encodeURIComponent(id) + "/restablecer-clave", {
    method: "POST",
    body: { clave_temporal: claveTemporal },
  });
}