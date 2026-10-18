import{AxisBottom,AxisLeft}from"@visx/axis";
import{GridRows}from"@visx/grid";
import{ParentSize}from"@visx/responsive";
import{scaleLinear}from"@visx/scale";
import{Bar,LinePath}from"@visx/shape";
//  Seccion tooltip  ------------------
import { Line } from "@visx/shape";
import { useTooltip, TooltipWithBounds , defaultStyles} from "@visx/tooltip";
import { localPoint } from "@visx/event";
import "./MiniGraficoLinea.css";

const formatearFechaCompleta = fecha => {
  if (!fecha) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
};
// Fin Seccion tooltip  ------------------
import{
  useConfiguracion
}from"../../contexto/ConfiguracionContext";

const esNumero=valor=>
  Number.isFinite(valor);

const formatearFecha=fecha=>{
  if(!fecha)return"";

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day:"2-digit",
      month:"short",
    }
  )
    .format(
      new Date(
        `${fecha}T12:00:00`
      )
    )
    .replace(".","");
};

const obtenerTicks=cantidad=>{
  if(cantidad<=1)return[0];

  return[
    0,
    Math.floor(
      (cantidad-1)/2
    ),
    cantidad-1,
  ].filter(
    (valor,indice,array)=>
      array.indexOf(valor)===indice
  );
};

