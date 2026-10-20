import{useEffect,useMemo,useState}from"react";
import{CalendarDays,CheckCircle2,MapPin,TriangleAlert}from"lucide-react";
import TarjetaTemperatura from"./TarjetaTemperatura";
import TarjetaAmplitud from"./TarjetaAmplitud";
import TarjetaPrecipitacion from"./TarjetaPrecipitacion";
import TarjetaRiesgo from"./TarjetaRiesgo";
import"./ResumenMeteorologico.css";

const PERIODOS=[
  {valor:"7",texto:"7 días"},
  {valor:"mes",texto:"Mes"},
  {valor:"temporada",texto:"Temporada"},
];

const MESES=[
  ["01","Enero"],["02","Febrero"],["03","Marzo"],["04","Abril"],
  ["05","Mayo"],["06","Junio"],["07","Julio"],["08","Agosto"],
  ["09","Septiembre"],["10","Octubre"],["11","Noviembre"],["12","Diciembre"],
].map(([valor,texto])=>({valor,texto}));

const SERIES_TEMPERATURA={
  maxima:{campo:"maxima",nombre:"Máxima",color:"#fb5263"},
  mediaDiaria:{campo:"mediaDiaria",nombre:"Media",color:"#aebed5"},
  minima:{campo:"minima",nombre:"Mínima",color:"#3389f4"},
};

const esNumero=Number.isFinite;

const formatearNumero=(v,decimales=1)=>
  esNumero(v)?v.toFixed(decimales).replace(".",","):"—";

const formatearPorcentaje=v=>formatearNumero(v);

const formatearFecha=fecha=>fecha
  ?new Intl.DateTimeFormat("es-CL",{day:"2-digit",month:"short",year:"numeric"})
    .format(new Date(`${fecha}T12:00:00`)).replace(".","")
  :"—";

const promedio=valores=>{
  const validos=valores.filter(esNumero);
  return validos.length?validos.reduce((a,b)=>a+b,0)/validos.length:null;
};

const sumar=valores=>{
  const validos=valores.filter(esNumero);
  return validos.length?validos.reduce((a,b)=>a+b,0):null;
};

const tieneDatos=dato=>Boolean(
  dato&&[
    dato.maxima,dato.minima,dato.mediaDiaria,
    dato.amplitudTermica,dato.precipitacionMm,
  ].some(esNumero)
);

const obtenerExtremo=(datos,campo,mayor=true)=>
  datos.reduce((mejor,dato)=>{
    if(!esNumero(dato[campo]))return mejor;
    if(!mejor)return dato;

    return(mayor
      ?dato[campo]>mejor[campo]
      :dato[campo]<mejor[campo]
    )?dato:mejor;
  },null);

const construirMesCompleto=(datos,anio,mes,estacionId)=>{
  if(!anio||!mes)return[];

  const dias=new Date(Number(anio),Number(mes),0).getDate();
  const registros=new Map(datos.map(d=>[d.fecha,d]));

  return Array.from({length:dias},(_,i)=>{
    const dia=String(i+1).padStart(2,"0");
    const fecha=`${anio}-${mes}-${dia}`;

    return registros.get(fecha)??{
      estacionId,fecha,maxima:null,minima:null,mediaDiaria:null,
      amplitudTermica:null,precipitacionMm:null,
      motivoNulo:"Sin registro disponible",
    };
  });
};

