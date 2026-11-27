import SelectorVigno from "../SelectorVigno/SelectorVigno";
import{useEffect,useMemo,useState}from"react";
import{ArrowLeftRight,CalendarDays,Grape,MapPin,Sprout}from"lucide-react";
import{crearSerieIndiceReal}from"./seriesIndicesReales";
import GraficoEvolucionIndice from"./GraficoEvolucionIndice";
import GraficoComparativaIndices from"./GraficoComparativaIndices";
import"./VistaIndicesHistoricos.css";

// convierte un valor a numero y si no es valido devuelve null
const numero=v=>{
  if(v===null||v===undefined||v==="")return null;
  const n=Number(v);
  return Number.isFinite(n)?n:null;
};

// muestra los numeros con un decimal y su unidad
const formato=(v,sufijo="")=>Number.isFinite(v)
  ?`${v.toFixed(1).replace(".",",")}${sufijo}`
  :"Sin dato";

// convierte la fecha a un formato mas facil de leer
const formatearFecha=fecha=>fecha
  ?new Intl.DateTimeFormat("es-CL",{day:"2-digit",month:"short",year:"numeric"})
    .format(new Date(`${fecha}T12:00:00`)).replace(".","")
  :"Sin dato";

// obtiene el id de la estacion desde la ficha
const idFicha=f=>f?.estacionId??f?.estacion_id??"";
// obtiene el nombre de la estacion o su id
const nombreEstacion=e=>e?.nombre??e?.huerto??e?.id??"Estación";
// busca el indice winkler o huglin dentro de la ficha
const indiceFicha=(ficha,tipo)=>ficha?.indices?.[tipo]??ficha?.[tipo]??null;

// obtiene el valor numerico del indice de la ficha
const valorIndice=(ficha,tipo)=>{
  const indice=indiceFicha(ficha,tipo);
  return numero(indice&&typeof indice==="object"?indice.valor:indice);
};

// comprueba si el dato del indice esta marcado como confiable
const indiceConfiable=(ficha,tipo)=>
  indiceFicha(ficha,tipo)?.calidad_dato?.confiable!==false;

// comprueba si la temporada sigue en curso
const estaEnCurso=(ficha,temporada,actual)=>Boolean(
  ficha?.enCurso===true||
  ficha?.clasificacion?.en_curso===true||
  temporada===actual
);

// convierte la clasificacion de huglin a un texto legible
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

// obtiene la clasificacion de winkler o huglin
const clasificacionIndice=(ficha,tipo)=>{
  const indice=indiceFicha(ficha,tipo);

  if(tipo==="winkler"){
    return indice?.region?`Región ${indice.region}`:"Sin clasificación";
  }

  return textoHuglin(indice?.clasificacion);
};

// crea las curvas de winkler y huglin con los datos de la temporada
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

// componente para mostrar los selectores de estacion y temporada
function Selector({titulo,Icono,valor,onChange,temporada=false,children}){
  return(
    <label className="vih-control">
      <span>{titulo}</span>
      <div className={`vih-select ${temporada?"vih-select-temporada":""}`}>
        <Icono size={14}/>
        {/* muestra el selector y avisa cuando cambia su valor */}
        <SelectorVigno value={valor} onChange={e=>onChange(e.target.value)}>
          {children}
        </SelectorVigno>
      </div>
    </label>
  );
}

