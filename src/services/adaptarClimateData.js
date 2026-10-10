const numero = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

const temporadasEstacion = (estacionId, completitud = []) =>
  Object.fromEntries(
    completitud
      .filter((item) => item.estacion_id === estacionId)
      .map((item) => [
        item.temporada,
        {
          completitud: item.variables?.tmedia ?? null,
          completitudVariables: {
            maxima: item.variables?.tmax ?? null,
            minima: item.variables?.tmin ?? null,
            media: item.variables?.tmedia ?? null,
            precipitacion: item.variables?.precipitacion ?? null,
          },
          confiable: item.confiable ?? false,
          observacion: item.observacion ?? null,
        },
      ])
  );

const adaptarEstaciones = (estaciones = [], completitud = []) =>
  estaciones.map((estacion) => ({
    ...estacion,
    fechaInicio: estacion.fecha_inicio ?? null,
    fechaFin: estacion.fecha_fin ?? null,
    temporadasDisponibles: estacion.temporadas_disponibles ?? 0,
    calidadDato: estacion.calidad_dato ?? null,
    temporadas: temporadasEstacion(estacion.id, completitud),
  }));

const adaptarResumenDiario = (resumenDiario = []) =>
  Array.isArray(resumenDiario)
    ? resumenDiario.flatMap((resumen) =>
        (resumen.dias ?? []).map((dia) => ({
          estacionId: resumen.estacion_id,
          fecha: dia.fecha,
          maxima: numero(dia.tmax),
          minima: numero(dia.tmin),
          mediaDiaria: numero(dia.tmedia),
          amplitudTermica: numero(dia.amplitud),
          precipitacionMm: numero(dia.precipitacion),
          motivoNulo: dia.motivo_nulo ?? null,
        }))
      )
    : [];

const adaptarFichasTemporada = (fichas = [], temporadaEnCurso = null) =>
  Array.isArray(fichas)
    ? fichas.map((ficha) => ({
        ...ficha,
        estacionId: ficha.estacion_id,
        enCurso: ficha.temporada === temporadaEnCurso,
        winkler: ficha.indices?.winkler ?? null,
        huglin: ficha.indices?.huglin ?? null,
        lluviaInvernal: ficha.lluvia_invernal ?? null,
        calor: ficha.calor ?? null,
        clasificacion: ficha.clasificacion ?? null,
        diasCriticos: ficha.dias_criticos ?? [],
      }))
    : [];

const adaptarRachas = (rachas = []) =>
  Array.isArray(rachas)
    ? rachas.map((item) => ({
        ...item,
        estacionId: item.estacion_id,
        umbral: numero(item.umbral_c),
        minimoDiasIncidencia: item.minimo_dias_incidencia ?? null,
        eventos: item.rachas ?? [],
        calidadDato: item.calidad_dato ?? null,
      }))
    : [];

export const adaptarClimateData = (data) => {
  if (!data) return null;

  const temporadaEnCurso = data.temporada_en_curso ?? null;
  const completitudPorTemporada = Array.isArray(data.completitud_por_temporada)
    ? data.completitud_por_temporada
    : [];

  return {
    generado: data.generado ?? null,
    temporadaEnCurso,
    estaciones: adaptarEstaciones(
      data.estaciones ?? [],
      completitudPorTemporada
    ),
    temporadas: Array.isArray(data.temporadas) ? data.temporadas : [],
    completitudPorTemporada,
    seriesTemperaturas: adaptarResumenDiario(data.resumen_diario),
    fichasTemporada: adaptarFichasTemporada(
      data.ficha_temporada,
      temporadaEnCurso
    ),
    rachas: adaptarRachas(data.rachas),
  };
};

export const obtenerFichaTemporada = (datos, estacionId, temporada) =>
  datos?.fichasTemporada?.find(
    (ficha) =>
      ficha.estacionId === estacionId &&
      ficha.temporada === temporada
  ) ?? null;

export const obtenerRachasTemporada = (datos, estacionId, temporada) =>
  datos?.rachas?.find(
    (item) =>
      item.estacionId === estacionId &&
      item.temporada === temporada
  ) ?? null;

export const formatearDato = (valor, decimales = 1) => {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(Number(valor))
  ) {
    return "Sin dato";
  }

  return Number(valor)
    .toFixed(decimales)
    .replace(".", ",");
};