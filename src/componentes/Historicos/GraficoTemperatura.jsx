import {
  useEffect,
  useState,
} from "react";

import {
  AxisBottom,
  AxisLeft,
} from "@visx/axis";

import {
  GridRows,
} from "@visx/grid";

import {
  ParentSize,
} from "@visx/responsive";

import {
  scaleLinear,
  scalePoint,
} from "@visx/scale";

import {
  LinePath,
} from "@visx/shape";

const formatearTemperatura = (
  valor
) =>
  Number.isFinite(valor)
    ? `${valor
        .toFixed(1)
        .replace(".", ",")} °C`
    : "—";

function GraficoTemperatura({
  series,
  categorias,
  ticksX,
  minimoY,
  maximoY,
  tema,
  formatoCategoria,
}) {
  const [
    tooltip,
    setTooltip,
  ] = useState(null);

  useEffect(() => {
    setTooltip(null);
  }, [series]);

  return (
    <div className="grafico-visx">
      <ParentSize
        debounceTime={80}
      >
        {({
          width,
          height,
        }) => {
          if (
            width < 50 ||
            height < 50
          ) {
            return null;
          }

          const margen = {
            top: 25,
            right: 22,
            bottom: 42,
            left: 52,
          };

          const ancho =
            width -
            margen.left -
            margen.right;

          const alto =
            height -
            margen.top -
            margen.bottom;

          const escalaX =
            scalePoint({
              domain:
                categorias,
              range: [
                0,
                ancho,
              ],
              padding: 0.35,
            });

          const escalaY =
            scaleLinear({
              domain: [
                minimoY,
                maximoY,
              ],
              range: [
                alto,
                0,
              ],
              nice: true,
            });

          const buscarCategoria =
            (x) =>
              categorias.reduce(
                (
                  cercana,
                  etiqueta
                ) => {
                  const posicion =
                    escalaX(
                      etiqueta
                    );

                  if (
                    posicion ===
                    undefined
                  ) {
                    return cercana;
                  }

                  const distancia =
                    Math.abs(
                      posicion - x
                    );

                  return !cercana ||
                    distancia <
                      cercana.distancia
                    ? {
                        etiqueta,
                        distancia,
                      }
                    : cercana;
                },
                null
              )?.etiqueta;

          const mostrarTooltip =
            (evento) => {
              const rect =
                evento.currentTarget
                  .getBoundingClientRect();

              const x =
                evento.clientX -
                rect.left;

              const etiqueta =
                buscarCategoria(
                  x
                );

              if (!etiqueta) {
                return;
              }

              const items =
                series
                  .map(
                    (serie) => {
                      const dato =
                        serie.datos.find(
                          (item) =>
                            item.etiqueta ===
                            etiqueta
                        );

                      return dato &&
                        Number.isFinite(
                          dato.valor
                        )
                        ? {
                            serie,
                            dato,
                          }
                        : null;
                    }
                  )
                  .filter(Boolean);

              if (!items.length) {
                setTooltip(null);
                return;
              }

              const posicionX =
                escalaX(
                  etiqueta
                );

              const posicionY =
                Math.min(
                  ...items.map(
                    ({ dato }) =>
                      escalaY(
                        dato.valor
                      )
                  )
                );

              setTooltip({
                etiqueta,
                items,
                left: Math.min(
                  width - 100,
                  Math.max(
                    100,
                    margen.left +
                      posicionX
                  )
                ),
                top: Math.max(
                  20,
                  margen.top +
                    posicionY
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
                  <GridRows
                    scale={
                      escalaY
                    }
                    width={ancho}
                    numTicks={5}
                    stroke={
                      tema.grilla
                    }
                  />

                  {series.map(
                    (serie) => (
                      <LinePath
                        key={
                          serie.nombre
                        }
                        data={
                          serie.datos
                        }
                        defined={(
                          dato
                        ) =>
                          Number.isFinite(
                            dato.valor
                          )
                        }
                        x={(dato) =>
                          escalaX(
                            dato.etiqueta
                          ) ?? 0
                        }
                        y={(dato) =>
                          escalaY(
                            dato.valor
                          )
                        }
                        stroke={
                          serie.color
                        }
                        strokeWidth={
                          2.7
                        }
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )
                  )}

                  {series.flatMap(
                    (serie) =>
                      serie.datos
                        .filter(
                          (dato) =>
                            Number.isFinite(
                              dato.valor
                            )
                        )
                        .map(
                          (dato) => (
                            <circle
                              key={`${serie.nombre}-${dato.etiqueta}`}
                              cx={escalaX(
                                dato.etiqueta
                              )}
                              cy={escalaY(
                                dato.valor
                              )}
                              r={
                                3.4
                              }
                              fill={
                                serie.color
                              }
                              stroke={
                                tema.punto
                              }
                              strokeWidth={
                                2
                              }
                            />
                          )
                        )
                  )}

                  <AxisLeft
                    scale={
                      escalaY
                    }
                    numTicks={5}
                    hideAxisLine
                    hideTicks
                    tickFormat={(
                      valor
                    ) =>
                      `${valor}°`
                    }
                    tickLabelProps={() => ({
                      fill:
                        tema.secundario,
                      fontSize: 10,
                      textAnchor:
                        "end",
                      dx: -6,
                      dy: "0.33em",
                    })}
                  />

                  <AxisBottom
                    top={alto}
                    scale={
                      escalaX
                    }
                    tickValues={
                      ticksX
                    }
                    hideAxisLine
                    hideTicks
                    tickLabelProps={() => ({
                      fill:
                        tema.secundario,
                      fontSize: 10,
                      textAnchor:
                        "middle",
                      dy: 8,
                    })}
                  />

                  <rect
                    width={ancho}
                    height={alto}
                    fill="transparent"
                    onPointerMove={
                      mostrarTooltip
                    }
                    onPointerDown={
                      mostrarTooltip
                    }
                    onPointerLeave={() =>
                      setTooltip(
                        null
                      )
                    }
                  />
                </g>
              </svg>

              {tooltip && (
                <div
                  className="tooltip-temperatura"
                  style={{
                    left:
                      tooltip.left,
                    top:
                      tooltip.top,
                  }}
                >
                  <strong className="tooltip-titulo">
                    {formatoCategoria(
                      tooltip.etiqueta
                    )}
                  </strong>

                  {tooltip.items.map(
                    ({
                      serie,
                      dato,
                    }) => (
                      <div
                        className="tooltip-serie"
                        key={
                          serie.nombre
                        }
                      >
                        <div>
                          <span
                            className="punto-tooltip"
                            style={{
                              background:
                                serie.color,
                            }}
                          />

                          <span>
                            {
                              serie.nombre
                            }
                          </span>
                        </div>

                        <strong>
                          {formatearTemperatura(
                            dato.valor
                          )}
                        </strong>
                      </div>
                    )
                  )}

                  {tooltip.items
                    .length ===
                    2 && (
                    <div className="tooltip-diferencia">
                      <span>
                        Diferencia A − B
                      </span>

                      <strong>
                        {(() => {
                          const diferencia =
                            tooltip
                              .items[0]
                              .dato
                              .valor -
                            tooltip
                              .items[1]
                              .dato
                              .valor;

                          const signo =
                            diferencia >
                            0
                              ? "+"
                              : "";

                          return `${signo}${diferencia
                            .toFixed(
                              1
                            )
                            .replace(
                              ".",
                              ","
                            )} °C`;
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

export default GraficoTemperatura;