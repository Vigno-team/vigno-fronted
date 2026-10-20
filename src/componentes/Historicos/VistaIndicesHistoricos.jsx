import{useEffect,useMemo,useState}from"react";
import{ArrowLeftRight,CalendarDays,Grape,MapPin,Sprout}from"lucide-react";
import{crearSerieIndiceReal}from"./seriesIndicesReales";
import GraficoEvolucionIndice from"./GraficoEvolucionIndice";
import GraficoComparativaIndices from"./GraficoComparativaIndices";
import"./VistaIndicesHistoricos.css";

const numero=v=>{
  if(v===null||v===undefined||v==="")return null;
  const n=Number(v);
  return Number.isFinite(n)?n:null;
};

const formato=(v,sufijo="")=>Number.isFinite(v)
  ?`${v.toFixed(1).replace(".",",")}${sufijo}`
  :"Sin dato";

const formatearFecha=fecha=>fecha
  ?new Intl.DateTimeFormat("es-CL",{day:"2-digit",month:"short",year:"numeric"})
    .format(new Date(`${fecha}T12:00:00`)).replace(".","")
  :"Sin dato";

const idFicha=f=>f?.estacionId??f?.estacion_id??"";
const nombreEstacion=e=>e?.nombre??e?.huerto??e?.id??"Estación";
const indiceFicha=(ficha,tipo)=>ficha?.indices?.[tipo]??ficha?.[tipo]??null;

const valorIndice=(ficha,tipo)=>{
  const indice=indiceFicha(ficha,tipo);
  return numero(indice&&typeof indice==="object"?indice.valor:indice);
};

const indiceConfiable=(ficha,tipo)=>
  indiceFicha(ficha,tipo)?.calidad_dato?.confiable!==false;

const estaEnCurso=(ficha,temporada,actual)=>Boolean(
  ficha?.enCurso===true||
  ficha?.clasificacion?.en_curso===true||
  temporada===actual
);

const textoHuglin=valor=>{
  if(!valor)return"Sin clasificación";

  const mapa={
    "calido":"Cálido",
    "templado calido":"Templado cálido",
    "templado":"Templado",
    "frio":"Frío",
    "muy frio":"Muy frío",
  };

  return mapa[String(valor).toLowerCase()]??String(valor);
};

const clasificacionIndice=(ficha,tipo)=>{
  const indice=indiceFicha(ficha,tipo);

  if(tipo==="winkler"){
    return indice?.region?`Región ${indice.region}`:"Sin clasificación";
  }

  return textoHuglin(indice?.clasificacion);
};

const crearCurvas=(datos,estacionId,temporada,ficha)=>({
  winkler:crearSerieIndiceReal({
    datos,
    estacionId,
    temporada,
    tipo:"winkler",
    ficha,
  }),
  huglin:crearSerieIndiceReal({
    datos,
    estacionId,
    temporada,
    tipo:"huglin",
    ficha,
  }),
});

function Selector({titulo,Icono,valor,onChange,temporada=false,children}){
  return(
    <label className="vih-control">
      <span>{titulo}</span>
      <div className={`vih-select ${temporada?"vih-select-temporada":""}`}>
        <Icono size={14}/>
        <select value={valor} onChange={e=>onChange(e.target.value)}>
          {children}
        </select>
      </div>
    </label>
  );
}

