export function adaptarPrediccionData(json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return null;
  }

  if (json.motivo_nulo) {
    return {
      motivo_nulo: String(json.motivo_nulo),
      fuente: null,
      modelo: null,
      predicciones: [],
    };
  }

  const prediccionesValidas = Array.isArray(json.predicciones)
    ? json.predicciones.map((item) => ({
        fuente: String(item?.fuente ?? "Amerine & Winkler"),
        region: String(item?.region ?? ""),
        anio: Number(item?.anio ?? 1941),
        cultivar: String(item?.cultivar ?? ""),
        color: String(item?.color ?? ""),
        doy_real: Number(item?.doy_real ?? 0),
        doy_estimado: Number(item?.doy_estimado ?? 0),
        diferencia_dias: Number(item?.diferencia_dias ?? 0),
        fecha_real: String(item?.fecha_real ?? "—"),
        prediccion: {
          centro: String(item?.prediccion?.centro ?? "—"),
          desde: String(item?.prediccion?.desde ?? "—"),
          hasta: String(item?.prediccion?.hasta ?? "—"),
          dispersion_dias: Number(item?.prediccion?.dispersion_dias ?? 0),
          tipo: String(item?.prediccion?.tipo ?? ""),
        },
        doy_regresion_lineal: Number(item?.doy_regresion_lineal ?? 0),
        doy_promedio_regional: Number(item?.doy_promedio_regional ?? 0),
      }))
    : [];

  return {
    generado: json.generado ?? null,
    datos_ficticios: Boolean(json.datos_ficticios),
    fuente: {
      cita: String(json?.fuente?.cita ?? "Amerine & Winkler"),
      url: String(json?.fuente?.url ?? ""),
    },
    modelo: {
      importancias:
        json?.modelo?.importancias && typeof json.modelo.importancias === "object"
          ? json.modelo.importancias
          : {},
      metricas:
        json?.modelo?.metricas && typeof json.modelo.metricas === "object"
          ? json.modelo.metricas
          : {},
    },
    predicciones: prediccionesValidas,
    avance: json?.fenologia?.avance ?? json?.avance,
    diasEstimados: json?.fenologia?.dias_estimados ?? json?.diasEstimados,
    temperaturas: json?.fenologia?.temperaturas ?? json?.temperaturas,
    rachaCalor: json?.calor?.rachas?.con_incidencia ?? json?.rachaCalor,
  };
}