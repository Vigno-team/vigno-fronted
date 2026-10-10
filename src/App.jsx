import { useEffect, useMemo, useState } from "react";

import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import TemperatureChart from "./componentes/Historicos/TemperatureChart";
import ResumenMeteorologico from "./componentes/ResumenMeteorologico/ResumenMeteorologico";
import AlertasReportes from "./componentes/AlertasReportes/AlertasReportes";
import { WinklerCard } from "./componentes/WinklerCard/WinklerCard";
import LoginView from "./componentes/LoginView/LoginView";
import { HuglinCard } from "./componentes/HuglinCard/HuglinCard";
import { useClimateData } from "./hooks/useClimateData";
import { adaptarClimateData } from "./services/adaptarClimateData";

import "./App.css";
import "./responsive.css";

function App(){
  const [barraExpandida,setBarraExpandida]=useState(false);
  const [opcionActiva,setOpcionActiva]=useState("Resumen");

  const [temaOscuro,setTemaOscuro]=useState(()=>{
    try{
      const guardado=localStorage.getItem("tema-dashboard");
      return guardado===null?true:JSON.parse(guardado);
    }catch{
      return true;
    }
  });

  useEffect(()=>{
    localStorage.setItem("tema-dashboard",JSON.stringify(temaOscuro));
  },[temaOscuro]);

  const {data,loading}=useClimateData();
  const datos=useMemo(()=>adaptarClimateData(data),[data]);

  const cambiarOpcion=(opcion)=>{
    setOpcionActiva(opcion);

    if(
      window.innerWidth<=820 ||
      (window.innerHeight<=520 && window.innerWidth<=950)
    ){
      setBarraExpandida(false);
    }
  };
  const renderizarContenido=()=>{
    if(loading)
      return <div className="estado-datos">Cargando datos meteorológicos...</div>;

    if(!datos)
      return <div className="estado-datos">No se pudieron cargar los datos.</div>;

    const comunes={
      estaciones:datos.estaciones,
      datosTemperatura:datos.seriesTemperaturas,
      temaOscuro,
    };

    switch(opcionActiva){
      case "Resumen":
        return <ResumenMeteorologico {...comunes}/>;

      case "Clima en tiempo real":
        return(
          <div className="pantalla-provisional">
            <h2>Clima en tiempo real</h2>
            <p>Los datos disponibles actualmente tienen resolución diaria.</p>
          </div>
        );

      case "Históricos":
        return <TemperatureChart {...comunes}/>;

      case "Índices vitivinícolas":
        return(
          <div className="indices-grid">
            <WinklerCard
              estaciones={datos.estaciones}
              seriesTemperaturas={datos.seriesTemperaturas}
              fichasTemporada={datos.fichasTemporada}
              temporadaEnCurso={datos.temporadaEnCurso}
            />
            <HuglinCard
              estaciones={datos.estaciones}
              seriesTemperaturas={datos.seriesTemperaturas}
              fichasTemporada={datos.fichasTemporada}
              temporadaEnCurso={datos.temporadaEnCurso}
            />
          </div>
        );

      case "Alertas y reportes":
        return(
          <AlertasReportes
            {...comunes}
            fichasTemporada={datos.fichasTemporada}
            rachas={datos.rachas}
            temporadaEnCurso={datos.temporadaEnCurso}
          />
        );

      case "Configuración":
        return(
          <div className="pantalla-provisional">
            <h2>Configuración</h2>
            <p>Configuración general del sistema.</p>
            <div style={{ paddingBottom: "50px" }}>
              <LoginView />
            </div>
          </div>
        );

      default:
        return(
          <div className="pantalla-provisional">
            <h2>{opcionActiva}</h2>
            <p>Esta sección será implementada próximamente.</p>
          </div>
        );
    }
  };

  return(
    <div className={`aplicacion ${temaOscuro?"tema-pagina-oscuro":"tema-pagina-claro"}`}>
      <BarraLateral
        expandida={barraExpandida}
        cambiarEstado={setBarraExpandida}
        opcionActiva={opcionActiva}
        cambiarOpcion={cambiarOpcion}
        temaOscuro={temaOscuro}
        cambiarTema={()=>setTemaOscuro(actual=>!actual)}
      />

      <button
        type="button"
        aria-label="Cerrar menú"
        className={`sidebar-overlay ${barraExpandida?"visible":""}`}
        onClick={()=>setBarraExpandida(false)}
      />

      <main className={`contenido ${barraExpandida?"contenido-expandido":"contenido-contraido"}`}>
        {renderizarContenido()}
      </main>
    </div>
  );
}

export default App;