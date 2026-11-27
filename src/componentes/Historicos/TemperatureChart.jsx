import SelectorVigno from "../SelectorVigno/SelectorVigno";
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

// define los nombres de los meses para mostrar los periodos
const MESES=["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_CORTOS=["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// define las opciones de vista mensual y anual
const VISTAS=[
  {valor:"mes",texto:"Mes",Icono:CalendarDays},
  {valor:"anio",texto:"Año",Icono:CalendarRange},
];

// guarda los colores utilizados en los dos temas del grafico
const TEMAS_GRAFICO={
  oscuro:{secundario:"#9CA3AF",grilla:"rgba(148,163,184,.14)",punto:"#0F1115"},
  claro:{secundario:"#64748B",grilla:"rgba(100,116,139,.14)",punto:"#FFF"},
};

// define los colores y el limite de series que se pueden comparar
const COLORES_SERIES=["#38BDF8","#C86D3B","#3E8E58","#A78BFA","#D99B26"];
const LETRAS_SERIES=["A","B","C","D","E"];
const MAX_SERIES=5;

// convierte un valor a numero o devuelve null si no es valido
const aNumero=v=>{
  if(v===null||v===undefined||v==="")return null;
  const n=Number(v);
  return Number.isFinite(n)?n:null;
};

// calcula el promedio de una lista de numeros
const promedio=valores=>
  valores.length?valores.reduce((s,v)=>s+v,0)/valores.length:null;

// muestra la temperatura con un decimal y la unidad
const formatoTemperatura=v=>
  v===null?"—":`${v.toFixed(1).replace(".",",")} °C`;

// convierte una fecha como 2026-11 en noviembre 2026
const periodoMesLegible=periodo=>{
  if(!periodo)return"";
  const[anio,mes]=periodo.split("-");
  return`${MESES[Number(mes)]} ${anio}`;
};

// obtiene la cantidad de dias que tiene un mes
const diasDelPeriodo=periodo=>{
  if(!periodo)return 0;
  const[anio,mes]=periodo.split("-").map(Number);
  return new Date(anio,mes,0).getDate();
};

// comprueba si dos listas tienen los mismos valores y el mismo orden
const listasIguales=(a,b)=>
  Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);

// elimina repetidos y periodos no disponibles para la comparacion
const limpiarLista=(valores,disponibles,principal,maximo=MAX_SERIES-1)=>
  [...new Set(Array.isArray(valores)?valores:[])]
    .filter(v=>disponibles.includes(v)&&v!==principal)
    .slice(0,maximo);

// comprueba que el valor recibido sea una lista
const listaSegura=lista=>Array.isArray(lista)?lista:[];

// agrega una nueva comparacion sin superar el limite permitido
const agregarLista=(disponibles,activos,setter,desdeFinal=false)=>{
  if(activos.length>=MAX_SERIES)return;

  const lista=desdeFinal?[...disponibles].reverse():disponibles;
  const disponible=lista.find(v=>!activos.includes(v));

  if(disponible)setter(actuales=>[...listaSegura(actuales),disponible]);
};

// cambia un elemento de la comparacion y evita repetidos
const cambiarLista=(validos,activos,setter,indice,valor)=>{
  const actual=validos[indice];
  if(activos.includes(valor)&&valor!==actual)return;

  setter(anteriores=>{
    const copia=[...listaSegura(anteriores)];
    copia[indice]=valor;
    return copia;
  });
};

// elimina una comparacion segun su posicion
const eliminarLista=(setter,indice)=>
  setter(anteriores=>listaSegura(anteriores).filter((_,i)=>i!==indice));

// hook que recuerda las preferencias utilizando localstorage
const usePreferencia=(clave,valorInicial)=>{
  const[valor,setValor]=useState(()=>{
    if(typeof window==="undefined")return valorInicial;

    try{
      // recupera una preferencia guardada en el navegador
      const guardado=localStorage.getItem(clave);
      return guardado===null?valorInicial:JSON.parse(guardado);
    }catch{
      return valorInicial;
    }
  });

  useEffect(()=>{
    // guarda la preferencia cada vez que cambia
    localStorage.setItem(clave,JSON.stringify(valor));
  },[clave,valor]);

  return[valor,setValor];
};

