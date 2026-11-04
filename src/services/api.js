// Todas las peticiones al backend pasan por este archivo.
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, "");
export const apiUrl = (ruta) => `${API_BASE}/${ruta.replace(/^\/+/, "")}`;

export async function pedirApi(ruta, opciones = {}) {
  const { headers = {}, body, ...resto } = opciones;
  let respuesta;

  try {
    respuesta = await fetch(apiUrl(ruta), {
      ...resto,
      headers: {
        Accept: "application/json",
        ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(`No se pudo conectar con Django (${API_BASE}). Verifica que el backend esté encendido.`, { cause: error });
  }

  if (!respuesta.ok) {
    if (respuesta.status === 503 && ruta === "/v1/datos") {
      throw new Error("Django aún no tiene resultados. Ejecuta: docker compose exec backend python manage.py actualizar_todo --sin-satelite");
    }
    if (respuesta.status === 503 && ruta.startsWith("/v1/correcciones")) {
      throw new Error("Django guardó la corrección, pero el recálculo quedó pendiente. No repitas el envío; consulta el historial.");
    }
    if (respuesta.status === 401 || respuesta.status === 403) {
      throw new Error("Acceso denegado por Django. Revisa tus permisos.");
    }
    throw new Error(`Django respondió HTTP ${respuesta.status} al consultar ${ruta}.`);
  }

  if (respuesta.status === 204) return null;
  const tipo = respuesta.headers.get("content-type") || "";
  if (!tipo.includes("json")) throw new Error(`Django no devolvió JSON en ${ruta}.`);
  return respuesta.json();
}
