import{useEffect,useMemo,useState}from"react";
import{AxisBottom,AxisLeft}from"@visx/axis";
import{GridRows}from"@visx/grid";
import{ParentSize}from"@visx/responsive";
import{scaleLinear,scalePoint}from"@visx/scale";
import{LinePath}from"@visx/shape";
import{
  ArrowLeftRight,CalendarDays,CalendarRange,ChartLine,MapPin,Plus,
  RadioTower,Snowflake,Thermometer,ThermometerSun,X,
}from"lucide-react";
import{useConfiguracion}from"../../contexto/ConfiguracionContext";
import"./TemperatureChart.css";

const MESES=["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_CORTOS=["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const VISTAS=[
  {valor:"mes",texto:"Mes",Icono:CalendarDays},
  {valor:"anio",texto:"Año",Icono:CalendarRange},
];

const TEMAS_GRAFICO={
  oscuro:{secundario:"#9CA3AF",grilla:"rgba(148,163,184,.14)",punto:"#0F1115"},
  claro:{secundario:"#64748B",grilla:"rgba(100,116,139,.14)",punto:"#FFF"},
};

const COLORES_SERIES=["#38BDF8","#C86D3B","#3E8E58","#A78BFA","#D99B26"];
const LETRAS_SERIES=["A","B","C","D","E"];
const MAX_SERIES=5;

const aNumero=v=>{
  if(v===null||v===undefined||v==="")return null;
  const n=Number(v);
  return Number.isFinite(n)?n:null;
};

const promedio=valores=>
  valores.length?valores.reduce((s,v)=>s+v,0)/valores.length:null;

const formatoTemperatura=v=>
  v===null?"—":`${v.toFixed(1).replace(".",",")} °C`;

const periodoMesLegible=periodo=>{
  if(!periodo)return"";
  const[anio,mes]=periodo.split("-");
  return`${MESES[Number(mes)]} ${anio}`;
};

const diasDelPeriodo=periodo=>{
  if(!periodo)return 0;
  const[anio,mes]=periodo.split("-").map(Number);
  return new Date(anio,mes,0).getDate();
};

const listasIguales=(a,b)=>
  Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);

const limpiarLista=(valores,disponibles,principal,maximo=MAX_SERIES-1)=>
  [...new Set(Array.isArray(valores)?valores:[])]
    .filter(v=>disponibles.includes(v)&&v!==principal)
    .slice(0,maximo);

const listaSegura=lista=>Array.isArray(lista)?lista:[];

const agregarLista=(disponibles,activos,setter,desdeFinal=false)=>{
  if(activos.length>=MAX_SERIES)return;

  const lista=desdeFinal?[...disponibles].reverse():disponibles;
  const disponible=lista.find(v=>!activos.includes(v));

  if(disponible)setter(actuales=>[...listaSegura(actuales),disponible]);
};

const cambiarLista=(validos,activos,setter,indice,valor)=>{
  const actual=validos[indice];
  if(activos.includes(valor)&&valor!==actual)return;

  setter(anteriores=>{
    const copia=[...listaSegura(anteriores)];
    copia[indice]=valor;
    return copia;
  });
};

const eliminarLista=(setter,indice)=>
  setter(anteriores=>listaSegura(anteriores).filter((_,i)=>i!==indice));

const usePreferencia=(clave,valorInicial)=>{
  const[valor,setValor]=useState(()=>{
    if(typeof window==="undefined")return valorInicial;

    try{
      const guardado=localStorage.getItem(clave);
      return guardado===null?valorInicial:JSON.parse(guardado);
    }catch{
      return valorInicial;
    }
  });

  useEffect(()=>{
    localStorage.setItem(clave,JSON.stringify(valor));
  },[clave,valor]);

  return[valor,setValor];
};

const crearDatosMes=(registros,periodo,categorias)=>{
  const mapa=new Map(
    registros
      .filter(d=>d.fecha.startsWith(`${periodo}-`))
      .map(d=>[d.fecha.substring(8,10),d])
  );

  return categorias.map(dia=>({
    etiqueta:dia,
    valor:aNumero(mapa.get(dia)?.mediaDiaria),
  }));
};

