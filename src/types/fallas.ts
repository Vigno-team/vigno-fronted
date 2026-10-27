export type TipoFalla = "rechazado" | "nulo" | "sin_registro" | "fuera_de_rango";
export type VariableMetereologica = "tmax" | "tmin" | "precipitacion" | "tmedia";
export type EstadoCorreccion = "pendiente" | "corregido" | "descartado";

export interface RegistroFalla {
  id: string;
  fecha: string;
  variable: VariableMetereologica;
  tipoFalla: TipoFalla;
  valorOriginal: number | string | null;
  archivoOrigen: string;
  fila: number;
  motivo: string;
  estadoCorreccion: EstadoCorreccion;
}

export interface ResumenTiposFalla {
  rechazado: number;
  nulo: number;
  sin_registro: number;
  fuera_de_rango: number;
}

export interface ResumenVariablesFalla {
  tmax: number;
  tmin: number;
  precipitacion: number;
}

export interface ResumenFallas {
  totalFallas: number;
  porTipo: ResumenTiposFalla;
  porVariable: ResumenVariablesFalla;
}

export interface FallasResponse {
  estacionId: string;
  temporada: string;
  resumen: ResumenFallas;
  fallas: RegistroFalla[];
  paginacion: {
    paginaActual: number;
    totalPaginas: number;
    totalRegistros: number;
    registrosPorPagina: number;
  };
}