function MiniGraficoLinea({
  datos=[],
  series=[],
  tipo="linea",
  lineasReferencia=[],
  destacarRiesgo=false,
  campoRiesgo="minima",
  // Inicio Seccion tooltip  ------------------
  esGraficoTemperatura = true,
  // Fin Seccion tooltip  ------------------
}){

  const{
    tipoGrafico,
    tamanoTexto,
    contraste,
  }=useConfiguracion();
  // Inicio Seccion hook use  ------------------
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip();
  // Fin Seccion hook  ------------------

  /*
    120% = tamaño base actual
    150% = 1.25 veces el tamaño base
  */
  const factor=
    tamanoTexto/120;

  /*
    Márgenes del SVG.

    Aquí está la corrección importante:
    el margen inferior crece bastante más
    para que el eje X nunca quede cortado.
  */
  const margen={
    top:
      Math.round(
        12*factor
      ),

    right:
      Math.round(
        18*factor
      ),

    bottom:
      Math.round(
        42*factor
      ),

    left:
      Math.round(
        46*factor
      ),
  };

  const mostrarLineas=
    tipo==="linea"&&
    tipoGrafico!=="puntos";

  const mostrarPuntos=
    tipo==="linea"&&
    tipoGrafico!=="lineas";

  const valores=[];

  datos.forEach(dato=>{
    series.forEach(serie=>{

      const valor=
        dato[serie.campo];

      if(esNumero(valor)){
        valores.push(valor);
      }

    });
  });

  lineasReferencia.forEach(linea=>{
    if(esNumero(linea.valor)){
      valores.push(linea.valor);
    }
  });

  if(
    !datos.length||
    !valores.length
  ){
    return(
      <div className="rm-grafico-vacio">
        Sin datos disponibles
      </div>
    );
  }

  return(
    <ParentSize debounceTime={60}>
      {({width,height})=>{

        if(
          width<=40||
          height<=60
        ){
          return null;
        }

        const anchoInterno=
          Math.max(
            20,
            width-
            margen.left-
            margen.right
          );

        const altoInterno=
          Math.max(
            20,
            height-
            margen.top-
            margen.bottom
          );

        const xScale=
          scaleLinear({
            domain:[
              0,
              Math.max(
                datos.length-1,
                1
              ),
            ],

            range:[
              margen.left,
              margen.left+
              anchoInterno,
            ],
          });

        let minimo=
          tipo==="barras"
            ?0
            :Math.min(
              ...valores
            );

        let maximo=
          Math.max(
            ...valores
          );

        if(minimo===maximo){
          minimo-=1;
          maximo+=1;
        }

        if(tipo==="linea"){

          const espacio=
            Math.max(
              (
                maximo-
                minimo
              )*.12,
              1
            );

          minimo-=espacio;
          maximo+=espacio;

        }else{

          maximo=
            Math.max(
              maximo*1.15,
              1
            );

        }

        const yScale=
          scaleLinear({
            domain:[
              minimo,
              maximo,
            ],

            range:[
              margen.top+
              altoInterno,
              margen.top,
            ],

            nice:true,
          });

        const ticksX=
          obtenerTicks(
            datos.length
          );

        const paso=
          anchoInterno/
          Math.max(
            datos.length,
            1
          );

        const anchoBarra=
          Math.max(
            2,
            Math.min(
              12,
              paso*.62
            )
          );

        /*
          Tamaño REAL de los textos SVG.
        */
        const tamanoEje=
          Math.round(
            9*factor
          );

        const pesoEje=
          contraste==="alto"
            ?700
            :600;
        // Inicio Seccion deteccion puntero  ------------------    
        const handlePointerMove = (event) => {
          const coords = localPoint(event);
          if (!coords) return;
          const xPos = coords.x - margen.left;
          const indexBruto = (xPos / anchoInterno) * (datos.length - 1);
          const index = Math.round(Math.max(0, Math.min(datos.length - 1, indexBruto)));
          const datoSeleccionado = datos[index];

          if (datoSeleccionado) {
            showTooltip({
              tooltipData: datoSeleccionado,
              tooltipLeft: xScale(index),
              tooltipTop: coords.y,
            });
          }
        };  
        // Fin Seccion deteccion puntero  ------------------    
        return (
          <div className="rm-grafico-contenedor">
            <svg
              width={width}
              height={height}
              role="img"
              aria-label="Gráfico meteorológico"
            >
              {/* ==========================
                GRILLA
              ========================== */}

              <GridRows
                scale={yScale}
                width={anchoInterno}
                left={margen.left}
                stroke="var(--rm-grilla)"
                strokeWidth={
                  contraste==="alto"
                    ?1.3
                    :1
                }
                numTicks={4}
              />

              {/* ==========================
                  EJE Y
              ========================== */}

              <AxisLeft
                scale={yScale}
                left={margen.left}
                hideAxisLine
                hideTicks
                numTicks={4}
                tickFormat={valor=>
                  Number(
                    valor
                  ).toFixed(0)
                }
                tickLabelProps={()=>({
                  fill:
                    "var(--rm-texto-secundario)",

                  fontSize:
                    tamanoEje,

                  fontWeight:
                    pesoEje,

                  textAnchor:
                    "end",

                  dx:
                    -Math.max(
                      7,
                      7*factor
                    ),

                  dy:
                    "0.33em",
                })}
              />

              {/* ==========================
                  EJE X
              ========================== */}

              <AxisBottom
                scale={xScale}
                top={
                  margen.top+
                  altoInterno
                }
                tickValues={ticksX}
                tickFormat={indice=>
                  formatearFecha(
                    datos[
                      Math.round(
                        indice
                      )
                    ]?.fecha
                  )
                }
                hideAxisLine
                hideTicks
                tickLabelProps={()=>({
                  fill:
                    "var(--rm-texto-secundario)",

                  fontSize:
                    tamanoEje,

                  fontWeight:
                    pesoEje,

                  textAnchor:
                    "middle",

                  dy:
                    Math.round(
                      10*factor
                    ),
                })}
              />

              {/* ==========================
                  REFERENCIAS
              ========================== */}

              {lineasReferencia.map(
                linea=>(
                  <line
                    key={
                      `${linea.valor}-${linea.color}`
                    }
                    x1={
                      margen.left
                    }
                    x2={
                      margen.left+
                      anchoInterno
                    }
                    y1={
                      yScale(
                        linea.valor
                      )
                    }
                    y2={
                      yScale(
                        linea.valor
                      )
                    }
                    stroke={
                      linea.color
                    }
                    strokeWidth={
                      contraste==="alto"
                        ?1.8
                        :1.2
                    }
                    strokeDasharray="5 4"
                  />
                )
              )}

              {/* ==========================
                  LÍNEAS
              ========================== */}

              {mostrarLineas&&
                series.map(
                  serie=>(
                    <LinePath
                      key={
                        serie.campo
                      }
                      data={
                        datos
                      }
                      defined={
                        dato=>
                          esNumero(
                            dato[
                              serie.campo
                            ]
                          )
                      }
                      x={(
                        _,
                        indice
                      )=>
                        xScale(
                          indice
                        )
                      }
                      y={
                        dato=>
                          yScale(
                            dato[
                              serie.campo
                            ]
                          )
                      }
                      stroke={
                        serie.color
                      }
                      strokeWidth={
                        contraste==="alto"
                          ?(
                            serie.grosor??
                            2.2
                          )+.6
                          :(
                            serie.grosor??
                            2.2
                          )
                      }
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )
                )
              }

              {/* ==========================
                  PUNTOS
              ========================== */}

              {tipo==="linea"&&
                series.map(
                  serie=>
                    datos.map(
                      (
                        dato,
                        indice
                      )=>{

                        const valor=
                          dato[
                            serie.campo
                          ];

                        if(
                          !esNumero(
                            valor
                          )
                        ){
                          return null;
                        }

                        const esCampoRiesgo=
                          destacarRiesgo&&
                          serie.campo===
                          campoRiesgo;

                        const esRiesgo=
                          esCampoRiesgo&&
                          valor<=2;

                        const esCritico=
                          esCampoRiesgo&&
                          valor<=0;

                        const debeMostrar=
                          mostrarPuntos||
                          esRiesgo||
                          esCritico||
                          datos.length===1;

                        if(
                          !debeMostrar
                        ){
                          return null;
                        }

                        let color=
                          serie.color;

                        if(esCritico){
                          color=
                            "#ef4444";
                        }else if(esRiesgo){
                          color=
                            "#f59e0b";
                        }

                        const radio=
                          esCritico
                            ?4.2
                            :esRiesgo
                              ?3.8
                              :tipoGrafico==="puntos"
                                ?3.6
                                :3;

                        return(
                          <circle
                            key={
                              `${serie.campo}-${dato.fecha}-${indice}`
                            }
                            cx={
                              xScale(
                                indice
                              )
                            }
                            cy={
                              yScale(
                                valor
                              )
                            }
                            r={
                              radio
                            }
                            fill={
                              color
                            }
                            stroke={
                              contraste==="alto"
                                ?"rgba(255,255,255,.85)"
                                :"transparent"
                            }
                            strokeWidth={
                              contraste==="alto"
                                ?1
                                :0
                            }
                          >
                            <title>
                              {serie.nombre}
                              {" · "}
                              {formatearFecha(
                                dato.fecha
                              )}
                              {" · "}
                              {valor}
                              {serie.unidad??""}
                            </title>
                          </circle>
                        );
                      }
                    )
                )
              }

              {/* ==========================
                  BARRAS
              ========================== */}

              {tipo==="barras"&&
                datos.map(
                  (
                    dato,
                    indice
                  )=>{

                    const serie=
                      series[0];

                    if(!serie){
                      return null;
                    }

                    const valor=
                      dato[
                        serie.campo
                      ];

                    if(
                      !esNumero(
                        valor
                      )
                    ){
                      return null;
                    }

                    const x=
                      xScale(
                        indice
                      )-
                      anchoBarra/2;

                    const y=
                      yScale(
                        valor
                      );

                    const base=
                      yScale(0);

                    return(
                      <Bar
                        key={
                          `${dato.fecha}-${indice}`
                        }
                        x={x}
                        y={y}
                        width={
                          anchoBarra
                        }
                        height={
                          Math.max(
                            base-y,
                            valor===0
                              ?0
                              :1
                          )
                        }
                        fill={
                          serie.color
                        }
                        rx={2}
                      >
                        <title>
                          {formatearFecha(
                            dato.fecha
                          )}
                          {" · "}
                          {valor}
                          {serie.unidad??""}
                        </title>
                      </Bar>
                    );
                  }
                )
              }
              {tooltipOpen && tooltipLeft != null && (
                <Line
                  from={{ x: tooltipLeft, y: margen.top }}
                  to={{ x: tooltipLeft, y: margen.top + altoInterno }}
                  className="rm-crosshair-line"
                />
              )}

              {/* Área interactiva transparente para capturar el mouse */}
              <Bar
                x={margen.left}
                y={margen.top}
                width={anchoInterno}
                height={altoInterno}
                fill="transparent"
                onPointerMove={handlePointerMove}
                onPointerLeave={hideTooltip}
              />
            </svg>

            {/* Inicio */}
            {tooltipOpen && tooltipData && (
              <TooltipWithBounds
                top={tooltipTop}
                left={tooltipLeft}
                className="rm-tooltip-oscuro"
              >
                <div className="rm-tooltip-fecha">
                  {formatearFechaCompleta(tooltipData.fecha)}
                </div>

                {esGraficoTemperatura ? (
                  <div className="rm-tooltip-filas">
                    <div className="rm-tooltip-item">
                      <span className="rm-tooltip-color-max">Máxima:</span>
                      <strong>{esNumero(tooltipData.maxima) ? `${tooltipData.maxima.toFixed(1)} °C` : "—"}</strong>
                    </div>
                    <div className="rm-tooltip-item">
                      <span className="rm-tooltip-color-med">Media:</span>
                      <strong>{esNumero(tooltipData.mediaDiaria) ? `${tooltipData.mediaDiaria.toFixed(1)} °C` : "—"}</strong>
                    </div>
                    <div className="rm-tooltip-item">
                      <span className="rm-tooltip-color-min">Mínima:</span>
                      <strong>{esNumero(tooltipData.minima) ? `${tooltipData.minima.toFixed(1)} °C` : "—"}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="rm-tooltip-filas">
                    {series.map(s => (
                      <div key={s.campo} className="rm-tooltip-item">
                        <span style={{ color: s.color }}>{s.nombre}:</span>
                        <strong>{esNumero(tooltipData[s.campo]) ? `${tooltipData[s.campo]} ${s.unidad ?? ""}` : "—"}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </TooltipWithBounds>
            )}
            {/* Fin */}
          </div>
        );
      }}
    </ParentSize>
  );
}

export default MiniGraficoLinea;