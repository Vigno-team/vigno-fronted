export interface MetadatosEstaciones {
  id: string;
  nombre: string;
  huerto: string;
  subzona: string;
  localidad: string;

  fechaInicio: string | null;
  fechaFin: string | null;

  completitud: number | null;
  confiable: boolean;
}

export interface TemporadaClimatica {
  estacionId: string;
  anio: number;

  fechaInicio: string | null;
  fechaFin: string | null;

  completitud: number | null;
  confiable: boolean;
}

export interface CompletitudVariable {
  estacionId: string;
  anio: number;

  variable:
    | "maxima"
    | "minima"
    | "mediaDiaria"
    | "amplitudTermica"
    | "precipitacionMm";

  completitud: number | null;
  confiable: boolean;
}

export interface SeriesDiariasTemperaturas {
  estacionId: string;
  fecha: string;
  temporada: number;

  maxima: number | null;
  minima: number | null;
  mediaDiaria: number | null;
  amplitudTermica: number | null;
  precipitacionMm: number | null;
}

export interface ClimateDataResponse {
  estaciones: MetadatosEstaciones[];
  temporadas: TemporadaClimatica[];
  completitudVariables: CompletitudVariable[];
  seriesTemperaturas: SeriesDiariasTemperaturas[];
}