function TarjetaIndice({
  tipo,titulo,Icono,serie,serieComparacion,valorOficial,
  clasificacion,unidad,periodo,comparar,enCurso,
  enCursoComparacion,etiquetaA,etiquetaB,
}){
  const estadoFuente=serie.confiable
    ?"Dato oficial confiable"
    :"Dato oficial con cobertura limitada";

  return(
    <article className="vih-card">
      <header className="vih-card-header">
        <div className="vih-card-titulo">
          <span className="vih-icono"><Icono size={18}/></span>
          <div>
            <span>Evolución acumulada</span>
            <h2>{titulo}</h2>
          </div>
        </div>

        <span className={`vih-estado ${enCurso?"en-curso":"cerrada"}`}>
          {enCurso?"En curso":"Cerrada"}
        </span>
      </header>

      <div className="vih-resumen-indice">
        <div>
          <span>Valor oficial</span>
          <strong>{formato(valorOficial,` ${unidad}`)}</strong>
        </div>

        <div>
          <span>Clasificación</span>
          <strong>{clasificacion}</strong>
        </div>

        <div>
          <span>Completitud</span>
          <strong>{formato(serie.completitud," %")}</strong>
        </div>
      </div>

      {comparar&&(
        <div className="vih-leyenda-curvas">
          <span><i className="principal"/>{etiquetaA}</span>
          <span><i className="comparacion"/>{etiquetaB}</span>
        </div>
      )}

      <div className="vih-grafico-wrap">
        <GraficoEvolucionIndice
          serie={serie}
          serieComparacion={comparar?serieComparacion:null}
          tipo={tipo}
          enCurso={enCurso}
          enCursoComparacion={enCursoComparacion}
          etiquetaPrincipal={etiquetaA}
          etiquetaComparacion={etiquetaB}
        />
      </div>

      <footer className="vih-card-footer">
        <span>{periodo}</span>
        <span>
          {enCurso&&serie.ultimaFecha
            ?`Datos hasta ${formatearFecha(serie.ultimaFecha)}`
            :`${serie.diasValidos} días válidos`
          }
        </span>
        <span className={serie.confiable?"vih-dato-oficial":"vih-dato-advertencia"}>
          {estadoFuente}
        </span>
      </footer>
    </article>
  );
}

