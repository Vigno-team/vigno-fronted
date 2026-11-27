// Todas las peticiones al backend pasan por este archivo.
import { obtenerAccessVigente, refreshAccessToken } from "./authService";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, "");
export const apiUrl = (ruta) => {
  if (/^https?:\/\//i.test(ruta)) return ruta; // Otra API externa
  if (ruta.endsWith(".json")) return `/${ruta.replace(/^\/+/, "")}`; // JSON local en public/
  return `${API_BASE}/${ruta.replace(/^\/+/, "")}`; // Endpoint de Django
};

const limpiarSesion = () => {
  sessionStorage.removeItem("access");
  sessionStorage.removeItem("refresh");
  sessionStorage.removeItem("usuario");
};

export async function pedirApi(ruta, opciones = {}) {
  const { headers = {}, body, ...resto } = opciones;
  let respuesta;

  const hacerPeticion = (token) =>
    fetch(apiUrl(ruta), {
      ...resto,
      headers: {
        Accept: "application/json",
        ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
    });

  // Si el token está por vencer, se renueva antes de hacer el GET/POST.
  const tokenAnterior = sessionStorage.getItem("access");
  let access;
  try {
    access = await obtenerAccessVigente();
    if (tokenAnterior && !access) throw new Error("Sesión expirada");
  } catch {
    limpiarSesion();
    window.location.href = "/login";
    throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
  }

  try {
    respuesta = await hacerPeticion(access);
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(`No se pudo conectar con Django (${API_BASE}). Verifica que el backend esté encendido.`, { cause: error });
  }

  if (respuesta.status === 401 && sessionStorage.getItem("refresh")) {
    try {
      const nuevoAccess = await refreshAccessToken();
      respuesta = await hacerPeticion(nuevoAccess);
    } catch (error) {
      if (error.name === "AbortError") throw error;
      limpiarSesion();
      window.location.href = "/login";
      throw new Error("Sesión expirada.");
    }
  }

  if (!respuesta.ok) {
    if (respuesta.status === 503 && ruta === "/v1/datos") {
      throw new Error("Django aún no tiene resultados. Ejecuta: docker compose exec backend python manage.py actualizar_todo --sin-satelite");
    }
    if (respuesta.status === 503 && ruta.startsWith("/v1/correcciones")) {
      throw new Error("Django guardó la corrección, pero el recálculo quedó pendiente. No repitas el envío; consulta el historial.");
    }
    if (respuesta.status === 403) {
      throw new Error("No tienes permisos para esta acción");
    }
    if (respuesta.status === 401) {
      limpiarSesion();
      window.location.href = "/login";
      throw new Error("Acceso denegado por Django. Revisa tus permisos.");
    }
    // Mostrar el mensaje de validación de Django, especialmente en correcciones.
    const detalle = await respuesta.json().catch(() => null);
    const mensaje = typeof detalle?.detail === "string" ? detalle.detail
      : typeof detalle?.error === "string" ? detalle.error
      : detalle?.errores ? JSON.stringify(detalle.errores)
      : detalle?.non_field_errors ? JSON.stringify(detalle.non_field_errors)
      : `Django respondió HTTP ${respuesta.status} al consultar ${ruta}.`;
    throw new Error(mensaje);
  }

  if (respuesta.status === 204) return null;
  const tipo = respuesta.headers.get("content-type") || "";
  if (!tipo.includes("json")) throw new Error(`Django no devolvió JSON en ${ruta}.`);
  return respuesta.json();
}