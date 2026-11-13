
export const UMBRALES_WINKLER = [
  { valor: 1390, etiqueta: "Región I / II" },
  { valor: 1670, etiqueta: "Región II / III" },
  { valor: 1950, etiqueta: "Región III / IV" },
  { valor: 2220, etiqueta: "Región IV / V" },
];

const numero = (valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

const periodoIndice = (temporada, tipo) => {
  const [inicioTexto, finTexto] = String(temporada ?? "").split("-");

  const inicio = Number(inicioTexto);
  const fin = Number(finTexto);

  if (!Number.isFinite(inicio) || !Number.isFinite(fin)) {
    return null;
  }

  return {
    inicio: `${inicio}-10-01`,
    fin: tipo === "huglin"
      ? `${fin}-03-31`
      : `${fin}-04-30`,
  };
};

const diferenciaDias = (inicio, fin) => {
  const a = new Date(`${inicio}T12:00:00`);
  const b = new Date(`${fin}T12:00:00`);

  return Math.round((b - a) / 86400000) + 1;
};

const indiceFicha = (ficha, tipo) =>
  ficha?.indices?.[tipo] ?? ficha?.[tipo] ?? null;

const aporteDiario = (dato, tipo) => {
  const media = numero(dato?.mediaDiaria);

  if (tipo === "winkler") {
    if (media === null) return null;

    return Math.max(0, media - 10);
  }

  const maxima = numero(dato?.maxima);

  if (media === null || maxima === null) {
    return null;
  }

  return Math.max(
    0,
    ((media - 10) + (maxima - 10)) / 2
  );
};

export const crearSerieIndiceReal = ({
  datos = [],
  estacionId = "",
  temporada = "",
  tipo = "winkler",
  ficha = null,
}) => {
  const periodo = periodoIndice(temporada, tipo);
  const indice = indiceFicha(ficha, tipo);

  const valorOficial = numero(
    indice && typeof indice === "object"
      ? indice.valor
      : indice
  );

  if (!periodo) {
    return {
      tipo,
      inicio: null,
      fin: null,
      puntos: [],
      diasEsperados: 0,
      diasValidos: 0,
      diasFaltantes: 0,
      completitud:
        numero(indice?.calidad_dato?.completitud_pct) ?? 0,
      ultimoAcumulado: valorOficial,
      ultimaFecha: null,
      valorOficial,
      confiable: indice?.calidad_dato?.confiable ?? false,
      resolucionOrigen:
        indice?.calidad_dato?.resolucion_origen ?? null,
      versionCalculo:
        indice?.calidad_dato?.version_calculo ?? null,
    };
  }

  const registros = datos
    .filter(
      (dato) =>
        dato.estacionId === estacionId &&
        dato.fecha >= periodo.inicio &&
        dato.fecha <= periodo.fin
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  let acumulado = 0;
  let diasValidos = 0;

  const puntos = registros.map((dato) => {
    const diario = aporteDiario(dato, tipo);

    if (diario === null) {
      return {
        fecha: dato.fecha,
        diario: null,
        acumulado: null,
        valido: false,
      };
    }

    acumulado += diario;
    diasValidos += 1;

    return {
      fecha: dato.fecha,
      diario,
      acumulado,
      valido: true,
    };
  });

  const puntosValidos = puntos.filter((punto) =>
    Number.isFinite(punto.acumulado)
  );

  const ultimo = puntosValidos.at(-1) ?? null;

  // El resultado oficial tiene prioridad sobre el cálculo visual.
  if (ultimo && Number.isFinite(valorOficial)) {
    ultimo.acumulado = valorOficial;
  }

  const diasEsperados = diferenciaDias(
    periodo.inicio,
    periodo.fin
  );

  const diasFaltantes = Math.max(
    0,
    diasEsperados - diasValidos
  );

  const completitudCalculada =
    diasEsperados > 0
      ? (diasValidos / diasEsperados) * 100
      : 0;

  const completitudOficial = numero(
    indice?.calidad_dato?.completitud_pct
  );

  return {
    tipo,
    inicio: periodo.inicio,
    fin: periodo.fin,
    puntos,
    diasEsperados,
    diasValidos,
    diasFaltantes,
    completitud:
      completitudOficial ?? completitudCalculada,
    ultimoAcumulado:
      valorOficial ?? ultimo?.acumulado ?? null,
    ultimaFecha: ultimo?.fecha ?? null,
    valorOficial,
    confiable: indice?.calidad_dato?.confiable ?? false,
    resolucionOrigen:
      indice?.calidad_dato?.resolucion_origen ?? null,
    versionCalculo:
      indice?.calidad_dato?.version_calculo ?? null,
  };
};
