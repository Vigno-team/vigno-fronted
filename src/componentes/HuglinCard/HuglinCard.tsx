import{useEffect,useMemo,useState}from"react";
import"./HuglinCard.css";

interface Estacion{
  id:string;
  nombre?:string;
  huerto?:string;
}

interface HuglinJSON{
  valor:number|null;
  clasificacion:string|null;
  motivo_nulo?:string|null;
}

interface FichaTemporada{
  temporada:string;
  estacion_id?:string;
  estacionId?:string;
  periodo?:{inicio?:string|null;fin?:string|null};
  indices?:{huglin?:HuglinJSON|null};
  huglin?:HuglinJSON|null;
  clasificacion?:{en_curso?:boolean|null};
}

interface Props{
  estaciones?:Estacion[];
  fichasTemporada?:FichaTemporada[];
  temporadaEnCurso?:string|null;
}

const idEstacion=(f?:FichaTemporada)=>f?.estacionId??f?.estacion_id??"";

const numero=(v?:number|null)=>
  v===null||v===undefined?"Sin dato":Number(v).toFixed(1).replace(".",",");

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

  const estacionActiva=
    estacionId||
    estaciones[0]?.id||
    idEstacion(fichasTemporada[0]);

  useEffect(()=>{
    if(!estacionId&&estacionActiva)setEstacionId(estacionActiva);
  },[estacionId,estacionActiva]);

  const temporadas=useMemo(
    ()=>[
      ...new Set(
        fichasTemporada
          .filter(f=>idEstacion(f)===estacionActiva)
          .map(f=>f.temporada)
      ),
    ].sort(),
    [fichasTemporada,estacionActiva]
  );

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

  const ficha=useMemo(
    ()=>fichasTemporada.find(f=>
      idEstacion(f)===estacionActiva&&f.temporada===temporada
    )??null,
    [fichasTemporada,estacionActiva,temporada]
  );

  const huglin=ficha?.indices?.huglin??ficha?.huglin??null;
  const sinDato=huglin?.valor===null||huglin?.valor===undefined;

  const enCurso=
    ficha?.clasificacion?.en_curso===true||
    ficha?.temporada===temporadaEnCurso;

  const estadoTemporada=!ficha
    ?"Sin dato"
    :enCurso
      ?"En curso"
      :"Finalizada";

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
          {!sinDato&&<span className="huglin-unit">IH</span>}
        </div>

        <div className="huglin-classification">
          <span className="huglin-region">
            {huglin?.clasificacion??"Sin dato"}
          </span>
          <span className="huglin-desc">Clasificación heliotérmica</span>
        </div>
      </div>

      {huglin?.motivo_nulo&&(
        <div className="huglin-aviso">{huglin.motivo_nulo}</div>
      )}

      <div className="huglin-temporada-info">
        <div>
          <span>Temporada</span>
          <strong>{ficha?.temporada??"Sin dato"}</strong>
        </div>

        <div>
          <span>Estado</span>
          <strong className={enCurso?"estado-curso":""}>
            {estadoTemporada}
          </strong>
        </div>

        <div>
          <span>Inicio</span>
          <strong>{fecha(ficha?.periodo?.inicio)}</strong>
        </div>

        <div>
          <span>Fin</span>
          <strong>{fecha(ficha?.periodo?.fin)}</strong>
        </div>
      </div>

    </article>
  );
}

export default HuglinCard;