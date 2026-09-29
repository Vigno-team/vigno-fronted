// ==========================================
// 1. CONTRATO OFICIAL v0.1 (Backend)
// ==========================================

// Información de calidad y completitud de datos de la estación.
export interface CalidadDato {
  completitud_pct: number;
  confiable: boolean;
  umbral_completitud_pct: number;
  resolucion_origen: string;
  version_calculo: string | null;
}

// Metadatos principales de cada estación meteorológica.
export interface EstacionMetadatos {
  id: string;
  nombre: string;
  subzona: string;
  propietario: string;
  variables: string[];
  fecha_inicio: string;
  fecha_fin: string;
  temporadas_disponibles: number;
  calidad_dato: CalidadDato;
}

// Variables medidas para evaluar la completitud por temporada.
export interface VariablesCompletitud {
  tmax: number;
  tmin: number;
  tmedia: number;
  precipitacion: number;
}

// Completitud evaluada por estación y temporada agrícola.
export interface CompletitudTemporada {
  estacion_id: string;
  temporada: string;
  variables: VariablesCompletitud;
  confiable: boolean;
  observacion?: string;
}

// Registro meteorológico diario individual con tolerancia a nulos por falla.
export interface DiaResumen {
  fecha: string;
  tmax: number | null;
  tmin: number | null;
  tmedia: number | null;
  amplitud: number | null;
  precipitacion: number | null;
  motivo_nulo?: string;
}

// Estructura del bloque de resumen diario.
export interface ResumenDiario {
  estacion_id: string;
  desde: string;
  hasta: string;
  dias: DiaResumen[];
}

// Información de auditoría y consolidación de archivos fuente.
export interface ArchivoConsolidado {
  archivo: string;
  estacion_id: string;
  filas_leidas: number;
  filas_aceptadas: number;
  filas_rechazadas: number;
  motivos_rechazo: Array<{ motivo: string; filas: number }>;
}

export interface Consolidacion {
  fecha_ejecucion: string;
  resolucion_origen: string;
  archivos: ArchivoConsolidado[];
  columnas_descartadas: Array<{ columna: string; motivo: string }>;
  valores_nulos: {
    total: number;
    motivo: string;
  };
}

// ==========================================
// 2. RETROCOMPATIBILIDAD (Para WinklerCard y componentes en migración)
// ==========================================

export interface MetadatosEstaciones {
  id: string;
  fechaRegistro?: string;
  huerto?: string;
  localidad?: string;
  ubicacion?: string;
  nombre?: string;
}

export interface SeriesDiariasTemperaturas {
  estacionId: string;
  fecha: string;
  mediaDiaria: number;
  maxima: number;
  minima: number;
  mediaMinima?: number;
  mediaMaxima?: number;
}

export interface SeriesHorariasTemperaturas {
  estacionId: string;
  fecha: string;
  hora: string;
  temperatura: number;
}

// ==========================================
// 3. CONTRATO PRINCIPAL INTEGRADO
// ==========================================

export interface ClimateDataResponse {
  _nota?: string;
  consolidacion?: Consolidacion;
  estaciones?: EstacionMetadatos[];
  temporadas?: string[];
  completitud_por_temporada?: CompletitudTemporada[];
  resumen_diario?: ResumenDiario;

  // Propiedades legadas opcionales para no romper llamadas anteriores
  seriesTemperaturas?: SeriesDiariasTemperaturas[];
  seriesHorarias?: SeriesHorariasTemperaturas[];
}