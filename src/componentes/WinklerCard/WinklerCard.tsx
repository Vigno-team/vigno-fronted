import{useEffect,useMemo,useState}from"react";
import"./WinklerCard.css";

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

interface WinklerJSON{
  valor:number|null;
  region:string|null;
  calidad_dato?:CalidadDato|null;
  motivo_nulo?:string|null;
}

interface Ficha{
  temporada:string;
  estacion_id?:string;
  estacionId?:string;
  periodo?:{inicio?:string;fin?:string};
  indices?:{winkler?:WinklerJSON|null};
  winkler?:WinklerJSON|null;
  clasificacion?:{
    termica?:string|null;
    en_curso?:boolean;
  };
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

function WinklerCard({
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

  const winkler=ficha?.indices?.winkler??ficha?.winkler??null;
  const calidad=winkler?.calidad_dato??null;
  const enCurso=temporada===temporadaEnCurso||ficha?.clasificacion?.en_curso===true;

  return(
    <article className="winkler-card">
      <header className="winkler-card-header">
        <div className="winkler-header-top">
          <div>
            <span className="winkler-badge">Índice bioclimático</span>
            <h4>Índice de Winkler</h4>
          </div>

          <div className="winkler-selectores">
            <select
              className="winkler-select"
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
              className="winkler-select"
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

      <div className="winkler-card-body">
        <div className="winkler-metric">
          <span className="winkler-value">{numero(winkler?.valor)}</span>
          {winkler?.valor!=null&&<span className="winkler-unit">GDD</span>}
        </div>

        <div className="winkler-classification">
          <span className="winkler-region">
            {winkler?.region?`Región ${winkler.region}`:"Región sin dato"}
          </span>
          <span className="winkler-desc">
            Clasificación térmica · {texto(ficha?.clasificacion?.termica)}
          </span>
        </div>
      </div>

      {winkler?.motivo_nulo&&(
        <div className="winkler-aviso">{winkler.motivo_nulo}</div>
      )}

      <div className="winkler-datos">
        <div><span>Temporada</span><strong>{texto(temporada)}</strong></div>
        <div><span>Estado</span><strong>{enCurso?"En curso":"Finalizada"}</strong></div>
        <div><span>Inicio</span><strong>{fecha(ficha?.periodo?.inicio)}</strong></div>
        <div><span>Fin</span><strong>{fecha(ficha?.periodo?.fin)}</strong></div>
        <div><span>Completitud</span><strong>{calidad?.completitud_pct!=null?`${calidad.completitud_pct}%`:"Sin dato"}</strong></div>
        <div>
          <span>Dato confiable</span>
          <strong className={calidad?.confiable?"winkler-ok":"winkler-warn"}>
            {calidad?.confiable?"Sí":"No"}
          </strong>
        </div>
        <div><span>Resolución</span><strong>{texto(calidad?.resolucion_origen)}</strong></div>
        <div><span>Umbral calidad</span><strong>{calidad?.umbral_completitud_pct!=null?`${calidad.umbral_completitud_pct}%`:"Sin dato"}</strong></div>
      </div>

      <footer className="winkler-card-footer">
        <small>Valores obtenidos directamente de la ficha de temporada · Base 10 °C</small>
      </footer>
    </article>
  );
}

export default WinklerCard;