function VistaIndicesHistoricos({
  estaciones=[],datosTemperatura=[],fichasTemporada=[],
  temporadaEnCurso=null,temaOscuro=true,
}){
  const[estacionId,setEstacionId]=useState("");
  const[temporada,setTemporada]=useState("");
  const[indiceComparacion,setIndiceComparacion]=useState("winkler");
  const[comparar,setComparar]=useState(false);
  const[estacionComparacionId,setEstacionComparacionId]=useState("");
  const[temporadaComparacion,setTemporadaComparacion]=useState("");

  useEffect(()=>{
    if(estaciones.length&&!estaciones.some(e=>e.id===estacionId)){
      setEstacionId(estaciones[0].id);
    }
  },[estaciones,estacionId]);

  const estacion=useMemo(
    ()=>estaciones.find(e=>e.id===estacionId)??null,
    [estaciones,estacionId]
  );

  const fichasEstacion=useMemo(
    ()=>fichasTemporada
      .filter(f=>idFicha(f)===estacionId)
      .sort((a,b)=>b.temporada.localeCompare(a.temporada)),
    [fichasTemporada,estacionId]
  );

  const temporadas=useMemo(
    ()=>fichasEstacion.map(f=>f.temporada),
    [fichasEstacion]
  );

  useEffect(()=>{
    if(!temporadas.length)return setTemporada("");
    if(temporadas.includes(temporada))return;

    const actual=temporadaEnCurso&&temporadas.includes(temporadaEnCurso)
      ?temporadaEnCurso
      :null;

    if(actual){
      const fichaActual=fichasEstacion.find(f=>f.temporada===actual)??null;
      const serieActual=crearSerieIndiceReal({
        datos:datosTemperatura,
        estacionId,
        temporada:actual,
        tipo:"winkler",
        ficha:fichaActual,
      });

      if(serieActual.diasValidos>0)return setTemporada(actual);
    }

    const cerrada=fichasEstacion.find(f=>
      f.temporada!==temporadaEnCurso&&(
        Number.isFinite(valorIndice(f,"winkler"))||
        Number.isFinite(valorIndice(f,"huglin"))
      )
    );

    setTemporada(cerrada?.temporada??temporadas[0]);
  },[
    temporadas,temporada,temporadaEnCurso,
    datosTemperatura,estacionId,fichasEstacion,
  ]);

  const ficha=useMemo(
    ()=>fichasEstacion.find(f=>f.temporada===temporada)??null,
    [fichasEstacion,temporada]
  );

  const enCurso=estaEnCurso(ficha,temporada,temporadaEnCurso);

  const curvas=useMemo(
    ()=>crearCurvas(datosTemperatura,estacionId,temporada,ficha),
    [datosTemperatura,estacionId,temporada,ficha]
  );

  const fichasComparacion=useMemo(
    ()=>fichasTemporada
      .filter(f=>idFicha(f)===estacionComparacionId)
      .sort((a,b)=>b.temporada.localeCompare(a.temporada)),
    [fichasTemporada,estacionComparacionId]
  );

  const temporadasComparacion=useMemo(
    ()=>fichasComparacion.map(f=>f.temporada),
    [fichasComparacion]
  );

  useEffect(()=>{
    if(!comparar)return;

    if(!estaciones.some(e=>e.id===estacionComparacionId)){
      setEstacionComparacionId(estacionId);
      return;
    }

    const igual=
      estacionComparacionId===estacionId&&
      temporadaComparacion===temporada;

    if(temporadasComparacion.includes(temporadaComparacion)&&!igual)return;

    const otraTemporada=fichasEstacion.find(
      f=>f.temporada!==temporada
    );

    if(otraTemporada){
      setEstacionComparacionId(estacionId);
      setTemporadaComparacion(otraTemporada.temporada);
      return;
    }

    const otraEstacion=estaciones.find(e=>
      e.id!==estacionId&&
      fichasTemporada.some(
        f=>idFicha(f)===e.id&&f.temporada===temporada
      )
    );

    if(otraEstacion){
      setEstacionComparacionId(otraEstacion.id);
      setTemporadaComparacion(temporada);
    }
  },[
    comparar,estaciones,estacionId,temporada,
    estacionComparacionId,temporadaComparacion,
    temporadasComparacion,fichasEstacion,fichasTemporada,
  ]);

  useEffect(()=>{
    if(!comparar)return;
    if(!temporadasComparacion.length)return setTemporadaComparacion("");

    const valida=temporadasComparacion.includes(temporadaComparacion);

    const igual=
      estacionComparacionId===estacionId&&
      temporadaComparacion===temporada;

    if(valida&&!igual)return;

    const alternativa=temporadasComparacion.find(
      t=>!(estacionComparacionId===estacionId&&t===temporada)
    );

    setTemporadaComparacion(
      alternativa??temporadasComparacion[0]
    );
  },[
    comparar,temporadasComparacion,temporadaComparacion,
    estacionComparacionId,estacionId,temporada,
  ]);

  const estacionComparacion=useMemo(
    ()=>estaciones.find(e=>e.id===estacionComparacionId)??null,
    [estaciones,estacionComparacionId]
  );

  const fichaComparacion=useMemo(
    ()=>fichasTemporada.find(f=>
      idFicha(f)===estacionComparacionId&&
      f.temporada===temporadaComparacion
    )??null,
    [fichasTemporada,estacionComparacionId,temporadaComparacion]
  );

  const enCursoComparacion=estaEnCurso(
    fichaComparacion,
    temporadaComparacion,
    temporadaEnCurso
  );

  const curvasComparacion=useMemo(
    ()=>comparar
      ?crearCurvas(
          datosTemperatura,
          estacionComparacionId,
          temporadaComparacion,
          fichaComparacion
        )
      :null,
    [
      comparar,datosTemperatura,estacionComparacionId,
      temporadaComparacion,fichaComparacion,
    ]
  );

  const etiquetaA=`${nombreEstacion(estacion)} · ${temporada}`;
  const etiquetaB=`${nombreEstacion(estacionComparacion)} · ${temporadaComparacion}`;

  const estacionAlterna=useMemo(
    ()=>estaciones.find(e=>e.id!==estacionId)??null,
    [estaciones,estacionId]
  );

  const fichaAlterna=useMemo(
    ()=>fichasTemporada.find(f=>
      idFicha(f)===estacionAlterna?.id&&
      f.temporada===temporada
    )??null,
    [fichasTemporada,estacionAlterna,temporada]
  );

  const valoresHistoricos=useMemo(
    ()=>fichasEstacion
      .filter(f=>
        f.temporada!==temporada&&
        !estaEnCurso(f,f.temporada,temporadaEnCurso)&&
        indiceConfiable(f,indiceComparacion)
      )
      .map(f=>valorIndice(f,indiceComparacion))
      .filter(Number.isFinite),
    [
      fichasEstacion,temporada,
      temporadaEnCurso,indiceComparacion,
    ]
  );

  const promedioHistorico=valoresHistoricos.length
    ?valoresHistoricos.reduce((total,v)=>total+v,0)/valoresHistoricos.length
    :null;

  const comparaciones=[
    {
      id:"temporada",
      titulo:"Temporada seleccionada",
      detalle:temporada,
      valor:valorIndice(ficha,indiceComparacion),
      principal:true,
    },
    {
      id:"historico",
      titulo:"Promedio histórico",
      detalle:`${valoresHistoricos.length} temporadas cerradas`,
      valor:promedioHistorico,
    },
    {
      id:"alterna",
      titulo:nombreEstacion(estacionAlterna),
      detalle:`Misma temporada · ${temporada}`,
      valor:valorIndice(fichaAlterna,indiceComparacion),
      alterna:true,
    },
  ];

  return(
    <section className={`vih ${temaOscuro?"vih-oscuro":"vih-claro"}`}>
      

      <div className="vih-barra-filtros">
        <div className="vih-filtros-principales">
          <Selector titulo="Estación A" Icono={MapPin} valor={estacionId} onChange={setEstacionId}>
            {estaciones.map(e=><option key={e.id} value={e.id}>{nombreEstacion(e)}</option>)}
          </Selector>
          <Selector titulo="Temporada A" Icono={CalendarDays} valor={temporada} onChange={setTemporada} temporada>
            {temporadas.map(t=><option key={t} value={t}>{t}</option>)}
          </Selector>
        </div>

        <button type="button" className={`vih-boton-comparar ${comparar?"activo":""}`}
          onClick={()=>setComparar(v=>!v)} aria-pressed={comparar}>
          <ArrowLeftRight size={15}/><span>{comparar?"Comparando":"Comparar"}</span>
        </button>

        {comparar&&(
          <div className="vih-filtros-secundarios">
            <Selector titulo="Estación B" Icono={MapPin} valor={estacionComparacionId} onChange={setEstacionComparacionId}>
              {estaciones.map(e=><option key={e.id} value={e.id}>{nombreEstacion(e)}</option>)}
            </Selector>
            <Selector titulo="Temporada B" Icono={CalendarDays} valor={temporadaComparacion} onChange={setTemporadaComparacion} temporada>
              {temporadasComparacion.map(t=><option key={t} value={t} disabled={estacionComparacionId===estacionId&&t===temporada}>{t}</option>)}
            </Selector>
          </div>
        )}
      </div>

      <div className="vih-evoluciones">
        <TarjetaIndice
          tipo="winkler"
          titulo="Índice de Winkler"
          Icono={Sprout}
          serie={curvas.winkler}
          serieComparacion={curvasComparacion?.winkler??null}
          valorOficial={valorIndice(ficha,"winkler")}
          clasificacion={clasificacionIndice(ficha,"winkler")}
          unidad="GDD"
          periodo="01 oct — 30 abr"
          comparar={comparar}
          enCurso={enCurso}
          enCursoComparacion={enCursoComparacion}
          etiquetaA={etiquetaA}
          etiquetaB={etiquetaB}
        />

        <TarjetaIndice
          tipo="huglin"
          titulo="Índice de Huglin"
          Icono={Grape}
          serie={curvas.huglin}
          serieComparacion={curvasComparacion?.huglin??null}
          valorOficial={valorIndice(ficha,"huglin")}
          clasificacion={clasificacionIndice(ficha,"huglin")}
          unidad="IH"
          periodo="01 oct — 31 mar"
          comparar={comparar}
          enCurso={enCurso}
          enCursoComparacion={enCursoComparacion}
          etiquetaA={etiquetaA}
          etiquetaB={etiquetaB}
        />
      </div>

      <article className="vih-card vih-card-comparacion">
        <header className="vih-card-header">
          <div className="vih-card-titulo">
            <span className="vih-icono"><Grape size={18}/></span>
            <div>
              <span>Contexto histórico</span>
              <h2>Comparativa de índices</h2>
            </div>
          </div>

          <div className="vih-selector-indice">
            {["winkler","huglin"].map(tipo=>(
              <button
                key={tipo}
                type="button"
                className={indiceComparacion===tipo?"activo":""}
                onClick={()=>setIndiceComparacion(tipo)}
              >
                {tipo==="winkler"?"Winkler":"Huglin"}
              </button>
            ))}
          </div>
        </header>

        <div className="vih-comparacion-grafico">
          <GraficoComparativaIndices
            datos={comparaciones}
            unidad={indiceComparacion==="winkler"?"GDD":"IH"}
          />
        </div>

        <footer className="vih-card-footer">
          <span>Temporada seleccionada vs promedio histórico vs estación alterna</span>
          <span>Comparación basada en valores oficiales de ficha_temporada</span>
        </footer>
      </article>
    </section>
  );
}

export default VistaIndicesHistoricos;
