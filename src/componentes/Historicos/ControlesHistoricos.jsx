import{ArrowLeftRight,CalendarDays,CalendarRange,ChartLine,MapPin,Snowflake,Thermometer,ThermometerSun}from"lucide-react";

const VISTAS=[
  {valor:"mes",texto:"Mes",Icono:CalendarDays},
  {valor:"anio",texto:"Año",Icono:CalendarRange},
];

const temperatura=v=>Number.isFinite(v)?`${v.toFixed(1).replace(".",",")} °C`:"—";

function ControlesHistoricos({
  estaciones,estacionId,setEstacionId,vista,setVista,comparar,setComparar,puedeComparar,
  periodosMensuales,periodoMes,setPeriodoMes,periodoMesComparacion,setPeriodoMesComparacion,
  anios,anio,setAnio,anioComparacion,setAnioComparacion,periodoMesLegible,resumen,series,
}){
  const esMes=vista==="mes";
  const opciones=esMes?periodosMensuales:anios;
  const valorA=esMes?periodoMes:anio;
  const valorB=esMes?periodoMesComparacion:anioComparacion;
  const setA=esMes?setPeriodoMes:setAnio;
  const setB=esMes?setPeriodoMesComparacion:setAnioComparacion;
  const textoA=esMes?"Mes":"Año";
  const mostrar=valor=>esMes?periodoMesLegible(valor):valor;

  return(
    <>
      <header className="cabecera-temperatura">
        <div className="titulo-temperatura">
          <div className="icono-principal"><ChartLine size={20}/></div>
          <h2>Histórico de temporadas</h2>
        </div>

        <div className="acciones-temperatura">
          <div className="selector-estacion">
            <MapPin size={15}/>
            <select value={estacionId} onChange={e=>setEstacionId(e.target.value)}>
              {estaciones.map(e=><option key={e.id} value={e.id}>{e.nombre??e.huerto??e.id}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="barra-grafico">
        <nav className="selector-vista">
          {VISTAS.map(({valor,texto,Icono})=>(
            <button
              key={valor}
              type="button"
              className={`boton-vista ${vista===valor?"activo":""}`}
              onClick={()=>setVista(valor)}
            >
              <Icono size={15}/><span>{texto}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className={`boton-comparar ${comparar?"activo":""}`}
          disabled={!puedeComparar}
          onClick={()=>setComparar(!comparar)}
        >
          <ArrowLeftRight size={15}/>Comparar
        </button>

        <div className="filtros-periodo">
          <label className="grupo-periodo">
            <span className="etiqueta-filtro">
              {comparar&&<span className="punto-serie serie-a"/>}
              {comparar?`${textoA} A`:textoA}
            </span>

            <select value={valorA} onChange={e=>setA(e.target.value)}>
              {opciones.map(v=>(
                <option key={v} value={v}>{mostrar(v)}</option>
              ))}
            </select>
          </label>

          {comparar&&(
            <label className="grupo-periodo">
              <span className="etiqueta-filtro">
                <span className="punto-serie serie-b"/>{textoA} B
              </span>

              <select value={valorB} onChange={e=>setB(e.target.value)}>
                {opciones.map(v=>(
                  <option key={v} value={v} disabled={v===valorA}>{mostrar(v)}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!comparar?(
          <div className="resumen-temperatura">
            <div><Snowflake size={13}/><span>Mínima</span><strong>{temperatura(resumen.minima)}</strong></div>
            <div><Thermometer size={13}/><span>Media</span><strong>{temperatura(resumen.media)}</strong></div>
            <div><ThermometerSun size={13}/><span>Máxima</span><strong>{temperatura(resumen.maxima)}</strong></div>
          </div>
        ):(
          <div className="leyenda-comparacion">
            {series.map((s,i)=>(
              <div className="item-leyenda" key={s.nombre}>
                <span className={`linea-leyenda ${i===0?"serie-a":"serie-b"}`}/>
                <span>{s.nombre}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default ControlesHistoricos;