export interface MetadatosEstaciones {
  id: string;
  fechaRegistro: string;
  huerto: string;
  localidad: string;
  ubicacion: string;
}
export interface IndicesTermicos {
  estacionId: string;
  winkler: number; // mide la suma de las temperaturas medias diarias que rebaran el umbral de los 10°

  huglin: number; // evalua las posibilidaes heliotermicas considerando la temp media y maxima diaria

  amplitudTermica?: number; // es la diferencia entre la temp maxima del dia y la minima de noche
}
export interface SeriesHorariasTemperaturas {
  estacionId: string;
  fecha: string;
  mediaDiaria: number;
  maxima: number;
  minima: number;
  mediaMinima?: number;
  mediaMaxima?: number;
}

export interface ClimateDataResponse {
  estaciones: MetadatosEstaciones[];
  seriesTemperaturas: SeriesHorariasTemperaturas[];
  indicesTermicos: IndicesTermicos[];
}