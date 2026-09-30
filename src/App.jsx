import { useEffect, useState } from "react";

import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import TemperatureChart from "./componentes/TemperatureChart";
import ResumenMeteorologico from "./componentes/ResumenMeteorologico/ResumenMeteorologico";

import { useClimateData } from "./hooks/useClimateData";

import "./App.css";

function App() {
  const [barraExpandida, setBarraExpandida] = useState(false);
  const [opcionActiva, setOpcionActiva] = useState("Resumen");

  const [temaOscuro, setTemaOscuro] = useState(() => {
    try {
      const guardado = localStorage.getItem("tema-dashboard");

      return guardado === null
        ? true
        : JSON.parse(guardado);
    } catch {
      return true;
    }
  });

  // Guarda el tema seleccionado
  useEffect(() => {
    localStorage.setItem(
      "tema-dashboard",
      JSON.stringify(temaOscuro)
    );
  }, [temaOscuro]);

  const { data, loading } = useClimateData();

  const renderizarContenido = () => {
    // Cargando datos
    if (loading) {
      return (
        <div className="estado-datos">
          Cargando datos meteorológicos...
        </div>
      );
    }

    // Error al cargar
    if (!data) {
      return (
        <div className="estado-datos">
          No se pudieron cargar los datos.
        </div>
      );
    }

    // Resumen
    if (opcionActiva === "Resumen") {
      return (
        <ResumenMeteorologico
          estaciones={data.estaciones}
          datosTemperatura={data.seriesTemperaturas}
          temaOscuro={temaOscuro}
        />
      );
    }

    // Históricos
    if (opcionActiva === "Históricos") {
      return (
        <TemperatureChart
          estaciones={data.estaciones}
          datosTemperatura={data.seriesTemperaturas}
          datosHorarios={data.seriesHorarias ?? []}
          temaOscuro={temaOscuro}
        />
      );
    }

    // Clima en tiempo real
    if (opcionActiva === "Clima en tiempo real") {
      return (
        <div className="pantalla-provisional">
          <h2>Clima en tiempo real</h2>
          <p>
            Panel meteorológico en tiempo real.
          </p>
        </div>
      );
    }

    // Índices vitivinícolas
    if (opcionActiva === "Índices vitivinícolas") {
      return (
        <div className="pantalla-provisional">
          <h2>Índices vitivinícolas</h2>
          <p>
            Visualización de índices térmicos y vitivinícolas.
          </p>
        </div>
      );
    }

    // Alertas y reportes
    if (opcionActiva === "Alertas y reportes") {
      return (
        <div className="pantalla-provisional">
          <h2>Alertas y reportes</h2>
          <p>
            Gestión de alertas meteorológicas y reportes.
          </p>
        </div>
      );
    }

    // Configuración
    if (opcionActiva === "Configuración") {
      return (
        <div className="pantalla-provisional">
          <h2>Configuración</h2>
          <p>
            Configuración general del sistema.
          </p>
        </div>
      );
    }

    return (
      <div className="pantalla-provisional">
        <h2>{opcionActiva}</h2>
        <p>
          Esta sección será implementada próximamente.
        </p>
      </div>
    );
  };

  return (
    <div
      className={`aplicacion ${
        temaOscuro
          ? "tema-pagina-oscuro"
          : "tema-pagina-claro"
      }`}
    >
      <BarraLateral
        expandida={barraExpandida}
        cambiarEstado={setBarraExpandida}
        opcionActiva={opcionActiva}
        cambiarOpcion={setOpcionActiva}
        temaOscuro={temaOscuro}
        cambiarTema={() =>
          setTemaOscuro((actual) => !actual)
        }
      />

      <main
        className={`contenido ${
          barraExpandida
            ? "contenido-expandido"
            : "contenido-contraido"
        }`}
      >
        {renderizarContenido()}
      </main>
    </div>
  );
}

export default App;