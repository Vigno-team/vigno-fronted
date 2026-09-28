import { useEffect, useState } from "react";

import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import TemperatureChart from "./componentes/TemperatureChart";
import { WinklerCard } from "./componentes/WinklerCard/WinklerCard";
import { useClimateData } from "./hooks/useClimateData";

import "./App.css";


function App() {
  
  const [
    barraExpandida,
    setBarraExpandida,
  ] = useState(false);


  const [
    opcionActiva,
    setOpcionActiva,
  ] = useState("Históricos");




  const [
    temaOscuro,
    setTemaOscuro,
  ] = useState(() => {
    try {
      const guardado =
        localStorage.getItem(
          "tema-dashboard"
        );

      return guardado === null
        ? true
        : JSON.parse(guardado);
    } catch {
      return true;
    }
  });


  // Guarda el tema seleccionado.
  useEffect(() => {
    localStorage.setItem(
      "tema-dashboard",
      JSON.stringify(temaOscuro)
    );
  }, [temaOscuro]);

  const {
    data,
    loading,
  } = useClimateData();


  const renderizarContenido = () => {

    // Cargando información.
    if (loading) {
      return (
        <div className="estado-datos">
          Cargando datos meteorológicos...
        </div>
      );
    }


    // Error.
    if (!data) {
      return (
        <div className="estado-datos">
          No se pudieron cargar los datos.
        </div>
      );
    }


  

    if (opcionActiva === "Históricos") {
      return (
        <TemperatureChart
          estaciones={
            data.estaciones
          }
          datosTemperatura={
            data.seriesTemperaturas
          }
          datosHorarios={
            data.seriesHorarias ?? []
          }
          temaOscuro={
            temaOscuro
          }
        />
      );
    }




    if (
      opcionActiva ===
      "Clima en tiempo real"
    ) {
      return (
        <div className="pantalla-provisional">
          <h2>
            Clima en tiempo real
          </h2>

          <p>
            Panel meteorológico en tiempo real.
          </p>
        </div>
      );
    }


    // RESUMEN
    
    if (opcionActiva === "Resumen") {
      return (
        <div className="pantalla-provisional">
          <h2>
            Resumen meteorológico
          </h2>

          <p>
            Vista general de las estaciones meteorológicas.
          </p>
        </div>
      );
    }


    
    // OTRAS PANTALLAS
   

    return (
      <div className="pantalla-provisional">
        <h2>
          {opcionActiva}
        </h2>

        <p>
          Esta sección será implementada próximamente.
        </p>
      </div>
    );
  };


  // INTERFAZ
 
  return (
    <div
      className={`aplicacion ${
        temaOscuro
          ? "tema-pagina-oscuro"
          : "tema-pagina-claro"
      }`}
    >

      {/* Barra lateral siempre negra */}
      <BarraLateral
        expandida={
          barraExpandida
        }

        cambiarEstado={
          setBarraExpandida
        }

        opcionActiva={
          opcionActiva
        }

        cambiarOpcion={
          setOpcionActiva
        }

        temaOscuro={
          temaOscuro
        }

        cambiarTema={() =>
          setTemaOscuro(
            (actual) => !actual
          )
        }
      />


      {/* Área que cambia entre claro / oscuro */}
      <main
        className={`contenido ${
          barraExpandida
            ? "contenido contenido-expandido"
            : "contenido contenido-contraido"
        }
      >
        <TemperatureChart
          estaciones={data.estaciones}
          datosTemperatura={data.seriesTemperaturas}
        />
        <HarvestProgressBar
          avance={58}
          diasEstimados={12}
          temperaturas={[38, 37, 37.5, 38, 41]}
        />
        <WinklerCard seriesTemperaturas={data.seriesTemperaturas} />
      </main>

    </div>
  );
}

export default App;
