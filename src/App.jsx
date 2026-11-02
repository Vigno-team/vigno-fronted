import { useEffect, useMemo, useState } from "react";

import "./App.css";

import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import ResumenMeteorologico from "./componentes/ResumenMeteorologico/ResumenMeteorologico";
import Historicos from "./componentes/Historicos/Historicos";
import AlertasReportes from "./componentes/AlertasReportes/AlertasReportes";

import WinklerCard from "./componentes/WinklerCard/WinklerCard";
import HuglinCard from "./componentes/HuglinCard/HuglinCard";
import LluviaInvernalCard from "./componentes/LluviaInvernalCard/LluviaInvernalCard";
import LluviaFueraInvernalCard from "./componentes/LluviaFueraInvernalCard/LluviaFueraInvernalCard";
import CalorExtremoCard from "./componentes/CalorExtremo/CalorExtremoCard";
import DatosConFallaCard from "./componentes/DatosConFallaCard/DatosConFallaCard";

import MapaSatelital from "./componentes/MapaSatelital/MapaSatelital";
import Configuracion from "./componentes/Configuracion/Configuracion";

import { useClimateData } from "./hooks/useClimateData";
import { adaptarClimateData } from "./services/adaptarClimateData";
import { useConfiguracion } from "./contexto/ConfiguracionContext";

function App() {
  /* ===================================================
     DATOS
  =================================================== */

  const { data, loading, error } = useClimateData();

  const datos = useMemo(() => adaptarClimateData(data), [data]);

  /* ===================================================
     CONFIGURACIÓN GLOBAL
  =================================================== */

  const { temaOscuro } = useConfiguracion();

  /* ===================================================
     BARRA LATERAL
  =================================================== */

  const [barraExpandida, setBarraExpandida] = useState(() => {
    const guardado = localStorage.getItem("barra-expandida");

    if (guardado === null) {
      return true;
    }

    return guardado === "true";
  });

  const [opcionActiva, setOpcionActiva] = useState("Resumen");

  useEffect(() => {
    localStorage.setItem("barra-expandida", String(barraExpandida));
  }, [barraExpandida]);

  /* ===================================================
     ERROR DE CARGA
  =================================================== */

  if (error) {
    return (
      <div className={temaOscuro ? "tema-pagina-oscuro" : "tema-pagina-claro"}>
        <div className="app-cargando">
          <strong>No se pudieron cargar los datos meteorológicos.</strong>

          <span>{String(error)}</span>
        </div>
      </div>
    );
  }

  /* ===================================================
     CARGANDO
  =================================================== */

  if (loading) {
    return (
      <div className={temaOscuro ? "tema-pagina-oscuro" : "tema-pagina-claro"}>
        <div className="app-cargando">Cargando datos meteorológicos...</div>
      </div>
    );
  }

  /* ===================================================
     DATOS NO DISPONIBLES
  =================================================== */

  if (!datos) {
    return (
      <div className={temaOscuro ? "tema-pagina-oscuro" : "tema-pagina-claro"}>
        <div className="app-cargando">
          No existen datos meteorológicos disponibles.
        </div>
      </div>
    );
  }

  /* ===================================================
     CONTENIDO
  =================================================== */

  const renderizarContenido = () => {
    switch (opcionActiva) {
      /* =================================================
         RESUMEN
      ================================================= */

      case "Resumen":
        return (
          <ResumenMeteorologico
            estaciones={datos.estaciones}
            datosTemperatura={datos.seriesTemperaturas}
            fichasTemporada={datos.fichasTemporada}
            temporadaEnCurso={datos.temporadaEnCurso}
            temaOscuro={temaOscuro}
          />
        );

      /* =================================================
         ALERTAS Y REPORTES
      ================================================= */

      case "Alertas y reportes":
        return (
          <AlertasReportes
            estaciones={datos.estaciones}
            datosTemperatura={datos.seriesTemperaturas}
            temaOscuro={temaOscuro}
          />
        );

      /* =================================================
         ÍNDICES VITIVINÍCOLAS
      ================================================= */

      case "Índices vitivinícolas":
        return (
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

            <CalorExtremoCard
              estaciones={datos.estaciones}
              fichasTemporada={datos.fichasTemporada}
              temporadaEnCurso={datos.temporadaEnCurso}
            />

            <LluviaInvernalCard
              estaciones={datos.estaciones}
              fichasTemporada={datos.fichasTemporada}
              temporadaEnCurso={datos.temporadaEnCurso}
            />

            <LluviaFueraInvernalCard
              estaciones={datos.estaciones}
              fichasTemporada={datos.fichasTemporada}
              temporadaEnCurso={datos.temporadaEnCurso}
            />

            <DatosConFallaCard
              estaciones={datos.estaciones}
              fichasTemporada={
                datos.completitudPorTemporada ?? datos.completitud_por_temporada
              }
              temporadaEnCurso={datos.temporadaEnCurso}
            />
          </div>
        );

      /* =================================================
         HISTÓRICOS
      ================================================= */

      case "Históricos":
        return (
          <Historicos
            estaciones={datos.estaciones}
            datosTemperatura={datos.seriesTemperaturas}
            fichasTemporada={datos.fichasTemporada}
            temporadaEnCurso={datos.temporadaEnCurso}
            temaOscuro={temaOscuro}
          />
        );

      /* =================================================
         MAPA SATELITAL
      ================================================= */

      case "Mapa Satelital":
        return (
          <MapaSatelital
            estaciones={datos.estaciones}
            mapaCalor={datos.mapaCalor}
            temaOscuro={temaOscuro}
          />
        );

      /* =================================================
         CONFIGURACIÓN
      ================================================= */

      case "Configuración":
        return <Configuracion />;

      /* =================================================
         DEFAULT
      ================================================= */

      default:
        return (
          <ResumenMeteorologico
            estaciones={datos.estaciones}
            datosTemperatura={datos.seriesTemperaturas}
            fichasTemporada={datos.fichasTemporada}
            temporadaEnCurso={datos.temporadaEnCurso}
            temaOscuro={temaOscuro}
          />
        );
    }
  };

  /* ===================================================
     INTERFAZ
  =================================================== */

  return (
    <div
      className={`app ${
        temaOscuro ? "tema-pagina-oscuro" : "tema-pagina-claro"
      }`}
    >
      <BarraLateral
        expandida={barraExpandida}
        setExpandida={setBarraExpandida}
        opcionActiva={opcionActiva}
        setOpcionActiva={setOpcionActiva}
      />

      <main
        className={`contenido ${
          barraExpandida ? "contenido-expandido" : "contenido-contraido"
        }`}
      >
        <div className="contenido-vista">{renderizarContenido()}</div>

        <footer className="footer-vigno">
          Este proyecto fue potenciado por la{" "}
          <strong>Universidad Autónoma de Chile</strong>
        </footer>
      </main>
    </div>
  );
}

export default App;