// componente que muestra la tarjeta con un indice y su grafico
function TarjetaIndice({
  tipo,titulo,Icono,serie,serieComparacion,valorOficial,
  clasificacion,unidad,periodo,comparar,enCurso,
  enCursoComparacion,etiquetaA,etiquetaB,
}){
  // indica si el dato oficial es confiable o tiene cobertura limitada
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

        {/* muestra si la temporada sigue en curso o ya esta cerrada */}
        <span className={`vih-estado ${enCurso?"en-curso":"cerrada"}`}>
          {enCurso?"En curso":"Cerrada"}
        </span>
      </header>

      {/* muestra el valor oficial, la clasificacion y la completitud */}
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

      {/* si esta comparando muestra los nombres de las dos curvas */}
      {comparar&&(
        <div className="vih-leyenda-curvas">
          <span><i className="principal"/>{etiquetaA}</span>
          <span><i className="comparacion"/>{etiquetaB}</span>
        </div>
      )}

      {/* muestra el grafico de evolucion del indice */}
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

      {/* muestra el periodo, los dias validos y el estado de la fuente */}
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

// componente principal que recibe estaciones, temperaturas y fichas de temporada
function VistaIndicesHistoricos({
  estaciones=[],datosTemperatura=[],fichasTemporada=[],
  temporadaEnCurso=null,temaOscuro=true,
}){
  // guarda la estacion y temporada principal seleccionadas
  const[estacionId,setEstacionId]=useState("");
  const[temporada,setTemporada]=useState("");
  // guarda si la comparativa inferior usa winkler o huglin
  const[indiceComparacion,setIndiceComparacion]=useState("winkler");
  // controla si la comparacion esta activada y que se compara
  const[comparar,setComparar]=useState(false);
  const[estacionComparacionId,setEstacionComparacionId]=useState("");
  const[temporadaComparacion,setTemporadaComparacion]=useState("");

  // si no hay estacion seleccionada elige la primera disponible
  useEffect(()=>{
    if(estaciones.length&&!estaciones.some(e=>e.id===estacionId)){
      setEstacionId(estaciones[0].id);
    }
  },[estaciones,estacionId]);

  // busca la estacion seleccionada
  const estacion=useMemo(
    ()=>estaciones.find(e=>e.id===estacionId)??null,
    [estaciones,estacionId]
  );

  // filtra las fichas de la estacion y las ordena por temporada
  const fichasEstacion=useMemo(
    ()=>fichasTemporada
      .filter(f=>idFicha(f)===estacionId)
      .sort((a,b)=>b.temporada.localeCompare(a.temporada)),
    [fichasTemporada,estacionId]
  );

  // obtiene las temporadas disponibles para la estacion
  const temporadas=useMemo(
    ()=>fichasEstacion.map(f=>f.temporada),
    [fichasEstacion]
  );

  // elige una temporada valida al cambiar la estacion o los datos
  useEffect(()=>{
    if(!temporadas.length)return setTemporada("");
    if(temporadas.includes(temporada))return;

    // revisa si la temporada actual esta disponible
    const actual=temporadaEnCurso&&temporadas.includes(temporadaEnCurso)
      ?temporadaEnCurso
      :null;

    // si la temporada actual tiene dias validos la selecciona
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

    // si no, busca una temporada cerrada con valores de indices
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

  // busca la ficha de la temporada seleccionada
  const ficha=useMemo(
    ()=>fichasEstacion.find(f=>f.temporada===temporada)??null,
    [fichasEstacion,temporada]
  );

  // comprueba si la temporada principal esta en curso
  const enCurso=estaEnCurso(ficha,temporada,temporadaEnCurso);

  // calcula las curvas principales de winkler y huglin
  const curvas=useMemo(
    ()=>crearCurvas(datosTemperatura,estacionId,temporada,ficha),
    [datosTemperatura,estacionId,temporada,ficha]
  );

  // obtiene las fichas de la estacion que se va a comparar
  const fichasComparacion=useMemo(
    ()=>fichasTemporada
      .filter(f=>idFicha(f)===estacionComparacionId)
      .sort((a,b)=>b.temporada.localeCompare(a.temporada)),
    [fichasTemporada,estacionComparacionId]
  );

  // obtiene las temporadas disponibles para la comparacion
  const temporadasComparacion=useMemo(
    ()=>fichasComparacion.map(f=>f.temporada),
    [fichasComparacion]
  );

  // busca una estacion y temporada validas al activar la comparacion
  useEffect(()=>{
    if(!comparar)return;

    if(!estaciones.some(e=>e.id===estacionComparacionId)){
      setEstacionComparacionId(estacionId);
      return;
    }

    // comprueba que no se compare exactamente la misma estacion y temporada
    const igual=
      estacionComparacionId===estacionId&&
      temporadaComparacion===temporada;

    if(temporadasComparacion.includes(temporadaComparacion)&&!igual)return;

    // primero intenta comparar con otra temporada de la misma estacion
    const otraTemporada=fichasEstacion.find(
      f=>f.temporada!==temporada
    );

    if(otraTemporada){
      setEstacionComparacionId(estacionId);
      setTemporadaComparacion(otraTemporada.temporada);
      return;
    }

    // si no encuentra otra temporada intenta usar otra estacion
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

  // evita dejar seleccionada una temporada de comparacion no valida
  useEffect(()=>{
    if(!comparar)return;
    if(!temporadasComparacion.length)return setTemporadaComparacion("");

    // comprueba si la temporada de comparacion esta disponible
    const valida=temporadasComparacion.includes(temporadaComparacion);

    const igual=
      estacionComparacionId===estacionId&&
      temporadaComparacion===temporada;

    if(valida&&!igual)return;

    // busca otra temporada diferente de la principal
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

  // busca los datos de la estacion de comparacion
  const estacionComparacion=useMemo(
    ()=>estaciones.find(e=>e.id===estacionComparacionId)??null,
    [estaciones,estacionComparacionId]
  );

  // busca la ficha de la estacion y temporada de comparacion
  const fichaComparacion=useMemo(
    ()=>fichasTemporada.find(f=>
      idFicha(f)===estacionComparacionId&&
      f.temporada===temporadaComparacion
    )??null,
    [fichasTemporada,estacionComparacionId,temporadaComparacion]
  );

  // comprueba si la temporada de comparacion sigue en curso
  const enCursoComparacion=estaEnCurso(
    fichaComparacion,
    temporadaComparacion,
    temporadaEnCurso
  );

  // calcula las curvas de comparacion solo si comparar esta activo
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

  // crea las etiquetas con el nombre de estacion y temporada
  const etiquetaA=`${nombreEstacion(estacion)} · ${temporada}`;
  const etiquetaB=`${nombreEstacion(estacionComparacion)} · ${temporadaComparacion}`;

  // busca otra estacion para la comparativa de indices
  const estacionAlterna=useMemo(
    ()=>estaciones.find(e=>e.id!==estacionId)??null,
    [estaciones,estacionId]
  );

  // busca la ficha de esa otra estacion para la misma temporada
  const fichaAlterna=useMemo(
    ()=>fichasTemporada.find(f=>
      idFicha(f)===estacionAlterna?.id&&
      f.temporada===temporada
    )??null,
    [fichasTemporada,estacionAlterna,temporada]
  );

  // obtiene indices de temporadas cerradas y con datos confiables
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

  // calcula el promedio de los valores historicos encontrados
  const promedioHistorico=valoresHistoricos.length
    ?valoresHistoricos.reduce((total,v)=>total+v,0)/valoresHistoricos.length
    :null;

  // prepara los tres valores de la comparativa de indices
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
      

      {/* selectores de estacion y temporada principales */}
      <div className="vih-barra-filtros">
        <div className="vih-filtros-principales">
          <Selector titulo="Estación A" Icono={MapPin} valor={estacionId} onChange={setEstacionId}>
            {estaciones.map(e=><option key={e.id} value={e.id}>{nombreEstacion(e)}</option>)}
          </Selector>
          <Selector titulo="Temporada A" Icono={CalendarDays} valor={temporada} onChange={setTemporada} temporada>
            {temporadas.map(t=><option key={t} value={t}>{t}</option>)}
          </Selector>
        </div>

        {/* boton para activar o desactivar la comparacion */}
        <button type="button" className={`vih-boton-comparar ${comparar?"activo":""}`}
          onClick={()=>setComparar(v=>!v)} aria-pressed={comparar}>
          <ArrowLeftRight size={15}/><span>{comparar?"Comparando":"Comparar"}</span>
        </button>

        {/* si comparar esta activo muestra los selectores de la serie b */}
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

      {/* muestra los graficos de evolucion de los dos indices */}
      <div className="vih-evoluciones">
        {/* tarjeta con el indice de winkler */}
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

        {/* tarjeta con el indice de huglin */}
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

      {/* compara la temporada elegida con el promedio historico y otra estacion */}
      <article className="vih-card vih-card-comparacion">
        <header className="vih-card-header">
          <div className="vih-card-titulo">
            <span className="vih-icono"><Grape size={18}/></span>
            <div>
              <span>Contexto histórico</span>
              <h2>Comparativa de índices</h2>
            </div>
          </div>

          {/* botones para elegir si comparar winkler o huglin */}
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

        {/* muestra el grafico con los tres valores de comparacion */}
        <div className="vih-comparacion-grafico">
          <GraficoComparativaIndices
            datos={comparaciones}
            unidad={indiceComparacion==="winkler"?"GDD":"IH"}
          />
        </div>

        <footer className="vih-card-footer">
          <span>Temporada seleccionada vs promedio histórico vs estación alterna</span>
        </footer>
      </article>
    </section>
  );
}

// permite usar este componente en otros archivos
export default VistaIndicesHistoricos;
