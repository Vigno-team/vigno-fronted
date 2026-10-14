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
          {VISTAS.map(({valor,texto,Icono})=>
            <button key={valor} type="button" className={vista===valor?"boton-vista activo":"boton-vista"} onClick={()=>setVista(valor)}>
              <Icono size={15}/><span>{texto}</span>
            </button>
          )}
        </nav>

        <button type="button" className={comparar?"boton-comparar activo":"boton-comparar"} disabled={!puedeComparar} onClick={()=>setComparar(!comparar)}>
          <ArrowLeftRight size={15}/>Comparar
        </button>

        <div className="filtros-periodo">
          {vista==="mes"?
            <>
              <label className="grupo-periodo">
                <span className="etiqueta-filtro">{comparar&&<span className="punto-serie serie-a"/>}{comparar?"Mes A":"Mes"}</span>
                <select value={periodoMes} onChange={e=>setPeriodoMes(e.target.value)}>
                  {periodosMensuales.map(p=><option key={p} value={p}>{periodoMesLegible(p)}</option>)}
                </select>
              </label>

              {comparar&&
                <label className="grupo-periodo">
                  <span className="etiqueta-filtro"><span className="punto-serie serie-b"/>Mes B</span>
                  <select value={periodoMesComparacion} onChange={e=>setPeriodoMesComparacion(e.target.value)}>
                    {periodosMensuales.map(p=><option key={p} value={p} disabled={p===periodoMes}>{periodoMesLegible(p)}</option>)}
                  </select>
                </label>
              }
            </>:
            <>
              <label className="grupo-periodo">
                <span className="etiqueta-filtro">{comparar&&<span className="punto-serie serie-a"/>}{comparar?"Año A":"Año"}</span>
                <select value={anio} onChange={e=>setAnio(e.target.value)}>
                  {anios.map(a=><option key={a}>{a}</option>)}
                </select>
              </label>

              {comparar&&
                <label className="grupo-periodo">
                  <span className="etiqueta-filtro"><span className="punto-serie serie-b"/>Año B</span>
                  <select value={anioComparacion} onChange={e=>setAnioComparacion(e.target.value)}>
                    {anios.map(a=><option key={a} disabled={a===anio}>{a}</option>)}
                  </select>
                </label>
              }
            </>
          }
        </div>

        {!comparar?
          <div className="resumen-temperatura">
            <div><Snowflake size={13}/><span>Mínima</span><strong>{temperatura(resumen.minima)}</strong></div>
            <div><Thermometer size={13}/><span>Media</span><strong>{temperatura(resumen.media)}</strong></div>
            <div><ThermometerSun size={13}/><span>Máxima</span><strong>{temperatura(resumen.maxima)}</strong></div>
          </div>:
          <div className="leyenda-comparacion">
            {series.map((s,i)=>
              <div className="item-leyenda" key={s.nombre}>
                <span className={`linea-leyenda ${i===0?"serie-a":"serie-b"}`}/>
                <span>{s.nombre}</span>
              </div>
            )}
          </div>
        }
      </div>
    </>
  );
}

export default ControlesHistoricos;