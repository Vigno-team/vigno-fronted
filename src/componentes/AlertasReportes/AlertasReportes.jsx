//operadores : = sino

import SelectorVigno from "../SelectorVigno/SelectorVigno";
import{useEffect,useMemo,useState}from"react";
import{CalendarDays,CalendarRange,CheckCircle2,Database,FileText,MapPin,Snowflake,Thermometer,X}from"lucide-react";
import { useConfiguracion } from "../../contexto/ConfiguracionContext";
import"./AlertasReportes.css";

const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];//los meses que salen en el selector
const DIAS_SEMANA=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];//se define el dia de la semana para que aparesca en el calendario
// Se mantienen los estados originales del calendario: crítica, precaución y reporte.
const TIPOS={
  critica:{texto:"Crítica",Icono:Snowflake},
  advertencia:{texto:"Precaución",Icono:Thermometer},
  reporte:{texto:"Reporte",Icono:FileText},
  sinDatos:{texto:"Sin datos",Icono:Database},
};
const PRIORIDAD={critica:4,advertencia:3,reporte:2,sinDatos:1};
const LEYENDA=[
  {tipo:"critica",titulo:"Alerta crítica",descripcion:"Helada bajo el umbral crítico"},
  {tipo:"advertencia",titulo:"Precaución",descripcion:"Riesgos que superan un umbral configurado"},
  {tipo:"reporte",titulo:"Reporte disponible"},
  {tipo:"sinDatos",titulo:"Sin registros"},
];

const aNumero=v=>v===null||v===undefined||v===""?null:Number.isFinite(Number(v))?Number(v):null;// esta funcion verifica si un numero es valido primero comprueba si es un valor vacio si es vacio retorna null si no esta vacio, verifica si es un numero finito valido sino es valido retorna null

const formatearNumero=(v,d=1)=>{const n=aNumero(v);return n===null?"—":n.toFixed(d).replace(".",",")};//primero recive las dos variables valor y si tiene decimales la cantidad de decimales a utilizar, despues valida el valor con la funcion anterior si no es estrictamente nulo se cumple la segunda condicion que el numero es valido y lo formatea para darle la estructura de solo un decimal

const formatearTemperatura=v=>{const n=aNumero(v);return n===null?"—":`${formatearNumero(n)} °C`};//primero utilizando la funcion anumero verifica si es un valor valido , `${...}` permiten insertar una variable o un cálculo dentro de un texto.

const formatearPrecipitacion=v=>{const n=aNumero(v);return n===null?"—":`${formatearNumero(n)} mm`};//utiliza la funcion anumero y verifica si es un valor valido si es valido lo formatea añadiendo mm

const nombreEstacion=e=>e?.nombre??e?.huerto??e?.id??"Estación";//esta funcion intenta consegir el nombre de la estacion  e representa la variable , el (.?) Permite intentar acceder a una propiedad sin generar un error cuando el objeto es null o undefined y el (??) utiliza el valor de la izquierda, pero si es null o undefined, prueba el siguiente.

