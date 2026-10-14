import{useEffect,useMemo,useState}from"react";
import"./HuglinCard.css";

interface Estacion{
  id:string;
  nombre?:string;
  huerto?:string;
}

interface CalidadDato{
  completitud_pct:number|null;
  confiable:boolean;
  umbral_completitud_pct:number|null;
  resolucion_origen:string|null;
  version_calculo:string|null;
}

interface HuglinJSON{
  valor:number|null;
  clasificacion:string|null;
  calidad_dato?:CalidadDato|null;
  motivo_nulo?:string|null;
}

interface Ficha{
  temporada:string;
  estacion_id?:string;
  estacionId?:string;
  periodo?:{inicio?:string;fin?:string};
  indices?:{huglin?:HuglinJSON|null};
  huglin?:HuglinJSON|null;
  clasificacion?:{en_curso?:boolean};
}

interface Props{
  estaciones?:Estacion[];
  fichasTemporada?:Ficha[];
  temporadaEnCurso?:string|null;
}

const texto=(v:any)=>v===null||v===undefined||v===""?"Sin dato":String(v);
const numero=(v:number|null|undefined)=>v==null?"Sin dato":v.toFixed(1).replace(".",",");
const fecha=(v?:string|null)=>v
  ?new Intl.DateTimeFormat("es-CL",{day:"2-digit",month:"short",year:"numeric"})
    .format(new Date(`${v}T12:00:00`)).replace(".","")
  :"Sin dato";

function HuglinCard({
  estaciones=[],
  fichasTemporada=[],
  temporadaEnCurso=null,
}:Props){
  const[estacionId,setEstacionId]=useState("");
  const[temporada,setTemporada]=useState("");

  const estacionActiva=estacionId||estaciones[0]?.id||
    fichasTemporada[0]?.estacionId||fichasTemporada[0]?.estacion_id||"";

  useEffect(()=>{
    if(!estacionId&&estacionActiva)setEstacionId(estacionActiva);
  },[estacionId,estacionActiva]);

  const temporadas=useMemo(()=>[
    ...new Set(
      fichasTemporada
        .filter(f=>(f.estacionId??f.estacion_id)===estacionActiva)
        .map(f=>f.temporada)
    )
  ].sort(),[fichasTemporada,estacionActiva]);

  useEffect(()=>{
    if(!temporadas.length)return setTemporada("");
    if(!temporadas.includes(temporada)){
      setTemporada(
        temporadas.includes(temporadaEnCurso??"")
          ?temporadaEnCurso!
          :temporadas.at(-1)!
      );
    }
  },[temporadas,temporada,temporadaEnCurso]);

  const ficha=useMemo(()=>fichasTemporada.find(
    f=>(f.estacionId??f.estacion_id)===estacionActiva&&f.temporada===temporada
  )??null,[fichasTemporada,estacionActiva,temporada]);

  const huglin=ficha?.indices?.huglin??ficha?.huglin??null;
  const calidad=huglin?.calidad_dato??null;
  const enCurso=temporada===temporadaEnCurso||ficha?.clasificacion?.en_curso===true;

  return(
    <article className="huglin-card">
      <header className="huglin-card-header">
        <div className="huglin-header-top">
          <div>
            <span className="huglin-badge">Índice bioclimático</span>
            <h4>Índice Heliotérmico de Huglin (IH)</h4>
          </div>

          <div className="huglin-selectores">
            <select
              className="huglin-select"
              value={estacionActiva}
              onChange={e=>setEstacionId(e.target.value)}
            >
              {estaciones.map(est=>(
                <option key={est.id} value={est.id}>
                  {est.nombre??est.huerto??est.id}
                </option>
              ))}
            </select>

            <select
              className="huglin-select"
              value={temporada}
              onChange={e=>setTemporada(e.target.value)}
            >
              {temporadas.map(t=>(
                <option key={t} value={t}>Temporada {t}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="huglin-card-body">
        <div className="huglin-metric">
          <span className="huglin-value">{numero(huglin?.valor)}</span>
          {huglin?.valor!=null&&<span className="huglin-unit">IH</span>}
        </div>

        <div className="huglin-classification">
          <span className="huglin-region">{texto(huglin?.clasificacion)}</span>
          <span className="huglin-desc">Clasificación heliotérmica</span>
        </div>
      </div>

      {huglin?.motivo_nulo&&(
        <div className="huglin-aviso">{huglin.motivo_nulo}</div>
      )}

      <div className="huglin-datos">
        <div><span>Temporada</span><strong>{texto(temporada)}</strong></div>
        <div><span>Estado</span><strong>{enCurso?"En curso":"Finalizada"}</strong></div>
        <div><span>Inicio</span><strong>{fecha(ficha?.periodo?.inicio)}</strong></div>
        <div><span>Fin</span><strong>{fecha(ficha?.periodo?.fin)}</strong></div>
        <div><span>Completitud</span><strong>{calidad?.completitud_pct!=null?`${calidad.completitud_pct}%`:"Sin dato"}</strong></div>
        <div>
          <span>Dato confiable</span>
          <strong className={calidad?.confiable?"huglin-ok":"huglin-warn"}>
            {calidad?.confiable?"Sí":"No"}
          </strong>
        </div>
        <div><span>Resolución</span><strong>{texto(calidad?.resolucion_origen)}</strong></div>
        <div><span>Umbral calidad</span><strong>{calidad?.umbral_completitud_pct!=null?`${calidad.umbral_completitud_pct}%`:"Sin dato"}</strong></div>
      </div>

      <footer className="huglin-card-footer">
        <small>Valores obtenidos directamente de la ficha de temporada · Base 10 °C</small>
      </footer>
    </article>
  );
}

export default HuglinCard;