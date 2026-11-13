// Convierte nombres snake_case del backend a nombres usados por los componentes.
// null significa "sin dato": no se reemplaza por cero.
const numero = valor => valor === null || valor === undefined || valor === ""
  ? null : (Number.isFinite(Number(valor)) ? Number(valor) : null);
const lista = valor => Array.isArray(valor) ? valor : [];
const idDe = objeto => String(objeto?.codigo ?? objeto?.estacion_id ?? objeto?.id ?? "");

export function adaptarClimateData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const temporadaEnCurso = data.temporada_en_curso ?? null;
  const completitudPorTemporada = lista(data.completitud_por_temporada);
  const rachasOriginales = lista(data.rachas);
  const adaptarEvento = r => ({
    ...r,
    fecha_inicio: r.fecha_inicio ?? r.inicio ?? null,
    fecha_fin: r.fecha_fin ?? r.fin ?? null,
    dias: r.dias ?? 0,
    tmax_maxima: numero(r.tmax_maxima),
    con_incidencia: r.con_incidencia ?? false,
    interrumpida_por_dato_faltante: r.interrumpida_por_dato_faltante ?? false,
  });

  const estaciones = lista(data.estaciones).map(e => {
    const id = String(e.codigo ?? e.id ?? "");
    const temporadas = Object.fromEntries(completitudPorTemporada
      .filter(c => idDe(c) === id)
      .map(c => [c.temporada, {
        completitud: c.variables?.tmedia ?? null,
        completitudVariables: {
          maxima: c.variables?.tmax ?? null,
          minima: c.variables?.tmin ?? null,
          media: c.variables?.tmedia ?? null,
          precipitacion: c.variables?.precipitacion ?? null,
        },
        confiable: c.confiable ?? false,
        observacion: c.observacion ?? null,
      }]));
    return {
      ...e, id, temporadas,
      fechaInicio: e.fecha_inicio ?? null,
      fechaFin: e.fecha_fin ?? null,
      temporadasDisponibles: e.temporadas_disponibles ?? 0,
      calidadDato: e.calidad_dato ?? null,
    };
  });

  const seriesTemperaturas = lista(data.resumen_diario).flatMap(registro =>
    lista(registro.dias).map(dia => ({
      estacionId: idDe(registro), fecha: dia.fecha,
      maxima: numero(dia.tmax), minima: numero(dia.tmin),
      mediaDiaria: numero(dia.tmedia), amplitudTermica: numero(dia.amplitud),
      precipitacionMm: numero(dia.precipitacion),
      humedadMedia: numero(dia.humedad_media),
      radiacionMaxima: numero(dia.radiacion_maxima),
      vientoMaximo: numero(dia.viento_maximo),
      motivoNulo: dia.motivo_nulo ?? null,
    }))
  );

  const fichasTemporada = lista(data.ficha_temporada).map(ficha => {
    const racha = rachasOriginales.find(r => idDe(r) === idDe(ficha) && r.temporada === ficha.temporada);
    return {
      ...ficha, estacionId: idDe(ficha), enCurso: ficha.temporada === temporadaEnCurso,
      winkler: ficha.indices?.winkler ?? null,
      huglin: ficha.indices?.huglin ?? null,
      lluviaInvernal: ficha.lluvia_invernal ?? null,
      lluviaFueraInvierno: ficha.lluvia_fuera_invierno ?? null,
      lluvia_fuera_invierno_mm: numero(ficha.lluvia_fuera_invierno?.crecimiento_mm),
      calor: ficha.calor ?? null,
      clasificacion: ficha.clasificacion ?? null,
      diasCriticos: ficha.dias_criticos ?? [],
      rachas: lista(racha?.rachas).map(adaptarEvento),
      calidadRachas: racha?.calidad_dato ?? null,
    };
  });

  const rachas = rachasOriginales.map(r => ({
    ...r, estacionId: idDe(r), umbral: numero(r.umbral_c),
    minimoDiasIncidencia: r.minimo_dias_incidencia ?? null,
    eventos: lista(r.rachas).map(adaptarEvento), calidadDato: r.calidad_dato ?? null,
  }));

  return {
    generado: data.generado ?? null, temporadaEnCurso,
    temporadas: lista(data.temporadas), estaciones, seriesTemperaturas,
    completitudPorTemporada, completitud_por_temporada: completitudPorTemporada,
    fichasTemporada, rachas,
    mapaCalor: data.mapa_calor ?? null, mapa_calor: data.mapa_calor ?? null,
  };
}

export const obtenerFichaTemporada = (datos, estacionId, temporada) =>
  datos?.fichasTemporada?.find(f => f.estacionId === estacionId && f.temporada === temporada) ?? null;

export const obtenerRachasTemporada = (datos, estacionId, temporada) =>
  datos?.rachas?.find(r => r.estacionId === estacionId && r.temporada === temporada) ?? null;

export const formatearDato = (valor, decimales = 1) => {
  const n = numero(valor);
  return n === null ? "Sin dato" : n.toFixed(decimales).replace(".", ",");
};
