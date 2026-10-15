import{useEffect,useMemo,useState}from"react";
import{AxisBottom,AxisLeft}from"@visx/axis";
import{GridRows}from"@visx/grid";
import{ParentSize}from"@visx/responsive";
import{scaleLinear,scalePoint}from"@visx/scale";
import{LinePath}from"@visx/shape";

import{
  ArrowLeftRight,
  CalendarDays,
  CalendarRange,
  ChartLine,
  MapPin,
  Plus,
  RadioTower,
  Snowflake,
  Thermometer,
  ThermometerSun,
  X,
}from"lucide-react";

import{
  useConfiguracion
}from"../../contexto/ConfiguracionContext";

import"./TemperatureChart.css";

/* =====================================================
   CONSTANTES
===================================================== */

const MESES=[
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

const MESES_CORTOS=[
  "",
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

const VISTAS=[
  {
    valor:"mes",
    texto:"Mes",
    titulo:"Temperatura media diaria",
    Icono:CalendarDays,
  },
  {
    valor:"anio",
    texto:"Año",
    titulo:"Temperatura media mensual",
    Icono:CalendarRange,
  },
];

const TEMAS_GRAFICO={
  oscuro:{
    secundario:"#9CA3AF",
    grilla:"rgba(148,163,184,.14)",
    punto:"#0F1115",
  },
  claro:{
    secundario:"#64748B",
    grilla:"rgba(100,116,139,.14)",
    punto:"#FFFFFF",
  },
};

const COLORES_SERIES=[
  "#38BDF8",
  "#C86D3B",
  "#3E8E58",
  "#A78BFA",
  "#D99B26",
];

const LETRAS_SERIES=[
  "A",
  "B",
  "C",
  "D",
  "E",
];

const MAX_SERIES=5;

/* =====================================================
   HELPERS
===================================================== */

const aNumero=valor=>{
  if(
    valor===null||
    valor===undefined||
    valor===""
  ){
    return null;
  }

  const numero=
    Number(valor);

  return Number.isFinite(numero)
    ?numero
    :null;
};

const promedio=valores=>{
  if(!valores.length){
    return null;
  }

  return(
    valores.reduce(
      (suma,valor)=>
        suma+valor,
      0
    )/
    valores.length
  );
};

const formatoTemperatura=valor=>
  valor===null
    ?"—"
    :`${valor
        .toFixed(1)
        .replace(".",",")} °C`;

const periodoMesLegible=periodo=>{
  if(!periodo){
    return"";
  }

  const[
    anio,
    mes
  ]=periodo.split("-");

  return`${MESES[Number(mes)]} ${anio}`;
};

const diasDelPeriodo=periodo=>{
  if(!periodo){
    return 0;
  }

  const[
    anio,
    mes
  ]=periodo
    .split("-")
    .map(Number);

  return new Date(
    anio,
    mes,
    0
  ).getDate();
};

const listasIguales=(a,b)=>
  Array.isArray(a)&&
  Array.isArray(b)&&
  a.length===b.length&&
  a.every(
    (valor,indice)=>
      valor===b[indice]
  );

const limpiarLista=(
  valores,
  disponibles,
  principal,
  maximo=MAX_SERIES-1
)=>{
  const lista=
    Array.isArray(valores)
      ?valores
      :[];

  return[
    ...new Set(lista)
  ]
    .filter(
      valor=>
        disponibles.includes(valor)&&
        valor!==principal
    )
    .slice(
      0,
      maximo
    );
};

const usePreferencia=(
  clave,
  valorInicial
)=>{
  const[
    valor,
    setValor
  ]=useState(()=>{

    if(
      typeof window===
      "undefined"
    ){
      return valorInicial;
    }

    try{
      const guardado=
        localStorage.getItem(
          clave
        );

      return guardado===null
        ?valorInicial
        :JSON.parse(
            guardado
          );

    }catch{
      return valorInicial;
    }
  });

  useEffect(()=>{

    localStorage.setItem(
      clave,
      JSON.stringify(
        valor
      )
    );

  },[
    clave,
    valor
  ]);

  return[
    valor,
    setValor
  ];
};

const crearDatosMes=(
  registros,
  periodo,
  categorias
)=>{
  const mapa=
    new Map(
      registros
        .filter(
          dato=>
            dato.fecha.startsWith(
              `${periodo}-`
            )
        )
        .map(
          dato=>[
            dato.fecha.substring(
              8,
              10
            ),
            dato,
          ]
        )
    );

  return categorias.map(
    dia=>({
      etiqueta:dia,
      valor:aNumero(
        mapa.get(dia)
          ?.mediaDiaria
      ),
    })
  );
};

const crearDatosAnio=(
  registros,
  anio
)=>
  MESES_CORTOS
    .slice(1)
    .map(
      (
        etiqueta,
        indice
      )=>{

        const mes=
          String(
            indice+1
          ).padStart(
            2,
            "0"
          );

        const valores=
          registros
            .filter(
              dato=>
                dato.fecha.startsWith(
                  `${anio}-${mes}-`
                )
            )
            .map(
              dato=>
                aNumero(
                  dato.mediaDiaria
                )
            )
            .filter(
              Number.isFinite
            );

        return{
          etiqueta,
          valor:
            promedio(
              valores
            ),
        };
      }
    );

/* =====================================================
   GRÁFICO
===================================================== */

function GraficoLinea({
  series,
  categorias,
  ticksX,
  minimoY,
  maximoY,
  tema,
  formatoCategoria,
  tipoGrafico,
  tamanoTexto,
  contraste,
}){

  const[
    tooltip,
    setTooltip
  ]=useState(null);

  useEffect(()=>{
    setTooltip(null);
  },[series]);

  const factorTexto=
    tamanoTexto/120;

  const mostrarLineas=
    tipoGrafico!=="puntos";

  const mostrarPuntos=
    tipoGrafico!=="lineas";

  return(
    <div className="grafico-visx">

      <ParentSize debounceTime={70}>
        {({
          width,
          height
        })=>{

          if(
            width<50||
            height<50
          ){
            return null;
          }

          const margen={
            top:
              Math.round(
                24*
                factorTexto
              ),

            right:
              Math.round(
                22*
                factorTexto
              ),

            bottom:
              Math.round(
                52*
                factorTexto
              ),

            left:
              Math.round(
                60*
                factorTexto
              ),
          };

          const ancho=
            Math.max(
              10,
              width-
              margen.left-
              margen.right
            );

          const alto=
            Math.max(
              10,
              height-
              margen.top-
              margen.bottom
            );

          const escalaX=
            scalePoint({
              domain:categorias,

              range:[
                0,
                ancho
              ],

              padding:.35,
            });

          const escalaY=
            scaleLinear({
              domain:[
                minimoY,
                maximoY
              ],

              range:[
                alto,
                0
              ],

              nice:true,
            });

          const buscarCategoria=x=>
            categorias.reduce(
              (
                cercana,
                etiqueta
              )=>{

                const posicion=
                  escalaX(
                    etiqueta
                  );

                if(
                  posicion===
                  undefined
                ){
                  return cercana;
                }

                const distancia=
                  Math.abs(
                    posicion-x
                  );

                if(
                  !cercana||
                  distancia<
                  cercana.distancia
                ){
                  return{
                    etiqueta,
                    distancia,
                  };
                }

                return cercana;

              },
              null
            )?.etiqueta;

          const mostrarTooltip=
            evento=>{

              const rect=
                evento
                  .currentTarget
                  .getBoundingClientRect();

              const x=
                evento.clientX-
                rect.left;

              const etiqueta=
                buscarCategoria(
                  x
                );

              if(!etiqueta){
                return;
              }

              const items=
                series
                  .map(
                    serie=>{

                      const dato=
                        serie.datos.find(
                          item=>
                            item.etiqueta===
                            etiqueta
                        );

                      return(
                        dato&&
                        Number.isFinite(
                          dato.valor
                        )
                      )
                        ?{
                            serie,
                            dato
                          }
                        :null;
                    }
                  )
                  .filter(Boolean);

              if(
                !items.length
              ){
                setTooltip(null);
                return;
              }

              const posicionX=
                escalaX(
                  etiqueta
                );

              const posicionY=
                Math.min(
                  ...items.map(
                    ({dato})=>
                      escalaY(
                        dato.valor
                      )
                  )
                );

              setTooltip({
                etiqueta,
                items,

                left:
                  Math.min(
                    width-120,
                    Math.max(
                      120,
                      margen.left+
                      posicionX
                    )
                  ),

                top:
                  Math.max(
                    20,
                    margen.top+
                    posicionY
                  ),
              });
            };

          const fontSize=
            Math.max(
              9,
              10*
              factorTexto
            );

          return(
            <>

              <svg
                width={width}
                height={height}
                role="img"
                aria-label="Histórico de temperatura"
              >

                <g
                  transform={
                    `translate(${margen.left},${margen.top})`
                  }
                >

                  <GridRows
                    scale={escalaY}
                    width={ancho}
                    numTicks={5}
                    stroke={
                      tema.grilla
                    }
                    strokeWidth={
                      contraste==="alto"
                        ?1.3
                        :1
                    }
                  />

                  {mostrarLineas&&
                    series.map(
                      serie=>(
                        <LinePath
                          key={
                            serie.id??
                            serie.nombre
                          }
                          data={
                            serie.datos
                          }
                          defined={
                            dato=>
                              Number.isFinite(
                                dato.valor
                              )
                          }
                          x={
                            dato=>
                              escalaX(
                                dato.etiqueta
                              )??0
                          }
                          y={
                            dato=>
                              escalaY(
                                dato.valor
                              )
                          }
                          stroke={
                            serie.color
                          }
                          strokeWidth={
                            contraste==="alto"
                              ?3.2
                              :2.7
                          }
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )
                    )
                  }

                  {mostrarPuntos&&
                    series.flatMap(
                      serie=>
                        serie.datos
                          .filter(
                            dato=>
                              Number.isFinite(
                                dato.valor
                              )
                          )
                          .map(
                            dato=>(
                              <circle
                                key={
                                  `${
                                    serie.id??
                                    serie.nombre
                                  }-${dato.etiqueta}`
                                }
                                cx={
                                  escalaX(
                                    dato.etiqueta
                                  )
                                }
                                cy={
                                  escalaY(
                                    dato.valor
                                  )
                                }
                                r={
                                  tipoGrafico==="puntos"
                                    ?4
                                    :3.3
                                }
                                fill={
                                  serie.color
                                }
                                stroke={
                                  tema.punto
                                }
                                strokeWidth={
                                  contraste==="alto"
                                    ?2.5
                                    :2
                                }
                              />
                            )
                          )
                    )
                  }

                  <AxisLeft
                    scale={escalaY}
                    numTicks={5}
                    hideAxisLine
                    hideTicks
                    tickFormat={
                      valor=>
                        `${valor}°`
                    }
                    tickLabelProps={()=>({
                      fill:
                        tema.secundario,

                      fontSize,

                      fontWeight:
                        contraste==="alto"
                          ?700
                          :600,

                      textAnchor:
                        "end",

                      dx:-7,

                      dy:
                        "0.33em",
                    })}
                  />

                  <AxisBottom
                    top={alto}
                    scale={escalaX}
                    tickValues={ticksX}
                    hideAxisLine
                    hideTicks
                    tickLabelProps={()=>({
                      fill:
                        tema.secundario,

                      fontSize,

                      fontWeight:
                        contraste==="alto"
                          ?700
                          :600,

                      textAnchor:
                        "middle",

                      dy:
                        Math.round(
                          10*
                          factorTexto
                        ),
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
                    onPointerLeave={()=>
                      setTooltip(null)
                    }
                  />

                </g>

              </svg>

              {tooltip&&(
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
                      dato
                    })=>(
                      <div
                        className="tooltip-serie"
                        key={
                          serie.id??
                          serie.nombre
                        }
                      >

                        <div>

                          <span
                            className="punto-tooltip"
                            style={{
                              background:
                                serie.color
                            }}
                          />

                          <span>
                            {serie.nombre}
                          </span>

                        </div>

                        <strong>
                          {formatoTemperatura(
                            dato.valor
                          )}
                        </strong>

                      </div>
                    )
                  )}

                  {tooltip.items.length===2&&(
                    <div className="tooltip-diferencia">

                      <span>
                        Diferencia
                      </span>

                      <strong>
                        {(()=>{
                          const diferencia=
                            tooltip
                              .items[0]
                              .dato
                              .valor-
                            tooltip
                              .items[1]
                              .dato
                              .valor;

                          const signo=
                            diferencia>0
                              ?"+"
                              :"";

                          return(
                            `${signo}${
                              diferencia
                                .toFixed(1)
                                .replace(".",",")
                            } °C`
                          );
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

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

function TemperatureChart({
  estaciones=[],
  datosTemperatura=[],
  temaOscuro=true,
}){

  const{
    tipoGrafico,
    tamanoTexto,
    contraste,
  }=useConfiguracion();

  const[
    vista,
    setVista
  ]=usePreferencia(
    "grafico-vista",
    "mes"
  );

  /*
    ninguno
    periodos
    estaciones
  */
  const[
    modoComparacion,
    setModoComparacion
  ]=usePreferencia(
    "historicos-modo-comparacion",
    "ninguno"
  );

  const[
    estacionSeleccionada,
    setEstacionSeleccionada
  ]=useState("");

  const[
    periodoMesSeleccionado,
    setPeriodoMesSeleccionado
  ]=useState("");

  const[
    anioSeleccionado,
    setAnioSeleccionado
  ]=useState("");

  const[
    mesesComparacion,
    setMesesComparacion
  ]=usePreferencia(
    "historicos-meses-comparacion",
    []
  );

  const[
    aniosComparacion,
    setAniosComparacion
  ]=usePreferencia(
    "historicos-anios-comparacion",
    []
  );

  const[
    estacionesComparacion,
    setEstacionesComparacion
  ]=usePreferencia(
    "historicos-estaciones-comparacion",
    []
  );

  /*
    Si quedó "dia" guardado de la versión
    antigua, automáticamente vuelve a Mes.
  */
  useEffect(()=>{

    if(
      vista!=="mes"&&
      vista!=="anio"
    ){
      setVista("mes");
    }

  },[
    vista,
    setVista
  ]);

  const comparaPeriodos=
    modoComparacion===
    "periodos";

  const comparaEstaciones=
    modoComparacion===
    "estaciones";

  /* ===================================================
     TEMA
  =================================================== */

  const temaBase=
    TEMAS_GRAFICO[
      temaOscuro
        ?"oscuro"
        :"claro"
    ];

  const tema={
    ...temaBase,

    secundario:
      contraste==="alto"
        ?temaOscuro
          ?"#F8FAFC"
          :"#111827"
        :temaBase.secundario,

    grilla:
      contraste==="alto"
        ?temaOscuro
          ?"rgba(255,255,255,.22)"
          :"rgba(17,24,39,.20)"
        :temaBase.grilla,
  };

  /* ===================================================
     ESTACIÓN PRINCIPAL
  =================================================== */

  useEffect(()=>{

    const existe=
      estaciones.some(
        estacion=>
          estacion.id===
          estacionSeleccionada
      );

    if(
      !existe&&
      estaciones.length
    ){
      setEstacionSeleccionada(
        estaciones[0].id
      );
    }

  },[
    estaciones,
    estacionSeleccionada
  ]);

  const nombreEstacion=id=>{

    const estacion=
      estaciones.find(
        item=>
          item.id===id
      );

    return(
      estacion?.nombre??
      estacion?.huerto??
      estacion?.id??
      "Estación"
    );
  };

  const registrosEstacion=id=>
    datosTemperatura
      .filter(
        dato=>
          dato.estacionId===id
      )
      .sort(
        (a,b)=>
          a.fecha.localeCompare(
            b.fecha
          )
      );

  const diariosEstacion=
    useMemo(
      ()=>
        registrosEstacion(
          estacionSeleccionada
        ),
      [
        datosTemperatura,
        estacionSeleccionada
      ]
    );

  /* ===================================================
     PERÍODOS DISPONIBLES
  =================================================== */

  const periodosMensuales=
    useMemo(
      ()=>[
        ...new Set(
          diariosEstacion.map(
            dato=>
              dato.fecha.substring(
                0,
                7
              )
          )
        )
      ].sort(),
      [diariosEstacion]
    );

  const aniosDisponibles=
    useMemo(
      ()=>[
        ...new Set(
          diariosEstacion.map(
            dato=>
              dato.fecha.substring(
                0,
                4
              )
          )
        )
      ].sort(),
      [diariosEstacion]
    );

  /* ===================================================
     SELECCIÓN BASE
  =================================================== */

  useEffect(()=>{

    if(
      !periodosMensuales.length
    ){
      setPeriodoMesSeleccionado("");
      return;
    }

    if(
      !periodosMensuales.includes(
        periodoMesSeleccionado
      )
    ){
      setPeriodoMesSeleccionado(
        periodosMensuales[
          periodosMensuales.length-1
        ]
      );
    }

  },[
    periodosMensuales,
    periodoMesSeleccionado
  ]);

  useEffect(()=>{

    if(
      !aniosDisponibles.length
    ){
      setAnioSeleccionado("");
      return;
    }

    if(
      !aniosDisponibles.includes(
        anioSeleccionado
      )
    ){
      setAnioSeleccionado(
        aniosDisponibles[
          aniosDisponibles.length-1
        ]
      );
    }

  },[
    aniosDisponibles,
    anioSeleccionado
  ]);

  /* ===================================================
     COMPARACIONES DE MESES
  =================================================== */

  const mesesComparacionValidos=
    useMemo(
      ()=>
        limpiarLista(
          mesesComparacion,
          periodosMensuales,
          periodoMesSeleccionado
        ),
      [
        mesesComparacion,
        periodosMensuales,
        periodoMesSeleccionado
      ]
    );

  useEffect(()=>{

    if(
      !comparaPeriodos||
      vista!=="mes"
    ){
      return;
    }

    setMesesComparacion(
      actuales=>{

        let validos=
          limpiarLista(
            actuales,
            periodosMensuales,
            periodoMesSeleccionado
          );

        if(
          !validos.length
        ){
          const alternativa=
            [...periodosMensuales]
              .reverse()
              .find(
                periodo=>
                  periodo!==
                  periodoMesSeleccionado
              );

          if(alternativa){
            validos=[
              alternativa
            ];
          }
        }

        return listasIguales(
          actuales,
          validos
        )
          ?actuales
          :validos;
      }
    );

  },[
    comparaPeriodos,
    vista,
    periodosMensuales,
    periodoMesSeleccionado,
    setMesesComparacion
  ]);

  const mesesActivos=[
    periodoMesSeleccionado,
    ...mesesComparacionValidos
  ].filter(Boolean);

  const agregarMes=()=>{

    if(
      mesesActivos.length>=
      MAX_SERIES
    ){
      return;
    }

    const disponible=
      [...periodosMensuales]
        .reverse()
        .find(
          periodo=>
            !mesesActivos.includes(
              periodo
            )
        );

    if(!disponible){
      return;
    }

    setMesesComparacion(
      anteriores=>[
        ...(
          Array.isArray(
            anteriores
          )
            ?anteriores
            :[]
        ),
        disponible
      ]
    );
  };

  const cambiarMesComparacion=(
    indice,
    periodo
  )=>{

    const actual=
      mesesComparacionValidos[
        indice
      ];

    if(
      mesesActivos.includes(
        periodo
      )&&
      periodo!==actual
    ){
      return;
    }

    setMesesComparacion(
      anteriores=>{

        const copia=[
          ...(
            Array.isArray(
              anteriores
            )
              ?anteriores
              :[]
          )
        ];

        copia[indice]=
          periodo;

        return copia;
      }
    );
  };

  const eliminarMesComparacion=
    indice=>{

      setMesesComparacion(
        anteriores=>
          (
            Array.isArray(
              anteriores
            )
              ?anteriores
              :[]
          ).filter(
            (
              _,
              posicion
            )=>
              posicion!==indice
          )
      );
    };

  /* ===================================================
     COMPARACIONES DE AÑOS
  =================================================== */

  const aniosComparacionValidos=
    useMemo(
      ()=>
        limpiarLista(
          aniosComparacion,
          aniosDisponibles,
          anioSeleccionado
        ),
      [
        aniosComparacion,
        aniosDisponibles,
        anioSeleccionado
      ]
    );

  useEffect(()=>{

    if(
      !comparaPeriodos||
      vista!=="anio"
    ){
      return;
    }

    setAniosComparacion(
      actuales=>{

        let validos=
          limpiarLista(
            actuales,
            aniosDisponibles,
            anioSeleccionado
          );

        if(
          !validos.length
        ){
          const alternativa=
            [...aniosDisponibles]
              .reverse()
              .find(
                anio=>
                  anio!==
                  anioSeleccionado
              );

          if(alternativa){
            validos=[
              alternativa
            ];
          }
        }

        return listasIguales(
          actuales,
          validos
        )
          ?actuales
          :validos;
      }
    );

  },[
    comparaPeriodos,
    vista,
    aniosDisponibles,
    anioSeleccionado,
    setAniosComparacion
  ]);

  const aniosActivos=[
    anioSeleccionado,
    ...aniosComparacionValidos
  ].filter(Boolean);

  const agregarAnio=()=>{

    if(
      aniosActivos.length>=
      MAX_SERIES
    ){
      return;
    }

    const disponible=
      [...aniosDisponibles]
        .reverse()
        .find(
          anio=>
            !aniosActivos.includes(
              anio
            )
        );

    if(!disponible){
      return;
    }

    setAniosComparacion(
      anteriores=>[
        ...(
          Array.isArray(
            anteriores
          )
            ?anteriores
            :[]
        ),
        disponible
      ]
    );
  };

  const cambiarAnioComparacion=(
    indice,
    anio
  )=>{

    const actual=
      aniosComparacionValidos[
        indice
      ];

    if(
      aniosActivos.includes(
        anio
      )&&
      anio!==actual
    ){
      return;
    }

    setAniosComparacion(
      anteriores=>{

        const copia=[
          ...(
            Array.isArray(
              anteriores
            )
              ?anteriores
              :[]
          )
        ];

        copia[indice]=
          anio;

        return copia;
      }
    );
  };

  const eliminarAnioComparacion=
    indice=>{

      setAniosComparacion(
        anteriores=>
          (
            Array.isArray(
              anteriores
            )
              ?anteriores
              :[]
          ).filter(
            (
              _,
              posicion
            )=>
              posicion!==indice
          )
      );
    };

  /* ===================================================
     ESTACIONES COMPARABLES
  =================================================== */

  const estacionTienePeriodo=id=>{

    if(!id){
      return false;
    }

    if(vista==="mes"){

      return datosTemperatura.some(
        dato=>
          dato.estacionId===id&&
          dato.fecha.startsWith(
            `${periodoMesSeleccionado}-`
          )
      );
    }

    return datosTemperatura.some(
      dato=>
        dato.estacionId===id&&
        dato.fecha.startsWith(
          `${anioSeleccionado}-`
        )
    );
  };

  const estacionesComparables=
    useMemo(
      ()=>
        estaciones
          .filter(
            estacion=>
              estacion.id!==
              estacionSeleccionada
          )
          .filter(
            estacion=>
              estacionTienePeriodo(
                estacion.id
              )
          )
          .map(
            estacion=>
              estacion.id
          ),
      [
        estaciones,
        datosTemperatura,
        estacionSeleccionada,
        vista,
        periodoMesSeleccionado,
        anioSeleccionado
      ]
    );

  const estacionesComparacionValidas=
    useMemo(
      ()=>
        limpiarLista(
          estacionesComparacion,
          estacionesComparables,
          estacionSeleccionada
        ),
      [
        estacionesComparacion,
        estacionesComparables,
        estacionSeleccionada
      ]
    );

  useEffect(()=>{

    if(
      !comparaEstaciones
    ){
      return;
    }

    setEstacionesComparacion(
      actuales=>{

        let validas=
          limpiarLista(
            actuales,
            estacionesComparables,
            estacionSeleccionada
          );

        if(
          !validas.length&&
          estacionesComparables.length
        ){
          validas=[
            estacionesComparables[0]
          ];
        }

        return listasIguales(
          actuales,
          validas
        )
          ?actuales
          :validas;
      }
    );

  },[
    comparaEstaciones,
    estacionesComparables,
    estacionSeleccionada,
    setEstacionesComparacion
  ]);

  const estacionesActivas=[
    estacionSeleccionada,
    ...estacionesComparacionValidas
  ].filter(Boolean);

  const agregarEstacion=()=>{

    if(
      estacionesActivas.length>=
      MAX_SERIES
    ){
      return;
    }

    const disponible=
      estacionesComparables.find(
        id=>
          !estacionesActivas.includes(
            id
          )
      );

    if(!disponible){
      return;
    }

    setEstacionesComparacion(
      anteriores=>[
        ...(
          Array.isArray(
            anteriores
          )
            ?anteriores
            :[]
        ),
        disponible
      ]
    );
  };

  const cambiarEstacionComparacion=(
    indice,
    id
  )=>{

    const actual=
      estacionesComparacionValidas[
        indice
      ];

    if(
      estacionesActivas.includes(
        id
      )&&
      id!==actual
    ){
      return;
    }

    setEstacionesComparacion(
      anteriores=>{

        const copia=[
          ...(
            Array.isArray(
              anteriores
            )
              ?anteriores
              :[]
          )
        ];

        copia[indice]=
          id;

        return copia;
      }
    );
  };

  const eliminarEstacionComparacion=
    indice=>{

      setEstacionesComparacion(
        anteriores=>
          (
            Array.isArray(
              anteriores
            )
              ?anteriores
              :[]
          ).filter(
            (
              _,
              posicion
            )=>
              posicion!==indice
          )
      );
    };

  /* ===================================================
     DISPONIBILIDAD DE BOTONES
  =================================================== */

  const puedeCompararPeriodos=
    vista==="mes"
      ?periodosMensuales.length>1
      :aniosDisponibles.length>1;

  const puedeCompararEstaciones=
    estacionesComparables.length>0;

  const puedeAgregarMes=
    mesesActivos.length<
    Math.min(
      MAX_SERIES,
      periodosMensuales.length
    );

  const puedeAgregarAnio=
    aniosActivos.length<
    Math.min(
      MAX_SERIES,
      aniosDisponibles.length
    );

  const puedeAgregarEstacion=
    estacionesActivas.length<
    Math.min(
      MAX_SERIES,
      estaciones.length
    )&&
    estacionesComparables.some(
      id=>
        !estacionesActivas.includes(
          id
        )
    );

  const alternarPeriodos=()=>{

    setModoComparacion(
      actual=>
        actual==="periodos"
          ?"ninguno"
          :"periodos"
    );
  };

  const alternarEstaciones=()=>{

    setModoComparacion(
      actual=>
        actual==="estaciones"
          ?"ninguno"
          :"estaciones"
    );
  };

  /* ===================================================
     SERIES
  =================================================== */

  const configuracion=
    useMemo(()=>{

      /* ===============================
         MES
      =============================== */

      if(vista==="mes"){

        let periodos=[
          periodoMesSeleccionado
        ];

        if(comparaPeriodos){
          periodos=[
            periodoMesSeleccionado,
            ...mesesComparacionValidos
          ];
        }

        const cantidadDias=
          Math.max(
            ...periodos
              .filter(Boolean)
              .map(
                diasDelPeriodo
              ),
            1
          );

        const categorias=
          Array.from(
            {
              length:
                cantidadDias
            },
            (
              _,
              indice
            )=>
              String(
                indice+1
              ).padStart(
                2,
                "0"
              )
          );

        let series=[];

        /* Comparación temporal */
        if(comparaPeriodos){

          series=
            periodos
              .filter(Boolean)
              .map(
                (
                  periodo,
                  indice
                )=>({
                  id:
                    `periodo-${periodo}`,

                  nombre:
                    periodoMesLegible(
                      periodo
                    ),

                  color:
                    COLORES_SERIES[
                      indice%
                      COLORES_SERIES.length
                    ],

                  datos:
                    crearDatosMes(
                      diariosEstacion,
                      periodo,
                      categorias
                    ),
                })
              );

        /* Comparación estaciones */
        }else if(
          comparaEstaciones
        ){

          series=
            estacionesActivas.map(
              (
                id,
                indice
              )=>({

                id:
                  `estacion-${id}`,

                nombre:
                  nombreEstacion(
                    id
                  ),

                color:
                  COLORES_SERIES[
                    indice%
                    COLORES_SERIES.length
                  ],

                datos:
                  crearDatosMes(
                    registrosEstacion(
                      id
                    ),
                    periodoMesSeleccionado,
                    categorias
                  ),
              })
            );

        /* Sin comparación */
        }else{

          series=[
            {
              id:
                `periodo-${periodoMesSeleccionado}`,

              nombre:
                periodoMesLegible(
                  periodoMesSeleccionado
                ),

              color:
                COLORES_SERIES[0],

              datos:
                crearDatosMes(
                  diariosEstacion,
                  periodoMesSeleccionado,
                  categorias
                ),
            }
          ];
        }

        const posiblesTicks=[
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
        ];

        return{
          categorias,
          series,

          ticksX:[
            ...new Set(
              posiblesTicks.filter(
                dia=>
                  categorias.includes(
                    dia
                  )
              )
            )
          ],

          formatoCategoria:
            etiqueta=>
              `Día ${
                Number(
                  etiqueta
                )
              }`,
        };
      }

      /* ===============================
         AÑO
      =============================== */

      const categorias=
        MESES_CORTOS.slice(1);

      let series=[];

      if(comparaPeriodos){

        const anios=[
          anioSeleccionado,
          ...aniosComparacionValidos
        ].filter(Boolean);

        series=
          anios.map(
            (
              anio,
              indice
            )=>({
              id:
                `anio-${anio}`,

              nombre:anio,

              color:
                COLORES_SERIES[
                  indice%
                  COLORES_SERIES.length
                ],

              datos:
                crearDatosAnio(
                  diariosEstacion,
                  anio
                ),
            })
          );

      }else if(
        comparaEstaciones
      ){

        series=
          estacionesActivas.map(
            (
              id,
              indice
            )=>({
              id:
                `estacion-${id}`,

              nombre:
                nombreEstacion(
                  id
                ),

              color:
                COLORES_SERIES[
                  indice%
                  COLORES_SERIES.length
                ],

              datos:
                crearDatosAnio(
                  registrosEstacion(
                    id
                  ),
                  anioSeleccionado
                ),
            })
          );

      }else{

        series=[
          {
            id:
              `anio-${anioSeleccionado}`,

            nombre:
              anioSeleccionado,

            color:
              COLORES_SERIES[0],

            datos:
              crearDatosAnio(
                diariosEstacion,
                anioSeleccionado
              ),
          }
        ];
      }

      return{
        categorias,
        series,
        ticksX:categorias,

        formatoCategoria:
          etiqueta=>
            etiqueta,
      };

    },[
      vista,
      comparaPeriodos,
      comparaEstaciones,
      diariosEstacion,
      periodoMesSeleccionado,
      mesesComparacionValidos,
      anioSeleccionado,
      aniosComparacionValidos,
      estacionesActivas,
      datosTemperatura
    ]);

  /* ===================================================
     RESUMEN PRINCIPAL
  =================================================== */

  const resumen=
    useMemo(()=>{

      const registros=
        diariosEstacion.filter(
          dato=>
            vista==="mes"
              ?dato.fecha.startsWith(
                  `${periodoMesSeleccionado}-`
                )
              :dato.fecha.startsWith(
                  `${anioSeleccionado}-`
                )
        );

      if(
        !registros.length
      ){
        return{
          minima:null,
          media:null,
          maxima:null,
        };
      }

      const minimas=
        registros
          .map(
            dato=>
              aNumero(
                dato.minima
              )
          )
          .filter(
            Number.isFinite
          );

      const medias=
        registros
          .map(
            dato=>
              aNumero(
                dato.mediaDiaria
              )
          )
          .filter(
            Number.isFinite
          );

      const maximas=
        registros
          .map(
            dato=>
              aNumero(
                dato.maxima
              )
          )
          .filter(
            Number.isFinite
          );

      return{
        minima:
          minimas.length
            ?Math.min(
                ...minimas
              )
            :null,

        media:
          promedio(
            medias
          ),

        maxima:
          maximas.length
            ?Math.max(
                ...maximas
              )
            :null,
      };

    },[
      vista,
      diariosEstacion,
      periodoMesSeleccionado,
      anioSeleccionado
    ]);

  /* ===================================================
     ESCALA Y
  =================================================== */

  const valores=
    useMemo(
      ()=>
        configuracion.series
          .flatMap(
            serie=>
              serie.datos
                .map(
                  dato=>
                    dato.valor
                )
                .filter(
                  Number.isFinite
                )
          ),
      [configuracion]
    );

  const minimoY=
    valores.length
      ?Math.floor(
          (
            Math.min(
              ...valores
            )-3
          )/5
        )*5
      :0;

  const maximoY=
    valores.length
      ?Math.max(
          minimoY+10,

          Math.ceil(
            (
              Math.max(
                ...valores
              )+3
            )/5
          )*5
        )
      :40;

  const hayDatos=
    valores.length>0;

  const comparando=
    modoComparacion!==
    "ninguno";

  /* ===================================================
     RENDER
  =================================================== */

  return(
    <section
      className={
        `panel-temperatura ${
          temaOscuro
            ?"tema-oscuro"
            :"tema-claro"
        }`
      }
    >

      {/* CABECERA */}
      <header className="cabecera-temperatura">

        <div className="titulo-temperatura">

          <div className="icono-principal">
            <ChartLine size={20}/>
          </div>

          <h2>
            Histórico de temporadas
          </h2>

        </div>

        <div className="acciones-temperatura">

          <div className="selector-estacion">

            <MapPin size={15}/>

            <select
              value={
                estacionSeleccionada
              }
              onChange={
                evento=>
                  setEstacionSeleccionada(
                    evento.target.value
                  )
              }
            >

              {estaciones.map(
                estacion=>(
                  <option
                    key={
                      estacion.id
                    }
                    value={
                      estacion.id
                    }
                  >
                    {
                      estacion.nombre??
                      estacion.huerto??
                      estacion.id
                    }
                  </option>
                )
              )}

            </select>

          </div>

        </div>

      </header>

      {/* =================================================
          CONTROLES
      ================================================== */}

      <div className="barra-grafico">

        <div className="controles-historicos">

          {/* MES / AÑO */}
          <nav className="selector-vista">

            {VISTAS.map(({
              valor,
              texto,
              Icono
            })=>(
              <button
                key={valor}
                type="button"
                className={
                  vista===valor
                    ?"boton-vista activo"
                    :"boton-vista"
                }
                onClick={()=>
                  setVista(valor)
                }
              >
                <Icono size={15}/>
                <span>{texto}</span>
              </button>
            ))}

          </nav>

          {/* COMPARAR PERÍODOS */}
          <button
            type="button"
            className={
              comparaPeriodos
                ?"boton-comparar activo"
                :"boton-comparar"
            }
            onClick={
              alternarPeriodos
            }
            disabled={
              !puedeCompararPeriodos
            }
            title="Comparar meses o años"
          >
            <ArrowLeftRight size={15}/>
            <span>Períodos</span>
          </button>

          {/* COMPARAR ESTACIONES */}
          <button
            type="button"
            className={
              comparaEstaciones
                ?"boton-comparar boton-estaciones activo"
                :"boton-comparar boton-estaciones"
            }
            onClick={
              alternarEstaciones
            }
            disabled={
              !puedeCompararEstaciones
            }
            title="Comparar estaciones meteorológicas"
          >
            <RadioTower size={15}/>
            <span>Estaciones</span>
          </button>

          {/* =============================================
              MES
          ============================================== */}

          {vista==="mes"&&(
            <div className="filtros-periodo">

              {/* MES A */}
              <label className="grupo-periodo">

                <span className="etiqueta-filtro">

                  {comparaPeriodos&&(
                    <span
                      className="punto-serie"
                      style={{
                        background:
                          COLORES_SERIES[0]
                      }}
                    />
                  )}

                  {
                    comparaPeriodos
                      ?"Mes A"
                      :"Mes"
                  }

                </span>

                <select
                  value={
                    periodoMesSeleccionado
                  }
                  onChange={
                    evento=>
                      setPeriodoMesSeleccionado(
                        evento.target.value
                      )
                  }
                >

                  {periodosMensuales.map(
                    periodo=>(
                      <option
                        key={periodo}
                        value={periodo}
                        disabled={
                          comparaPeriodos&&
                          mesesComparacionValidos.includes(
                            periodo
                          )
                        }
                      >
                        {
                          periodoMesLegible(
                            periodo
                          )
                        }
                      </option>
                    )
                  )}

                </select>

              </label>

              {/* MES B-E */}
              {comparaPeriodos&&
                mesesComparacionValidos.map(
                  (
                    periodo,
                    indice
                  )=>{

                    const posicion=
                      indice+1;

                    return(
                      <div
                        className="grupo-periodo"
                        key={
                          `${periodo}-${indice}`
                        }
                      >

                        <span className="etiqueta-filtro">

                          <span
                            className="punto-serie"
                            style={{
                              background:
                                COLORES_SERIES[
                                  posicion
                                ]
                            }}
                          />

                          Mes {
                            LETRAS_SERIES[
                              posicion
                            ]
                          }

                        </span>

                        <div className="selector-eliminable">

                          <select
                            value={
                              periodo
                            }
                            onChange={
                              evento=>
                                cambiarMesComparacion(
                                  indice,
                                  evento.target.value
                                )
                            }
                          >

                            {periodosMensuales.map(
                              opcion=>(
                                <option
                                  key={opcion}
                                  value={opcion}
                                  disabled={
                                    mesesActivos.includes(
                                      opcion
                                    )&&
                                    opcion!==periodo
                                  }
                                >
                                  {
                                    periodoMesLegible(
                                      opcion
                                    )
                                  }
                                </option>
                              )
                            )}

                          </select>

                          <button
                            type="button"
                            className="boton-quitar-comparacion"
                            onClick={()=>
                              eliminarMesComparacion(
                                indice
                              )
                            }
                            aria-label="Eliminar mes"
                          >
                            <X size={14}/>
                          </button>

                        </div>

                      </div>
                    );
                  }
                )
              }

              {comparaPeriodos&&(
                <button
                  type="button"
                  className="boton-agregar-comparacion"
                  onClick={
                    agregarMes
                  }
                  disabled={
                    !puedeAgregarMes
                  }
                >
                  <Plus size={15}/>
                  <span>Añadir mes</span>
                </button>
              )}

            </div>
          )}

          {/* =============================================
              AÑO
          ============================================== */}

          {vista==="anio"&&(
            <div className="filtros-periodo">

              {/* AÑO A */}
              <label className="grupo-periodo grupo-anio">

                <span className="etiqueta-filtro">

                  {comparaPeriodos&&(
                    <span
                      className="punto-serie"
                      style={{
                        background:
                          COLORES_SERIES[0]
                      }}
                    />
                  )}

                  {
                    comparaPeriodos
                      ?"Año A"
                      :"Año"
                  }

                </span>

                <select
                  value={
                    anioSeleccionado
                  }
                  onChange={
                    evento=>
                      setAnioSeleccionado(
                        evento.target.value
                      )
                  }
                >

                  {aniosDisponibles.map(
                    anio=>(
                      <option
                        key={anio}
                        value={anio}
                        disabled={
                          comparaPeriodos&&
                          aniosComparacionValidos.includes(
                            anio
                          )
                        }
                      >
                        {anio}
                      </option>
                    )
                  )}

                </select>

              </label>

              {/* AÑO B-E */}
              {comparaPeriodos&&
                aniosComparacionValidos.map(
                  (
                    anio,
                    indice
                  )=>{

                    const posicion=
                      indice+1;

                    return(
                      <div
                        className="grupo-periodo grupo-anio"
                        key={
                          `${anio}-${indice}`
                        }
                      >

                        <span className="etiqueta-filtro">

                          <span
                            className="punto-serie"
                            style={{
                              background:
                                COLORES_SERIES[
                                  posicion
                                ]
                            }}
                          />

                          Año {
                            LETRAS_SERIES[
                              posicion
                            ]
                          }

                        </span>

                        <div className="selector-eliminable">

                          <select
                            value={anio}
                            onChange={
                              evento=>
                                cambiarAnioComparacion(
                                  indice,
                                  evento.target.value
                                )
                            }
                          >

                            {aniosDisponibles.map(
                              opcion=>(
                                <option
                                  key={opcion}
                                  value={opcion}
                                  disabled={
                                    aniosActivos.includes(
                                      opcion
                                    )&&
                                    opcion!==anio
                                  }
                                >
                                  {opcion}
                                </option>
                              )
                            )}

                          </select>

                          <button
                            type="button"
                            className="boton-quitar-comparacion"
                            onClick={()=>
                              eliminarAnioComparacion(
                                indice
                              )
                            }
                          >
                            <X size={14}/>
                          </button>

                        </div>

                      </div>
                    );
                  }
                )
              }

              {comparaPeriodos&&(
                <button
                  type="button"
                  className="boton-agregar-comparacion"
                  onClick={
                    agregarAnio
                  }
                  disabled={
                    !puedeAgregarAnio
                  }
                >
                  <Plus size={15}/>
                  <span>Añadir año</span>
                </button>
              )}

            </div>
          )}

          {/* =============================================
              COMPARACIÓN DE ESTACIONES
          ============================================== */}

          {comparaEstaciones&&(
            <div className="comparadores-estacion">

              {estacionesComparacionValidas.map(
                (
                  id,
                  indice
                )=>{

                  const posicion=
                    indice+1;

                  return(
                    <div
                      className="grupo-periodo grupo-estacion-comparada"
                      key={
                        `${id}-${indice}`
                      }
                    >

                      <span className="etiqueta-filtro">

                        <span
                          className="punto-serie"
                          style={{
                            background:
                              COLORES_SERIES[
                                posicion
                              ]
                          }}
                        />

                        Estación {
                          LETRAS_SERIES[
                            posicion
                          ]
                        }

                      </span>

                      <div className="selector-eliminable">

                        <select
                          value={id}
                          onChange={
                            evento=>
                              cambiarEstacionComparacion(
                                indice,
                                evento.target.value
                              )
                          }
                        >

                          {estacionesComparables.map(
                            opcion=>(
                              <option
                                key={opcion}
                                value={opcion}
                                disabled={
                                  estacionesActivas.includes(
                                    opcion
                                  )&&
                                  opcion!==id
                                }
                              >
                                {
                                  nombreEstacion(
                                    opcion
                                  )
                                }
                              </option>
                            )
                          )}

                        </select>

                        <button
                          type="button"
                          className="boton-quitar-comparacion"
                          onClick={()=>
                            eliminarEstacionComparacion(
                              indice
                            )
                          }
                        >
                          <X size={14}/>
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

              <button
                type="button"
                className="boton-agregar-comparacion"
                onClick={
                  agregarEstacion
                }
                disabled={
                  !puedeAgregarEstacion
                }
              >
                <Plus size={15}/>
                <span>Añadir estación</span>
              </button>

            </div>
          )}

        </div>

        {/* RESUMEN */}
        {!comparando&&(
          <div className="resumen-temperatura">

            <div>
              <Snowflake size={13}/>
              <span>Mínima</span>
              <strong>
                {formatoTemperatura(
                  resumen.minima
                )}
              </strong>
            </div>

            <div>
              <Thermometer size={13}/>
              <span>Media</span>
              <strong>
                {formatoTemperatura(
                  resumen.media
                )}
              </strong>
            </div>

            <div>
              <ThermometerSun size={13}/>
              <span>Máxima</span>
              <strong>
                {formatoTemperatura(
                  resumen.maxima
                )}
              </strong>
            </div>

          </div>
        )}

      </div>

      {/* LEYENDA */}
      {comparando&&(
        <div className="leyenda-comparacion">

          {configuracion.series.map(
            serie=>(
              <div
                className="item-leyenda"
                key={
                  serie.id??
                  serie.nombre
                }
              >

                <span
                  className="linea-leyenda"
                  style={{
                    background:
                      serie.color
                  }}
                />

                <span>
                  {serie.nombre}
                </span>

              </div>
            )
          )}

        </div>
      )}

      {/* GRÁFICO */}
      <div className="area-temperatura">

        {hayDatos?(
          <GraficoLinea
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
            tipoGrafico={
              tipoGrafico
            }
            tamanoTexto={
              tamanoTexto
            }
            contraste={
              contraste
            }
          />
        ):(
          <div className="sin-datos">

            <Thermometer size={28}/>

            <strong>
              Sin registros disponibles
            </strong>

            <span>
              No existen datos para la selección actual.
            </span>

          </div>
        )}

      </div>

    </section>
  );
}

export default TemperatureChart;