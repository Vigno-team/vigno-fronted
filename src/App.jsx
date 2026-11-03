import { useEffect, useMemo, useState } from "react";

import "./App.css";

import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import ResumenMeteorologico from "./componentes/ResumenMeteorologico/ResumenMeteorologico";
import Historicos from "./componentes/Historicos/Historicos";
import AlertasReportes from "./componentes/AlertasReportes/AlertasReportes";
import MapaSatelital from "./componentes/MapaSatelital/MapaSatelital";
import Configuracion from "./componentes/Configuracion/Configuracion";
import IndicesVitivinicolasPanel from "./componentes/IndicesVitivinicolas/IndicesVitivinicolasPanel";

import { useClimateData } from "./hooks/useClimateData";
import { adaptarClimateData } from "./services/adaptarClimateData";
import { useConfiguracion } from "./contexto/ConfiguracionContext";

function App() {
  const { data, loading, error, avisos, recargar } = useClimateData();

  const datos = useMemo(() => adaptarClimateData(data), [data]);
  const { temaOscuro } = useConfiguracion();

  const [barraExpandida, setBarraExpandida] = useState(() => {
    const guardado = localStorage.getItem("barra-expandida");
    return guardado === null ? true : guardado === "true";
  });

  const [opcionActiva, setOpcionActiva] = useState("Resumen");

  useEffect(() => {
    localStorage.setItem("barra-expandida", String(barraExpandida));
  }, [barraExpandida]);

  const claseTema = temaOscuro ? "tema-pagina-oscuro" : "tema-pagina-claro";

  if (error) {
    return (
      <div className={claseTema}>
        <div className="app-cargando">
          <strong>No se pudieron cargar los datos meteorológicos.</strong>
          <span>{String(error)}</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={claseTema}>
        <div className="app-cargando">Cargando datos meteorológicos...</div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className={claseTema}>
        <div className="app-cargando">No existen datos meteorológicos disponibles.</div>
      </div>
    );
  }

  const renderizarContenido = () => {
    switch (opcionActiva) {
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
      case "Alertas y reportes":
        return (
          <AlertasReportes
            estaciones={datos.estaciones}
            datosTemperatura={datos.seriesTemperaturas}
            temaOscuro={temaOscuro}
          />
        );
      case "Índices vitivinícolas":
        return (
          <IndicesVitivinicolasPanel
            estaciones={datos.estaciones}
            fichasTemporada={datos.fichasTemporada}
            temporadaEnCurso={datos.temporadaEnCurso}
          />
        );
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
      case "Mapa Satelital":
        return (
          <MapaSatelital
            estaciones={datos.estaciones}
            mapaCalor={datos.mapaCalor}
            temaOscuro={temaOscuro}
          />
        );
      case "Configuración":
        return <Configuracion estaciones={datos.estaciones} onCargaConfirmada={recargar} />;
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

  return (
    <div className={`app ${claseTema}`}>
      <BarraLateral
        expandida={barraExpandida}
        setExpandida={setBarraExpandida}
        opcionActiva={opcionActiva}
        setOpcionActiva={setOpcionActiva}
      />

      <main className={`contenido ${barraExpandida ? "contenido-expandido" : "contenido-contraido"}`}>
        <div className="contenido-vista">
          {avisos?.length > 0 && (
            <aside className="aviso-integracion-api" role="status" aria-live="polite">
              <strong>Información de la conexión con el backend</strong>
              <ul>
                {avisos.map((mensaje, index) => (
                  <li key={`${index}-${mensaje}`}>{mensaje}</li>
                ))}
              </ul>
            </aside>
          )}
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
