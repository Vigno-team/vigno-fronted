/**
 * Operaciones administrativas de Vigno.
 * No se guarda el valor de la clave en el código ni en ningún archivo .env.
 * Nombre del header (público) definido por el contrato: X-Api-Key.
 * NOTA: confirmar con Swagger que los campos multipart son "archivo" y "estacion".
 */
import { apiUrl } from "./api";
const CLAVE_SESION = "vigno-clave-administracion";

export const leerClaveSesion = () => sessionStorage.getItem(CLAVE_SESION) || "";
export const guardarClaveSesion = (valor) => {
  if (valor.trim()) sessionStorage.setItem(CLAVE_SESION, valor);
  else sessionStorage.removeItem(CLAVE_SESION);
};
export const borrarClaveSesion = () => sessionStorage.removeItem(CLAVE_SESION);

export class ErrorCarga extends Error {
  constructor(status, detalle, respuesta) {
    super(detalle);
    this.name = "ErrorCarga";
    this.status = status;
    this.respuesta = respuesta;
  }
}

async function pedir(ruta, { metodo = "GET", clave, cuerpo, signal } = {}) {
  if (!clave?.trim()) throw new ErrorCarga(401, "Ingresa la clave de administración para continuar.");
  const url = apiUrl(`/v1${ruta}`);
  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: { "X-Api-Key": clave.trim(), Accept: "application/json" },
      body: cuerpo,
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ErrorCarga(0, `No se pudo conectar con el backend: ${error.message}`);
  }
  const texto = await respuesta.text();
  let datos;
  try { datos = texto ? JSON.parse(texto) : null; }
  catch { datos = texto; }
  if (!respuesta.ok) {
    const detalle = typeof datos?.detail === "string" ? datos.detail
      : typeof datos?.detalle === "string" ? datos.detalle
      : typeof datos?.mensaje === "string" ? datos.mensaje
      : `HTTP ${respuesta.status}: la operación no pudo completarse.`;
    throw new ErrorCarga(respuesta.status, detalle, datos);
  }
  return datos;
}

function formularioExcel(archivo, codigo) {
  const cuerpo = new FormData();
  cuerpo.append("archivo", archivo);
  cuerpo.append("estacion", codigo);
  return cuerpo;
}

export const prevalidarExcel = (archivo, codigo, clave, signal) =>
  pedir("/cargas?solo_validar=1", {
    metodo: "POST", clave, cuerpo: formularioExcel(archivo, codigo), signal,
  });

export const confirmarExcel = (archivo, codigo, clave) =>
  pedir("/cargas", {
    metodo: "POST", clave, cuerpo: formularioExcel(archivo, codigo),
  });

export const obtenerHistorialCargas = (clave, signal) =>
  pedir("/cargas", { clave, signal });

// JSON de estaciones: requiere Content-Type, a diferencia del multipart.
export async function registrarEstacion(localidad, clave) {
  if (!clave?.trim()) throw new ErrorCarga(401, "Ingresa la clave de administración.");
  const url = apiUrl("/v1/estaciones");
  const respuesta = await fetch(url, {
    method: "POST",
    headers: { "X-Api-Key": clave.trim(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(localidad),
  });
  const texto = await respuesta.text();
  let datos;
  try { datos = texto ? JSON.parse(texto) : null; } catch { datos = texto; }
  if (!respuesta.ok) {
    const detalle = typeof datos?.detail === "string" ? datos.detail : `HTTP ${respuesta.status} al crear estación.`;
    throw new ErrorCarga(respuesta.status, detalle, datos);
  }
  return datos;
}