const crearDatosAnio=(registros,anio)=>
  MESES_CORTOS.slice(1).map((etiqueta,indice)=>{
    const mes=String(indice+1).padStart(2,"0");

    const valores=registros
      .filter(d=>d.fecha.startsWith(`${anio}-${mes}-`))
      .map(d=>aNumero(d.mediaDiaria))
      .filter(Number.isFinite);

    return{etiqueta,valor:promedio(valores)};
  });

const crearSerie=(id,nombre,datos,indice)=>({
  id,nombre,
  color:COLORES_SERIES[indice%COLORES_SERIES.length],
  datos,
});

function PuntoSerie({indice}){
  return(
    <span
      className="punto-serie"
      style={{background:COLORES_SERIES[indice]}}
    />
  );
}

function SelectorPrincipal({
  tipo,valor,onChange,opciones,comparando,comparaciones,formatear,
}){
  const esAnio=tipo==="Año";

  return(
    <label className={`grupo-periodo ${esAnio?"grupo-anio":""}`}>
      <span className="etiqueta-filtro">
        {comparando&&<PuntoSerie indice={0}/>}
        {comparando?`${tipo} A`:tipo}
      </span>

      <select value={valor} onChange={e=>onChange(e.target.value)}>
        {opciones.map(opcion=>(
          <option
            key={opcion}
            value={opcion}
            disabled={comparando&&comparaciones.includes(opcion)}
          >
            {formatear(opcion)}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectorComparacion({
  clase="",indice,valor,opciones,activos,onChange,onDelete,
  etiqueta,formatear=v=>v,ariaLabel,
}){
  return(
    <div className={`grupo-periodo ${clase}`}>
      <span className="etiqueta-filtro">
        <PuntoSerie indice={indice}/>
        {etiqueta}
      </span>

      <div className="selector-eliminable">
        <select value={valor} onChange={e=>onChange(e.target.value)}>
          {opciones.map(opcion=>(
            <option
              key={opcion}
              value={opcion}
              disabled={activos.includes(opcion)&&opcion!==valor}
            >
              {formatear(opcion)}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="boton-quitar-comparacion"
          onClick={onDelete}
          aria-label={ariaLabel}
        >
          <X size={14}/>
        </button>
      </div>
    </div>
  );
}

function BotonAgregar({onClick,disabled,texto}){
  return(
    <button
      type="button"
      className="boton-agregar-comparacion"
      onClick={onClick}
      disabled={disabled}
    >
      <Plus size={15}/>
      <span>{texto}</span>
    </button>
  );
}

function GraficoLinea({
  series,categorias,ticksX,minimoY,maximoY,tema,
  formatoCategoria,tipoGrafico,tamanoTexto,contraste,
}){
  const[tooltip,setTooltip]=useState(null);

  useEffect(()=>setTooltip(null),[series]);

  const factorTexto=tamanoTexto/120;
  const mostrarLineas=tipoGrafico!=="puntos";
  const mostrarPuntos=tipoGrafico!=="lineas";

  return(
    <div className="grafico-visx">
      <ParentSize debounceTime={70}>
        {({width,height})=>{
          if(width<50||height<50)return null;

          const margen={
            top:Math.round(24*factorTexto),
            right:Math.round(22*factorTexto),
            bottom:Math.round(52*factorTexto),
            left:Math.round(60*factorTexto),
          };

          const ancho=Math.max(10,width-margen.left-margen.right);
          const alto=Math.max(10,height-margen.top-margen.bottom);

          const escalaX=scalePoint({
            domain:categorias,
            range:[0,ancho],
            padding:.35,
          });

          const escalaY=scaleLinear({
            domain:[minimoY,maximoY],
            range:[alto,0],
            nice:true,
          });

          const buscarCategoria=x=>
            categorias.reduce((cercana,etiqueta)=>{
              const posicion=escalaX(etiqueta);
              if(posicion===undefined)return cercana;

              const distancia=Math.abs(posicion-x);

              return!cercana||distancia<cercana.distancia
                ?{etiqueta,distancia}
                :cercana;
            },null)?.etiqueta;

          const mostrarTooltip=e=>{
            const rect=e.currentTarget.getBoundingClientRect();
            const etiqueta=buscarCategoria(e.clientX-rect.left);
            if(!etiqueta)return;

            const items=series
              .map(serie=>{
                const dato=serie.datos.find(d=>d.etiqueta===etiqueta);
                return dato&&Number.isFinite(dato.valor)?{serie,dato}:null;
              })
              .filter(Boolean);

            if(!items.length)return setTooltip(null);

            const posicionX=escalaX(etiqueta);
            const posicionY=Math.min(...items.map(({dato})=>escalaY(dato.valor)));

            setTooltip({
              etiqueta,
              items,
              left:Math.min(width-120,Math.max(120,margen.left+posicionX)),
              top:Math.max(20,margen.top+posicionY),
            });
          };

          const fontSize=Math.max(9,10*factorTexto);
          const peso=contraste==="alto"?700:600;

          return(
            <>
              <svg width={width} height={height} role="img" aria-label="Histórico de temperatura">
                <g transform={`translate(${margen.left},${margen.top})`}>
                  <GridRows
                    scale={escalaY}
                    width={ancho}
                    numTicks={5}
                    stroke={tema.grilla}
                    strokeWidth={contraste==="alto"?1.3:1}
                  />

                  {mostrarLineas&&series.map(serie=>(
                    <LinePath
                      key={serie.id??serie.nombre}
                      data={serie.datos}
                      defined={d=>Number.isFinite(d.valor)}
                      x={d=>escalaX(d.etiqueta)??0}
                      y={d=>escalaY(d.valor)}
                      stroke={serie.color}
                      strokeWidth={contraste==="alto"?3.2:2.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}

                  {mostrarPuntos&&series.flatMap(serie=>
                    serie.datos
                      .filter(d=>Number.isFinite(d.valor))
                      .map(d=>(
                        <circle
                          key={`${serie.id??serie.nombre}-${d.etiqueta}`}
                          cx={escalaX(d.etiqueta)}
                          cy={escalaY(d.valor)}
                          r={tipoGrafico==="puntos"?4:3.3}
                          fill={serie.color}
                          stroke={tema.punto}
                          strokeWidth={contraste==="alto"?2.5:2}
                        />
                      ))
                  )}

                  <AxisLeft
                    scale={escalaY}
                    numTicks={5}
                    hideAxisLine
                    hideTicks
                    tickFormat={v=>`${v}°`}
                    tickLabelProps={()=>({
                      fill:tema.secundario,
                      fontSize,
                      fontWeight:peso,
                      textAnchor:"end",
                      dx:-7,
                      dy:"0.33em",
                    })}
                  />

                  <AxisBottom
                    top={alto}
                    scale={escalaX}
                    tickValues={ticksX}
                    hideAxisLine
                    hideTicks
                    tickLabelProps={()=>({
                      fill:tema.secundario,
                      fontSize,
                      fontWeight:peso,
                      textAnchor:"middle",
                      dy:Math.round(10*factorTexto),
                    })}
                  />

                  <rect
                    width={ancho}
                    height={alto}
                    fill="transparent"
                    onPointerMove={mostrarTooltip}
                    onPointerDown={mostrarTooltip}
                    onPointerLeave={()=>setTooltip(null)}
                  />
                </g>
              </svg>

              {tooltip&&(
                <div
                  className="tooltip-temperatura"
                  style={{left:tooltip.left,top:tooltip.top}}
                >
                  <strong className="tooltip-titulo">
                    {formatoCategoria(tooltip.etiqueta)}
                  </strong>

                  {tooltip.items.map(({serie,dato})=>(
                    <div
                      className="tooltip-serie"
                      key={serie.id??serie.nombre}
                    >
                      <div>
                        <span
                          className="punto-tooltip"
                          style={{background:serie.color}}
                        />
                        <span>{serie.nombre}</span>
                      </div>

                      <strong>{formatoTemperatura(dato.valor)}</strong>
                    </div>
                  ))}

                  {tooltip.items.length===2&&(
                    <div className="tooltip-diferencia">
                      <span>Diferencia</span>
                      <strong>
                        {(()=>{
                          const d=tooltip.items[0].dato.valor-tooltip.items[1].dato.valor;
                          return`${d>0?"+":""}${d.toFixed(1).replace(".",",")} °C`;
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

function TemperatureChart({
  estaciones=[],
  datosTemperatura=[],
  temaOscuro=true,
}){
  const{tipoGrafico,tamanoTexto,contraste}=useConfiguracion();

  const[vista,setVista]=usePreferencia("grafico-vista","mes");
  const[modoComparacion,setModoComparacion]=usePreferencia("historicos-modo-comparacion","ninguno");

  const[estacionSeleccionada,setEstacionSeleccionada]=useState("");
  const[periodoMesSeleccionado,setPeriodoMesSeleccionado]=useState("");
  const[anioSeleccionado,setAnioSeleccionado]=useState("");

  const[mesesComparacion,setMesesComparacion]=usePreferencia("historicos-meses-comparacion",[]);
  const[aniosComparacion,setAniosComparacion]=usePreferencia("historicos-anios-comparacion",[]);
  const[estacionesComparacion,setEstacionesComparacion]=usePreferencia("historicos-estaciones-comparacion",[]);

  useEffect(()=>{
    if(vista!=="mes"&&vista!=="anio")setVista("mes");
  },[vista,setVista]);

  const comparaPeriodos=modoComparacion==="periodos";
  const comparaEstaciones=modoComparacion==="estaciones";

  const temaBase=TEMAS_GRAFICO[temaOscuro?"oscuro":"claro"];

  const tema={
    ...temaBase,
    secundario:contraste==="alto"
      ?temaOscuro?"#F8FAFC":"#111827"
      :temaBase.secundario,
    grilla:contraste==="alto"
      ?temaOscuro?"rgba(255,255,255,.22)":"rgba(17,24,39,.20)"
      :temaBase.grilla,
  };

  useEffect(()=>{
    const existe=estaciones.some(e=>e.id===estacionSeleccionada);
    if(!existe&&estaciones.length)setEstacionSeleccionada(estaciones[0].id);
  },[estaciones,estacionSeleccionada]);

  const nombreEstacion=id=>{
    const estacion=estaciones.find(e=>e.id===id);
    return estacion?.nombre??estacion?.huerto??estacion?.id??"Estación";
  };

  const registrosEstacion=id=>
    datosTemperatura
      .filter(d=>d.estacionId===id)
      .sort((a,b)=>a.fecha.localeCompare(b.fecha));

  const diariosEstacion=useMemo(
    ()=>registrosEstacion(estacionSeleccionada),
    [datosTemperatura,estacionSeleccionada]
  );

  const periodosMensuales=useMemo(
    ()=>[...new Set(diariosEstacion.map(d=>d.fecha.substring(0,7)))].sort(),
    [diariosEstacion]
  );

  const aniosDisponibles=useMemo(
    ()=>[...new Set(diariosEstacion.map(d=>d.fecha.substring(0,4)))].sort(),
    [diariosEstacion]
  );

  useEffect(()=>{
    if(!periodosMensuales.length)return setPeriodoMesSeleccionado("");

    if(!periodosMensuales.includes(periodoMesSeleccionado)){
      setPeriodoMesSeleccionado(periodosMensuales.at(-1));
    }
  },[periodosMensuales,periodoMesSeleccionado]);

  useEffect(()=>{
    if(!aniosDisponibles.length)return setAnioSeleccionado("");

    if(!aniosDisponibles.includes(anioSeleccionado)){
      setAnioSeleccionado(aniosDisponibles.at(-1));
    }
  },[aniosDisponibles,anioSeleccionado]);

  const mesesComparacionValidos=useMemo(
    ()=>limpiarLista(mesesComparacion,periodosMensuales,periodoMesSeleccionado),
    [mesesComparacion,periodosMensuales,periodoMesSeleccionado]
  );

  useEffect(()=>{
    if(!comparaPeriodos||vista!=="mes")return;

    setMesesComparacion(actuales=>{
      let validos=limpiarLista(actuales,periodosMensuales,periodoMesSeleccionado);

      if(!validos.length){
        const alternativa=[...periodosMensuales]
          .reverse()
          .find(p=>p!==periodoMesSeleccionado);

        if(alternativa)validos=[alternativa];
      }

      return listasIguales(actuales,validos)?actuales:validos;
    });
  },[
    comparaPeriodos,vista,periodosMensuales,
    periodoMesSeleccionado,setMesesComparacion,
  ]);

  const mesesActivos=[periodoMesSeleccionado,...mesesComparacionValidos].filter(Boolean);

  const agregarMes=()=>
    agregarLista(periodosMensuales,mesesActivos,setMesesComparacion,true);

  const cambiarMesComparacion=(indice,periodo)=>
    cambiarLista(
      mesesComparacionValidos,mesesActivos,
      setMesesComparacion,indice,periodo
    );

  const eliminarMesComparacion=indice=>
    eliminarLista(setMesesComparacion,indice);

  const aniosComparacionValidos=useMemo(
    ()=>limpiarLista(aniosComparacion,aniosDisponibles,anioSeleccionado),
    [aniosComparacion,aniosDisponibles,anioSeleccionado]
  );

  useEffect(()=>{
    if(!comparaPeriodos||vista!=="anio")return;

    setAniosComparacion(actuales=>{
      let validos=limpiarLista(actuales,aniosDisponibles,anioSeleccionado);

      if(!validos.length){
        const alternativa=[...aniosDisponibles]
          .reverse()
          .find(a=>a!==anioSeleccionado);

        if(alternativa)validos=[alternativa];
      }

      return listasIguales(actuales,validos)?actuales:validos;
    });
  },[
    comparaPeriodos,vista,aniosDisponibles,
    anioSeleccionado,setAniosComparacion,
  ]);

  const aniosActivos=[anioSeleccionado,...aniosComparacionValidos].filter(Boolean);

  const agregarAnio=()=>
    agregarLista(aniosDisponibles,aniosActivos,setAniosComparacion,true);

  const cambiarAnioComparacion=(indice,anio)=>
    cambiarLista(
      aniosComparacionValidos,aniosActivos,
      setAniosComparacion,indice,anio
    );

  const eliminarAnioComparacion=indice=>
    eliminarLista(setAniosComparacion,indice);

  const estacionTienePeriodo=id=>{
    if(!id)return false;

    const periodo=vista==="mes"
      ?`${periodoMesSeleccionado}-`
      :`${anioSeleccionado}-`;

    return datosTemperatura.some(
      d=>d.estacionId===id&&d.fecha.startsWith(periodo)
    );
  };

  const estacionesComparables=useMemo(
    ()=>estaciones
      .filter(e=>e.id!==estacionSeleccionada)
      .filter(e=>estacionTienePeriodo(e.id))
      .map(e=>e.id),
    [
      estaciones,datosTemperatura,estacionSeleccionada,
      vista,periodoMesSeleccionado,anioSeleccionado,
    ]
  );

  const estacionesComparacionValidas=useMemo(
    ()=>limpiarLista(
      estacionesComparacion,
      estacionesComparables,
      estacionSeleccionada
    ),
    [estacionesComparacion,estacionesComparables,estacionSeleccionada]
  );

  useEffect(()=>{
    if(!comparaEstaciones)return;

    setEstacionesComparacion(actuales=>{
      let validas=limpiarLista(
        actuales,
        estacionesComparables,
        estacionSeleccionada
      );

      if(!validas.length&&estacionesComparables.length){
        validas=[estacionesComparables[0]];
      }

      return listasIguales(actuales,validas)?actuales:validas;
    });
  },[
    comparaEstaciones,estacionesComparables,
    estacionSeleccionada,setEstacionesComparacion,
  ]);

  const estacionesActivas=[
    estacionSeleccionada,
    ...estacionesComparacionValidas,
  ].filter(Boolean);

  const agregarEstacion=()=>
    agregarLista(
      estacionesComparables,
      estacionesActivas,
      setEstacionesComparacion
    );

  const cambiarEstacionComparacion=(indice,id)=>
    cambiarLista(
      estacionesComparacionValidas,
      estacionesActivas,
      setEstacionesComparacion,
      indice,
      id
    );

  const eliminarEstacionComparacion=indice=>
    eliminarLista(setEstacionesComparacion,indice);

  const puedeCompararPeriodos=
    vista==="mes"
      ?periodosMensuales.length>1
      :aniosDisponibles.length>1;

  const puedeCompararEstaciones=estacionesComparables.length>0;

  const puedeAgregarMes=
    mesesActivos.length<Math.min(MAX_SERIES,periodosMensuales.length);

  const puedeAgregarAnio=
    aniosActivos.length<Math.min(MAX_SERIES,aniosDisponibles.length);

  const puedeAgregarEstacion=
    estacionesActivas.length<Math.min(MAX_SERIES,estaciones.length)&&
    estacionesComparables.some(id=>!estacionesActivas.includes(id));

  const alternarPeriodos=()=>
    setModoComparacion(actual=>actual==="periodos"?"ninguno":"periodos");

  const alternarEstaciones=()=>
    setModoComparacion(actual=>actual==="estaciones"?"ninguno":"estaciones");

  const configuracion=useMemo(()=>{
    if(vista==="mes"){
      const periodos=comparaPeriodos
        ?[periodoMesSeleccionado,...mesesComparacionValidos]
        :[periodoMesSeleccionado];

      const cantidadDias=Math.max(
        ...periodos.filter(Boolean).map(diasDelPeriodo),
        1
      );

      const categorias=Array.from(
        {length:cantidadDias},
        (_,i)=>String(i+1).padStart(2,"0")
      );

      let series;

      if(comparaPeriodos){
        series=periodos
          .filter(Boolean)
          .map((periodo,i)=>
            crearSerie(
              `periodo-${periodo}`,
              periodoMesLegible(periodo),
              crearDatosMes(diariosEstacion,periodo,categorias),
              i
            )
          );
      }else if(comparaEstaciones){
        series=estacionesActivas.map((id,i)=>
          crearSerie(
            `estacion-${id}`,
            nombreEstacion(id),
            crearDatosMes(
              registrosEstacion(id),
              periodoMesSeleccionado,
              categorias
            ),
            i
          )
        );
      }else{
        series=[
          crearSerie(
            `periodo-${periodoMesSeleccionado}`,
            periodoMesLegible(periodoMesSeleccionado),
            crearDatosMes(
              diariosEstacion,
              periodoMesSeleccionado,
              categorias
            ),
            0
          ),
        ];
      }

      const posiblesTicks=[
        "01","05","10","15","20","25",
        String(cantidadDias).padStart(2,"0"),
      ];

      return{
        categorias,
        series,
        ticksX:[...new Set(posiblesTicks.filter(d=>categorias.includes(d)))],
        formatoCategoria:etiqueta=>`Día ${Number(etiqueta)}`,
      };
    }

    const categorias=MESES_CORTOS.slice(1);
    let series;

    if(comparaPeriodos){
      series=[
        anioSeleccionado,
        ...aniosComparacionValidos,
      ]
        .filter(Boolean)
        .map((anio,i)=>
          crearSerie(
            `anio-${anio}`,
            anio,
            crearDatosAnio(diariosEstacion,anio),
            i
          )
        );
    }else if(comparaEstaciones){
      series=estacionesActivas.map((id,i)=>
        crearSerie(
          `estacion-${id}`,
          nombreEstacion(id),
          crearDatosAnio(registrosEstacion(id),anioSeleccionado),
          i
        )
      );
    }else{
      series=[
        crearSerie(
          `anio-${anioSeleccionado}`,
          anioSeleccionado,
          crearDatosAnio(diariosEstacion,anioSeleccionado),
          0
        ),
      ];
    }

    return{
      categorias,
      series,
      ticksX:categorias,
      formatoCategoria:etiqueta=>etiqueta,
    };
  },[
    vista,comparaPeriodos,comparaEstaciones,diariosEstacion,
    periodoMesSeleccionado,mesesComparacionValidos,
    anioSeleccionado,aniosComparacionValidos,
    estacionesActivas,datosTemperatura,
  ]);

  const resumen=useMemo(()=>{
    const registros=diariosEstacion.filter(d=>
      d.fecha.startsWith(
        vista==="mes"
          ?`${periodoMesSeleccionado}-`
          :`${anioSeleccionado}-`
      )
    );

    if(!registros.length)return{minima:null,media:null,maxima:null};

    const valores=campo=>
      registros.map(d=>aNumero(d[campo])).filter(Number.isFinite);

    const minimas=valores("minima");
    const medias=valores("mediaDiaria");
    const maximas=valores("maxima");

    return{
      minima:minimas.length?Math.min(...minimas):null,
      media:promedio(medias),
      maxima:maximas.length?Math.max(...maximas):null,
    };
  },[
    vista,diariosEstacion,
    periodoMesSeleccionado,anioSeleccionado,
  ]);

  const valores=useMemo(
    ()=>configuracion.series.flatMap(
      serie=>serie.datos.map(d=>d.valor).filter(Number.isFinite)
    ),
    [configuracion]
  );

  const minimoY=valores.length
    ?Math.floor((Math.min(...valores)-3)/5)*5
    :0;

  const maximoY=valores.length
    ?Math.max(
      minimoY+10,
      Math.ceil((Math.max(...valores)+3)/5)*5
    )
    :40;

  const hayDatos=valores.length>0;
  const comparando=modoComparacion!=="ninguno";

  const esMes=vista==="mes";
  const tipoPeriodo=esMes?"Mes":"Año";
  const opcionesPeriodo=esMes?periodosMensuales:aniosDisponibles;
  const periodoPrincipal=esMes?periodoMesSeleccionado:anioSeleccionado;
  const setPeriodoPrincipal=esMes?setPeriodoMesSeleccionado:setAnioSeleccionado;
  const comparacionesPeriodo=esMes?mesesComparacionValidos:aniosComparacionValidos;
  const activosPeriodo=esMes?mesesActivos:aniosActivos;
  const puedeAgregarPeriodo=esMes?puedeAgregarMes:puedeAgregarAnio;
  const agregarPeriodo=esMes?agregarMes:agregarAnio;
  const cambiarPeriodo=esMes?cambiarMesComparacion:cambiarAnioComparacion;
  const eliminarPeriodo=esMes?eliminarMesComparacion:eliminarAnioComparacion;
  const formatearPeriodo=esMes?periodoMesLegible:v=>v;

  return(
    <section className={`panel-temperatura ${temaOscuro?"tema-oscuro":"tema-claro"}`}>
      <header className="cabecera-temperatura">
        <div className="titulo-temperatura">
          <div className="icono-principal">
            <ChartLine size={20}/>
          </div>
          <h2>Histórico de temporadas</h2>
        </div>

        <div className="acciones-temperatura">
          <div className="selector-estacion">
            <MapPin size={15}/>

            <select
              value={estacionSeleccionada}
              onChange={e=>setEstacionSeleccionada(e.target.value)}
            >
              {estaciones.map(estacion=>(
                <option key={estacion.id} value={estacion.id}>
                  {estacion.nombre??estacion.huerto??estacion.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="barra-grafico">
        <div className="controles-historicos">
          <nav className="selector-vista">
            {VISTAS.map(({valor,texto,Icono})=>(
              <button
                key={valor}
                type="button"
                className={`boton-vista ${vista===valor?"activo":""}`}
                onClick={()=>setVista(valor)}
              >
                <Icono size={15}/>
                <span>{texto}</span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            className={`boton-comparar ${comparaPeriodos?"activo":""}`}
            onClick={alternarPeriodos}
            disabled={!puedeCompararPeriodos}
            title="Comparar meses o años"
          >
            <ArrowLeftRight size={15}/>
            <span>Períodos</span>
          </button>

          <button
            type="button"
            className={`boton-comparar boton-estaciones ${comparaEstaciones?"activo":""}`}
            onClick={alternarEstaciones}
            disabled={!puedeCompararEstaciones}
            title="Comparar estaciones meteorológicas"
          >
            <RadioTower size={15}/>
            <span>Estaciones</span>
          </button>

          <div className="filtros-periodo">
            <SelectorPrincipal
              tipo={tipoPeriodo}
              valor={periodoPrincipal}
              onChange={setPeriodoPrincipal}
              opciones={opcionesPeriodo}
              comparando={comparaPeriodos}
              comparaciones={comparacionesPeriodo}
              formatear={formatearPeriodo}
            />

            {comparaPeriodos&&comparacionesPeriodo.map((valor,indice)=>{
              const posicion=indice+1;

              return(
                <SelectorComparacion
                  key={`${valor}-${indice}`}
                  clase={esMes?"":"grupo-anio"}
                  indice={posicion}
                  valor={valor}
                  opciones={opcionesPeriodo}
                  activos={activosPeriodo}
                  onChange={nuevo=>cambiarPeriodo(indice,nuevo)}
                  onDelete={()=>eliminarPeriodo(indice)}
                  etiqueta={`${tipoPeriodo} ${LETRAS_SERIES[posicion]}`}
                  formatear={formatearPeriodo}
                  ariaLabel={`Eliminar ${tipoPeriodo.toLowerCase()}`}
                />
              );
            })}

            {comparaPeriodos&&(
              <BotonAgregar
                onClick={agregarPeriodo}
                disabled={!puedeAgregarPeriodo}
                texto={`Añadir ${tipoPeriodo.toLowerCase()}`}
              />
            )}
          </div>

          {comparaEstaciones&&(
            <div className="comparadores-estacion">
              {estacionesComparacionValidas.map((id,indice)=>{
                const posicion=indice+1;

                return(
                  <SelectorComparacion
                    key={`${id}-${indice}`}
                    clase="grupo-estacion-comparada"
                    indice={posicion}
                    valor={id}
                    opciones={estacionesComparables}
                    activos={estacionesActivas}
                    onChange={nuevo=>cambiarEstacionComparacion(indice,nuevo)}
                    onDelete={()=>eliminarEstacionComparacion(indice)}
                    etiqueta={`Estación ${LETRAS_SERIES[posicion]}`}
                    formatear={nombreEstacion}
                    ariaLabel="Eliminar estación"
                  />
                );
              })}

              <BotonAgregar
                onClick={agregarEstacion}
                disabled={!puedeAgregarEstacion}
                texto="Añadir estación"
              />
            </div>
          )}
        </div>

        {!comparando&&(
          <div className="resumen-temperatura">
            <div>
              <Snowflake size={13}/>
              <span>Mínima</span>
              <strong>{formatoTemperatura(resumen.minima)}</strong>
            </div>

            <div>
              <Thermometer size={13}/>
              <span>Media</span>
              <strong>{formatoTemperatura(resumen.media)}</strong>
            </div>

            <div>
              <ThermometerSun size={13}/>
              <span>Máxima</span>
              <strong>{formatoTemperatura(resumen.maxima)}</strong>
            </div>
          </div>
        )}
      </div>

      {comparando&&(
        <div className="leyenda-comparacion">
          {configuracion.series.map(serie=>(
            <div
              className="item-leyenda"
              key={serie.id??serie.nombre}
            >
              <span
                className="linea-leyenda"
                style={{background:serie.color}}
              />
              <span>{serie.nombre}</span>
            </div>
          ))}
        </div>
      )}

      <div className="area-temperatura">
        {hayDatos?(
          <GraficoLinea
            series={configuracion.series}
            categorias={configuracion.categorias}
            ticksX={configuracion.ticksX}
            minimoY={minimoY}
            maximoY={maximoY}
            tema={tema}
            formatoCategoria={configuracion.formatoCategoria}
            tipoGrafico={tipoGrafico}
            tamanoTexto={tamanoTexto}
            contraste={contraste}
          />
        ):(
          <div className="sin-datos">
            <Thermometer size={28}/>
            <strong>Sin registros disponibles</strong>
            <span>No existen datos para la selección actual.</span>
          </div>
        )}
      </div>
    </section>
  );
}

export default TemperatureChart;