// Peticiones de Gestión de datos: el backend aplica los permisos del token JWT.
import { apiUrl } from "./api";
import { refreshAccessToken } from "./authService";

export class ErrorCarga extends Error {
  constructor(status, mensaje, datos) {
    super(mensaje);
    this.name = "ErrorCarga";
    this.status = status;
    this.respuesta = datos;
  }
}

async function pedir(ruta, { method = "GET", body, signal } = {}) {
  const token = sessionStorage.getItem("access");
  if (!token) throw new ErrorCarga(401, "Inicia sesión para administrar datos.");

  const enviar = (access) => fetch(apiUrl(`/v1${ruta}`), {
    method, signal, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${access}`,
      Accept: "application/json",
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    },
  });

  let respuesta;
  try {
    respuesta = await enviar(token);
    if (respuesta.status === 401 && sessionStorage.getItem("refresh")) {
      respuesta = await enviar(await refreshAccessToken());
    }
  } catch (error) {
    if (error.name === "AbortError" || error instanceof ErrorCarga) throw error;
    throw new ErrorCarga(0, "No se pudo conectar con Django. Revisa Docker y la URL del backend.");
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const motivo = datos?.detail || (Array.isArray(datos?.errores) ? datos.errores.join(". ") : null);
    const mensaje = respuesta.status === 401 ? "Sesión vencida. Inicia sesión nuevamente."
      : respuesta.status === 403 ? "Tu cuenta no tiene permiso para esta operación."
      : motivo || `Django respondió HTTP ${respuesta.status}.`;
    throw new ErrorCarga(respuesta.status, mensaje, datos);
  }
  return datos;
}

function formulario(archivo, estacion, variables) {
  const datos = new FormData();
  datos.append("archivo", archivo);
  datos.append("estacion", estacion);
  if (variables !== undefined) datos.append("variables", JSON.stringify(variables));
  return datos;
}

// La prevalidación no guarda nada. Si el administrador selecciona columnas,
// confirmar debe enviar exactamente esa misma selección.
export const prevalidarExcel = (archivo, estacion, signal, variables) =>
  pedir("/cargas?solo_validar=1", { method: "POST", body: formulario(archivo, estacion, variables), signal });
export const confirmarExcel = (archivo, estacion, variables) =>
  pedir("/cargas", { method: "POST", body: formulario(archivo, estacion, variables) });

export const obtenerHistorialCargas = (signal) => pedir("/cargas", { signal });
export const obtenerDetalleCarga = (id) => pedir(`/cargas/${encodeURIComponent(id)}`);
export const cambiarColumnasCarga = (id, variablesExcluidas) =>
  pedir(`/cargas/${encodeURIComponent(id)}`, {
    method: "PATCH", body: { variables_excluidas: variablesExcluidas },
  });
export const obtenerVariables = () => pedir("/variables");

export const obtenerEstaciones = (incluirInactivas = false) =>
  pedir(`/estaciones${incluirInactivas ? "?incluir_inactivas=1" : ""}`);
export const registrarEstacion = (datos) => pedir("/estaciones", { method: "POST", body: datos });
export const editarEstacion = (codigo, datos) =>
  pedir(`/estaciones/${encodeURIComponent(codigo)}`, { method: "PATCH", body: datos });
export const eliminarEstacion = (codigo) =>
  pedir(`/estaciones/${encodeURIComponent(codigo)}`, { method: "DELETE" });
export const reactivarEstacion = (codigo) =>
  pedir(`/estaciones/${encodeURIComponent(codigo)}/reactivar`, { method: "POST" });