function ResumenMeteorologico({
  estaciones=[],
  datosTemperatura=[],
  temaOscuro=true,
}){
  const[estacionId,setEstacionId]=useState("");
  const[temporada,setTemporada]=useState("");
  const[periodo,setPeriodo]=useState("7");
  const[mesSeleccionado,setMesSeleccionado]=useState("");
  const[serieTemperatura,setSerieTemperatura]=useState("maxima");

  useEffect(()=>{
    if(estaciones.length&&!estaciones.some(e=>e.id===estacionId)){
      setEstacionId(estaciones[0].id);
    }
  },[estaciones,estacionId]);

  const estacion=useMemo(
    ()=>estaciones.find(e=>e.id===estacionId)??null,
    [estaciones,estacionId]
  );

  const datosEstacion=useMemo(
    ()=>datosTemperatura
      .filter(d=>d.estacionId===estacionId)
      .sort((a,b)=>a.fecha.localeCompare(b.fecha)),
    [datosTemperatura,estacionId]
  );

  const temporadas=useMemo(
    ()=>[...new Set(datosEstacion.map(d=>d.fecha.slice(0,4)))]
      .sort((a,b)=>Number(b)-Number(a)),
    [datosEstacion]
  );

  useEffect(()=>{
    if(temporadas.length&&!temporadas.includes(temporada)){
      setTemporada(temporadas[0]);
    }
  },[temporadas,temporada]);

  const datosTemporada=useMemo(
    ()=>datosEstacion.filter(d=>d.fecha.startsWith(`${temporada}-`)),
    [datosEstacion,temporada]
  );

  const mesesConRegistros=useMemo(
    ()=>[...new Set(datosTemporada.map(d=>d.fecha.slice(5,7)))].sort(),
    [datosTemporada]
  );

  useEffect(()=>{
    setMesSeleccionado(mesesConRegistros.at(-1)??"01");
  },[estacionId,temporada,mesesConRegistros]);

  const datosMes=useMemo(
    ()=>construirMesCompleto(
      datosTemporada,temporada,mesSeleccionado,estacionId
    ),
    [datosTemporada,temporada,mesSeleccionado,estacionId]
  );

  const datosPeriodo=useMemo(()=>{
    if(periodo==="temporada")return datosTemporada;
    if(periodo==="mes")return datosMes;
    return datosTemporada.slice(-7);
  },[datosTemporada,datosMes,periodo]);

  const sinDatos=!useMemo(
    ()=>datosPeriodo.some(tieneDatos),
    [datosPeriodo]
  );

  const diasTotalesMes=useMemo(
    ()=>temporada&&mesSeleccionado
      ?new Date(Number(temporada),Number(mesSeleccionado),0).getDate()
      :0,
    [temporada,mesSeleccionado]
  );

  const diasValidosMes=useMemo(
    ()=>datosMes.filter(tieneDatos).length,
    [datosMes]
  );

  const calidadMes=diasTotalesMes
    ?diasValidosMes/diasTotalesMes*100
    :null;

  const mesConfiable=esNumero(calidadMes)&&calidadMes>80;

  const configTemporada=estacion?.temporadas?.[temporada];
  const completitudTemporada=configTemporada?.completitud??null;
  const temporadaConfiable=configTemporada?.confiable!==false;

  const completitud=periodo==="mes"
    ?calidadMes
    :completitudTemporada;

  const confiable=periodo==="mes"
    ?mesConfiable
    :temporadaConfiable;

  const diasSinDatos=useMemo(
    ()=>periodo==="mes"
      ?Math.max(0,diasTotalesMes-diasValidosMes)
      :datosPeriodo.filter(d=>!tieneDatos(d)).length,
    [periodo,diasTotalesMes,diasValidosMes,datosPeriodo]
  );

  const metricas=useMemo(()=>({
    registroMaximo:obtenerExtremo(datosPeriodo,"maxima"),
    registroMinimo:obtenerExtremo(datosPeriodo,"minima",false),
    temperaturaMedia:promedio(datosPeriodo.map(d=>d.mediaDiaria)),
    amplitudPromedio:promedio(datosPeriodo.map(d=>d.amplitudTermica)),
    amplitudMaxima:obtenerExtremo(datosPeriodo,"amplitudTermica"),
    precipitacionPeriodo:sumar(datosPeriodo.map(d=>d.precipitacionMm)),
    maximaLluvia:obtenerExtremo(datosPeriodo,"precipitacionMm"),
    diasConLluvia:datosPeriodo.filter(
      d=>esNumero(d.precipitacionMm)&&d.precipitacionMm>0
    ).length,
    diasBajo2:datosPeriodo.filter(
      d=>esNumero(d.minima)&&d.minima<=2
    ).length,
    diasBajo0:datosPeriodo.filter(
      d=>esNumero(d.minima)&&d.minima<=0
    ).length,
  }),[datosPeriodo]);

  const precipitacionTemporada=useMemo(
    ()=>sumar(datosTemporada.map(d=>d.precipitacionMm)),
    [datosTemporada]
  );

  const rangoInicio=datosPeriodo[0]?.fecha;
  const rangoFin=datosPeriodo.at(-1)?.fecha;

  const nombreMes=
    MESES.find(m=>m.valor===mesSeleccionado)?.texto??"Mes";

  const textoPeriodo=
    periodo==="temporada"
      ?"Temporada completa"
      :periodo==="mes"
        ?`${nombreMes} ${temporada}`
        :"Últimos 7 días";

  return(
    <section className={`rm-dashboard ${temaOscuro?"tema-oscuro":"tema-claro"}`}>
      <header className="rm-header rm-header-compacto">

        <div className="rm-resumen-barra rm-resumen-barra-header">
          <span className="rm-rango-datos">
            <strong>Datos</strong>
            <span>
              {formatearFecha(rangoInicio)} — {formatearFecha(rangoFin)}
            </span>
          </span>

          {!sinDatos&&esNumero(completitud)&&(
            <span className="rm-completitud">
              <strong>{formatearPorcentaje(completitud)} %</strong>{" "}completos
            </span>
          )}

          {sinDatos?(
            <span className="rm-chip-empty">
              <TriangleAlert size={12}/>
              Sin datos
            </span>
          ):confiable?(
            <span className="rm-chip-ok">
              <CheckCircle2 size={12}/>
              Confiable
            </span>
          ):(
            <span className="rm-chip-warn">
              <TriangleAlert size={12}/>
              Calidad limitada
            </span>
          )}

          {!sinDatos&&diasSinDatos>0&&(
            <span className="rm-dias-faltantes">
              <strong>{diasSinDatos}</strong>{" "}
              {diasSinDatos===1?"día sin datos":"días sin datos"}
            </span>
          )}
        </div>

        <div className="rm-controles">
          <label className="rm-control">
            <span>Estación</span>

            <div className="rm-select">
              <MapPin size={14}/>
              <select
                value={estacionId}
                onChange={e=>setEstacionId(e.target.value)}
              >
                {estaciones.map(e=>(
                  <option key={e.id} value={e.id}>
                    {e.nombre??e.huerto??e.id}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="rm-control rm-control-temporada">
            <span>Temporada</span>

            <div className="rm-select">
              <CalendarDays size={14}/>
              <select
                value={temporada}
                onChange={e=>setTemporada(e.target.value)}
              >
                {temporadas.map(anio=>(
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>
          </label>

          <div className="rm-control rm-control-periodo">
            <span>Período</span>

            <div className="rm-periodo-fila">
              <div className="rm-periodos">
                {PERIODOS.map(opcion=>(
                  <button
                    key={opcion.valor}
                    type="button"
                    className={periodo===opcion.valor?"activo":""}
                    onClick={()=>setPeriodo(opcion.valor)}
                  >
                    {opcion.texto}
                  </button>
                ))}
              </div>

              {periodo==="mes"&&(
                <div className="rm-mes-select">
                  <CalendarDays size={13}/>

                  <select
                    value={mesSeleccionado}
                    onChange={e=>setMesSeleccionado(e.target.value)}
                    aria-label="Seleccionar mes"
                  >
                    {MESES.map(mes=>(
                      <option key={mes.valor} value={mes.valor}>
                        {mes.texto}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {sinDatos?(
        <div className="rm-vacio-periodo">
          <div className="rm-vacio-periodo-icono">
            <CalendarDays size={24}/>
          </div>

          <h2>
            {periodo==="mes"
              ?"Sin registros disponibles para el mes seleccionado"
              :"Sin registros disponibles para el período seleccionado"
            }
          </h2>

          <p>
            {periodo==="mes"
              ?`No existen observaciones válidas para ${nombreMes} de ${temporada}. Selecciona otro mes para continuar.`
              :"No existen observaciones válidas para este período."
            }
          </p>
        </div>
      ):(
        <div className="rm-grid">
          <TarjetaTemperatura
            datos={datosPeriodo}
            textoPeriodo={textoPeriodo}
            maximo={metricas.registroMaximo}
            minimo={metricas.registroMinimo}
            media={metricas.temperaturaMedia}
            serie={serieTemperatura}
            cambiarSerie={setSerieTemperatura}
            configuracionSerie={SERIES_TEMPERATURA[serieTemperatura]}
            formatearNumero={formatearNumero}
            formatearFecha={formatearFecha}
          />

          <TarjetaAmplitud
            datos={datosPeriodo}
            promedio={metricas.amplitudPromedio}
            maxima={metricas.amplitudMaxima}
            formatearNumero={formatearNumero}
            formatearFecha={formatearFecha}
          />

          <TarjetaPrecipitacion
            datos={datosPeriodo}
            total={
              periodo==="temporada"
                ?precipitacionTemporada
                :metricas.precipitacionPeriodo
            }
            diasConLluvia={metricas.diasConLluvia}
            maxima={metricas.maximaLluvia}
            esTemporada={periodo==="temporada"}
            formatearNumero={formatearNumero}
            formatearFecha={formatearFecha}
          />

          <TarjetaRiesgo
            datos={datosPeriodo}
            registroMinimo={metricas.registroMinimo}
            diasBajo2={metricas.diasBajo2}
            diasBajo0={metricas.diasBajo0}
            formatearNumero={formatearNumero}
            formatearFecha={formatearFecha}
          />
        </div>
      )}
    </section>
  );
}

export default ResumenMeteorologico;