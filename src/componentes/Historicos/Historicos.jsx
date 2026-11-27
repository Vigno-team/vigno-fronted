
import{useEffect,useState}from"react";
import{ChartNoAxesCombined,Grape}from"lucide-react";
import TemperatureChart from"./TemperatureChart";
import VistaIndicesHistoricos from"./VistaIndicesHistoricos";
import"./Historicos.css";

// componente que recibe los datos de las estaciones y temporadas
function Historicos({
  estaciones=[],datosTemperatura=[],fichasTemporada=[],
  temporadaEnCurso=null,temaOscuro=true,
}){

  // guarda la vista seleccionada y recupera la ultima vista del localstorage
  const[vista,setVista]=useState(
    ()=>localStorage.getItem("historicos-vista")==="indices"?"indices":"temperaturas"
  );

  // guarda la vista seleccionada en el localstorage cada vez que cambia
  useEffect(()=>{
    localStorage.setItem("historicos-vista",vista);
  },[vista]);

  return(
    <section className={`historicos-shell ${temaOscuro?"historicos-oscuro":"historicos-claro"}`}>

      {/* botones para cambiar entre temperaturas e indices */}
      <div className="historicos-navegacion">

        {/* cambia la vista a temperaturas */}
        <button
          type="button"
          className={vista==="temperaturas"?"activo":""}
          onClick={()=>setVista("temperaturas")}
        >
          <ChartNoAxesCombined size={16}/>
          <span>Temperaturas</span>
        </button>

        {/* cambia la vista a indices vitivinicolas */}
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

        {/* si la vista es temperaturas muestra el grafico de temperaturas */}
        {vista==="temperaturas"?(
          <TemperatureChart
            estaciones={estaciones}
            datosTemperatura={datosTemperatura}
            temaOscuro={temaOscuro}
          />
        ):(
          /* si no, muestra los indices vitivinicolas */
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
