import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import "./TemperatureChart.css";
function TemperatureChart({
  estaciones = [],
  datosTemperatura = [],
}) {
  const [estacionSeleccionada, setEstacionSeleccionada] =
  useState(() => estaciones[0]?.id ?? "");
  useEffect(() => {
    if (!estacionSeleccionada && estaciones.length > 0) {
      setEstacionSeleccionada(estaciones[0].id);
    }
  }, [estaciones, estacionSeleccionada]);
  const datosEstacion = useMemo(() => {
    return datosTemperatura
      .filter(
        (dato) =>
          dato.estacionId === estacionSeleccionada
      )
      .sort((a, b) =>
        a.fecha.localeCompare(b.fecha)
      );
  }, [
    datosTemperatura,
    estacionSeleccionada
  ]);
  const informacionEstacion =
    estaciones.find(
      (estacion) =>
        estacion.id === estacionSeleccionada
    );
  const mostrarEtiquetas =
    datosEstacion.length <= 12;
  const fechas = datosEstacion.map(
    (dato) => dato.fecha
  );
  const temperaturasMaximas =
    datosEstacion.map(
      (dato) => dato.maxima
    );
  const temperaturasMedias =
    datosEstacion.map(
      (dato) => dato.mediaDiaria
    );
  const temperaturasMinimas =
    datosEstacion.map(
      (dato) => dato.minima
    );
  const todasTemperaturas =
    datosEstacion.flatMap((dato) => [
      dato.maxima,
      dato.mediaDiaria,
      dato.minima,
    ]);
  const minimoReal =
    todasTemperaturas.length > 0
      ? Math.min(...todasTemperaturas)
      : 0;
  const maximoReal =
    todasTemperaturas.length > 0
      ? Math.max(...todasTemperaturas)
      : 40;
  const minimoEje =
    Math.floor((minimoReal - 3) / 5) * 5;
  const maximoEje =
    Math.max(
      40,
      Math.ceil((maximoReal + 3) / 5) * 5
    );
  const formatearFechaCorta = (fecha) => {
    if (!fecha) return "";
    const [, mes, dia] =
      fecha.split("-");
    const meses = [
      "",
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ];
    return `${dia} ${meses[Number(mes)]}`;
  };
  const formatearFechaCompleta = (fecha) => {
    if (!fecha) return "";
    const [anio, mes, dia] =
      fecha.split("-");
    return `${dia}-${mes}-${anio}`;
  };
  const opciones = {
    backgroundColor: "transparent",
    animationDuration: 500,
    tooltip: {
      trigger: "axis",
      backgroundColor: "#081525",
      borderColor: "#30435f",
      borderWidth: 1,
      padding: 15,
      textStyle: {
        color: "#f8fafc",
        fontSize: 12,
      },
      axisPointer: {
        type: "line",
        lineStyle: {
          color: "#64748b",
          type: "dashed",
          width: 1,
        },
      },
      formatter: (parametros) => {
        if (!parametros?.length) {
          return "";
        }
        const indice =
          parametros[0].dataIndex;
        const lectura =
          datosEstacion[indice];
        if (!lectura) {
          return "";
        }
        return `
          <div style="
            min-width:250px;
          ">
            <div style="
              font-size:14px;
              font-weight:700;
              margin-bottom:4px;
            ">
              ${formatearFechaCompleta(
                lectura.fecha
              )}
            </div>
            <div style="
              color:#94a3b8;
              font-size:11px;
              margin-bottom:12px;
            ">
              ${
                informacionEstacion?.huerto ??
                estacionSeleccionada
              }
            </div>
            <div style="
              display:flex;
              justify-content:space-between;
              gap:30px;
              padding:5px 0;
            ">
              <span style="color:#fb923c">
                ● Máxima
              </span>
              <strong>
                ${lectura.maxima} °C
              </strong>
            </div>
            <div style="
              display:flex;
              justify-content:space-between;
              gap:30px;
              padding:5px 0;
            ">
              <span style="color:#38bdf8">
                ● Media
              </span>
              <strong>
                ${lectura.mediaDiaria} °C
              </strong>
            </div>
            <div style="
              display:flex;
              justify-content:space-between;
              gap:30px;
              padding:5px 0;
            ">
              <span style="color:#818cf8">
                ● Mínima
              </span>
              <strong>
                ${lectura.minima} °C
              </strong>
            </div>
            ${
              lectura.mediaMaxima !== undefined
                ? `
                  <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:30px;
                    padding:5px 0;
                    color:#94a3b8;
                  ">
                    <span>
                      Media máxima
                    </span>
                    <span>
                      ${lectura.mediaMaxima} °C
                    </span>
                  </div>
                `
                : ""
            }
            ${
              lectura.mediaMinima !== undefined
                ? `
                  <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:30px;
                    padding:5px 0;
                    color:#94a3b8;
                  ">
                    <span>
                      Media mínima
                    </span>
                    <span>
                      ${lectura.mediaMinima} °C
                    </span>
                  </div>
                `
                : ""
            }
          </div>
        `;
      },
    },
    legend: {
      top: 5,
      right: 10,
      icon: "circle",
      itemWidth: 9,
      itemHeight: 9,
      itemGap: 22,
      textStyle: {
        color: "#cbd5e1",
        fontSize: 12,
      },
      data: [
        "Temperatura máxima",
        "Temperatura media",
        "Temperatura mínima",
      ],
    },
    grid: {
      left: 75,
      right: 60,
      top: 70,
      bottom: 90,
    },
    xAxis: {
      type: "category",
      data: fechas,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: "#3d506b",
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: "#91a4c0",
        margin: 15,
        formatter: (fecha) =>
          formatearFechaCorta(fecha),
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: "value",
      min: minimoEje,
      max: maximoEje,
      interval: 5,
      name: "Temperatura (°C)",
      nameLocation: "end",
      nameGap: 24,
      nameTextStyle: {
        color: "#91a4c0",
        fontSize: 12,
      },
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: "#91a4c0",
        formatter:
          "{value} °C",
      },
      splitLine: {
        lineStyle: {
          color:
            "rgba(148,163,184,0.10)",
        },
      },
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
      },
      {
        type: "slider",
        start: 0,
        end: 100,
        bottom: 15,
        height: 18,
        borderColor: "#334155",
        backgroundColor: "#101827",
        fillerColor:
          "rgba(96,165,250,0.16)",
        handleStyle: {
          color: "#cbd5e1",
          borderColor: "#64748b",
        },
        textStyle: {
          color: "#8192aa",
        },
      },
    ],
    series: [
      {
        name: "Temperatura máxima",
        type: "line",
        data: temperaturasMaximas,
        smooth: 0.2,
        connectNulls: false,
        symbol: "circle",
        symbolSize: 9,
        showSymbol: true,
        lineStyle: {
          width: 3,
          color: "#fb923c",
        },
        itemStyle: {
          color: "#fb923c",
          borderColor: "#081827",
          borderWidth: 2,
        },
        label: {
          show: mostrarEtiquetas,
          position: "top",
          distance: 8,
          color: "#fdba74",
          fontSize: 11,
          fontWeight: 700,
          formatter: ({ value }) =>
            `${value}°`,
        },
        emphasis: {
          focus: "series",
          scale: 1.4,
          itemStyle: {
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: {
            color: "#e2e8f0",
            fontSize: 11,
            fontWeight: 700,
            backgroundColor:
              "rgba(15,23,42,0.92)",
            padding: [4, 7],
            borderRadius: 5,
            position: "end",
          },
          data: [
            {
              yAxis: 30,
              lineStyle: {
                color: "#fb923c",
                type: "dashed",
                width: 1.5,
              },
              label: {
                formatter:
                  "Alerta · 30 °C",
              },
            },
            {
              yAxis: 35,
              lineStyle: {
                color: "#ef4444",
                type: "dashed",
                width: 1.5,
              },
              label: {
                formatter:
                  "Crítico · 35 °C",
              },
            },
          ],
        },
        markArea: {
          silent: true,
          label: {
            show: false,
          },
          data: [
            [
              {
                yAxis: 30,
                itemStyle: {
                  color:
                    "rgba(251,146,60,0.035)",
                },
              },
              {
                yAxis: 35,
              },
            ],
            [
              {
                yAxis: 35,
                itemStyle: {
                  color:
                    "rgba(239,68,68,0.045)",
                },
              },
              {
                yAxis: maximoEje,
              },
            ],
          ],
        },
      },
      {
        name: "Temperatura media",
        type: "line",
        data: temperaturasMedias,
        smooth: 0.2,
        connectNulls: false,
        symbol: "circle",
        symbolSize: 8,
        showSymbol: true,
        lineStyle: {
          width: 2.5,
          color: "#38bdf8",
        },
        itemStyle: {
          color: "#38bdf8",
          borderColor: "#081827",
          borderWidth: 2,
        },
        label: {
          show: mostrarEtiquetas,
          position: "right",
          distance: 8,
          color: "#7dd3fc",
          fontSize: 10,
          formatter: ({ value }) =>
            `${value}°`,
        },
        emphasis: {
          focus: "series",
          scale: 1.4,
        },
      },
      {
        name: "Temperatura mínima",
        type: "line",
        data: temperaturasMinimas,
        smooth: 0.2,
        connectNulls: false,
        symbol: "circle",
        symbolSize: 8,
        showSymbol: true,
        lineStyle: {
          width: 2.5,
          color: "#818cf8",
        },
        itemStyle: {
          color: "#818cf8",
          borderColor: "#081827",
          borderWidth: 2,
        },
        label: {
          show: mostrarEtiquetas,
          position: "bottom",
          distance: 8,
          color: "#a5b4fc",
          fontSize: 10,
          formatter: ({ value }) =>
            `${value}°`,
        },
        emphasis: {
          focus: "series",
          scale: 1.4,
        },
      },
    ],
  };
  return (
    <section className="panel-temperatura">
      <header className="cabecera-temperatura">
        <div>
          <span className="sobre-titulo">
            ESTACIÓN METEOROLÓGICA
          </span>
          <h2>
            Comportamiento térmico
          </h2>
          <p>
            Temperaturas máximas, medias y mínimas
            registradas por la estación.
          </p>
        </div>
        <div className="selector-estacion">
          <label htmlFor="estacion">
            Estación
          </label>
          <select
            id="estacion"
            value={estacionSeleccionada}
            onChange={(evento) =>
              setEstacionSeleccionada(
                evento.target.value
              )
            }
          >
            {estaciones.map((estacion) => (
              <option
                key={estacion.id}
                value={estacion.id}
              >
                {estacion.huerto}
              </option>
            ))}
          </select>
        </div>
      </header>
      {informacionEstacion && (
        <div className="informacion-estacion">
          <span>
            {informacionEstacion.localidad}
          </span>
          <span className="separador-info">
            •
          </span>
          <span>
            {informacionEstacion.ubicacion}
          </span>
        </div>
      )}
      <div className="area-grafico">
        <ReactECharts
          option={opciones}
          notMerge={true}
          lazyUpdate={true}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </section>
  );
}
export default TemperatureChart;