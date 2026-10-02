import {
  Database,
  FileText,
  Snowflake,
  Thermometer,
} from "lucide-react";

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export const DIAS_SEMANA = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];

export const TIPOS = {
  critica: {
    texto: "Crítica",
    Icono: Snowflake,
  },
  advertencia: {
    texto: "Advertencia",
    Icono: Thermometer,
  },
  reporte: {
    texto: "Reporte",
    Icono: FileText,
  },
  sinDatos: {
    texto: "Sin datos",
    Icono: Database,
  },
};

export const PRIORIDAD = {
  critica: 4,
  advertencia: 3,
  reporte: 2,
  sinDatos: 1,
};

export const aNumero = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : null;
};

export const formatearNumero = (
  valor,
  decimales = 1
) => {
  const numero = aNumero(valor);

  if (numero === null) {
    return "—";
  }

  return numero
    .toFixed(decimales)
    .replace(".", ",");
};

export const formatearTemperatura = (valor) => {
  const numero = aNumero(valor);

  return numero === null
    ? "—"
    : `${formatearNumero(numero)} °C`;
};

export const formatearPrecipitacion = (valor) => {
  const numero = aNumero(valor);

  return numero === null
    ? "—"
    : `${formatearNumero(numero)} mm`;
};

export const nombreEstacion = (estacion) =>
  estacion?.nombre ??
  estacion?.huerto ??
  estacion?.id ??
  "Estación";

export const construirFecha = (
  anio,
  mes,
  dia
) =>
  `${anio}-${String(mes + 1).padStart(2, "0")}-${String(
    dia
  ).padStart(2, "0")}`;

export const formatearFechaCompleta = (fecha) => {
  if (!fecha) {
    return "";
  }

  const [anio, mes, dia] =
    fecha.split("-");

  return `${Number(dia)} de ${MESES[
    Number(mes) - 1
  ].toLowerCase()} de ${anio}`;
};

export const tieneDatosMeteorologicos = (
  registro
) => {
  if (!registro) {
    return false;
  }

  return [
    registro.maxima,
    registro.minima,
    registro.mediaDiaria,
    registro.amplitudTermica,
    registro.precipitacionMm,
  ].some(
    (valor) =>
      aNumero(valor) !== null
  );
};

export const obtenerAmplitud = (registro) => {
  const amplitud =
    aNumero(
      registro?.amplitudTermica
    );

  if (amplitud !== null) {
    return amplitud;
  }

  const maxima =
    aNumero(registro?.maxima);

  const minima =
    aNumero(registro?.minima);

  if (
    maxima !== null &&
    minima !== null
  ) {
    return maxima - minima;
  }

  return null;
};

export const estaDentroDelRango = (
  fecha,
  inicio,
  fin
) =>
  Boolean(
    fecha &&
      inicio &&
      fin &&
      fecha >= inicio &&
      fecha <= fin
  );

export const obtenerRangoCobertura = (
  estacion,
  datos
) => {
  const fechas = datos
    .map((dato) => dato.fecha)
    .filter(Boolean)
    .sort();

  return {
    inicio:
      estacion?.fechaInicio ??
      fechas[0] ??
      null,

    fin:
      estacion?.fechaFin ??
      fechas[fechas.length - 1] ??
      null,
  };
};

export const generarPeriodosRango = (
  inicio,
  fin
) => {
  if (!inicio || !fin) {
    return [];
  }

  const [anioInicio, mesInicio] =
    inicio.split("-").map(Number);

  const [anioFin, mesFin] =
    fin.split("-").map(Number);

  const actual = new Date(
    anioInicio,
    mesInicio - 1,
    1
  );

  const limite = new Date(
    anioFin,
    mesFin - 1,
    1
  );

  const periodos = [];

  while (actual <= limite) {
    periodos.push(
      `${actual.getFullYear()}-${String(
        actual.getMonth() + 1
      ).padStart(2, "0")}`
    );

    actual.setMonth(
      actual.getMonth() + 1
    );
  }

  return periodos;
};

export const crearDiasCalendario = (
  anio,
  mes
) => {
  if (!anio) {
    return [];
  }

  const numeroAnio =
    Number(anio);

  const primerDia =
    new Date(
      numeroAnio,
      mes,
      1
    ).getDay();

  const desplazamiento =
    primerDia === 0
      ? 6
      : primerDia - 1;

  const diasMes =
    new Date(
      numeroAnio,
      mes + 1,
      0
    ).getDate();

  const diasMesAnterior =
    new Date(
      numeroAnio,
      mes,
      0
    ).getDate();

  const celdas = [];

  for (
    let i = desplazamiento - 1;
    i >= 0;
    i -= 1
  ) {
    celdas.push({
      dia:
        diasMesAnterior - i,
      actual: false,
      tipo: "anterior",
    });
  }

  for (
    let dia = 1;
    dia <= diasMes;
    dia += 1
  ) {
    celdas.push({
      dia,
      actual: true,
      tipo: "actual",
    });
  }

  let siguiente = 1;

  while (celdas.length < 42) {
    celdas.push({
      dia: siguiente,
      actual: false,
      tipo: "siguiente",
    });

    siguiente += 1;
  }

  return celdas;
};