// crea los datos diarios para el grafico mensual
const crearDatosMes=(registros,periodo,categorias)=>{
  // organiza los registros por dia para buscarlos facilmente
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

// calcula un promedio de temperatura para cada mes del ano
const crearDatosAnio=(registros,anio)=>
  MESES_CORTOS.slice(1).map((etiqueta,indice)=>{
    const mes=String(indice+1).padStart(2,"0");

    const valores=registros
      .filter(d=>d.fecha.startsWith(`${anio}-${mes}-`))
      .map(d=>aNumero(d.mediaDiaria))
      .filter(Number.isFinite);

    return{etiqueta,valor:promedio(valores)};
  });

// agrupa los datos y asigna un color a cada serie
const crearSerie=(id,nombre,datos,indice)=>({
  id,nombre,
  color:COLORES_SERIES[indice%COLORES_SERIES.length],
  datos,
});

// muestra el color que identifica cada serie de la comparacion
function PuntoSerie({indice}){
  return(
    <span
      className="punto-serie"
      style={{background:COLORES_SERIES[indice]}}
    />
  );
}

// crea el selector principal de mes o ano
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

      <SelectorVigno value={valor} onChange={e=>onChange(e.target.value)}>
        {opciones.map(opcion=>(
          <option
            key={opcion}
            value={opcion}
            disabled={comparando&&comparaciones.includes(opcion)}
          >
            {formatear(opcion)}
          </option>
        ))}
      </SelectorVigno>
    </label>
  );
}

// crea un selector para una comparacion adicional
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
        <SelectorVigno value={valor} onChange={e=>onChange(e.target.value)}>
          {opciones.map(opcion=>(
            <option
              key={opcion}
              value={opcion}
              disabled={activos.includes(opcion)&&opcion!==valor}
            >
              {formatear(opcion)}
            </option>
          ))}
        </SelectorVigno>

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

// crea el boton para agregar comparaciones
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

