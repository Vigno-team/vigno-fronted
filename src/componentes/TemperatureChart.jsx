import ReactECharts from "echarts-for-react";
import "./TemperatureChart.css";

function TemperatureChart({ seriesTemporales }) {
  /*
   * Colores de cada temporada
   */
  const colores = [
    "#60a5fa", // 2024
    "#84cc16", // 2025
    "#c084fc", // 2026
  ];

  /*
   * Convierte:
   * 2024-09-01T08:00:00
   *
   * en:
   * 09-01 08:00
   *
   * De esta forma podemos superponer diferentes años.
   */
  const obtenerMomento = (fecha) => {
    const [, mes, resto] = fecha.split("-");
    const [dia, horaCompleta] = resto.split("T");

    return `${mes}-${dia} ${horaCompleta.substring(0, 5)}`;
  };

  /*
   * Formato de fecha para el tooltip
   */
  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "Sin fecha";
    }

    const fechaObjeto = new Date(fecha);

    return fechaObjeto.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /*
   * Creamos las categorías del eje X
   */
  const categorias = [
    ...new Set(
      seriesTemporales.flatMap((serie) =>
        serie.datos.map((dato) =>
          obtenerMomento(dato.fecha)
        )
      )
    ),
  ].sort();

  /*
   * ==============================
   * SERIES DE LAS TEMPORADAS
   * ==============================
   */
  const seriesTemporadas = seriesTemporales.map(
    (serie, indice) => {
      const mapaDatos = {};

      /*
       * Asociamos cada momento con su lectura
       */
      serie.datos.forEach((dato) => {
        mapaDatos[obtenerMomento(dato.fecha)] =
          dato;
      });

      /*
       * Construimos la serie respetando los null.
       */
      const datosGrafico = categorias.map(
        (categoria) => {
          const dato = mapaDatos[categoria];

          /*
           * Si esa temporada no tiene dato
           * para esa posición.
           */
          if (!dato) {
            return {
              value: null,
            };
          }

          /*
           * Si el sensor entregó null,
           * se conserva null.
           *
           * Esto genera el corte real
           * en la línea.
           */
          return {
            value: dato.temperatura,
            fechaOriginal: dato.fecha,
          };
        }
      );

      return {
        name: serie.nombre,

        type: "line",

        data: datosGrafico,

        /*
         * Curva suave pero no exagerada.
         */
        smooth: 0.25,

        /*
         * MUY IMPORTANTE:
         * no unir lecturas cuando existe null.
         */
        connectNulls: false,

        /*
         * Ocultamos puntos normales para
         * mantener el gráfico limpio.
         */
        showSymbol: false,

        symbol: "circle",

        symbolSize: 7,

        lineStyle: {
          width: 3,
          color:
            colores[indice % colores.length],
        },

        itemStyle: {
          color:
            colores[indice % colores.length],
        },

        emphasis: {
          focus: "series",

          scale: true,

          lineStyle: {
            width: 4,
          },
        },

        /*
         * Al pasar el mouse por una serie
         * aparecerá el punto correspondiente.
         */
        symbolKeepAspect: true,
      };
    }
  );

  /*
   * ========================================
   * SERIE INDEPENDIENTE PARA LOS UMBRALES
   * ========================================
   *
   * Esta es la corrección importante.
   *
   * Antes los markLine estaban dentro
   * de Temporada 2024.
   *
   * Ahora pertenecen a una serie
   * independiente que no aparece
   * en la leyenda.
   *
   * Por eso:
   *
   * 2024 oculta -> umbrales visibles
   * 2025 oculta -> umbrales visibles
   * 2026 oculta -> umbrales visibles
   */
  const serieUmbrales = {
    name: "__umbrales__",

    type: "line",

    /*
     * Necesitamos una serie técnicamente,
     * pero no dibujaremos ninguna línea.
     */
    data: categorias.map(() => null),

    showSymbol: false,

    silent: true,

    lineStyle: {
      opacity: 0,
    },

    itemStyle: {
      opacity: 0,
    },

    /*
     * No debe aparecer en tooltip.
     */
    tooltip: {
      show: false,
    },

    /*
     * ==============================
     * LÍNEAS DE UMBRAL
     * ==============================
     */
    markLine: {
      silent: true,

      symbol: "none",

      animation: false,

      label: {
        show: true,

        color: "#dbe7ff",

        fontSize: 11,

        fontWeight: 600,

        backgroundColor:
          "rgba(15, 23, 42, 0.92)",

        padding: [4, 7],

        borderRadius: 5,

        position: "end",
      },

      data: [
        /*
         * Alerta
         */
        {
          yAxis: 30,

          name: "Alerta térmica",

          lineStyle: {
            color: "#fb923c",
            width: 2,
            type: "dashed",
          },

          label: {
            formatter: "30 °C",
          },
        },

        /*
         * Crítico
         */
        {
          yAxis: 35,

          name: "Nivel crítico",

          lineStyle: {
            color: "#ef4444",
            width: 2,
            type: "dashed",
          },

          label: {
            formatter: "35 °C",
          },
        },
      ],
    },

    /*
     * ==============================
     * ZONAS DE ALERTA
     * ==============================
     *
     * Son muy suaves para no molestar
     * visualmente.
     */
    markArea: {
      silent: true,

      animation: false,

      label: {
        show: false,
      },

      data: [
        /*
         * Zona 30 - 35 °C
         */
        [
          {
            yAxis: 30,

            itemStyle: {
              color:
                "rgba(251, 146, 60, 0.035)",
            },
          },

          {
            yAxis: 35,
          },
        ],

        /*
         * Zona superior a 35 °C
         */
        [
          {
            yAxis: 35,

            itemStyle: {
              color:
                "rgba(239, 68, 68, 0.045)",
            },
          },

          {
            yAxis: 40,
          },
        ],
      ],
    },

    /*
     * Dejamos esta serie detrás
     * de las temporadas.
     */
    z: 0,
  };

  /*
   * Unimos temporadas + umbrales.
   */
  const series = [
    ...seriesTemporadas,
    serieUmbrales,
  ];

  /*
   * ========================================
   * CONFIGURACIÓN ECHARTS
   * ========================================
   */
  const opciones = {
    backgroundColor: "transparent",

    animation: true,

    animationDuration: 500,

    /*
     * ==============================
     * TOOLTIP
     * ==============================
     */
    tooltip: {
      trigger: "axis",

      backgroundColor: "#0b1422",

      borderColor: "#334155",

      borderWidth: 1,

      padding: 14,

      textStyle: {
        color: "#ffffff",
        fontSize: 12,
      },

      axisPointer: {
        type: "line",

        lineStyle: {
          color: "#64748b",
          width: 1,
          type: "dashed",
        },
      },

      formatter: (parametros) => {
        /*
         * Eliminamos cualquier posible
         * referencia a la serie auxiliar.
         */
        const datosVisibles =
          parametros.filter(
            (parametro) =>
              parametro.seriesName !==
              "__umbrales__"
          );

        if (datosVisibles.length === 0) {
          return "";
        }

        let contenido = `
          <div style="min-width:230px;">
            <div style="
              color:#94a3b8;
              font-size:11px;
              margin-bottom:9px;
            ">
              ${datosVisibles[0].axisValue}
            </div>
        `;
        datosVisibles.forEach(
          (parametro) => {
            const dato = parametro.data;
            /*Lecturas nulas*/
            if (
              dato?.value === null ||
              dato?.value === undefined
            ) {
              contenido += `
                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                    gap:25px;
                    margin-top:8px;
                  "
                >
                  <span>
                    ${parametro.marker}
                    ${parametro.seriesName}
                  </span>
                  <strong
                    style="color:#94a3b8;"
                  >
                    Sin lectura
                  </strong>
                </div>
              `;
              return;
            }
            /*Estado de temperatura*/
            let estado = "Normal";
            let colorEstado = "#4ade80";
            if (dato.value > 35) {
              estado = "Crítico";
              colorEstado = "#ef4444";
            } else if (dato.value > 30) {
              estado = "Alerta";
              colorEstado = "#fb923c";
            }
            contenido += `
              <div style="
                margin-top:10px;
                padding-top:8px;
                border-top:1px solid rgba(148,163,184,0.12);
              ">
                <div style="
                  display:flex;
                  justify-content:space-between;
                  gap:25px;
                ">
                  <span>
                    ${parametro.marker}
                    <strong>
                      ${parametro.seriesName}
                    </strong>
                  </span>
                  <strong>
                    ${dato.value} °C
                  </strong>
                </div>
                <div style="
                  color:#94a3b8;
                  font-size:11px;
                  margin-top:4px;
                ">
                  ${formatearFecha(
                    dato.fechaOriginal
                  )}
                </div>
                <div style="
                  color:${colorEstado};
                  font-size:11px;
                  font-weight:700;
                  margin-top:4px;
                ">
                  ${estado}
                </div>
              </div>
            `;
          }
        );
        contenido += "</div>";
        return contenido;
      },
    },
    legend: {
      top: 0,
      right: 10,
      data: seriesTemporales.map(
        (serie) => serie.nombre
      ),
      icon: "circle",
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 20,
      textStyle: {
        color: "#d5dfed",
        fontSize: 13,
      },
      /*Permite elegir temporadas.*/
      selectedMode: true,
    },
    /*ESPACIO DEL GRÁFICO*/
    grid: {
      left: 65,
      right: 55,
      top: 65,
      bottom: 85,
      containLabel: false,
    },
    /*lo que muestra el eje x*/
    xAxis: {
      type: "category",
      data: categorias,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: "#42536d",
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: "#93a4bf",
        margin: 14,
        interval:
          categorias.length > 14 ? 3 : 1,
        formatter: (valor) => {
          const [fecha, hora] =
            valor.split(" ");
          return `${fecha}\n${hora}`;
        },
      },
      splitLine: {
        show: false,
      },
    },
    /* lo que muestra el eje y */
    yAxis: {
      type: "value",
      min: 0,
      max: 40,
      interval: 10,
      name: "Temperatura (°C)",
      nameLocation: "end",
      nameGap: 28,
      nameTextStyle: {
        color: "#9bb0ce",
        fontSize: 12,
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: "#93a4bf",
        formatter: "{value} °C",
      },
      splitLine: {
        lineStyle: {
          color:
            "rgba(148, 163, 184, 0.12)",
        },
      },
    },
    dataZoom: [
      /* Zoom con el mouse*/
      {
        type: "inside",
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
      },

      /*slide del zoom*/ 
      {
        type: "slider",
        start: 0,
        end: 100,
        bottom: 15,
        height: 20,
        borderColor: "#34445d",
        backgroundColor: "#111827",
        fillerColor:
          "rgba(99, 102, 241, 0.24)",
        dataBackground: {
          lineStyle: {
            color: "#7384c5",
          },
          areaStyle: {
            color:
              "rgba(115, 132, 197, 0.30)",
          },
        },
        selectedDataBackground: {
          lineStyle: {
            color: "#8b9ce0",
          },
          areaStyle: {
            color:
              "rgba(139, 156, 224, 0.35)",
          },
        },
        handleStyle: {
          color: "#e2e8f0",
          borderColor: "#94a3b8",
        },
        moveHandleStyle: {
          color: "#94a3b8",
        },
        textStyle: {
          color: "#94a3b8",
        },
      },
    ],
    series,
  };
  return (
    <section className="contenedor-grafico-temperatura">
      <div className="encabezado-grafico">
        <div className="bloque-titulos-grafico">
          <span className="etiqueta-grafico">
            ANÁLISIS HISTÓRICO
          </span>
          <h2>
            Temperatura por temporada
          </h2>
          <p>
            Comparación multianual de las
            lecturas registradas por la estación.
          </p>
        </div>
        <div className="leyenda-umbrales">
          <span className="badge-umbral normal">
            Normal
          </span>
          <span className="badge-umbral alerta">
            30 – 35 °C
          </span>
          <span className="badge-umbral critico">
            &gt; 35 °C
          </span>
        </div>
      </div>
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