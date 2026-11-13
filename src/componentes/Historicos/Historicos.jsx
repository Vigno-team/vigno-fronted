import{useEffect,useState}from"react";
import{ChartNoAxesCombined,Grape}from"lucide-react";
import TemperatureChart from"./TemperatureChart";
import VistaIndicesHistoricos from"./VistaIndicesHistoricos";
import"./Historicos.css";

function Historicos({
  estaciones=[],datosTemperatura=[],fichasTemporada=[],
  temporadaEnCurso=null,temaOscuro=true,
}){
  const[vista,setVista]=useState(
    ()=>localStorage.getItem("historicos-vista")==="indices"?"indices":"temperaturas"
  );

  useEffect(()=>{
    localStorage.setItem("historicos-vista",vista);
  },[vista]);

  return(
    <section className={`historicos-shell ${temaOscuro?"historicos-oscuro":"historicos-claro"}`}>
      <div className="historicos-navegacion">
        <button
          type="button"
          className={vista==="temperaturas"?"activo":""}
          onClick={()=>setVista("temperaturas")}
        >
          <ChartNoAxesCombined size={16}/>
          <span>Temperaturas</span>
        </button>

        <button
          type="button"
          className={vista==="indices"?"activo":""}
          onClick={()=>setVista("indices")}
        >
          <Grape size={16}/>
          <span>Índices vitivinícolas</span>
        </button>
      </div>

      <div className="historicos-contenido">
        {vista==="temperaturas"?(
          <TemperatureChart
            estaciones={estaciones}
            datosTemperatura={datosTemperatura}
            temaOscuro={temaOscuro}
          />
        ):(
          <VistaIndicesHistoricos
            estaciones={estaciones}
            datosTemperatura={datosTemperatura}
            fichasTemporada={fichasTemporada}
            temporadaEnCurso={temporadaEnCurso}
            temaOscuro={temaOscuro}
          />
        )}
      </div>
    </section>
  );
}

export default Historicos;