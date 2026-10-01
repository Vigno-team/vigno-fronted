import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Thermometer,
} from "lucide-react";

import ControlesHistoricos from "./ControlesHistoricos";
import GraficoTemperatura from "./GraficoTemperatura";

import "./TemperatureChart.css";

const MESES = [
  "",
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

const MESES_CORTOS = [
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

const COLOR_A =
  "#38bdf8";

const COLOR_B =
  "#34d399";

const TEMAS = {
  oscuro: {
    secundario:
      "#8296b0",
    grilla:
      "rgba(148,163,184,0.10)",
    punto: "#081725",
  },
  claro: {
    secundario:
      "#64748b",
    grilla:
      "rgba(100,116,139,0.13)",
    punto: "#ffffff",
  },
};

const aNumero = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(valor);

  return Number.isFinite(
    numero
  )
    ? numero
    : null;
};

const promedio = (valores) => {
  const validos =
    valores.filter(
      Number.isFinite
    );

  return validos.length
    ? validos.reduce(
        (suma, valor) =>
          suma + valor,
        0
      ) / validos.length
    : null;
};

const periodoMesLegible = (
  periodo
) => {
  if (!periodo) {
    return "";
  }

  const [anio, mes] =
    periodo.split("-");

  return `${
    MESES[Number(mes)]
  } ${anio}`;
};

const diasDelPeriodo = (
  periodo
) => {
  if (!periodo) {
    return 0;
  }

  const [anio, mes] =
    periodo
      .split("-")
      .map(Number);

  return new Date(
    anio,
    mes,
    0
  ).getDate();
};

const elegirAlternativa = (
  opciones,
  principal,
  actual
) => {
  if (
    actual &&
    actual !== principal &&
    opciones.includes(actual)
  ) {
    return actual;
  }

  const alternativas =
    opciones.filter(
      (item) =>
        item !== principal
    );

  return alternativas[
    alternativas.length - 1
  ] ?? "";
};

const crearDatosMes = (
  registros,
  periodo,
  categorias
) => {
  const mapa =
    new Map(
      registros
        .filter(
          (dato) =>
            dato.fecha.startsWith(
              `${periodo}-`
            )
        )
        .map(
          (dato) => [
            dato.fecha.slice(
              8,
              10
            ),
            dato,
          ]
        )
    );

  return categorias.map(
    (dia) => ({
      etiqueta: dia,
      valor:
        aNumero(
          mapa.get(dia)
            ?.mediaDiaria
        ),
    })
  );
};

const crearDatosAnio = (
  registros,
  anio
) =>
  MESES_CORTOS.map(
    (etiqueta, indice) => {
      const mes =
        String(
          indice + 1
        ).padStart(2, "0");

      const valores =
        registros
          .filter(
            (dato) =>
              dato.fecha.startsWith(
                `${anio}-${mes}-`
              )
          )
          .map(
            (dato) =>
              aNumero(
                dato.mediaDiaria
              )
          )
          .filter(
            Number.isFinite
          );

      return {
        etiqueta,
        valor:
          promedio(valores),
      };
    }
  );

function TemperatureChart({
  estaciones = [],
  datosTemperatura = [],
  temaOscuro = true,
}) {
  const [
    vista,
    setVista,
  ] = useState(() => {
    const guardado =
      localStorage.getItem(
        "grafico-vista"
      );

    return guardado ===
      "anio"
      ? "anio"
      : "mes";
  });

  const [
    comparar,
    setComparar,
  ] = useState(false);

  const [
    estacionId,
    setEstacionId,
  ] = useState("");

  const [
    periodoMes,
    setPeriodoMes,
  ] = useState("");

  const [
    periodoMesComparacion,
    setPeriodoMesComparacion,
  ] = useState("");

  const [
    anio,
    setAnio,
  ] = useState("");

  const [
    anioComparacion,
    setAnioComparacion,
  ] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "grafico-vista",
      vista
    );
  }, [vista]);

  useEffect(() => {
    if (
      estaciones.length &&
      !estaciones.some(
        (item) =>
          item.id === estacionId
      )
    ) {
      setEstacionId(
        estaciones[0].id
      );
    }
  }, [
    estaciones,
    estacionId,
  ]);

  const estacion =
    useMemo(
      () =>
        estaciones.find(
          (item) =>
            item.id === estacionId
        ) ?? null,
      [
        estaciones,
        estacionId,
      ]
    );

  const datosEstacion =
    useMemo(
      () =>
        datosTemperatura
          .filter(
            (dato) =>
              dato.estacionId ===
              estacionId
          )
          .sort((a, b) =>
            a.fecha.localeCompare(
              b.fecha
            )
          ),
      [
        datosTemperatura,
        estacionId,
      ]
    );

  const periodosMensuales =
    useMemo(
      () =>
        [
          ...new Set(
            datosEstacion.map(
              (dato) =>
                dato.fecha.slice(
                  0,
                  7
                )
            )
          ),
        ].sort(),
      [datosEstacion]
    );

  const anios =
    useMemo(
      () =>
        [
          ...new Set(
            datosEstacion.map(
              (dato) =>
                dato.fecha.slice(
                  0,
                  4
                )
            )
          ),
        ].sort(),
      [datosEstacion]
    );

  useEffect(() => {
    if (
      periodosMensuales.length &&
      !periodosMensuales.includes(
        periodoMes
      )
    ) {
      setPeriodoMes(
        periodosMensuales[
          periodosMensuales.length -
            1
        ]
      );
    }
  }, [
    periodosMensuales,
    periodoMes,
  ]);

  useEffect(() => {
    if (
      anios.length &&
      !anios.includes(anio)
    ) {
      setAnio(
        anios[
          anios.length - 1
        ]
      );
    }
  }, [anios, anio]);

  useEffect(() => {
    if (
      comparar &&
      vista === "mes"
    ) {
      setPeriodoMesComparacion(
        (actual) =>
          elegirAlternativa(
            periodosMensuales,
            periodoMes,
            actual
          )
      );
    }
  }, [
    comparar,
    vista,
    periodosMensuales,
    periodoMes,
  ]);

  useEffect(() => {
    if (
      comparar &&
      vista === "anio"
    ) {
      setAnioComparacion(
        (actual) =>
          elegirAlternativa(
            anios,
            anio,
            actual
          )
      );
    }
  }, [
    comparar,
    vista,
    anios,
    anio,
  ]);

  const puedeComparar =
    vista === "mes"
      ? periodosMensuales
          .length > 1
      : anios.length > 1;

  useEffect(() => {
    if (
      comparar &&
      !puedeComparar
    ) {
      setComparar(false);
    }
  }, [
    comparar,
    puedeComparar,
  ]);

  const configuracion =
    useMemo(() => {
      if (
        vista === "mes"
      ) {
        const periodos = [
          periodoMes,
          ...(comparar &&
          periodoMesComparacion
            ? [
                periodoMesComparacion,
              ]
            : []),
        ].filter(Boolean);

        const cantidadDias =
          Math.max(
            ...periodos.map(
              diasDelPeriodo
            ),
            1
          );

        const categorias =
          Array.from(
            {
              length:
                cantidadDias,
            },
            (_, indice) =>
              String(
                indice + 1
              ).padStart(
                2,
                "0"
              )
          );

        const series = [
          {
            nombre:
              periodoMesLegible(
                periodoMes
              ),
            color: COLOR_A,
            datos:
              crearDatosMes(
                datosEstacion,
                periodoMes,
                categorias
              ),
          },
        ];

        if (
          comparar &&
          periodoMesComparacion
        ) {
          series.push({
            nombre:
              periodoMesLegible(
                periodoMesComparacion
              ),
            color: COLOR_B,
            datos:
              crearDatosMes(
                datosEstacion,
                periodoMesComparacion,
                categorias
              ),
          });
        }

        const ticks =
          [
            "01",
            "05",
            "10",
            "15",
            "20",
            "25",
            String(
              cantidadDias
            ).padStart(
              2,
              "0"
            ),
          ].filter(
            (valor) =>
              categorias.includes(
                valor
              )
          );

        return {
          categorias,
          series,
          ticksX: [
            ...new Set(
              ticks
            ),
          ],
          formatoCategoria:
            (valor) =>
              `Día ${Number(
                valor
              )}`,
        };
      }

      const series = [
        {
          nombre: anio,
          color: COLOR_A,
          datos:
            crearDatosAnio(
              datosEstacion,
              anio
            ),
        },
      ];

      if (
        comparar &&
        anioComparacion
      ) {
        series.push({
          nombre:
            anioComparacion,
          color: COLOR_B,
          datos:
            crearDatosAnio(
              datosEstacion,
              anioComparacion
            ),
        });
      }

      return {
        categorias:
          MESES_CORTOS,
        series,
        ticksX:
          MESES_CORTOS,
        formatoCategoria:
          (valor) => valor,
      };
    }, [
      vista,
      comparar,
      datosEstacion,
      periodoMes,
      periodoMesComparacion,
      anio,
      anioComparacion,
    ]);

  const resumen =
    useMemo(() => {
      const registros =
        datosEstacion.filter(
          (dato) =>
            vista === "mes"
              ? dato.fecha.startsWith(
                  `${periodoMes}-`
                )
              : dato.fecha.startsWith(
                  `${anio}-`
                )
        );

      const minimas =
        registros
          .map(
            (dato) =>
              aNumero(
                dato.minima
              )
          )
          .filter(
            Number.isFinite
          );

      const medias =
        registros
          .map(
            (dato) =>
              aNumero(
                dato.mediaDiaria
              )
          )
          .filter(
            Number.isFinite
          );

      const maximas =
        registros
          .map(
            (dato) =>
              aNumero(
                dato.maxima
              )
          )
          .filter(
            Number.isFinite
          );

      return {
        minima:
          minimas.length
            ? Math.min(
                ...minimas
              )
            : null,

        media:
          promedio(medias),

        maxima:
          maximas.length
            ? Math.max(
                ...maximas
              )
            : null,
      };
    }, [
      datosEstacion,
      vista,
      periodoMes,
      anio,
    ]);

  const valores =
    configuracion.series
      .flatMap(
        (serie) =>
          serie.datos.map(
            (dato) =>
              dato.valor
          )
      )
      .filter(
        Number.isFinite
      );

  const minimoY =
    valores.length
      ? Math.floor(
          (Math.min(
            ...valores
          ) -
            3) /
            5
        ) * 5
      : 0;

  const maximoY =
    valores.length
      ? Math.max(
          minimoY + 10,
          Math.ceil(
            (Math.max(
              ...valores
            ) +
              3) /
              5
          ) * 5
        )
      : 40;

  const tema =
    TEMAS[
      temaOscuro
        ? "oscuro"
        : "claro"
    ];

  return (
    <section
      className={`panel-temperatura ${
        temaOscuro
          ? "tema-oscuro"
          : "tema-claro"
      }`}
    >
      <ControlesHistoricos
        estaciones={
          estaciones
        }
        estacion={estacion}
        estacionId={
          estacionId
        }
        setEstacionId={
          setEstacionId
        }
        vista={vista}
        setVista={setVista}
        comparar={comparar}
        setComparar={
          setComparar
        }
        puedeComparar={
          puedeComparar
        }
        periodosMensuales={
          periodosMensuales
        }
        periodoMes={
          periodoMes
        }
        setPeriodoMes={
          setPeriodoMes
        }
        periodoMesComparacion={
          periodoMesComparacion
        }
        setPeriodoMesComparacion={
          setPeriodoMesComparacion
        }
        anios={anios}
        anio={anio}
        setAnio={setAnio}
        anioComparacion={
          anioComparacion
        }
        setAnioComparacion={
          setAnioComparacion
        }
        periodoMesLegible={
          periodoMesLegible
        }
        resumen={resumen}
        series={
          configuracion.series
        }
      />

      <div className="area-temperatura">
        {valores.length ? (
          <GraficoTemperatura
            series={
              configuracion.series
            }
            categorias={
              configuracion.categorias
            }
            ticksX={
              configuracion.ticksX
            }
            minimoY={
              minimoY
            }
            maximoY={
              maximoY
            }
            tema={tema}
            formatoCategoria={
              configuracion.formatoCategoria
            }
          />
        ) : (
          <div className="sin-datos">
            <Thermometer
              size={28}
            />

            <strong>
              Sin registros disponibles
            </strong>

            <span>
              No existen datos para el período seleccionado.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default TemperatureChart;