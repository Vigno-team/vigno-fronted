import{useEffect,useMemo,useState}from"react";
import{Thermometer}from"lucide-react";
import ControlesHistoricos from"./ControlesHistoricos";
import GraficoTemperatura from"./GraficoTemperatura";
import"./TemperatureChart.css";

const MESES=["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_CORTOS=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const COLOR_A="#C86D3B",COLOR_B="#3E8E58";
const TEMAS={
  oscuro:{secundario:"#9CA3AF",grilla:"rgba(156,163,175,.10)",punto:"#0F1115"},
  claro:{secundario:"#6B7280",grilla:"rgba(107,114,128,.13)",punto:"#FFF"},
};

const aNumero=v=>{
  if(v===null||v===undefined||v==="")return null;
  const n=Number(v);return Number.isFinite(n)?n:null;
};
const promedio=a=>{const v=a.filter(Number.isFinite);return v.length?v.reduce((s,n)=>s+n,0)/v.length:null};
const mesTexto=p=>{if(!p)return"";const[a,m]=p.split("-");return`${MESES[Number(m)]} ${a}`};
const diasMes=p=>{if(!p)return 0;const[a,m]=p.split("-").map(Number);return new Date(a,m,0).getDate()};
const alternativa=(lista,actual,b)=>{
  if(b&&b!==actual&&lista.includes(b))return b;
  return lista.filter(x=>x!==actual).at(-1)??"";
};

const datosMes=(registros,p,categorias)=>{
  const mapa=new Map(registros.filter(d=>d.fecha.startsWith(`${p}-`)).map(d=>[d.fecha.slice(8,10),d]));
  return categorias.map(d=>({etiqueta:d,valor:aNumero(mapa.get(d)?.mediaDiaria)}));
};

const datosAnio=(registros,a)=>MESES_CORTOS.map((etiqueta,i)=>{
  const m=String(i+1).padStart(2,"0");
  const v=registros.filter(d=>d.fecha.startsWith(`${a}-${m}-`)).map(d=>aNumero(d.mediaDiaria)).filter(Number.isFinite);
  return{etiqueta,valor:promedio(v)};
});

function TemperatureChart({estaciones=[],datosTemperatura=[],temaOscuro=true}){
  const[vista,setVista]=useState(()=>localStorage.getItem("grafico-vista")==="anio"?"anio":"mes");
  const[comparar,setComparar]=useState(false);
  const[estacionId,setEstacionId]=useState("");
  const[periodoMes,setPeriodoMes]=useState("");
  const[periodoMesComparacion,setPeriodoMesComparacion]=useState("");
  const[anio,setAnio]=useState("");
  const[anioComparacion,setAnioComparacion]=useState("");

  useEffect(()=>localStorage.setItem("grafico-vista",vista),[vista]);
  useEffect(()=>{
    if(estaciones.length&&!estaciones.some(e=>e.id===estacionId))setEstacionId(estaciones[0].id);
  },[estaciones,estacionId]);

  const estacion=useMemo(()=>estaciones.find(e=>e.id===estacionId)??null,[estaciones,estacionId]);
  const registros=useMemo(()=>datosTemperatura.filter(d=>d.estacionId===estacionId).sort((a,b)=>a.fecha.localeCompare(b.fecha)),[datosTemperatura,estacionId]);
  const meses=useMemo(()=>[...new Set(registros.map(d=>d.fecha.slice(0,7)))].sort(),[registros]);
  const anios=useMemo(()=>[...new Set(registros.map(d=>d.fecha.slice(0,4)))].sort(),[registros]);

  useEffect(()=>{if(meses.length&&!meses.includes(periodoMes))setPeriodoMes(meses.at(-1))},[meses,periodoMes]);
  useEffect(()=>{if(anios.length&&!anios.includes(anio))setAnio(anios.at(-1))},[anios,anio]);
  useEffect(()=>{if(comparar&&vista==="mes")setPeriodoMesComparacion(v=>alternativa(meses,periodoMes,v))},[comparar,vista,meses,periodoMes]);
  useEffect(()=>{if(comparar&&vista==="anio")setAnioComparacion(v=>alternativa(anios,anio,v))},[comparar,vista,anios,anio]);

  const puedeComparar=vista==="mes"?meses.length>1:anios.length>1;
  useEffect(()=>{if(comparar&&!puedeComparar)setComparar(false)},[comparar,puedeComparar]);

  const configuracion=useMemo(()=>{
    if(vista==="mes"){
      const periodos=[periodoMes,...(comparar&&periodoMesComparacion?[periodoMesComparacion]:[])].filter(Boolean);
      const cantidad=Math.max(...periodos.map(diasMes),1);
      const categorias=Array.from({length:cantidad},(_,i)=>String(i+1).padStart(2,"0"));
      const series=[{nombre:mesTexto(periodoMes),color:COLOR_A,datos:datosMes(registros,periodoMes,categorias)}];

      if(comparar&&periodoMesComparacion)
        series.push({nombre:mesTexto(periodoMesComparacion),color:COLOR_B,datos:datosMes(registros,periodoMesComparacion,categorias)});

      const ticks=["01","05","10","15","20","25",String(cantidad).padStart(2,"0")].filter(x=>categorias.includes(x));
      return{categorias,series,ticksX:[...new Set(ticks)],formatoCategoria:v=>`Día ${Number(v)}`};
    }

    const series=[{nombre:anio,color:COLOR_A,datos:datosAnio(registros,anio)}];
    if(comparar&&anioComparacion)series.push({nombre:anioComparacion,color:COLOR_B,datos:datosAnio(registros,anioComparacion)});
    return{categorias:MESES_CORTOS,series,ticksX:MESES_CORTOS,formatoCategoria:v=>v};
  },[vista,comparar,registros,periodoMes,periodoMesComparacion,anio,anioComparacion]);

  const resumen=useMemo(()=>{
    const r=registros.filter(d=>vista==="mes"?d.fecha.startsWith(`${periodoMes}-`):d.fecha.startsWith(`${anio}-`));
    const min=r.map(d=>aNumero(d.minima)).filter(Number.isFinite);
    const med=r.map(d=>aNumero(d.mediaDiaria)).filter(Number.isFinite);
    const max=r.map(d=>aNumero(d.maxima)).filter(Number.isFinite);
    return{minima:min.length?Math.min(...min):null,media:promedio(med),maxima:max.length?Math.max(...max):null};
  },[registros,vista,periodoMes,anio]);

  const valores=configuracion.series.flatMap(s=>s.datos.map(d=>d.valor)).filter(Number.isFinite);
  const minimoY=valores.length?Math.floor((Math.min(...valores)-3)/5)*5:0;
  const maximoY=valores.length?Math.max(minimoY+10,Math.ceil((Math.max(...valores)+3)/5)*5):40;
  const tema=TEMAS[temaOscuro?"oscuro":"claro"];

  return(
    <section className={`panel-temperatura ${temaOscuro?"tema-oscuro":"tema-claro"}`}>
      <ControlesHistoricos
        estaciones={estaciones} estacion={estacion} estacionId={estacionId} setEstacionId={setEstacionId}
        vista={vista} setVista={setVista} comparar={comparar} setComparar={setComparar}
        puedeComparar={puedeComparar} periodosMensuales={meses} periodoMes={periodoMes}
        setPeriodoMes={setPeriodoMes} periodoMesComparacion={periodoMesComparacion}
        setPeriodoMesComparacion={setPeriodoMesComparacion} anios={anios} anio={anio}
        setAnio={setAnio} anioComparacion={anioComparacion} setAnioComparacion={setAnioComparacion}
        periodoMesLegible={mesTexto} resumen={resumen} series={configuracion.series}
      />

      <div className="area-temperatura">
        {valores.length?
          <GraficoTemperatura
            series={configuracion.series} categorias={configuracion.categorias}
            ticksX={configuracion.ticksX} minimoY={minimoY} maximoY={maximoY}
            tema={tema} formatoCategoria={configuracion.formatoCategoria}
          />:
          <div className="sin-datos">
            <Thermometer size={28}/>
            <strong>Sin registros disponibles</strong>
            <span>No existen datos para el período seleccionado.</span>
          </div>
        }
      </div>
    </section>
  );
}

export default TemperatureChart;