// componente que dibuja las lineas, puntos y ejes del grafico
function GraficoLinea({
  series,categorias,ticksX,minimoY,maximoY,tema,
  formatoCategoria,tipoGrafico,tamanoTexto,contraste,
}){
  // guarda los datos que aparecen al pasar el mouse por el grafico
  const[tooltip,setTooltip]=useState(null);

  // oculta el tooltip cuando cambian las series
  useEffect(()=>setTooltip(null),[series]);

  // ajusta el tamano de los elementos segun la preferencia de texto
  const factorTexto=tamanoTexto/120;
  const mostrarLineas=tipoGrafico!=="puntos";
  const mostrarPuntos=tipoGrafico!=="lineas";

  return(
    <div className="grafico-visx">
      {/* ajusta el grafico al tamano disponible */}
      <ParentSize debounceTime={70}>
        {({width,height})=>{
          if(width<50||height<50)return null;

          // reserva espacio para los ejes y etiquetas del grafico
          const margen={
            top:Math.round(24*factorTexto),
            right:Math.round(22*factorTexto),
            bottom:Math.round(52*factorTexto),
            left:Math.round(60*factorTexto),
          };

          // calcula el ancho y alto disponibles para dibujar
          const ancho=Math.max(10,width-margen.left-margen.right);
          const alto=Math.max(10,height-margen.top-margen.bottom);

          // convierte las categorias en posiciones horizontales
          const escalaX=scalePoint({
            domain:categorias,
            range:[0,ancho],
            padding:.35,
          });

          // convierte las temperaturas en posiciones verticales
          const escalaY=scaleLinear({
            domain:[minimoY,maximoY],
            range:[alto,0],
            nice:true,
          });

          // encuentra el dia o mes mas cercano a la posicion del mouse
          const buscarCategoria=x=>
            categorias.reduce((cercana,etiqueta)=>{
              const posicion=escalaX(etiqueta);
              if(posicion===undefined)return cercana;

              const distancia=Math.abs(posicion-x);

              return!cercana||distancia<cercana.distancia
                ?{etiqueta,distancia}
                :cercana;
            },null)?.etiqueta;

          // busca los valores que se mostraran en el tooltip
          const mostrarTooltip=e=>{
            const rect=e.currentTarget.getBoundingClientRect();
            const etiqueta=buscarCategoria(e.clientX-rect.left);
            if(!etiqueta)return;

            // recorre las series y obtiene sus valores para esa categoria
            const items=series
              .map(serie=>{
                const dato=serie.datos.find(d=>d.etiqueta===etiqueta);
                return dato&&Number.isFinite(dato.valor)?{serie,dato}:null;
              })
              .filter(Boolean);

            if(!items.length)return setTooltip(null);

            // calcula donde debe aparecer el tooltip dentro del grafico
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

          // si hay poco espacio se muestran menos etiquetas sin quitar los datos
          // reduce las etiquetas del eje horizontal cuando falta espacio
          const cantidadEtiquetas=Math.min(
            ticksX.length,
            Math.max(2,Math.floor(ancho/(52*factorTexto)))
          );
          // elige las etiquetas visibles manteniendo las mediciones del grafico
          const ticksVisibles=Array.from({length:cantidadEtiquetas},(_,i)=>
            ticksX[Math.round(i*(ticksX.length-1)/(cantidadEtiquetas-1))]
          );

          return(
            <>
              <svg width={width} height={height} role="img" aria-label="Histórico de temperatura">
                <g transform={`translate(${margen.left},${margen.top})`}>
                  {/* dibuja las lineas de fondo del grafico */}
                  <GridRows
                    scale={escalaY}
                    width={ancho}
                    numTicks={5}
                    stroke={tema.grilla}
                    strokeWidth={contraste==="alto"?1.3:1}
                  />

                  {/* dibuja una linea por cada serie cuando esta permitido */}
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

                  {/* dibuja los puntos con temperaturas validas */}
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

                  {/* muestra el eje vertical con los valores de temperatura */}
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

                  {/* muestra el eje horizontal con las fechas seleccionadas */}
                  <AxisBottom
                    top={alto}
                    scale={escalaX}
                    tickValues={ticksVisibles}
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

                  {/* detecta el movimiento del mouse para mostrar el tooltip */}
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

              {/* muestra el tooltip cuando hay una categoria seleccionada */}
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

                  {/* calcula la diferencia cuando hay dos series en el tooltip */}
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

// componente principal que controla el historico de temperaturas
function TemperatureChart({
  estaciones=[],
  datosTemperatura=[],
  temaOscuro=true,
}){
  // obtiene las preferencias visuales desde el contexto
  const{tipoGrafico,tamanoTexto,contraste}=useConfiguracion();

  // guarda si el usuario prefiere ver meses o anos
  const[vista,setVista]=usePreferencia("grafico-vista","mes");
  // recuerda el modo de comparacion seleccionado
  const[modoComparacion,setModoComparacion]=usePreferencia("historicos-modo-comparacion","ninguno");

  // guarda la estacion y el periodo que el usuario selecciona
  const[estacionSeleccionada,setEstacionSeleccionada]=useState("");
  const[periodoMesSeleccionado,setPeriodoMesSeleccionado]=useState("");
  const[anioSeleccionado,setAnioSeleccionado]=useState("");

  // recuerda los meses, anos y estaciones elegidos para comparar
  const[mesesComparacion,setMesesComparacion]=usePreferencia("historicos-meses-comparacion",[]);
  const[aniosComparacion,setAniosComparacion]=usePreferencia("historicos-anios-comparacion",[]);
  const[estacionesComparacion,setEstacionesComparacion]=usePreferencia("historicos-estaciones-comparacion",[]);

  useEffect(()=>{
    if(vista!=="mes"&&vista!=="anio")setVista("mes");
  },[vista,setVista]);

  // comprueba si se estan comparando periodos o estaciones
  const comparaPeriodos=modoComparacion==="periodos";
  const comparaEstaciones=modoComparacion==="estaciones";

  // selecciona los colores segun el tema actual
  const temaBase=TEMAS_GRAFICO[temaOscuro?"oscuro":"claro"];

  // aumenta el contraste de colores cuando el usuario lo pide
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
    // si la estacion elegida no existe selecciona la primera disponible
    const existe=estaciones.some(e=>e.id===estacionSeleccionada);
    if(!existe&&estaciones.length)setEstacionSeleccionada(estaciones[0].id);
  },[estaciones,estacionSeleccionada]);

  // busca el nombre de una estacion usando su identificador
  const nombreEstacion=id=>{
    const estacion=estaciones.find(e=>e.id===id);
    return estacion?.nombre??estacion?.huerto??estacion?.id??"Estación";
  };

  // filtra los datos por estacion y los ordena por fecha
  const registrosEstacion=id=>
    datosTemperatura
      .filter(d=>d.estacionId===id)
      .sort((a,b)=>a.fecha.localeCompare(b.fecha));

  // guarda los registros de la estacion actual y evita recalcular sin necesidad
  const diariosEstacion=useMemo(
    ()=>registrosEstacion(estacionSeleccionada),
    [datosTemperatura,estacionSeleccionada]
  );

  // obtiene los meses disponibles sin repetirlos
  const periodosMensuales=useMemo(
    ()=>[...new Set(diariosEstacion.map(d=>d.fecha.substring(0,7)))].sort(),
    [diariosEstacion]
  );

  // obtiene los anos disponibles sin repetirlos
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

  // deja solo los meses disponibles para comparar
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

  // junta el mes principal y los adicionales
  const mesesActivos=[periodoMesSeleccionado,...mesesComparacionValidos].filter(Boolean);

  // agrega otro mes para comparar
  const agregarMes=()=>
    agregarLista(periodosMensuales,mesesActivos,setMesesComparacion,true);

  // permite reemplazar un mes de comparacion
  const cambiarMesComparacion=(indice,periodo)=>
    cambiarLista(
      mesesComparacionValidos,mesesActivos,
      setMesesComparacion,indice,periodo
    );

  // permite quitar un mes de comparacion
  const eliminarMesComparacion=indice=>
    eliminarLista(setMesesComparacion,indice);

  // deja solo los anos disponibles para comparar
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

  // junta el ano principal y los adicionales
  const aniosActivos=[anioSeleccionado,...aniosComparacionValidos].filter(Boolean);

  // agrega otro ano para comparar
  const agregarAnio=()=>
    agregarLista(aniosDisponibles,aniosActivos,setAniosComparacion,true);

  // permite reemplazar un ano de comparacion
  const cambiarAnioComparacion=(indice,anio)=>
    cambiarLista(
      aniosComparacionValidos,aniosActivos,
      setAniosComparacion,indice,anio
    );

  // permite quitar un ano de comparacion
  const eliminarAnioComparacion=indice=>
    eliminarLista(setAniosComparacion,indice);

  // comprueba si una estacion tiene datos en el periodo elegido
  const estacionTienePeriodo=id=>{
    if(!id)return false;

    const periodo=vista==="mes"
      ?`${periodoMesSeleccionado}-`
      :`${anioSeleccionado}-`;

    return datosTemperatura.some(
      d=>d.estacionId===id&&d.fecha.startsWith(periodo)
    );
  };

  // busca estaciones que se pueden comparar con la principal
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

  // evita estaciones repetidas o que ya no estan disponibles
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

  // junta la estacion principal con las que se estan comparando
  const estacionesActivas=[
    estacionSeleccionada,
    ...estacionesComparacionValidas,
  ].filter(Boolean);

  // agrega otra estacion para comparar
  const agregarEstacion=()=>
    agregarLista(
      estacionesComparables,
      estacionesActivas,
      setEstacionesComparacion
    );

  // cambia una de las estaciones comparadas
  const cambiarEstacionComparacion=(indice,id)=>
    cambiarLista(
      estacionesComparacionValidas,
      estacionesActivas,
      setEstacionesComparacion,
      indice,
      id
    );

  // quita una estacion de la comparacion
  const eliminarEstacionComparacion=indice=>
    eliminarLista(setEstacionesComparacion,indice);

  // comprueba si hay suficientes periodos para comparar
  const puedeCompararPeriodos=
    vista==="mes"
      ?periodosMensuales.length>1
      :aniosDisponibles.length>1;

  // comprueba si existe otra estacion que se pueda comparar
  const puedeCompararEstaciones=estacionesComparables.length>0;

  // limita el numero de comparaciones simultaneas
  const puedeAgregarMes=
    mesesActivos.length<Math.min(MAX_SERIES,periodosMensuales.length);

  const puedeAgregarAnio=
    aniosActivos.length<Math.min(MAX_SERIES,aniosDisponibles.length);

  const puedeAgregarEstacion=
    estacionesActivas.length<Math.min(MAX_SERIES,estaciones.length)&&
    estacionesComparables.some(id=>!estacionesActivas.includes(id));

  // activa o desactiva la comparacion entre periodos
  const alternarPeriodos=()=>
    setModoComparacion(actual=>actual==="periodos"?"ninguno":"periodos");

  // activa o desactiva la comparacion entre estaciones
  const alternarEstaciones=()=>
    setModoComparacion(actual=>actual==="estaciones"?"ninguno":"estaciones");

  // prepara las series y etiquetas que necesita el grafico
  const configuracion=useMemo(()=>{
    if(vista==="mes"){
      const periodos=comparaPeriodos
        ?[periodoMesSeleccionado,...mesesComparacionValidos]
        :[periodoMesSeleccionado];

      // usa la cantidad de dias del mes mas largo seleccionado
      const cantidadDias=Math.max(
        ...periodos.filter(Boolean).map(diasDelPeriodo),
        1
      );

      // crea las etiquetas de los dias para el eje horizontal
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

      // elige las fechas principales que pueden aparecer en el eje
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

  // calcula el resumen de temperaturas del periodo principal
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

    // separa los datos de minima, media y maxima
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

  // reune todas las temperaturas validas para ajustar el grafico
  const valores=useMemo(
    ()=>configuracion.series.flatMap(
      serie=>serie.datos.map(d=>d.valor).filter(Number.isFinite)
    ),
    [configuracion]
  );

  // calcula el limite inferior del eje vertical
  const minimoY=valores.length
    ?Math.floor((Math.min(...valores)-3)/5)*5
    :0;

  // calcula el limite superior del eje vertical
  const maximoY=valores.length
    ?Math.max(
      minimoY+10,
      Math.ceil((Math.max(...valores)+3)/5)*5
    )
    :40;

  // comprueba si el grafico tiene datos para mostrar
  const hayDatos=valores.length>0;
  const comparando=modoComparacion!=="ninguno";

  // selecciona los controles correctos segun la vista de mes o ano
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

            {/* permite seleccionar la estacion principal */}
            <SelectorVigno
              value={estacionSeleccionada}
              onChange={e=>setEstacionSeleccionada(e.target.value)}
            >
              {estaciones.map(estacion=>(
                <option key={estacion.id} value={estacion.id}>
                  {estacion.nombre??estacion.huerto??estacion.id}
                </option>
              ))}
            </SelectorVigno>
          </div>
        </div>
      </header>

      <div className="barra-grafico">
        <div className="controles-historicos">
          <nav className="selector-vista">
            {/* crea los botones para cambiar entre mes y ano */}
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
            {/* permite elegir el periodo principal */}
            <SelectorPrincipal
              tipo={tipoPeriodo}
              valor={periodoPrincipal}
              onChange={setPeriodoPrincipal}
              opciones={opcionesPeriodo}
              comparando={comparaPeriodos}
              comparaciones={comparacionesPeriodo}
              formatear={formatearPeriodo}
            />

            {/* muestra los selectores de periodos adicionales */}
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

            {/* permite agregar otro periodo si esta activo ese modo */}
            {comparaPeriodos&&(
              <BotonAgregar
                onClick={agregarPeriodo}
                disabled={!puedeAgregarPeriodo}
                texto={`Añadir ${tipoPeriodo.toLowerCase()}`}
              />
            )}
          </div>

          {/* muestra las estaciones elegidas para comparar */}
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

        {/* muestra minima, media y maxima cuando no hay comparaciones */}
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

      {/* muestra la leyenda que identifica cada serie comparada */}
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
        {/* muestra el grafico o un mensaje si no existen datos */}
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
