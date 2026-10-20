import{useEffect,useMemo,useState}from"react";
import{CalendarDays,CalendarRange,CheckCircle2,ChevronDown,ChevronLeft,ChevronRight,Database,FileText,MapPin,Snowflake,Thermometer,X}from"lucide-react";
import"./AlertasReportes.css";

const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_CORTOS=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DIAS_SEMANA=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const TIPOS={critica:{texto:"Crítica",Icono:Snowflake},advertencia:{texto:"Precaución",Icono:Thermometer},reporte:{texto:"Reporte",Icono:FileText},sinDatos:{texto:"Sin datos",Icono:Database}};
const PRIORIDAD={critica:4,advertencia:3,reporte:2,sinDatos:1};
const LEYENDA=[
  {tipo:"critica",titulo:"Alerta crítica",descripcion:"Mínima ≤ 0 °C"},
  {tipo:"advertencia",titulo:"Precaución",descripcion:"0 °C < mínima ≤ 2 °C"},
  {tipo:"reporte",titulo:"Reporte disponible",descripcion:"Existe información observada"},
  {tipo:"sinDatos",titulo:"Sin datos",descripcion:"Registro no disponible"},
];

const aNumero=v=>v===null||v===undefined||v===""?null:Number.isFinite(Number(v))?Number(v):null;
const formatearNumero=(v,d=1)=>{const n=aNumero(v);return n===null?"—":n.toFixed(d).replace(".",",")};
const formatearTemperatura=v=>{const n=aNumero(v);return n===null?"—":`${formatearNumero(n)} °C`};
const formatearPrecipitacion=v=>{const n=aNumero(v);return n===null?"—":`${formatearNumero(n)} mm`};
const nombreEstacion=e=>e?.nombre??e?.huerto??e?.id??"Estación";
const construirFecha=(a,m,d)=>`${a}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const formatearFechaCompleta=f=>{if(!f)return"";const[a,m,d]=f.split("-");return`${Number(d)} de ${MESES[Number(m)-1].toLowerCase()} de ${a}`};
const tieneDatosMeteorologicos=r=>!!r&&[r.maxima,r.minima,r.mediaDiaria,r.amplitudTermica,r.precipitacionMm].some(v=>aNumero(v)!==null);
const obtenerAmplitud=r=>{const a=aNumero(r?.amplitudTermica);if(a!==null)return a;const max=aNumero(r?.maxima),min=aNumero(r?.minima);return max!==null&&min!==null?max-min:null};
const estaDentroDelRango=(f,i,fin)=>!!(f&&i&&fin&&f>=i&&f<=fin);
const detalle=(etiqueta,valor)=>({etiqueta,valor});

const obtenerTiposRegistro=({registro,existeRegistro,dentroCobertura})=>{
  if(!dentroCobertura)return[];
  if(!existeRegistro||!tieneDatosMeteorologicos(registro))return["sinDatos"];
  const tipos=[],minima=aNumero(registro.minima);
  if(minima!==null)tipos.push(minima<=0?"critica":minima<=2?"advertencia":null);
  tipos.push("reporte");
  return tipos.filter(Boolean);
};

const construirReportes=({registro,estacion,fecha,existeRegistro,dentroCobertura})=>{
  if(!fecha||!dentroCobertura)return[];
  const estacionTexto=nombreEstacion(estacion),fechaTexto=formatearFechaCompleta(fecha);
  const base=[detalle("Estación",estacionTexto),detalle("Fecha",fechaTexto)];
  if(!existeRegistro)return[{id:`${fecha}-sin-registro`,tipo:"sinDatos",titulo:"Sin registro disponible",resumen:"No se recibió ningún registro meteorológico para este día.",detalles:[...base,detalle("Estado","Sin registro"),detalle("Descripción","No existe un registro diario para esta fecha.")]}];
  if(!tieneDatosMeteorologicos(registro))return[{id:`${fecha}-datos-nulos`,tipo:"sinDatos",titulo:"Datos no recibidos",resumen:"Existe el registro del día, pero no contiene valores meteorológicos.",detalles:[...base,detalle("Estado","Datos no recibidos"),detalle("Descripción","Los valores meteorológicos del día están vacíos o nulos.")]}];

  const reportes=[],minima=aNumero(registro.minima);
  if(minima!==null&&minima<=0)reportes.push({id:`${fecha}-critica`,tipo:"critica",titulo:"Helada crítica",resumen:"La temperatura mínima diaria descendió bajo 0 °C.",detalles:[...base,detalle("Temperatura mínima",formatearTemperatura(minima)),detalle("Condición","Mínima ≤ 0 °C"),detalle("Severidad","Crítica")]});
  else if(minima!==null&&minima<=2)reportes.push({id:`${fecha}-advertencia`,tipo:"advertencia",titulo:"Riesgo térmico",resumen:"La temperatura mínima diaria alcanzó el rango de precaución térmica.",detalles:[...base,detalle("Temperatura mínima",formatearTemperatura(minima)),detalle("Condición","0 °C < mínima ≤ 2 °C"),detalle("Severidad","Precaución")]});

  reportes.push({id:`${fecha}-reporte`,tipo:"reporte",titulo:"Reporte meteorológico diario",resumen:"Resumen de las condiciones meteorológicas observadas durante el día.",detalles:[
    ...base,
    detalle("Temperatura máxima",formatearTemperatura(registro.maxima)),
    detalle("Temperatura media",formatearTemperatura(registro.mediaDiaria)),
    detalle("Temperatura mínima",formatearTemperatura(registro.minima)),
    detalle("Amplitud térmica",formatearTemperatura(obtenerAmplitud(registro))),
    detalle("Precipitación diaria",formatearPrecipitacion(registro.precipitacionMm)),
  ]});
  return reportes;
};

function AlertasReportes({estaciones=[],datosTemperatura=[],temaOscuro=true}){
  const[estacionSeleccionada,setEstacionSeleccionada]=useState("");
  const[anioActual,setAnioActual]=useState("");
  const[mesActual,setMesActual]=useState(0);
  const[fechaSeleccionada,setFechaSeleccionada]=useState(null);
  const[reporteAbierto,setReporteAbierto]=useState(null);

  useEffect(()=>{
    if(estaciones.length&&!estaciones.some(e=>e.id===estacionSeleccionada))setEstacionSeleccionada(estaciones[0].id);
  },[estaciones,estacionSeleccionada]);

  const estacion=useMemo(()=>estaciones.find(e=>e.id===estacionSeleccionada)??null,[estaciones,estacionSeleccionada]);
  const datosEstacion=useMemo(()=>datosTemperatura.filter(d=>d.estacionId===estacionSeleccionada).sort((a,b)=>a.fecha.localeCompare(b.fecha)),[datosTemperatura,estacionSeleccionada]);
  const registrosPorFecha=useMemo(()=>new Map(datosEstacion.map(r=>[r.fecha,r])),[datosEstacion]);
  const rangoCobertura=useMemo(()=>{
    const fechas=datosEstacion.map(d=>d.fecha).filter(Boolean).sort();
    return{inicio:estacion?.fechaInicio??fechas[0]??null,fin:estacion?.fechaFin??fechas[fechas.length-1]??null};
  },[datosEstacion,estacion]);
  const periodosDisponibles=useMemo(()=>[...new Set(datosEstacion.map(d=>d.fecha.substring(0,7)))].sort(),[datosEstacion]);
  const aniosDisponibles=useMemo(()=>[...new Set(periodosDisponibles.map(p=>p.substring(0,4)))].sort((a,b)=>Number(b)-Number(a)),[periodosDisponibles]);
  const periodoActual=anioActual?`${anioActual}-${String(mesActual+1).padStart(2,"0")}`:"";

  const limpiarSeleccion=()=>{setFechaSeleccionada(null);setReporteAbierto(null)};
  const aplicarPeriodo=periodo=>{
    if(!periodo)return;
    const[anio,mes]=periodo.split("-");
    setAnioActual(anio);setMesActual(Number(mes)-1);limpiarSeleccion();
  };

  useEffect(()=>{
    if(!periodosDisponibles.length){setAnioActual("");setMesActual(0);return}
    if(!periodosDisponibles.includes(periodoActual))aplicarPeriodo(periodosDisponibles[periodosDisponibles.length-1]);
  },[periodosDisponibles,periodoActual]);

  const mesesDisponibles=useMemo(()=>!anioActual?[]:periodosDisponibles.filter(p=>p.startsWith(`${anioActual}-`)).map(p=>Number(p.substring(5,7))-1),[periodosDisponibles,anioActual]);
  const cambiarEstacion=id=>{setEstacionSeleccionada(id);limpiarSeleccion()};
  const seleccionarAnio=anio=>{const ps=periodosDisponibles.filter(p=>p.startsWith(`${anio}-`));if(ps.length)aplicarPeriodo(ps[ps.length-1])};
  const seleccionarMes=mes=>{const p=`${anioActual}-${String(mes+1).padStart(2,"0")}`;if(periodosDisponibles.includes(p))aplicarPeriodo(p)};

  const indicePeriodo=periodosDisponibles.indexOf(periodoActual);
  const puedeAnterior=indicePeriodo>0;
  const puedeSiguiente=indicePeriodo>=0&&indicePeriodo<periodosDisponibles.length-1;
  const cambiarPeriodo=direccion=>{const i=indicePeriodo+direccion;if(i>=0&&i<periodosDisponibles.length)aplicarPeriodo(periodosDisponibles[i])};

  const diasCalendario=useMemo(()=>{
    if(!anioActual)return[];
    const anio=Number(anioActual),primerDia=new Date(anio,mesActual,1).getDay(),desplazamiento=primerDia===0?6:primerDia-1;
    const diasMes=new Date(anio,mesActual+1,0).getDate(),diasMesAnterior=new Date(anio,mesActual,0).getDate(),celdas=[];
    for(let i=desplazamiento-1;i>=0;i--)celdas.push({dia:diasMesAnterior-i,actual:false,tipo:"anterior"});
    for(let dia=1;dia<=diasMes;dia++)celdas.push({dia,actual:true,tipo:"actual"});
    for(let dia=1;celdas.length<42;dia++)celdas.push({dia,actual:false,tipo:"siguiente"});
    return celdas;
  },[anioActual,mesActual]);

  const seleccionarDia=dia=>{
    const fecha=construirFecha(anioActual,mesActual,dia);
    const dentroCobertura=estaDentroDelRango(fecha,rangoCobertura.inicio,rangoCobertura.fin);
    if(!dentroCobertura)return;
    const existeRegistro=registrosPorFecha.has(fecha),registro=registrosPorFecha.get(fecha);
    const reportes=construirReportes({registro,estacion,fecha,existeRegistro,dentroCobertura});
    setFechaSeleccionada(fecha);setReporteAbierto(reportes[0]?.id??null);
  };

  const registroSeleccionado=fechaSeleccionada?registrosPorFecha.get(fechaSeleccionada):null;
  const existeRegistroSeleccionado=fechaSeleccionada?registrosPorFecha.has(fechaSeleccionada):false;
  const fechaSeleccionadaDentroRango=fechaSeleccionada?estaDentroDelRango(fechaSeleccionada,rangoCobertura.inicio,rangoCobertura.fin):false;
  const reportesSeleccionados=useMemo(()=>!fechaSeleccionada?[]:construirReportes({registro:registroSeleccionado,estacion,fecha:fechaSeleccionada,existeRegistro:existeRegistroSeleccionado,dentroCobertura:fechaSeleccionadaDentroRango}),[registroSeleccionado,estacion,fechaSeleccionada,existeRegistroSeleccionado,fechaSeleccionadaDentroRango]);

  return(
    <section className={`ar-dashboard ${temaOscuro?"ar-oscuro":"ar-claro"}`}>
      <div className={`ar-contenido ${fechaSeleccionada?"con-detalle":"sin-detalle"}`}>
        <div className="ar-calendario">
          <div className="ar-calendario-toolbar">
            <label className="ar-estacion ar-estacion-calendario">
              <span>Estación</span>
              <div className="ar-estacion-select">
                <MapPin size={14}/>
                <select value={estacionSeleccionada} onChange={e=>cambiarEstacion(e.target.value)}>
                  {estaciones.map(e=><option key={e.id} value={e.id}>{nombreEstacion(e)}</option>)}
                </select>
              </div>
            </label>

            <div className="ar-navegacion-periodo">
              <button type="button" className="ar-boton-mes" disabled={!puedeAnterior} onClick={()=>cambiarPeriodo(-1)} aria-label="Período anterior" title="Mes anterior"><ChevronLeft size={20}/></button>
              <div className="ar-periodo-principal">
                <div className="ar-mes-titulo"><CalendarDays size={18}/><strong>{MESES[mesActual]}</strong></div>
                <label className="ar-selector-anio">
                  <CalendarRange size={14}/>
                  <select value={anioActual} disabled={!aniosDisponibles.length} onChange={e=>seleccionarAnio(e.target.value)}>
                    {!aniosDisponibles.length&&<option value="">Sin datos</option>}
                    {aniosDisponibles.map(anio=><option key={anio} value={anio}>{anio}</option>)}
                  </select>
                </label>
              </div>
              <button type="button" className="ar-boton-mes" disabled={!puedeSiguiente} onClick={()=>cambiarPeriodo(1)} aria-label="Período siguiente" title="Mes siguiente"><ChevronRight size={20}/></button>
            </div>
            <div className="ar-toolbar-equilibrio" aria-hidden="true"/>
          </div>

          <div className="ar-selector-meses">
            {MESES_CORTOS.map((mes,i)=>{const disponible=mesesDisponibles.includes(i);return <button key={mes} type="button" disabled={!disponible} className={mesActual===i?"activo":""} title={disponible?MESES[i]:"Sin datos disponibles"} onClick={()=>seleccionarMes(i)}>{mes}</button>})}
          </div>

          <div className="ar-resumen-estados">
            <div className="ar-resumen-estados-head"><strong>Interpretación del calendario</strong><span>Colores y marcas utilizados en cada día</span></div>
            <div className="ar-resumen-estados-grid">
              {LEYENDA.map(item=><div key={item.tipo} className="ar-estado-item"><i className={`ar-estado-swatch ${item.tipo}`}/><div><strong>{item.titulo}</strong><small>{item.descripcion}</small></div></div>)}
            </div>
          </div>

          <div className="ar-semana">{DIAS_SEMANA.map(dia=><span key={dia}>{dia}</span>)}</div>

          <div className="ar-dias">
            {diasCalendario.map((celda,i)=>{
              if(!celda.actual)return <div key={`${celda.tipo}-${celda.dia}-${i}`} className="ar-dia fuera-mes"><span>{celda.dia}</span></div>;
              const fecha=construirFecha(anioActual,mesActual,celda.dia),dentroCobertura=estaDentroDelRango(fecha,rangoCobertura.inicio,rangoCobertura.fin);
              const existeRegistro=registrosPorFecha.has(fecha),registro=registrosPorFecha.get(fecha);
              const tipos=obtenerTiposRegistro({registro,existeRegistro,dentroCobertura});
              const tipoPrincipal=[...tipos].sort((a,b)=>PRIORIDAD[b]-PRIORIDAD[a])[0];
              const seleccionada=fechaSeleccionada===fecha;
              return(
                <button key={fecha} type="button" disabled={!dentroCobertura} className={`ar-dia ar-dia-activo ${tipoPrincipal?`evento-${tipoPrincipal}`:""} ${seleccionada?"seleccionado":""} ${!dentroCobertura?"fuera-cobertura":""}`} onClick={()=>seleccionarDia(celda.dia)}>
                  <span className="ar-numero-dia">{celda.dia}</span>
                  {!!tipos.length&&<div className="ar-puntos-dia">{tipos.map(tipo=><i key={tipo} className={`ar-punto ${tipo}`}/>)}</div>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="ar-detalle">
          {fechaSeleccionada&&<>
            <div className="ar-detalle-header">
              <div>
                <span className="ar-detalle-etiqueta">Reportes del día</span>
                <h2>{formatearFechaCompleta(fechaSeleccionada)}</h2>
                <p>{nombreEstacion(estacion)}{" · "}{reportesSeleccionados.length===1?"1 registro":`${reportesSeleccionados.length} registros`}</p>
              </div>
              <button type="button" className="ar-cerrar" onClick={limpiarSeleccion} aria-label="Cerrar detalle" title="Cerrar detalle"><X size={19}/></button>
            </div>

            {reportesSeleccionados.length>0?(
              <div className="ar-lista-reportes">
                {reportesSeleccionados.map((reporte,i)=>{
                  const config=TIPOS[reporte.tipo],Icono=config.Icono,abierto=reporteAbierto===reporte.id;
                  return(
                    <article key={reporte.id} className={`ar-reporte ${reporte.tipo} ${abierto?"abierto":""}`}>
                      <button type="button" className="ar-reporte-cabecera" aria-expanded={abierto} onClick={()=>setReporteAbierto(abierto?null:reporte.id)}>
                        <div className="ar-reporte-identidad">
                          <span className="ar-reporte-icono"><Icono size={23}/></span>
                          <div><strong>{String(i+1).padStart(2,"0")}{" · "}{reporte.titulo}</strong><small>{reporte.resumen}</small></div>
                        </div>
                        <div className="ar-reporte-acciones"><span className={`ar-badge ${reporte.tipo}`}>{config.texto}</span><ChevronDown size={18} className={abierto?"girado":""}/></div>
                      </button>
                      <div className={`ar-reporte-contenido ${abierto?"visible":""}`}>
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
