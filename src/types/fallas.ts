export type TipoFalla = "rechazado" | "nulo" | "sin_registro" | "fuera_de_rango";
export type EstadoCorreccion = "pendiente" | "corregido" | "descartado";

export interface RegistroFalla {
  id: string;
  fecha: string;
  timestamp: string | null;
  variable: string;
  frecuencia: string;
  tipoFalla: TipoFalla;
  valorOriginal: number | string | null;
  archivoOrigen: string;
  fila: number | null;
  cargaOrigen: number | null;
  motivo: string;
  estadoCorreccion: EstadoCorreccion;
}

export interface FallasResponse {
  resumen: {
    totalFallas: number;
    porTipo: Record<string, number>;
    porVariable: Record<string, number>;
  };
  fallas: RegistroFalla[];
}
