import { useEffect, useState } from "react";

import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import TemperatureChart from "./componentes/Historicos/TemperatureChart";
import ResumenMeteorologico from "./componentes/ResumenMeteorologico/ResumenMeteorologico";
import AlertasReportes from "./componentes/AlertasReportes/AlertasReportes";
import { WinklerCard } from "./componentes/WinklerCard/WinklerCard";
import { HuglinCard } from "./componentes/HuglinCard/HuglinCard";

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
  ] = useState("Resumen");

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
        : JSON.parse(
            guardado
          );
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "tema-dashboard",
      JSON.stringify(
        temaOscuro
      )
    );
  }, [temaOscuro]);

  const {
    data,
    loading,
  } = useClimateData();

  const renderizarContenido =
    () => {
      if (loading) {
        return (
          <div className="estado-datos">
            Cargando datos meteorológicos...
          </div>
        );
      }

      if (!data) {
        return (
          <div className="estado-datos">
            No se pudieron cargar los datos.
          </div>
        );
      }

      switch (opcionActiva) {
        case "Resumen":
          return (
            <ResumenMeteorologico
              estaciones={
                data.estaciones
              }
              datosTemperatura={
                data.seriesTemperaturas
              }
              temaOscuro={
                temaOscuro
              }
            />
          );

        case "Clima en tiempo real":
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

        case "Históricos":
          return (
            <TemperatureChart
              estaciones={
                data.estaciones
              }
              datosTemperatura={
                data.seriesTemperaturas
              }
              temaOscuro={
                temaOscuro
              }
            />
          );

        case "Índices vitivinícolas":
          return (
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <WinklerCard
                seriesTemperaturas={data.seriesTemperaturas}
                estaciones={data.estaciones}
              />
              <HuglinCard
                seriesTemperaturas={data.seriesTemperaturas}
                estaciones={data.estaciones}
              />
            </div>
          );

        case "Alertas y reportes":
          return (
            <AlertasReportes
              estaciones={
                data.estaciones
              }
              datosTemperatura={
                data.seriesTemperaturas
              }
              temaOscuro={
                temaOscuro
              }
            />
          );

        case "Configuración":
          return (
            <div className="pantalla-provisional">
              <h2>
                Configuración
              </h2>

              <p>
                Configuración general del sistema.
              </p>
            </div>
          );

        default:
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
      }
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
            (actual) =>
              !actual
          )
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