import SelectorVigno from "../SelectorVigno/SelectorVigno";
import {useEffect,useMemo,useState} from "react";
import {CalendarDays,Droplets,Flame,Leaf,MapPin} from "lucide-react";
import WinklerCard from "../WinklerCard/WinklerCard";
import HuglinCard from "../HuglinCard/HuglinCard";
import CalorExtremoCard from "../CalorExtremo/CalorExtremoCard";
import LluviaInvernalCard from "../LluviaInvernalCard/LluviaInvernalCard";
import LluviaFueraInvernalCard from "../LluviaFueraInvernalCard/LluviaFueraInvernalCard";
import "./IndicesVitivinicolasPanel.css";

const idFicha=f=>f?.estacionId??f?.estacion_id??"";
const nombreEstacion=e=>e?.nombre??e?.huerto??e?.id??"Estación";
const existeNumero=v=>v!==null&&v!==undefined&&Number.isFinite(Number(v));

function TituloSeccion({Icono,titulo}){
  return <div className="iv-seccion-head">
    <span className="iv-seccion-icono"><Icono size={18} aria-hidden="true"/></span>
    <h2>{titulo}</h2>
  </div>;
}

function IndicesVitivinicolasPanel({
  estaciones=[],fichasTemporada=[],temporadaEnCurso=null,
}){
  const[estacionId,setEstacionId]=useState("");
  const[temporada,setTemporada]=useState("");

  const estacionesDisponibles=useMemo(()=>estaciones.length
    ?estaciones
    :[...new Set(fichasTemporada.map(idFicha).filter(Boolean))]
      .map(id=>({id,nombre:id})),[estaciones,fichasTemporada]);

  const estacionActiva=estacionesDisponibles.some(e=>e.id===estacionId)
    ?estacionId
    :estacionesDisponibles[0]?.id??"";

  const temporadas=useMemo(()=>[...new Set(
    fichasTemporada.filter(f=>idFicha(f)===estacionActiva)
      .map(f=>f.temporada).filter(Boolean)
  )].sort((a,b)=>b.localeCompare(a)),[fichasTemporada,estacionActiva]);

  const temporadaInicial=useMemo(()=>{
    const conDatos=temporadas.find(t=>{
      const ficha=fichasTemporada.find(f=>idFicha(f)===estacionActiva&&f.temporada===t);
      return [
        ficha?.indices?.winkler?.valor??ficha?.winkler?.valor,
        ficha?.indices?.huglin?.valor??ficha?.huglin?.valor,
        ficha?.indices?.lluvia_invernal?.acumulado_mm??ficha?.lluvia_invernal?.acumulado_mm,
        ficha?.lluvia_fuera_invierno_mm,
      ].some(existeNumero);
    });
    return conDatos??(temporadas.includes(temporadaEnCurso)?temporadaEnCurso:temporadas[0])??"";
  },[temporadas,fichasTemporada,estacionActiva,temporadaEnCurso]);

  const temporadaActiva=temporadas.includes(temporada)?temporada:temporadaInicial;
  useEffect(()=>{
    if(temporada!==temporadaActiva)setTemporada(temporadaActiva);
  },[temporada,temporadaActiva]);

  // La selección es única: todos los componentes reciben el mismo período.
  const props={
    estaciones:estacionesDisponibles,fichasTemporada,temporadaEnCurso,
    estacionSeleccionada:estacionActiva,
    temporadaSeleccionada:temporadaActiva,
    ocultarSelectores:true,
  };

  return <section className="iv-panel" aria-label="Índices vitivinícolas">
   
<header className="iv-cabecera">
  <TituloSeccion
    Icono={Leaf}
    titulo="Análisis de índices"
  />

  <div
    className="iv-filtros-globales"
    aria-label="Filtros comunes de los índices"
  >
    <label className="iv-control">
      <span>Estación</span>
      <div className="iv-caja-select">
        <MapPin size={16} aria-hidden="true" />
        <SelectorVigno
          value={estacionActiva}
          disabled={!estacionesDisponibles.length}
          onChange={(e) => {
            setEstacionId(e.target.value);
            setTemporada("");
          }}
        >
          {estacionesDisponibles.map((e) => (
            <option key={e.id} value={e.id}>
              {nombreEstacion(e)}
            </option>
          ))}
        </SelectorVigno>
      </div>
    </label>

    <label className="iv-control">
      <span>Temporada</span>
      <div className="iv-caja-select">
        <CalendarDays size={16} aria-hidden="true" />
        <SelectorVigno
          value={temporadaActiva}
          disabled={!temporadas.length}
          onChange={(e) => setTemporada(e.target.value)}
        >
          {!temporadas.length && (
            <option value="">Sin temporadas</option>
          )}
          {temporadas.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectorVigno>
      </div>
    </label>
  </div>
</header>


    <section className="iv-seccion" aria-label="Índices bioclimáticos">
      <div className="iv-grid-bioclimatico">
        <WinklerCard {...props}/>
        <HuglinCard {...props}/>
      </div>
    </section>

    <section className="iv-seccion" aria-label="Calor y riesgo térmico">
      <TituloSeccion Icono={Flame} titulo="Calor y riesgo térmico"/>
      <div className="iv-calor-completo">
        <CalorExtremoCard {...props}/>
      </div>
    </section>

    <section className="iv-seccion" aria-label="Índices hídricos">
      <TituloSeccion Icono={Droplets} titulo="Índices hídricos"/>
      <div className="iv-hidrico-unificado">
        <LluviaInvernalCard {...props}/>
        <LluviaFueraInvernalCard {...props}/>
      </div>
    </section>
  </section>;
}

export default IndicesVitivinicolasPanel;
