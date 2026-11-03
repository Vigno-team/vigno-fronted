
const BASE = `${
  (import.meta.env.VITE_API_BASE_URL || "/api")
    .replace(/\/+$/, "")
}/v1`;

export class VignoApiError extends Error {
  constructor(mensaje, estado, ruta) {
    super(mensaje);
    this.name = "VignoApiError";
    this.status = estado;
    this.ruta = ruta;
  }
}

async function peticion(ruta, { parametros = {}, signal } = {}) {
  const url = new URL(`${BASE}${ruta}`, window.location.origin);

  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== null && valor !== undefined && valor !== "") {
      url.searchParams.set(clave, String(valor));
    }
  }

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error(`No se pudo conectar con ${url.pathname}. Revisa Docker y el proxy de Vite. ${error.message}`);
  }

  if (!respuesta.ok) {
    let detalle = "";
    try {
      const cuerpo = await respuesta.json();
      detalle = typeof cuerpo?.detail === "string" ? cuerpo.detail :
        typeof cuerpo?.mensaje === "string" ? cuerpo.mensaje : "";
    } catch { /* Algunos errores llegan sin JSON. */ }
    throw new VignoApiError(
      `HTTP ${respuesta.status} en ${url.pathname}${detalle ? `: ${detalle}` : ""}`,
      respuesta.status,
      url.pathname,
    );
  }

  try {
    return await respuesta.json();
  } catch {
    throw new Error(`Respuesta inválida: ${url.pathname} no entregó JSON.`);
  }
}

export const obtenerEstacionesApi = (signal) =>
  peticion("/estaciones", { signal });

export const obtenerTemporadasApi = (signal) =>
  peticion("/temporadas", { signal });

export const obtenerFichaApi = (temporada, codigo, signal) =>
  peticion(`/temporadas/${encodeURIComponent(temporada)}`, {
    parametros: { estacion: codigo }, signal,
  });

export const obtenerRachasApi = (temporada, codigo, signal) =>
  peticion(`/rachas/${encodeURIComponent(temporada)}`, {
    parametros: { estacion: codigo }, signal,
  });

/** Rutas opcionales: se prueban en tiempo de ejecución. */
export const obtenerResumenDiarioApi = (codigo, desde, hasta, signal) =>
  peticion("/resumen-diario", {
    parametros: { estacion: codigo, desde, hasta }, signal,
  });

export const obtenerCompletitudApi = (codigo, signal) =>
  peticion("/completitud", {
    parametros: { estacion: codigo }, signal,
  });

/** JSON consolidado para alimentar el frontend (ruta confirmada en Swagger). */
export const obtenerDatosApi = (signal) =>
  peticion("/datos", { signal });
