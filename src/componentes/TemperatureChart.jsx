import { useEffect, useMemo, useState } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scalePoint } from "@visx/scale";
import { LinePath } from "@visx/shape";
import {
  ArrowLeftRight,
  CalendarDays,
  CalendarRange,
  ChartLine,
  Clock3,
  MapPin,
  Snowflake,
  Thermometer,
  ThermometerSun,
} from "lucide-react";
import "./TemperatureChart.css";

// Configuración general

const MESES = [
  "",
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MESES_CORTOS = [
  "",
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const VISTAS = [
  {
    valor: "dia",
    texto: "Día",
    titulo: "Temperatura por hora",
    Icono: Clock3,
  },
  {
    valor: "mes",
    texto: "Mes",
    titulo: "Temperatura media diaria",
    Icono: CalendarDays,
  },
  {
    valor: "anio",
    texto: "Año",
    titulo: "Temperatura media mensual",
    Icono: CalendarRange,
  },
];

const TEMAS_GRAFICO = {
  oscuro: {
    secundario: "#8296b0",
    grilla: "rgba(148,163,184,0.10)",
    punto: "#081725",
  },
  claro: {
    secundario: "#64748b",
    grilla: "rgba(100,116,139,0.13)",
    punto: "#ffffff",
  },
};

const COLOR_A = "#38bdf8";

const COLOR_B = "#34d399";

// Funciones auxiliares

const aNumero = (valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const promedio = (valores) => {
  if (!valores.length) return null;
  return (
    valores.reduce((suma, valor) => suma + valor, 0) /
    valores.length
  );
};

const formatoTemperatura = (valor) =>
  valor === null
    ? "—"
    : `${valor.toFixed(1).replace(".", ",")} °C`;

const fechaLegible = (fecha) => {
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia} ${MESES[Number(mes)].toLowerCase()} ${anio}`;
};

const periodoMesLegible = (periodo) => {
  if (!periodo) return "";
  const [anio, mes] = periodo.split("-");
  return `${MESES[Number(mes)]} ${anio}`;
};

const diasDelPeriodo = (periodo) => {
  if (!periodo) return 0;
  const [anio, mes] = periodo.split("-").map(Number);
  return new Date(anio, mes, 0).getDate();
};

const elegirAlternativa = (opciones, principal, actual) => {
  if (
    actual &&
    actual !== principal &&
    opciones.includes(actual)
  ) {
    return actual;
  }
  const indice = opciones.indexOf(principal);
  if (indice > 0) {
    return opciones[indice - 1];
  }
  return opciones.find((opcion) => opcion !== principal) ?? "";
};

const usePreferencia = (clave, valorInicial) => {
  const [valor, setValor] = useState(() => {
    if (typeof window === "undefined") return valorInicial;
    try {
      const guardado = localStorage.getItem(clave);
      return guardado === null
        ? valorInicial
        : JSON.parse(guardado);
    } catch {
      return valorInicial;
    }
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(clave, JSON.stringify(valor));
    }
  }, [clave, valor]);
  return [valor, setValor];
};

// Preparación de datos

const crearDatosDia = (registros, fecha, categorias) => {
  const mapa = new Map(
    registros
      .filter((dato) => dato.fecha === fecha)
      .map((dato) => [
        String(dato.hora).substring(0, 2).padStart(2, "0"),
        dato,
      ])
  );
  return categorias.map((etiqueta) => {
    const hora = etiqueta.substring(0, 2);
    const registro = mapa.get(hora);
    return {
      etiqueta,
      valor: aNumero(registro?.temperatura),
    };
  });
};

const crearDatosMes = (registros, periodo, categorias) => {
  const mapa = new Map(
    registros
      .filter((dato) =>
        dato.fecha.startsWith(`${periodo}-`)
      )
      .map((dato) => [
        dato.fecha.substring(8, 10),
        dato,
      ])
  );
  return categorias.map((dia) => ({
    etiqueta: dia,
    valor: aNumero(mapa.get(dia)?.mediaDiaria),
  }));
};

const crearDatosAnio = (registros, anio) =>
  MESES_CORTOS.slice(1).map((etiqueta, indice) => {
    const mes = String(indice + 1).padStart(2, "0");
    const valores = registros
      .filter((dato) =>
        dato.fecha.startsWith(`${anio}-${mes}-`)
      )
      .map((dato) => aNumero(dato.mediaDiaria))
      .filter(Number.isFinite);
    return {
      etiqueta,
      valor: promedio(valores),
    };
  });

// Gráfico

function GraficoLinea({
  series,
  categorias,
  ticksX,
  minimoY,
  maximoY,
  tema,
  formatoCategoria,
}) {
  const [tooltip, setTooltip] = useState(null);
  useEffect(() => {
    setTooltip(null);
  }, [series]);
  return (
    <div className="grafico-visx">
      <ParentSize debounceTime={80}>
        {({ width, height }) => {
          if (width < 50 || height < 50) return null;
          const margen = {
            top: 25,
            right: 22,
            bottom: 42,
            left: 52,
          };
          const ancho =
            width - margen.left - margen.right;
          const alto =
            height - margen.top - margen.bottom;
          const escalaX = scalePoint({
            domain: categorias,
            range: [0, ancho],
            padding: 0.35,
          });
          const escalaY = scaleLinear({
            domain: [minimoY, maximoY],
            range: [alto, 0],
            nice: true,
          });
          const buscarCategoria = (x) =>
            categorias.reduce((cercana, etiqueta) => {
              const posicion = escalaX(etiqueta);
              if (posicion === undefined) return cercana;
              const distancia = Math.abs(posicion - x);
              if (!cercana || distancia < cercana.distancia) {
                return { etiqueta, distancia };
              }
              return cercana;
            }, null)?.etiqueta;
          const mostrarTooltip = (evento) => {
            const rect =
              evento.currentTarget.getBoundingClientRect();
            const x = evento.clientX - rect.left;
            const etiqueta = buscarCategoria(x);
            if (!etiqueta) return;
            const items = series
              .map((serie) => {
                const dato = serie.datos.find(
                  (item) => item.etiqueta === etiqueta
                );
                return dato && Number.isFinite(dato.valor)
                  ? { serie, dato }
                  : null;
              })
              .filter(Boolean);
            if (!items.length) {
              setTooltip(null);
              return;
            }
            const posicionX = escalaX(etiqueta);
            const posicionY = Math.min(
              ...items.map(({ dato }) =>
                escalaY(dato.valor)
              )
            );
            setTooltip({
              etiqueta,
              items,
              left: Math.min(
                width - 100,
                Math.max(
                  100,
                  margen.left + posicionX
                )
              ),
              top: Math.max(
                20,
                margen.top + posicionY
              ),
            });
          };
          return (
            <>
              <svg
                width={width}
                height={height}
                role="img"
                aria-label="Evolución de temperatura"
              >
                <g
                  transform={`translate(${margen.left}, ${margen.top})`}
                >
                  {/* Grilla */}
                  <GridRows
                    scale={escalaY}
                    width={ancho}
                    numTicks={5}
                    stroke={tema.grilla}
                  />
                  {/* Series */}
                  {series.map((serie) => (
                    <LinePath
                      key={serie.nombre}
                      data={serie.datos}
                      defined={(dato) =>
                        Number.isFinite(dato.valor)
                      }
                      x={(dato) =>
                        escalaX(dato.etiqueta) ?? 0
                      }
                      y={(dato) =>
                        escalaY(dato.valor)
                      }
                      stroke={serie.color}
                      strokeWidth={2.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {/* Puntos */}
                  {series.flatMap((serie) =>
                    serie.datos
                      .filter((dato) =>
                        Number.isFinite(dato.valor)
                      )
                      .map((dato) => (
                        <circle
                          key={`${serie.nombre}-${dato.etiqueta}`}
                          cx={escalaX(dato.etiqueta)}
                          cy={escalaY(dato.valor)}
                          r={3.4}
                          fill={serie.color}
                          stroke={tema.punto}
                          strokeWidth={2}
                        />
                      ))
                  )}
                  {/* Eje vertical */}
                  <AxisLeft
                    scale={escalaY}
                    numTicks={5}
                    hideAxisLine
                    hideTicks
                    tickFormat={(valor) => `${valor}°`}
                    tickLabelProps={() => ({
                      fill: tema.secundario,
                      fontSize: 10,
                      textAnchor: "end",
                      dx: -6,
                      dy: "0.33em",
                    })}
                  />
                  {/* Eje horizontal */}
                  <AxisBottom
                    top={alto}
                    scale={escalaX}
                    tickValues={ticksX}
                    hideAxisLine
                    hideTicks
                    tickLabelProps={() => ({
                      fill: tema.secundario,
                      fontSize: 10,
                      textAnchor: "middle",
                      dy: 8,
                    })}
                  />
                  {/* Área interactiva */}
                  <rect
                    width={ancho}
                    height={alto}
                    fill="transparent"
                    onPointerMove={mostrarTooltip}
                    onPointerDown={mostrarTooltip}
                    onPointerLeave={() => setTooltip(null)}
                  />
                </g>
              </svg>
              {/* Tooltip */}
              {tooltip && (
                <div
                  className="tooltip-temperatura"
                  style={{
                    left: tooltip.left,
                    top: tooltip.top,
                  }}
                >
                  <strong className="tooltip-titulo">
                    {formatoCategoria(tooltip.etiqueta)}
                  </strong>
                  {tooltip.items.map(({ serie, dato }) => (
                    <div
                      className="tooltip-serie"
                      key={serie.nombre}
                    >
                      <div>
                        <span
                          className="punto-tooltip"
                          style={{ background: serie.color }}
                        />
                        <span>{serie.nombre}</span>
                      </div>
                      <strong>
                        {formatoTemperatura(dato.valor)}
                      </strong>
                    </div>
                  ))}
                  {tooltip.items.length === 2 && (
                    <div className="tooltip-diferencia">
                      <span>Diferencia A − B</span>
                      <strong>
                        {(() => {
                          const diferencia =
                            tooltip.items[0].dato.valor -
                            tooltip.items[1].dato.valor;
                          const signo =
                            diferencia > 0 ? "+" : "";
                          return `${signo}${diferencia
                            .toFixed(1)
                            .replace(".", ",")} °C`;
                        })()}
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        }}
      </ParentSize>
    </div>
  );
}

// Componente principal

function TemperatureChart({
  estaciones = [],
  datosTemperatura = [],
  datosHorarios = [],
  temaOscuro = true,
}) {
  const [vista, setVista] =
    usePreferencia("grafico-vista", "dia");
  const [comparar, setComparar] =
    usePreferencia("grafico-comparar", false);
  const [
    estacionSeleccionada,
    setEstacionSeleccionada,
  ] = useState("");
  const [
    fechaSeleccionada,
    setFechaSeleccionada,
  ] = useState("");
  const [
    periodoMesSeleccionado,
    setPeriodoMesSeleccionado,
  ] = useState("");
  const [
    anioSeleccionado,
    setAnioSeleccionado,
  ] = useState("");
  const [
    fechaComparacion,
    setFechaComparacion,
  ] = useState("");
  const [
    periodoMesComparacion,
    setPeriodoMesComparacion,
  ] = useState("");
  const [
    anioComparacion,
    setAnioComparacion,
  ] = useState("");
  const tema =
    TEMAS_GRAFICO[
      temaOscuro ? "oscuro" : "claro"
    ];

// Datos de la estación
  useEffect(() => {
    const existe = estaciones.some(
      (estacion) =>
        estacion.id === estacionSeleccionada
    );
    if (!existe && estaciones.length) {
      setEstacionSeleccionada(estaciones[0].id);
    }
  }, [estaciones, estacionSeleccionada]);
  const estacion = useMemo(
    () =>
      estaciones.find(
        (item) =>
          item.id === estacionSeleccionada
      ) ?? null,
    [estaciones, estacionSeleccionada]
  );
  const diariosEstacion = useMemo(
    () =>
      datosTemperatura
        .filter(
          (dato) =>
            dato.estacionId === estacionSeleccionada
        )
        .sort((a, b) =>
          a.fecha.localeCompare(b.fecha)
        ),
    [datosTemperatura, estacionSeleccionada]
  );
  const horariosEstacion = useMemo(
    () =>
      datosHorarios
        .filter(
          (dato) =>
            dato.estacionId === estacionSeleccionada
        )
        .sort((a, b) =>
          `${a.fecha} ${a.hora}`.localeCompare(
            `${b.fecha} ${b.hora}`
          )
        ),
    [datosHorarios, estacionSeleccionada]
  );

// Períodos disponibles
  const fechasDisponibles = useMemo(
    () =>
      [
        ...new Set(
          horariosEstacion.map(
            (dato) => dato.fecha
          )
        ),
      ].sort(),
    [horariosEstacion]
  );
  const periodosMensuales = useMemo(
    () =>
      [
        ...new Set(
          diariosEstacion.map(
            (dato) =>
              dato.fecha.substring(0, 7)
          )
        ),
      ].sort(),
    [diariosEstacion]
  );
  const aniosDisponibles = useMemo(
    () =>
      [
        ...new Set(
          diariosEstacion.map(
            (dato) =>
              dato.fecha.substring(0, 4)
          )
        ),
      ].sort(),
    [diariosEstacion]
  );

// Selección inicial
  useEffect(() => {
    if (!fechasDisponibles.length) {
      setFechaSeleccionada("");
      return;
    }
    if (!fechasDisponibles.includes(fechaSeleccionada)) {
      setFechaSeleccionada(
        fechasDisponibles[
          fechasDisponibles.length - 1
        ]
      );
    }
  }, [fechasDisponibles, fechaSeleccionada]);
  useEffect(() => {
    if (!periodosMensuales.length) {
      setPeriodoMesSeleccionado("");
      return;
    }
    if (
      !periodosMensuales.includes(
        periodoMesSeleccionado
      )
    ) {
      setPeriodoMesSeleccionado(
        periodosMensuales[
          periodosMensuales.length - 1
        ]
      );
    }
  }, [
    periodosMensuales,
    periodoMesSeleccionado,
  ]);
  useEffect(() => {
    if (!aniosDisponibles.length) {
      setAnioSeleccionado("");
      return;
    }
    if (!aniosDisponibles.includes(anioSeleccionado)) {
      setAnioSeleccionado(
        aniosDisponibles[
          aniosDisponibles.length - 1
        ]
      );
    }
  }, [aniosDisponibles, anioSeleccionado]);

// Período de comparación
  useEffect(() => {
    if (!comparar || vista !== "dia") return;
    setFechaComparacion((actual) =>
      elegirAlternativa(
        fechasDisponibles,
        fechaSeleccionada,
        actual
      )
    );
  }, [
    comparar,
    vista,
    fechasDisponibles,
    fechaSeleccionada,
  ]);
  useEffect(() => {
    if (!comparar || vista !== "mes") return;
    setPeriodoMesComparacion((actual) =>
      elegirAlternativa(
        periodosMensuales,
        periodoMesSeleccionado,
        actual
      )
    );
  }, [
    comparar,
    vista,
    periodosMensuales,
    periodoMesSeleccionado,
  ]);
  useEffect(() => {
    if (!comparar || vista !== "anio") return;
    setAnioComparacion((actual) =>
      elegirAlternativa(
        aniosDisponibles,
        anioSeleccionado,
        actual
      )
    );
  }, [
    comparar,
    vista,
    aniosDisponibles,
    anioSeleccionado,
  ]);

// Validación de comparación
  const puedeComparar =
    vista === "dia"
      ? fechasDisponibles.length > 1
      : vista === "mes"
        ? periodosMensuales.length > 1
        : aniosDisponibles.length > 1;
  useEffect(() => {
    if (comparar && !puedeComparar) {
      setComparar(false);
    }
  }, [comparar, puedeComparar, setComparar]);

// Datos del gráfico
  const configuracion = useMemo(() => {

// Vista diaria
    if (vista === "dia") {
      const categorias = Array.from(
        { length: 24 },
        (_, hora) =>
          `${String(hora).padStart(2, "0")}:00`
      );
      const series = [
        {
          nombre: fechaLegible(fechaSeleccionada),
          color: COLOR_A,
          datos: crearDatosDia(
            horariosEstacion,
            fechaSeleccionada,
            categorias
          ),
        },
      ];
      if (comparar && fechaComparacion) {
        series.push({
          nombre: fechaLegible(fechaComparacion),
          color: COLOR_B,
          datos: crearDatosDia(
            horariosEstacion,
            fechaComparacion,
            categorias
          ),
        });
      }
      return {
        categorias,
        series,
        ticksX: categorias.filter(
          (_, indice) =>
            indice % 3 === 0 ||
            indice === 23
        ),
        formatoCategoria: (etiqueta) =>
          etiqueta,
      };
    }

// Vista mensual
    if (vista === "mes") {
      const periodos = [
        periodoMesSeleccionado,
        ...(comparar && periodoMesComparacion
          ? [periodoMesComparacion]
          : []),
      ].filter(Boolean);
      const cantidadDias = Math.max(
        ...periodos.map(diasDelPeriodo),
        1
      );
      const categorias = Array.from(
        { length: cantidadDias },
        (_, indice) =>
          String(indice + 1).padStart(2, "0")
      );
      const series = [
        {
          nombre: periodoMesLegible(
            periodoMesSeleccionado
          ),
          color: COLOR_A,
          datos: crearDatosMes(
            diariosEstacion,
            periodoMesSeleccionado,
            categorias
          ),
        },
      ];
      if (
        comparar &&
        periodoMesComparacion
      ) {
        series.push({
          nombre: periodoMesLegible(
            periodoMesComparacion
          ),
          color: COLOR_B,
          datos: crearDatosMes(
            diariosEstacion,
            periodoMesComparacion,
            categorias
          ),
        });
      }
      const posiblesTicks = [
        "01",
        "05",
        "10",
        "15",
        "20",
        "25",
        String(cantidadDias).padStart(2, "0"),
      ];
      return {
        categorias,
        series,
        ticksX: [
          ...new Set(
            posiblesTicks.filter((dia) =>
              categorias.includes(dia)
            )
          ),
        ],
        formatoCategoria: (etiqueta) =>
          `Día ${Number(etiqueta)}`,
      };
    }

// Vista anual
    const categorias =
      MESES_CORTOS.slice(1);
    const series = [
      {
        nombre: anioSeleccionado,
        color: COLOR_A,
        datos: crearDatosAnio(
          diariosEstacion,
          anioSeleccionado
        ),
      },
    ];
    if (comparar && anioComparacion) {
      series.push({
        nombre: anioComparacion,
        color: COLOR_B,
        datos: crearDatosAnio(
          diariosEstacion,
          anioComparacion
        ),
      });
    }
    return {
      categorias,
      series,
      ticksX: categorias,
      formatoCategoria: (etiqueta) =>
        etiqueta,
    };
  }, [
    vista,
    comparar,
    diariosEstacion,
    horariosEstacion,
    fechaSeleccionada,
    fechaComparacion,
    periodoMesSeleccionado,
    periodoMesComparacion,
    anioSeleccionado,
    anioComparacion,
  ]);

// Resumen del período
  const resumen = useMemo(() => {
    if (vista === "dia") {
      const valores = horariosEstacion
        .filter(
          (dato) =>
            dato.fecha === fechaSeleccionada
        )
        .map(
          (dato) =>
            aNumero(dato.temperatura)
        )
        .filter(Number.isFinite);
      if (!valores.length) {
        return {
          minima: null,
          media: null,
          maxima: null,
        };
      }
      return {
        minima: Math.min(...valores),
        media: promedio(valores),
        maxima: Math.max(...valores),
      };
    }
    const registros = diariosEstacion.filter(
      (dato) =>
        vista === "mes"
          ? dato.fecha.startsWith(
              `${periodoMesSeleccionado}-`
            )
          : dato.fecha.startsWith(
              `${anioSeleccionado}-`
            )
    );
    if (!registros.length) {
      return {
        minima: null,
        media: null,
        maxima: null,
      };
    }
    const minimas = registros
      .map((dato) => aNumero(dato.minima))
      .filter(Number.isFinite);
    const medias = registros
      .map((dato) => aNumero(dato.mediaDiaria))
      .filter(Number.isFinite);
    const maximas = registros
      .map((dato) => aNumero(dato.maxima))
      .filter(Number.isFinite);
    return {
      minima:
        minimas.length
          ? Math.min(...minimas)
          : null,
      media:
        promedio(medias),
      maxima:
        maximas.length
          ? Math.max(...maximas)
          : null,
    };
  }, [
    vista,
    horariosEstacion,
    diariosEstacion,
    fechaSeleccionada,
    periodoMesSeleccionado,
    anioSeleccionado,
  ]);

// Escala vertical
  const valores = useMemo(
    () =>
      configuracion.series.flatMap(
        (serie) =>
          serie.datos
            .map((dato) => dato.valor)
            .filter(Number.isFinite)
      ),
    [configuracion]
  );
  const minimoY =
    valores.length
      ? Math.floor(
          (Math.min(...valores) - 3) / 5
        ) * 5
      : 0;
  const maximoY =
    valores.length
      ? Math.max(
          minimoY + 10,
          Math.ceil(
            (Math.max(...valores) + 3) / 5
          ) * 5
        )
      : 40;
  const hayDatos =
    valores.length > 0;

// Interfaz
  return (
    <section
      className={`panel-temperatura ${
        temaOscuro
          ? "tema-oscuro"
          : "tema-claro"
      }`}
    >
      {/* Cabecera */}
      <header className="cabecera-temperatura">
        <div className="titulo-temperatura">
          <div className="icono-principal">
            <ChartLine size={20} />
          </div>
          <div>
            <h2>Evolución térmica</h2>
            {estacion && (
              <span className="ubicacion-temperatura">
                <MapPin size={12} />
                {estacion.localidad}
              </span>
            )}
          </div>
        </div>
        <div className="acciones-temperatura">
          {/* Selector de estación */}
          <div className="selector-estacion">
            <MapPin size={15} />
            <select
              value={estacionSeleccionada}
              onChange={(evento) =>
                setEstacionSeleccionada(
                  evento.target.value
                )
              }
              aria-label="Seleccionar estación"
            >
              {estaciones.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.huerto}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      {/* Controles */}
      <div className="barra-grafico">
        {/* Día / Mes / Año */}
        <nav
          className="selector-vista"
          aria-label="Período del gráfico"
        >
          {VISTAS.map(
            ({
              valor,
              texto,
              titulo,
              Icono,
            }) => (
              <button
                key={valor}
                type="button"
                title={titulo}
                className={
                  vista === valor
                    ? "boton-vista activo"
                    : "boton-vista"
                }
                onClick={() =>
                  setVista(valor)
                }
              >
                <Icono size={15} />
                <span>{texto}</span>
              </button>
            )
          )}
        </nav>
        {/* Comparación */}
        <button
          type="button"
          className={
            comparar
              ? "boton-comparar activo"
              : "boton-comparar"
          }
          onClick={() =>
            setComparar(
              (actual) => !actual
            )
          }
          disabled={!puedeComparar}
          aria-pressed={comparar}
          title={
            puedeComparar
              ? "Comparar dos períodos"
              : "No existen suficientes períodos para comparar"
          }
        >
          <ArrowLeftRight size={15} />
          <span>
            Comparar
          </span>
        </button>
        {/* Filtros */}
        <div className="filtros-periodo">
          {/* Vista diaria */}
          {vista === "dia" && (
            <>
              <label className="grupo-periodo">
                <span className="etiqueta-filtro">
                  {comparar && (
                    <span className="punto-serie serie-a" />
                  )}
                  {comparar ? "Día A" : "Fecha"}
                </span>
                <input
                  type="date"
                  value={fechaSeleccionada}
                  min={fechasDisponibles[0] ?? ""}
                  max={
                    fechasDisponibles[
                      fechasDisponibles.length - 1
                    ] ?? ""
                  }
                  onChange={(evento) =>
                    setFechaSeleccionada(
                      evento.target.value
                    )
                  }
                />
              </label>
              {comparar && (
  <label className="grupo-periodo">
    <span className="etiqueta-filtro">
      <span className="punto-serie serie-b" />
      Día B
    </span>
    <input
      type="date"
      value={fechaComparacion}
      min={fechasDisponibles[0] ?? ""}
      max={
        fechasDisponibles[
          fechasDisponibles.length - 1
        ] ?? ""
      }
      onChange={(evento) => {
        const nuevaFecha = evento.target.value;
        if (
          nuevaFecha !== fechaSeleccionada &&
          fechasDisponibles.includes(nuevaFecha)
        ) {
          setFechaComparacion(nuevaFecha);
        }
      }}
    />
  </label>
)}
            </>
          )}
          {/* Vista mensual */}
          {vista === "mes" && (
            <>
              <label className="grupo-periodo">
                <span className="etiqueta-filtro">
                  {comparar && (
                    <span className="punto-serie serie-a" />
                  )}
                  {comparar ? "Mes A" : "Mes"}
                </span>
                <select
                  value={periodoMesSeleccionado}
                  onChange={(evento) =>
                    setPeriodoMesSeleccionado(
                      evento.target.value
                    )
                  }
                >
                  {periodosMensuales.map(
                    (periodo) => (
                      <option
                        key={periodo}
                        value={periodo}
                      >
                        {periodoMesLegible(periodo)}
                      </option>
                    )
                  )}
                </select>
              </label>
              {comparar && (
                <label className="grupo-periodo">
                  <span className="etiqueta-filtro">
                    <span className="punto-serie serie-b" />
                    Mes B
                  </span>
                  <select
                    value={periodoMesComparacion}
                    onChange={(evento) =>
                      setPeriodoMesComparacion(
                        evento.target.value
                      )
                    }
                  >
                    {periodosMensuales.map(
                      (periodo) => (
                        <option
                          key={periodo}
                          value={periodo}
                          disabled={
                            periodo ===
                            periodoMesSeleccionado
                          }
                        >
                          {periodoMesLegible(periodo)}
                        </option>
                      )
                    )}
                  </select>
                </label>
              )}
            </>
          )}
          {/* Vista anual */}
          {vista === "anio" && (
            <>
              <label className="grupo-periodo">
                <span className="etiqueta-filtro">
                  {comparar && (
                    <span className="punto-serie serie-a" />
                  )}
                  {comparar ? "Año A" : "Año"}
                </span>
                <select
                  value={anioSeleccionado}
                  onChange={(evento) =>
                    setAnioSeleccionado(
                      evento.target.value
                    )
                  }
                >
                  {aniosDisponibles.map(
                    (anio) => (
                      <option
                        key={anio}
                        value={anio}
                      >
                        {anio}
                      </option>
                    )
                  )}
                </select>
              </label>
              {comparar && (
                <label className="grupo-periodo">
                  <span className="etiqueta-filtro">
                    <span className="punto-serie serie-b" />
                    Año B
                  </span>
                  <select
                    value={anioComparacion}
                    onChange={(evento) =>
                      setAnioComparacion(
                        evento.target.value
                      )
                    }
                  >
                    {aniosDisponibles.map(
                      (anio) => (
                        <option
                          key={anio}
                          value={anio}
                          disabled={
                            anio ===
                            anioSeleccionado
                          }
                        >
                          {anio}
                        </option>
                      )
                    )}
                  </select>
                </label>
              )}
            </>
          )}
        </div>
        {/* Resumen */}
        {!comparar && (
          <div className="resumen-temperatura">
            <div>
              <Snowflake size={13} />
              <span>Mínima</span>
              <strong>
                {formatoTemperatura(
                  resumen.minima
                )}
              </strong>
            </div>
            <div>
              <Thermometer size={13} />
              <span>Media</span>
              <strong>
                {formatoTemperatura(
                  resumen.media
                )}
              </strong>
            </div>
            <div>
              <ThermometerSun size={13} />
              <span>Máxima</span>
              <strong>
                {formatoTemperatura(
                  resumen.maxima
                )}
              </strong>
            </div>
          </div>
        )}
        {/* Leyenda de comparación */}
        {comparar && (
          <div className="leyenda-comparacion">
            {configuracion.series.map(
              (serie, indice) => (
                <div
                  className="item-leyenda"
                  key={serie.nombre}
                >
                  <span
                    className={
                      indice === 0
                        ? "linea-leyenda serie-a"
                        : "linea-leyenda serie-b"
                    }
                  />
                  <span>
                    {serie.nombre}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
      {/* GRÁFICO */}
      <div className="area-temperatura">
        {hayDatos ? (
          <GraficoLinea
            series={configuracion.series}
            categorias={configuracion.categorias}
            ticksX={configuracion.ticksX}
            minimoY={minimoY}
            maximoY={maximoY}
            tema={tema}
            formatoCategoria={
              configuracion.formatoCategoria
            }
          />
        ) : (
          <div className="sin-datos">
            <Thermometer size={28} />
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
