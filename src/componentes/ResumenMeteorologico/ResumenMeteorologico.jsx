import{useEffect,useMemo,useState}from"react";
import{ArrowUpDown,CalendarDays,CheckCircle2,CloudRain,MapPin,Snowflake,ThermometerSun,TriangleAlert}from"lucide-react";
import MiniGraficoLinea from"./MiniGraficoLinea";
import"./ResumenMeteorologico.css";

const PERIODOS=[
  {valor:"ultimo",texto:"Último día"},
  {valor:"7",texto:"7 días"},
  {valor:"30",texto:"30 días"},
  {valor:"temporada",texto:"Temporada"},
];

const SERIES_TEMPERATURA={
  maxima:{campo:"maxima",nombre:"Máxima",color:"#C86D3B"},
  mediaDiaria:{campo:"mediaDiaria",nombre:"Media",color:"#9CA3AF"},
  minima:{campo:"minima",nombre:"Mínima",color:"#38BDF8"},
};

const esNumero=v=>Number.isFinite(v);
const numero=(v,d=1)=>esNumero(v)?v.toFixed(d).replace(".",","):"—";
const fecha=f=>f?new Intl.DateTimeFormat("es-CL",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${f}T12:00:00`)).replace(".",""):"—";
const promedio=a=>{const v=a.filter(esNumero);return v.length?v.reduce((s,n)=>s+n,0)/v.length:null};
const sumar=a=>{const v=a.filter(esNumero);return v.length?v.reduce((s,n)=>s+n,0):null};
const tieneDatos=d=>Boolean(d&&[d.maxima,d.minima,d.mediaDiaria,d.amplitudTermica,d.precipitacionMm].some(esNumero));

function ResumenMeteorologico({estaciones=[],datosTemperatura=[],temaOscuro=true}){
  const[estacionId,setEstacionId]=useState("");
  const[temporada,setTemporada]=useState("");
  const[periodo,setPeriodo]=useState("30");
  const[serie,setSerie]=useState("maxima");

  useEffect(()=>{
    if(estaciones.length&&!estaciones.some(e=>e.id===estacionId))setEstacionId(estaciones[0].id);
  },[estaciones,estacionId]);

  const estacion=useMemo(()=>estaciones.find(e=>e.id===estacionId),[estaciones,estacionId]);

  const datosEstacion=useMemo(()=>datosTemperatura
    .filter(d=>d.estacionId===estacionId)
    .sort((a,b)=>a.fecha.localeCompare(b.fecha)),[datosTemperatura,estacionId]);

  const temporadas=useMemo(()=>[...new Set(datosEstacion.map(d=>d.fecha.slice(0,4)))]
    .sort((a,b)=>Number(b)-Number(a)),[datosEstacion]);

  useEffect(()=>{
    if(temporadas.length&&!temporadas.includes(temporada))setTemporada(temporadas[0]);
  },[temporadas,temporada]);

  const datosTemporada=useMemo(()=>temporada?datosEstacion.filter(d=>d.fecha.startsWith(`${temporada}-`)):[],[datosEstacion,temporada]);

  const datos=useMemo(()=>{
    if(periodo==="temporada")return datosTemporada;
    if(periodo==="ultimo")return datosTemporada.slice(-1);
    return datosTemporada.slice(-Number(periodo));
  },[datosTemporada,periodo]);

  const config=estacion?.temporadas?.[temporada];
  const confiable=config?.confiable!==false;
  const completitud=config?.completitud??null;
  const sinDatos=datosTemporada.filter(d=>!tieneDatos(d)).length;

  const maximo=useMemo(()=>datos.reduce((m,d)=>!esNumero(d.maxima)?m:!m||d.maxima>m.maxima?d:m,null),[datos]);
  const minimo=useMemo(()=>datos.reduce((m,d)=>!esNumero(d.minima)?m:!m||d.minima<m.minima?d:m,null),[datos]);
  const media=useMemo(()=>promedio(datos.map(d=>d.mediaDiaria)),[datos]);
  const amplitudMedia=useMemo(()=>promedio(datos.map(d=>d.amplitudTermica)),[datos]);
  const amplitudMax=useMemo(()=>datos.reduce((m,d)=>!esNumero(d.amplitudTermica)?m:!m||d.amplitudTermica>m.amplitudTermica?d:m,null),[datos]);

  const lluviaPeriodo=useMemo(()=>sumar(datos.map(d=>d.precipitacionMm)),[datos]);
  const lluviaTemporada=useMemo(()=>sumar(datosTemporada.map(d=>d.precipitacionMm)),[datosTemporada]);
  const lluviaMax=useMemo(()=>datos.reduce((m,d)=>!esNumero(d.precipitacionMm)?m:!m||d.precipitacionMm>m.precipitacionMm?d:m,null),[datos]);
  const diasLluvia=datos.filter(d=>esNumero(d.precipitacionMm)&&d.precipitacionMm>0).length;
  const diasBajo2=datos.filter(d=>esNumero(d.minima)&&d.minima<=2).length;
  const diasBajo0=datos.filter(d=>esNumero(d.minima)&&d.minima<=0).length;

  const riesgo=diasBajo2>0,critico=diasBajo0>0;
  const inicio=datosTemporada[0]?.fecha,fin=datosTemporada.at(-1)?.fecha;
  const textoPeriodo=periodo==="ultimo"?"Último día":periodo==="temporada"?"Temporada completa":`Últimos ${periodo} días`;
  const serieActual=SERIES_TEMPERATURA[serie];

  return(
    <section className={`rm-dashboard ${temaOscuro?"tema-oscuro":"tema-claro"}`}>
      <header className="rm-header">
        <div className="rm-header-texto">
          <h1>Resumen meteorológico</h1>
          <p>Principales condiciones observadas en la estación.</p>
        </div>

        <div className="rm-controles">
          <label className="rm-control">
            <span>Estación</span>
            <div className="rm-select">
              <MapPin size={14}/>
              <select value={estacionId} onChange={e=>setEstacionId(e.target.value)}>
                {estaciones.map(e=><option key={e.id} value={e.id}>{e.nombre??e.huerto??e.id}</option>)}
              </select>
            </div>
          </label>

          <label className="rm-control rm-control-temporada">
            <span>Temporada</span>
            <div className="rm-select">
              <CalendarDays size={14}/>
              <select value={temporada} onChange={e=>setTemporada(e.target.value)}>
                {temporadas.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </label>

          <div className="rm-control">
            <span>Período</span>
            <div className="rm-periodos">
              {PERIODOS.map(p=>
                <button key={p.valor} type="button" className={periodo===p.valor?"activo":""} onClick={()=>setPeriodo(p.valor)}>
                  {p.texto}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="rm-resumen-barra">
        <span><strong>Datos</strong> {fecha(inicio)} — {fecha(fin)}</span>
        {esNumero(completitud)&&<span><strong>{completitud} %</strong> completos</span>}
        {confiable
          ?<span className="rm-chip-ok"><CheckCircle2 size={12}/>Confiable</span>
          :<span className="rm-chip-warn"><TriangleAlert size={12}/>Calidad limitada</span>}
        {sinDatos>0&&<span><strong>{sinDatos}</strong> {sinDatos===1?"día sin datos":"días sin datos"}</span>}
      </div>

      <div className="rm-grid">
        <article className="rm-card">
          <div className="rm-card-top">
            <div className="rm-card-titulo">
              <div className="rm-icono rm-icono-temperatura"><ThermometerSun size={18}/></div>
              <div><h2>Temperatura del aire</h2><p>{textoPeriodo}</p></div>
            </div>
          </div>

          <div className="rm-metricas rm-metricas-3">
            <div><strong className="rm-maxima">{numero(maximo?.maxima)} °C</strong><span>Máxima del período</span><small>{fecha(maximo?.fecha)}</small></div>
            <div><strong className="rm-media">{numero(media)} °C</strong><span>Promedio del período</span></div>
            <div><strong className="rm-minima">{numero(minimo?.minima)} °C</strong><span>Mínima del período</span><small>{fecha(minimo?.fecha)}</small></div>
          </div>

          <div className="rm-selector-series">
            <button className={serie==="maxima"?"activo maxima":""} onClick={()=>setSerie("maxima")}><i/>Máxima</button>
            <button className={serie==="mediaDiaria"?"activo media":""} onClick={()=>setSerie("mediaDiaria")}><i/>Media</button>
            <button className={serie==="minima"?"activo minima":""} onClick={()=>setSerie("minima")}><i/>Mínima</button>
          </div>

          <div className="rm-grafico">
            <MiniGraficoLinea datos={datos} series={[{...serieActual,unidad:" °C",grosor:2.4}]}/>
          </div>
        </article>

        <article className="rm-card">
          <div className="rm-card-top">
            <div className="rm-card-titulo">
              <div className="rm-icono rm-icono-amplitud"><ArrowUpDown size={18}/></div>
              <div><h2>Amplitud térmica</h2><p>Diferencia entre máxima y mínima diaria</p></div>
            </div>
          </div>

          <div className="rm-metricas rm-metricas-2">
            <div><strong className="rm-amplitud">{numero(amplitudMedia)} °C</strong><span>Promedio del período</span></div>
            <div><strong className="rm-amplitud">{numero(amplitudMax?.amplitudTermica)} °C</strong><span>Mayor amplitud</span><small>{fecha(amplitudMax?.fecha)}</small></div>
          </div>

          <div className="rm-grafico">
            <MiniGraficoLinea datos={datos} series={[{campo:"amplitudTermica",nombre:"Amplitud térmica",unidad:" °C",color:"#C86D3B",grosor:2.3}]}/>
          </div>
        </article>

        <article className="rm-card">
          <div className="rm-card-top">
            <div className="rm-card-titulo">
              <div className="rm-icono rm-icono-lluvia"><CloudRain size={18}/></div>
              <div><h2>Precipitación</h2><p>Lluvia observada durante el período</p></div>
            </div>
          </div>

          <div className="rm-metricas rm-metricas-3">
            <div><strong className="rm-lluvia">{numero(periodo==="temporada"?lluviaTemporada:lluviaPeriodo)} mm</strong><span>{periodo==="temporada"?"Total temporada":"Total del período"}</span></div>
            <div><strong className="rm-lluvia">{diasLluvia}</strong><span>Días con lluvia</span></div>
            <div><strong className="rm-lluvia">{numero(lluviaMax?.precipitacionMm)} mm</strong><span>Máxima diaria</span><small>{fecha(lluviaMax?.fecha)}</small></div>
          </div>

          <div className="rm-grafico">
            <MiniGraficoLinea datos={datos} tipo="barras" series={[{campo:"precipitacionMm",nombre:"Precipitación",unidad:" mm",color:"#38BDF8"}]}/>
          </div>
        </article>

        <article className={`rm-card rm-card-riesgo ${critico?"rm-riesgo-critico":riesgo?"rm-riesgo-atencion":""}`}>
          <div className="rm-card-top">
            <div className="rm-card-titulo">
              <div className="rm-icono rm-icono-riesgo"><Snowflake size={18}/></div>
              <div><h2>Riesgo térmico</h2><p>Basado en temperatura mínima diaria</p></div>
            </div>
            {critico?<span className="rm-badge-critico"><TriangleAlert size={12}/>Helada crítica</span>
              :riesgo?<span className="rm-badge-riesgo"><TriangleAlert size={12}/>Riesgo de helada</span>:null}
          </div>

          <div className="rm-metricas rm-metricas-3">
            <div className={critico?"rm-metrica-roja":""}>
              <strong className={critico?"rm-rojo":"rm-minima"}>{numero(minimo?.minima)} °C</strong>
              <span>Mínima del período</span><small>{fecha(minimo?.fecha)}</small>
            </div>
            <div className="rm-metrica-ambar"><strong>{diasBajo2}</strong><span>Días con mínima ≤ 2 °C</span></div>
            <div className="rm-metrica-roja"><strong>{diasBajo0}</strong><span>Días con mínima ≤ 0 °C</span></div>
          </div>

          <div className="rm-grafico">
            <MiniGraficoLinea
              datos={datos}
              destacarRiesgo
              campoRiesgo="minima"
              lineasReferencia={[{valor:2,color:"#D99B26"},{valor:0,color:"#38BDF8"}]}
              series={[{campo:"minima",nombre:"Mínima diaria",unidad:" °C",color:"#38BDF8",grosor:2.3}]}
            />
          </div>

          <div className="rm-leyenda">
            <span><i className="rm-dot rm-dot-min"/>Mínima diaria</span>
            <span><i className="rm-line rm-line-2"/>Riesgo · 2 °C</span>
            <span><i className="rm-line rm-line-0"/>Crítico · 0 °C</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ResumenMeteorologico;