export const obtenerTiposRegistro = ({
  registro,
  existeRegistro,
  dentroCobertura,
}) => {
  if (!dentroCobertura) {
    return [];
  }

  if (
    !existeRegistro ||
    !tieneDatosMeteorologicos(registro)
  ) {
    return ["sinDatos"];
  }

  const tipos = [];
  const minima =
    aNumero(registro.minima);

  if (minima !== null) {
    if (minima <= 0) {
      tipos.push("critica");
    } else if (minima <= 2) {
      tipos.push("advertencia");
    }
  }

  tipos.push("reporte");

  return tipos;
};

export const construirReportes = ({
  registro,
  estacion,
  fecha,
  existeRegistro,
  dentroCobertura,
}) => {
  if (
    !fecha ||
    !dentroCobertura
  ) {
    return [];
  }

  const estacionTexto =
    nombreEstacion(estacion);

  const fechaTexto =
    formatearFechaCompleta(
      fecha
    );

  if (!existeRegistro) {
    return [
      {
        id: `${fecha}-sin-registro`,
        tipo: "sinDatos",
        titulo:
          "Sin registro disponible",
        resumen:
          "No se recibió ningún registro meteorológico para este día.",
        detalles: [
          {
            etiqueta: "Estación",
            valor: estacionTexto,
          },
          {
            etiqueta: "Fecha",
            valor: fechaTexto,
          },
          {
            etiqueta: "Estado",
            valor: "Sin registro",
          },
          {
            etiqueta: "Descripción",
            valor:
              "No existe un registro diario para esta fecha.",
          },
        ],
      },
    ];
  }

  if (
    !tieneDatosMeteorologicos(
      registro
    )
  ) {
    return [
      {
        id: `${fecha}-datos-nulos`,
        tipo: "sinDatos",
        titulo:
          "Datos no recibidos",
        resumen:
          "Existe el registro del día, pero no contiene valores meteorológicos.",
        detalles: [
          {
            etiqueta: "Estación",
            valor: estacionTexto,
          },
          {
            etiqueta: "Fecha",
            valor: fechaTexto,
          },
          {
            etiqueta: "Estado",
            valor:
              "Datos no recibidos",
          },
          {
            etiqueta: "Descripción",
            valor:
              "Los valores meteorológicos del día están vacíos o nulos.",
          },
        ],
      },
    ];
  }

  const reportes = [];
  const minima =
    aNumero(registro.minima);

  if (
    minima !== null &&
    minima <= 0
  ) {
    reportes.push({
      id: `${fecha}-critica`,
      tipo: "critica",
      titulo: "Helada crítica",
      resumen:
        "La temperatura mínima diaria descendió bajo 0 °C.",
      detalles: [
        {
          etiqueta: "Estación",
          valor: estacionTexto,
        },
        {
          etiqueta: "Fecha",
          valor: fechaTexto,
        },
        {
          etiqueta:
            "Temperatura mínima",
          valor:
            formatearTemperatura(
              minima
            ),
        },
        {
          etiqueta: "Condición",
          valor: "Mínima ≤ 0 °C",
        },
        {
          etiqueta: "Severidad",
          valor: "Crítica",
        },
      ],
    });
  } else if (
    minima !== null &&
    minima <= 2
  ) {
    reportes.push({
      id: `${fecha}-advertencia`,
      tipo: "advertencia",
      titulo: "Riesgo térmico",
      resumen:
        "La temperatura mínima diaria alcanzó el rango de riesgo térmico.",
      detalles: [
        {
          etiqueta: "Estación",
          valor: estacionTexto,
        },
        {
          etiqueta: "Fecha",
          valor: fechaTexto,
        },
        {
          etiqueta:
            "Temperatura mínima",
          valor:
            formatearTemperatura(
              minima
            ),
        },
        {
          etiqueta: "Condición",
          valor:
            "0 °C < mínima ≤ 2 °C",
        },
        {
          etiqueta: "Severidad",
          valor: "Advertencia",
        },
      ],
    });
  }

  reportes.push({
    id: `${fecha}-reporte`,
    tipo: "reporte",
    titulo:
      "Reporte meteorológico diario",
    resumen:
      "Resumen de las condiciones meteorológicas observadas durante el día.",
    detalles: [
      {
        etiqueta: "Estación",
        valor: estacionTexto,
      },
      {
        etiqueta: "Fecha",
        valor: fechaTexto,
      },
      {
        etiqueta:
          "Temperatura máxima",
        valor:
          formatearTemperatura(
            registro.maxima
          ),
      },
      {
        etiqueta:
          "Temperatura media",
        valor:
          formatearTemperatura(
            registro.mediaDiaria
          ),
      },
      {
        etiqueta:
          "Temperatura mínima",
        valor:
          formatearTemperatura(
            registro.minima
          ),
      },
      {
        etiqueta:
          "Amplitud térmica",
        valor:
          formatearTemperatura(
            obtenerAmplitud(
              registro
            )
          ),
      },
      {
        etiqueta:
          "Precipitación diaria",
        valor:
          formatearPrecipitacion(
            registro.precipitacionMm
          ),
      },
    ],
  });

  return reportes;
};