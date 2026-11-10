// Excel y estaciones: endpoints existentes de Django, con la sesión JWT de Vigno.
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
      const nuevo = await refreshAccessToken();
      respuesta = await enviar(nuevo);
    }
  } catch (error) {
    if (error.name === "AbortError" || error instanceof ErrorCarga) throw error;
    throw new ErrorCarga(0, "No se pudo conectar con Django. Revisa que Docker esté encendido y la URL del backend.");
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const mensaje = respuesta.status === 401 ? "Sesión vencida. Vuelve a iniciar sesión."
      : respuesta.status === 403 ? (method === "DELETE" ? "Solo un administrador puede desactivar estaciones." : "Tu cuenta no tiene permiso para esta operación.")
      : respuesta.status === 422 ? "El archivo contiene errores. Revisa los motivos."
      : respuesta.status === 404 ? "La ruta no existe en el backend."
      : datos?.detail || `Django respondió HTTP ${respuesta.status}.`;
    throw new ErrorCarga(respuesta.status, mensaje, datos);
  }
  return datos;
}

function formulario(archivo, estacion) {
  const datos = new FormData();
  datos.append("archivo", archivo);
  datos.append("estacion", estacion);
  return datos;
}

export const prevalidarExcel = (archivo, estacion, signal) =>
  pedir("/cargas?solo_validar=1", { method: "POST", body: formulario(archivo, estacion), signal });

export const confirmarExcel = (archivo, estacion) =>
  pedir("/cargas", { method: "POST", body: formulario(archivo, estacion) });

// Django devuelve hasta las 20 cargas más recientes (de todas las estaciones).
export const obtenerHistorialCargas = (signal) => pedir("/cargas", { signal });
export const registrarEstacion = (estacion) => pedir("/estaciones", { method: "POST", body: estacion });

// Django desactiva (activa=false), sin borrar mediciones.
export const eliminarEstacion = (codigo) =>
  pedir(`/estaciones/${encodeURIComponent(codigo)}`, { method: "DELETE" });
