import{useEffect,useMemo,useState}from"react";
import BarraLateral from"./componentes/BarraLateral/BarraLateral";
import ResumenMeteorologico from"./componentes/ResumenMeteorologico/ResumenMeteorologico";
import AlertasReportes from"./componentes/AlertasReportes/AlertasReportes";
import TemperatureChart from"./componentes/Historicos/TemperatureChart";
import WinklerCard from"./componentes/WinklerCard/WinklerCard";
import HuglinCard from"./componentes/HuglinCard/HuglinCard";
import{useClimateData}from"./hooks/useClimateData";
import{adaptarClimateData}from"./services/adaptarClimateData";
import"./App.css";
import"./responsive.css";
import"./paletaVigno.css";

function App(){
  const{data,loading}=useClimateData();
  const[barraExpandida,setBarraExpandida]=useState(false);
  const[opcionActiva,setOpcionActiva]=useState("Resumen");

  const[temaOscuro,setTemaOscuro]=useState(()=>{
    const valor=localStorage.getItem("tema-oscuro");
    return valor===null?true:valor==="true";
  });

  const[escalaTexto,setEscalaTexto]=useState(()=>{
    const valor=Number(localStorage.getItem("escala-texto"));
    return valor>=90&&valor<=150?valor:120;
  });

  const datos=useMemo(()=>adaptarClimateData(data),[data]);

  useEffect(()=>{
    localStorage.setItem("tema-oscuro",String(temaOscuro));
  },[temaOscuro]);

  useEffect(()=>{
    localStorage.setItem("escala-texto",String(escalaTexto));
  },[escalaTexto]);

  const renderizarContenido=()=>{
    if(loading||!datos)return(
      <div className="estado-carga">Cargando datos meteorológicos...</div>
    );

    switch(opcionActiva){
      case"Resumen":
        return(
          <ResumenMeteorologico
            estaciones={datos.estaciones}
            datosTemperatura={datos.seriesTemperaturas}
            temaOscuro={temaOscuro}
          />
        );

      case"Alertas y reportes":
        return(
          <AlertasReportes
            estaciones={datos.estaciones}
            datosTemperatura={datos.seriesTemperaturas}
            temaOscuro={temaOscuro}
          />
        );

      case"Índices vitivinícolas":
        return(
          <div className="indices-grid">
            <WinklerCard
              estaciones={datos.estaciones}
              fichasTemporada={datos.fichasTemporada}
              temporadaEnCurso={datos.temporadaEnCurso}
            />

            <HuglinCard
              estaciones={datos.estaciones}
              fichasTemporada={datos.fichasTemporada}
              temporadaEnCurso={datos.temporadaEnCurso}
            />
          </div>
        );

      case"Históricos":
        return(
          <TemperatureChart
            estaciones={datos.estaciones}
            datosTemperatura={datos.seriesTemperaturas}
            temaOscuro={temaOscuro}
          />
        );

      case"Configuración":
        return(
          <section className="configuracion">
            <div className="configuracion-header">
              <h1>Configuración</h1>
              <p>Personaliza la visualización del dashboard.</p>
            </div>

            <div className="configuracion-card">
              <div className="configuracion-card-header">
                <div>
                  <h2>Tamaño del texto</h2>
                  <p>Ajusta el tamaño general de los textos.</p>
                </div>
                <strong>{escalaTexto}%</strong>
              </div>

              <div className="configuracion-slider">
                <span>90%</span>
                <input
                  type="range"
                  min="90"
                  max="150"
                  step="5"
                  value={escalaTexto}
                  onChange={e=>setEscalaTexto(Number(e.target.value))}
                />
                <span>150%</span>
              </div>

              <div
                className="configuracion-preview"
                style={{fontSize:`${escalaTexto/100}rem`}}
              >
                Vista previa del tamaño del texto
              </div>

              <button
                type="button"
                className="configuracion-reset"
                onClick={()=>setEscalaTexto(120)}
              >
                Restablecer
              </button>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return(
    <div
      className={`aplicacion ${temaOscuro?"tema-pagina-oscuro":"tema-pagina-claro"}`}
      style={{"--escala-texto":escalaTexto/100}}
    >
      <BarraLateral
        expandida={barraExpandida}
        setExpandida={setBarraExpandida}
        opcionActiva={opcionActiva}
        setOpcionActiva={setOpcionActiva}
        temaOscuro={temaOscuro}
        setTemaOscuro={setTemaOscuro}
      />

      <main className={`contenido ${barraExpandida?"contenido-expandido":"contenido-contraido"}`}>
        <div className="contenido-vista">
          {renderizarContenido()}
        </div>

        <footer className="footer-vigno">
          Este proyecto fue potenciado por la{" "}
          <strong>Universidad Autónoma de Chile</strong>
        </footer>
      </main>
    </div>
  );
}

export default App;