const construirFecha=(a,m,d)=>`${a}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;// contruimos la fecha, recibe año, mes y dia peroro ponemos el año- luego el mes le sumamos uno por que en el js esta indexado y empieza en 0. padstart garantiza que tenga dos valores minimo y le pone un 0 a la izquierda cuando sea necesario y luego en dia es lo mismo

const formatearFechaCompleta=f=>{if(!f)return"";const[a,m,d]=f.split("-");return`${Number(d)} de ${MESES[Number(m)-1].toLowerCase()} de ${a}`};//primero declaramos que la funcion reciba la fecha, si no recive una fecha valida retorna un valor vacio f.split no sirve para separar el texto dentro del arreglo y destructurado se guarda en las variables luego combierte D en un numero, luego busca el mes en el arreglo meses y resta uno ya que el index empieza en 0 y finalmente .toLowerCase() vuelve el mes en minuscula

const tieneDatosMeteorologicos=r=>!!r&&[r.maxima,r.minima,r.mediaDiaria,r.amplitudTermica,r.precipitacionMm].some(v=>aNumero(v)!==null);//r representa el registro diario , !!r convierte el valor en verdadero o falso , luego se hace el arreglo para comprobar , .some() recorre un arreglo y devuelve true si al menos un elemento cumple la condicion

const obtenerAmplitud=r=>{const a=aNumero(r?.amplitudTermica);if(a!==null)return a;const max=aNumero(r?.maxima),min=aNumero(r?.minima);return max!==null&&min!==null?max-min:null};{}//Recibe el registro meteorológico de un día. luego busca si el registro tiene amlitut termica calculada , si esque existe la devuelve directamente asi no tiene calculos inecesario obtiene la maxima y la minima Comprueba que ambas temperaturas existan.Si las dos son válidas, resta la mínima a la máxima.De lo contrario, devuelve null.

const estaDentroDelRango=(f,i,fin)=>!!(f&&i&&fin&&f>=i&&f<=fin);//f= fecha a comprobar, i=fecha de inicio , fin=fecha final, Todo está unido mediante &&, por lo tanto deben cumplirse todas las condiciones.

const detalle=(etiqueta,valor)=>({etiqueta,valor});//Esta función recibe dos datos y construye un objeto.


// Cada riesgo se agrega por separado. Así un mismo día puede tener varias alertas.
const construirReportes=({registro,estacion,fecha,existeRegistro,dentroCobertura,umbrales})=>{
  if(!fecha||!dentroCobertura)return[];

  const base=[
    detalle("Estación",nombreEstacion(estacion)),
    detalle("Fecha",formatearFechaCompleta(fecha)),
  ];
  if(!existeRegistro||!tieneDatosMeteorologicos(registro))return[{
    id:`${fecha}-sin-datos`,tipo:"sinDatos",titulo:"Sin datos disponibles",
    resumen:"No existen mediciones meteorológicas válidas para este día.",
    detalles:[...base,detalle("Estado","Sin registro o datos nulos")],
  }];

  const reportes=[];
  const minima=aNumero(registro.minima);
  const maxima=aNumero(registro.maxima);
  const media=aNumero(registro.mediaDiaria);
  const lluvia=aNumero(registro.precipitacionMm);
  const amplitud=obtenerAmplitud(registro);
  const limite=(clave)=>aNumero(umbrales?.[clave]);

  // Helada crítica y precaución son dos niveles de un mismo riesgo.
  if(minima!==null&&limite("helada")!==null&&minima<=limite("helada")){
    reportes.push({
      id:`${fecha}-helada`,tipo:"critica",titulo:"Helada crítica",
      resumen:`La mínima alcanzó ${formatearTemperatura(minima)}.`,
      detalles:[...base,detalle("Temperatura mínima",formatearTemperatura(minima)),
        detalle("Condición",`Mínima ≤ ${formatearTemperatura(limite("helada"))}`)],
    });
  }else if(minima!==null&&limite("riesgoHelada")!==null&&minima<=limite("riesgoHelada")){
    reportes.push({
      id:`${fecha}-riesgo-helada`,tipo:"advertencia",titulo:"Precaución por helada",
      resumen:`La mínima alcanzó ${formatearTemperatura(minima)}.`,
      detalles:[...base,detalle("Temperatura mínima",formatearTemperatura(minima)),
        detalle("Condición",`Mínima ≤ ${formatearTemperatura(limite("riesgoHelada"))}`)],
    });
  }

  // Estos riesgos son independientes: pueden coincidir con una helada.
  if(maxima!==null&&limite("maxima")!==null&&maxima>=limite("maxima")){
    reportes.push({
      id:`${fecha}-calor`,tipo:"advertencia",titulo:"Temperatura máxima elevada",
      resumen:`La máxima llegó a ${formatearTemperatura(maxima)}.`,
      detalles:[...base,detalle("Temperatura máxima",formatearTemperatura(maxima)),
        detalle("Condición",`Máxima ≥ ${formatearTemperatura(limite("maxima"))}`)],
    });
  }

  if(lluvia!==null&&lluvia>0&&limite("lluviaDiaria")!==null&&lluvia>=limite("lluviaDiaria")){
    reportes.push({
      id:`${fecha}-lluvia`,tipo:"advertencia",titulo:"Lluvia intensa",
      resumen:`Se registraron ${formatearPrecipitacion(lluvia)} durante el día.`,
      detalles:[...base,detalle("Precipitación",formatearPrecipitacion(lluvia)),
        detalle("Condición",`Lluvia ≥ ${formatearPrecipitacion(limite("lluviaDiaria"))}`)],
    });
  }

  // Solo aparecen si el administrador configuró estos umbrales.
  const adicionales=[
    {clave:"media",valor:media,campo:"Temperatura media",titulo:"Temperatura media elevada",formato:formatearTemperatura,comparar:(a,b)=>a>=b,signo:"≥"},
    {clave:"minima",valor:minima,campo:"Temperatura mínima",titulo:"Mínima bajo el umbral",formato:formatearTemperatura,comparar:(a,b)=>a<=b,signo:"≤"},
    {clave:"amplitud",valor:amplitud,campo:"Amplitud térmica",titulo:"Amplitud térmica elevada",formato:formatearTemperatura,comparar:(a,b)=>a>=b,signo:"≥"},
  ];
  adicionales.forEach(({clave,valor,campo,titulo,formato,comparar,signo})=>{
    if(valor===null||limite(clave)===null||!comparar(valor,limite(clave)))return;
    reportes.push({
      id:`${fecha}-${clave}`,tipo:"advertencia",titulo,
      resumen:`${campo}: ${formato(valor)}.`,
      detalles:[...base,detalle(campo,formato(valor)),
        detalle("Condición",`${campo} ${signo} ${formato(limite(clave))}`)],
    });
  });

  // El reporte diario siempre queda al final, además de todas las alertas.
  reportes.push({
    id:`${fecha}-reporte`,tipo:"reporte",titulo:"Reporte meteorológico diario",
    resumen:"Resumen de las condiciones meteorológicas observadas durante el día.",
    detalles:[
      ...base,
      detalle("Temperatura máxima",formatearTemperatura(maxima)),
      detalle("Temperatura media",formatearTemperatura(media)),
      detalle("Temperatura mínima",formatearTemperatura(minima)),
      detalle("Amplitud térmica",formatearTemperatura(amplitud)),
      detalle("Precipitación diaria",formatearPrecipitacion(lluvia)),
    ],
  });
  return reportes;
};

function AlertasReportes({estaciones=[],datosTemperatura=[],temaOscuro=true}){//aqui recibimos los componentes entregados del componente padre
  const { obtenerUmbralesEstacion } = useConfiguracion();
  const[estacionSeleccionada,setEstacionSeleccionada]=useState("");// creamos una variable de estado que guarda el indicadior de estacion seleccionada primera guarda el valor seleccionado y segunda permite actualizarlo
  const umbrales=useMemo(
    ()=>obtenerUmbralesEstacion(estacionSeleccionada),
    [obtenerUmbralesEstacion,estacionSeleccionada]
  ); // Los mismos límites que en Configuración.
  const[anioActual,setAnioActual]=useState("");//lo mismo permite tener la variable de estado en año para guardar la seleccion y permite actualizarla.
  const[mesActual,setMesActual]=useState(0);// guarda el mes seleccionado como esta indexado empieza en 0
  const[fechaSeleccionada,setFechaSeleccionada]=useState(null);//guarda la fecha seleccionada

  useEffect(()=>{//useeffect nos permite ejecutar un efecto después de que React haya actualizado la interfaz.
    if(estaciones.length&&!estaciones.some(e=>e.id===estacionSeleccionada))setEstacionSeleccionada(estaciones[0].id);//primero con length vemos la cantidad de elementes del arreglo, .some comprueba si alguna estacion cumple la condicion, si ahi estaciones disponibles pero no coinciden con la seleecion actual selecciona la primera
  },[estaciones,estacionSeleccionada]);//esto nos permite que react vuelva a evaluar el efecto cuando cambie la referencia o el valor

  const estacion=useMemo(()=>estaciones.find(e=>e.id===estacionSeleccionada)??null,[estaciones,estacionSeleccionada]);//use memo permite memorizar el resultado del calculo para reutilizarlo, .find()= busca el primer elemento de un arreglo que cumpla la condicion,si no encuentra una estacion retorna nulo
  const datosEstacion=useMemo(()=>datosTemperatura.filter(d=>d.estacionId===estacionSeleccionada).sort((a,b)=>a.fecha.localeCompare(b.fecha)),[datosTemperatura,estacionSeleccionada]);//.filter() recorre el arreglo y crea otro que contiene solo lo que cumple la condicion d=registro meteorologico .sort() ordena los elementeos a y b son los elementos que comapra mientras ordena, localeComapre() = compara cadenas de texto
  const registrosPorFecha=useMemo(()=>new Map(datosEstacion.map(r=>[r.fecha,r])),[datosEstacion]);//.map recorre un arreglo  el newmap permite guardar datos mediante pares clave(fecha)- valor(registro meteorologico)
  const rangoCobertura=useMemo(()=>{
    const fechas=datosEstacion.map(d=>d.fecha).filter(Boolean).sort();//obtiene la fecha de cada registro, elimina valores falsos o que no existan y ordena las fechas alfabeticamente
    return{inicio:estacion?.fechaInicio??fechas[0]??null,fin:estacion?.fechaFin??fechas[fechas.length-1]??null};//primero intenta utilizar la fehc ade inicio si no exite utiliza la priumera fehca del arreglo y si tampoco esta usa null, sigueinte Hace lo mismo, pero utiliza la última fecha, fechas.length - 1 representa la posiciom del ultimo arreglo
  },[datosEstacion,estacion]);
  const periodosDisponibles=useMemo(()=>[...new Set(datosEstacion.map(d=>d.fecha.substring(0,7)))].sort(),[datosEstacion]);//.subtring(0,7) extrae los c aracteres desde la posicion 0 hasta antes de la posicion 7 asi elimina el dia y conserva solo el mes y el año el new set almacena valores unicos y combierte todo en arreglo nuevamente
  const aniosDisponibles=useMemo(()=>[...new Set(periodosDisponibles.map(p=>p.substring(0,4)))].sort((a,b)=>Number(b)-Number(a)),[periodosDisponibles]);//la resta lo que hace es ordenar en orden desendente
  const periodoActual=anioActual?`${anioActual}-${String(mesActual+1).padStart(2,"0")}`:"";//.padSTrart agrega un 0 cuando hace falta

  const limpiarSeleccion=()=>setFechaSeleccionada(null);//no recibe argumentos , elimina la fehca seleccionada y el reporte abierto
  const aplicarPeriodo=periodo=>{
    if(!periodo)return;// si no existe un periodo no retorna nada
    const[anio,mes]=periodo.split("-");//separa el año con el mes en variables distintas
    setAnioActual(anio);setMesActual(Number(mes)-1);limpiarSeleccion();//limpia la seleccionado anteriormente
  };

  useEffect(()=>{
    if(!periodosDisponibles.length){setAnioActual("");setMesActual(0);return}//si length es 0 la condicion se cumple , los set limpia el año y establece enero como el mes inicial
    if(!periodosDisponibles.includes(periodoActual))aplicarPeriodo(periodosDisponibles[periodosDisponibles.length-1]);//Aquí pregunta si el período actualmente seleccionado existe dentro de los disponibles.
  },[periodosDisponibles,periodoActual]);

  const mesesDisponibles=useMemo(()=>!anioActual?[]:periodosDisponibles.filter(p=>p.startsWith(`${anioActual}-`)).map(p=>Number(p.substring(5,7))-1),[periodosDisponibles,anioActual]);//si no tenemos una año acutal devuelve una lista vacia, luego al periodo disponible lo filtra , startswith solo sirve para ver si un texto comienza con cadena determinada, substring solo estrae el mes  y le resta 1 para utilizar el mes de java
  const cambiarEstacion=id=>{setEstacionSeleccionada(id);limpiarSeleccion()};//cuando el usuario cambia de estacion la seleccionada tiene id  y para actualizarlo lo limpia y se recalcula
  const seleccionarAnio=anio=>{const ps=periodosDisponibles.filter(p=>p.startsWith(`${anio}-`));if(ps.length)aplicarPeriodo(ps[ps.length-1])};//primero filtra solo los periodos que tengan ese año, luego comprueba si ese año tiene periodos y luego selecciona el ultimo mes del año disponible
  const seleccionarMes=mes=>{const p=`${anioActual}-${String(mes+1).padStart(2,"0")}`;if(periodosDisponibles.includes(p))aplicarPeriodo(p)};//construye el periodo utilizando el año y el mes recivido , comprueba si el periodo existe , si existe actualiza el calendario y limpia la secciones

  const diasCalendario=useMemo(()=>{
    if(!anioActual)return[];
    const anio=Number(anioActual),primerDia=new Date(anio,mesActual,1).getDay(),desplazamiento=primerDia===0?6:primerDia-1;//new date sirve para crear una fecha en javascrip 1 representa el primer dia del mes seleccionado .getday devuelve el dia de la semana usando numeracion 0 domingo etc, luego calcula el desplazamiento  define donde empieza el mes
    const diasMes=new Date(anio,mesActual+1,0).getDate(),diasMesAnterior=new Date(anio,mesActual,0).getDate(),celdas=[];//Cuando se utiliza el día 0 en new Date(), JavaScript lo interpreta como el último día del mes anterior al indicado. .getDate() Devuelve el número de día del mes. calcula los dias del mes anterior para saber donde termina y crea el arreglo de las celdas
    for(let i=desplazamiento-1;i>=0;i--)celdas.push({dia:diasMesAnterior-i,actual:false,tipo:"anterior"});//primero definimos el valor de i, el ciclo se mantiene mientra i sea mayo a 0, y se le resta 1 en cada ciclo, agraga una celda por cada dia del mes anterior (dias que aparecen si el mes no empieza en noviembre)
    for(let dia=1;dia<=diasMes;dia++)celdas.push({dia,actual:true,tipo:"actual"});//va sumando 1 dia mientra dias del mes sea menor a dia celdas.push va creando las celdas "agrega dias al mes seleccionado"
    for(let dia=1;celdas.length<42;dia++)celdas.push({dia,actual:false,tipo:"siguiente"});//mes siguiente inicia en el dia 1 el ciclo se repite hasta que ayan al menos 42 celdas agrega las celdas
    return celdas;
  },[anioActual,mesActual]);

  const seleccionarDia=dia=>{//recibe el dia
    const fecha=construirFecha(anioActual,mesActual,dia);//ejecuta la funcion construir fecha para juntal el año el mes y el dia
    const dentroCobertura=estaDentroDelRango(fecha,rangoCobertura.inicio,rangoCobertura.fin);//ejecuta la funcion para ver si esta dentro del rango del periodo
    if(!dentroCobertura)return;//si no esta dentro de la cobertura la funcion termina
    setFechaSeleccionada(fecha);//actualiza el estado con el dia que selecciono el usuario y utiliza el primer reporte del arreglo intenta obtener su identificador si no lo obtiene da un valor null
  };

  const registroSeleccionado=fechaSeleccionada?registrosPorFecha.get(fechaSeleccionada):null;//primero pregunta si existe una fecha seleccionada si existe ejecuta get y obtiene el registro meteorologico si no ahi nada devuelve null
  const existeRegistroSeleccionado=fechaSeleccionada?registrosPorFecha.has(fechaSeleccionada):false;//si ahi una fecha seleccionada pasa a registrosPorFecha.has(fechaSeleccionada) y devuelve tru o false si no ahi fecha devuelve false
  const fechaSeleccionadaDentroRango=fechaSeleccionada?estaDentroDelRango(fechaSeleccionada,rangoCobertura.inicio,rangoCobertura.fin):false;//verifica si la fecha seleccionada esta dentro del rango ejectua la funcion para comprobar que siga dentro del rango sino existe fecha devuelve false
  const reportesSeleccionados=useMemo(()=>!fechaSeleccionada?[]:construirReportes({registro:registroSeleccionado,estacion,fecha:fechaSeleccionada,existeRegistro:existeRegistroSeleccionado,dentroCobertura:fechaSeleccionadaDentroRango,umbrales}),[registroSeleccionado,estacion,fechaSeleccionada,existeRegistroSeleccionado,fechaSeleccionadaDentroRango,umbrales]);//verifica si la fecha seleccionada existe si no existe da un arreglo vacio sino registra el arreglo


  return(
    <section className={`ar-dashboard ${temaOscuro?"ar-oscuro":"ar-claro"}`}>
      <div className={`ar-contenido ${fechaSeleccionada?"con-detalle":"sin-detalle"}`}>
        <div className="ar-calendario">
          <div className="ar-calendario-toolbar">

            {/*selector de estaciones*/ }
            <label className="ar-estacion ar-estacion-calendario">
              <span>Estación</span>
              <div className="ar-estacion-select">
                <MapPin size={14}/>
                <SelectorVigno value={estacionSeleccionada} onChange={e=>cambiarEstacion(e.target.value)}>
                  {estaciones.map(e=><option key={e.id} value={e.id}>{nombreEstacion(e)}</option>)}
                </SelectorVigno>
              </div>
            </label>
             {/*selector de mes*/ }
            <div className="ar-navegacion-periodo">
              <div className="ar-periodo-principal">
                <label className="ar-selector-mes">
                  <CalendarDays size={14}/>
                  <SelectorVigno
                    aria-label="Seleccionar mes"
                    value={mesActual}
                    disabled={!mesesDisponibles.length}
                    onChange={e=>seleccionarMes(Number(e.target.value))}
                  >
                    {!mesesDisponibles.length&&<option value={mesActual}>Sin meses</option>}
                    {MESES.map((nombre,i)=>mesesDisponibles.includes(i)
                      ?<option key={nombre} value={i}>{nombre}</option>
                      :null
                    )}
                  </SelectorVigno>
                </label>
                     {/*selector de años*/ }
                <label className="ar-selector-anio">
                  <CalendarRange size={14}/>
                  <SelectorVigno aria-label="Seleccionar año" value={anioActual} disabled={!aniosDisponibles.length} onChange={e=>seleccionarAnio(e.target.value)}>
                    {!aniosDisponibles.length&&<option value="">Sin datos</option>}
                    {aniosDisponibles.map(anio=><option key={anio} value={anio}>{anio}</option>)}
                  </SelectorVigno>
                </label>
              </div>
            </div>
            <div className="ar-toolbar-equilibrio" aria-hidden="true"/>
          </div>
           {/*leyenda*/ }
          <div className="ar-resumen-estados">
            <div className="ar-resumen-estados-head"><strong>Interpretación del calendario</strong><span>Colores y marcas utilizados en cada día</span></div>
            <div className="ar-resumen-estados-grid">
              {LEYENDA.map(item=><div key={item.tipo} className="ar-estado-item"><i className={`ar-estado-swatch ${item.tipo}`}/><div><strong>{item.titulo}</strong><small>{item.descripcion}</small></div></div>)}
            </div>
          </div>
                     {/*dias de la semana anotados arriba*/ }
          <div className="ar-semana">{DIAS_SEMANA.map(dia=><span key={dia}>{dia}</span>)}</div>

             {/*celdas de dias*/ }
          <div className="ar-dias">
            {diasCalendario.map((celda,i)=>{
              if(!celda.actual)return <div key={`${celda.tipo}-${celda.dia}-${i}`} className="ar-dia fuera-mes"><span>{celda.dia}</span></div>;
              const fecha=construirFecha(anioActual,mesActual,celda.dia),dentroCobertura=estaDentroDelRango(fecha,rangoCobertura.inicio,rangoCobertura.fin);
              const existeRegistro=registrosPorFecha.has(fecha),registro=registrosPorFecha.get(fecha);
              const reportesDia=construirReportes({registro,estacion,fecha,existeRegistro,dentroCobertura,umbrales});
              const tipos=reportesDia.map(r=>r.tipo);
              const tipoPrincipal=[...tipos].sort((a,b)=>PRIORIDAD[b]-PRIORIDAD[a])[0];
              const alertasDia=reportesDia.filter(r=>r.tipo!=="reporte"&&r.tipo!=="sinDatos");
              const seleccionada=fechaSeleccionada===fecha;
              return(
                <button key={fecha} type="button" disabled={!dentroCobertura}
                  className={`ar-dia ar-dia-activo ${tipoPrincipal?`evento-${tipoPrincipal}`:""} ${seleccionada?"seleccionado":""} ${!dentroCobertura?"fuera-cobertura":""}`}
                  onClick={()=>seleccionarDia(celda.dia)}
                  aria-label={`${formatearFechaCompleta(fecha)}: ${reportesDia.map(r=>r.titulo).join(", ")||"Sin registros"}`}
                  title={alertasDia.map(r=>r.titulo).join(" · ")||"Reporte diario"}>
                  <span className="ar-numero-dia">{celda.dia}</span>
                  {!!tipos.length&&<div className="ar-puntos-dia">
                    {alertasDia.slice(0,2).map((r)=><i key={r.id} className={`ar-punto ${r.tipo}`}/>)}
                    {alertasDia.length>2&&<span className="ar-mas-alertas">+{alertasDia.length-2}</span>}
                    {tipos.includes("reporte")&&<i className="ar-punto reporte"/>}
                    {tipos.includes("sinDatos")&&<i className="ar-punto sinDatos"/>}
                  </div>}
                </button>
              );
            })}
          </div>
        </div>
             {/*expansion de reportes del dia*/ }
        <aside className="ar-detalle">
          {fechaSeleccionada&&<>
            <div className="ar-detalle-header">
              <div>
                <span className="ar-detalle-etiqueta">Reportes del día</span>
                <h2>{formatearFechaCompleta(fechaSeleccionada)}</h2>
                <p>{nombreEstacion(estacion)}{" · "}{reportesSeleccionados.filter(r=>r.tipo!=="reporte"&&r.tipo!=="sinDatos").length} alertas · {reportesSeleccionados.length} registros</p>
              </div>
              <button type="button" className="ar-cerrar" onClick={limpiarSeleccion} aria-label="Cerrar detalle" title="Cerrar detalle"><X size={19}/></button>
            </div>

            {reportesSeleccionados.length>0?(
              <div className="ar-lista-reportes">
                {reportesSeleccionados.map((reporte,i)=>{
                  const config=TIPOS[reporte.tipo],Icono=config.Icono;
                  return(
                    <article key={reporte.id} className={`ar-reporte ${reporte.tipo} abierto`}>
                      <div className="ar-reporte-cabecera">
                        <div className="ar-reporte-identidad">
                          <span className="ar-reporte-icono"><Icono size={23}/></span>
                          <div><strong>{String(i+1).padStart(2,"0")}{" · "}{reporte.titulo}</strong><small>{reporte.resumen}</small></div>
                        </div>
                        <div className="ar-reporte-acciones"><span className={`ar-badge ${reporte.tipo}`}>{config.texto}</span></div>
                      </div>
                      <div className="ar-reporte-contenido visible">
                        <div className="ar-reporte-datos">{reporte.detalles.map(d=><div key={d.etiqueta}><span>{d.etiqueta}</span><strong>{d.valor}</strong></div>)}</div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ):(
              <div className="ar-sin-reportes"><CheckCircle2 size={40}/><strong>Sin información disponible</strong><span>No existen registros disponibles para la fecha seleccionada.</span></div>
            )}
          </>}
        </aside>
      </div>
    </section>
  );
}

export default AlertasReportes;
