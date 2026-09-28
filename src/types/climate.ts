// Información general de cada estación meteorológica.
export interface MetadatosEstaciones {
  id: string;
  fechaRegistro: string;
  huerto: string;
  localidad: string;
  ubicacion: string;
}

// Índices térmicos utilizados para análisis vitícola.
export interface IndicesTermicos {
  estacionId: string;

  // Suma térmica de temperaturas medias sobre el umbral de 10 °C.
  winkler: number;

  // Evalúa las condiciones heliotérmicas usando temperatura media y máxima.
  huglin: number;

  // Diferencia entre temperatura máxima y mínima.
  amplitudTermica?: number;
}

// Resumen de temperatura correspondiente a cada día.
export interface SeriesDiariasTemperaturas {
  estacionId: string;
  fecha: string;

  mediaDiaria: number;
  maxima: number;
  minima: number;

  mediaMinima?: number;
  mediaMaxima?: number;
}

// Lectura individual tomada por la estación cada hora.
export interface SeriesHorariasTemperaturas {
  estacionId: string;
  fecha: string;
  hora: string;
  temperatura: number;
}

// Estructura completa de los datos climáticos.
export interface ClimateDataResponse {
  estaciones: MetadatosEstaciones[];

  // Resúmenes diarios utilizados en las vistas mensual y anual.
  seriesTemperaturas: SeriesDiariasTemperaturas[];

  // Mediciones horarias utilizadas en la vista diaria.
  seriesHorarias: SeriesHorariasTemperaturas[];

  indicesTermicos: IndicesTermicos[];
}