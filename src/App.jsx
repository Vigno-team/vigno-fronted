import { useEffect, useMemo, useState } from "react";
import "./App.css";
import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import ResumenMeteorologico from "./componentes/ResumenMeteorologico/ResumenMeteorologico";
import AlertasReportes from "./componentes/AlertasReportes/AlertasReportes";
import Historicos from "./componentes/Historicos/Historicos";
import IndicesVitivinicolasPanel from "./componentes/IndicesVitivinicolas/IndicesVitivinicolasPanel";
import DatosConFallaCard from "./componentes/DatosConFallaCard/DatosConFallaCard";
import MapaSatelital from "./componentes/MapaSatelital/MapaSatelital";
import Configuracion from "./componentes/Configuracion/Configuracion";
import { useClimateData } from "./hooks/useClimateData";
import { adaptarClimateData } from "./services/adaptarClimateData";
import { useConfiguracion } from "./contexto/ConfiguracionContext";

export default function App() {
  const { data, loading, error, recargar } = useClimateData("/v1/datos");
  const datos = useMemo(() => adaptarClimateData(data), [data]);
  const { temaOscuro } = useConfiguracion();
  const [opcionActiva, setOpcionActiva] = useState("Resumen");
  const [barraExpandida, setBarraExpandida] = useState(() =>
    localStorage.getItem("barra-expandida") !== "false"
  );

  useEffect(() => {
    localStorage.setItem("barra-expandida", String(barraExpandida));
  }, [barraExpandida]);

  const comunes = {
    estaciones: datos?.estaciones ?? [],
    fichasTemporada: datos?.fichasTemporada ?? [],
    temporadaEnCurso: datos?.temporadaEnCurso ?? null,
  };

  const pantallas = {
    "Resumen": () => <ResumenMeteorologico {...comunes} datosTemperatura={datos?.seriesTemperaturas ?? []} temaOscuro={temaOscuro} />,
    "Alertas y reportes": () => <AlertasReportes estaciones={comunes.estaciones} datosTemperatura={datos?.seriesTemperaturas ?? []} temaOscuro={temaOscuro} />,
    "Históricos": () => <Historicos {...comunes} datosTemperatura={datos?.seriesTemperaturas ?? []} temaOscuro={temaOscuro} />,
    "Mapa Satelital": () => <MapaSatelital estaciones={comunes.estaciones} mapaCalor={datos?.mapaCalor} seriesTemperaturas={datos?.seriesTemperaturas ?? []} temaOscuro={temaOscuro} />,
    "Configuración": () => <Configuracion estaciones={comunes.estaciones} onCargaConfirmada={recargar} />,
    "Índices vitivinícolas": () => (
      <>
        <IndicesVitivinicolasPanel {...comunes} />
        <div className="indices-grid">
          <DatosConFallaCard {...comunes} onDatosActualizados={recargar} />
          <section className="winkler-card" style={{ padding: 20 }}>
            <h4>Predicción de cosecha</h4>
            <p>No disponible: Django aún no entrega una predicción local validada.</p>
          </section>
        </div>
      </>
    ),
  };

  const sinDatos = loading || error || !comunes.estaciones.length;
  const vistaError = (
    <div className="app-cargando" role="status">
      <strong>{loading ? "Cargando datos desde Django..." : error ? "No se pudieron cargar los datos." : "No hay estaciones con datos."}</strong>
      {error && <span>{error}</span>}
      {!loading && <button type="button" onClick={recargar}>Reintentar conexión</button>}
      {!loading && <p>Puedes ir a Configuración para cargar archivos Excel.</p>}
    </div>
  );

  return (
    <div className={`app ${temaOscuro ? "tema-pagina-oscuro" : "tema-pagina-claro"}`}>
      <BarraLateral
        expandida={barraExpandida}
        setExpandida={setBarraExpandida}
        opcionActiva={opcionActiva}
        setOpcionActiva={setOpcionActiva}
      />
      <main className={`contenido ${barraExpandida ? "contenido-expandido" : "contenido-contraido"}`}>
        <div className="contenido-vista">
          {opcionActiva === "Configuración"
            ? pantallas["Configuración"]()
            : sinDatos ? vistaError : (pantallas[opcionActiva] || pantallas.Resumen)()}
        </div>
        <footer className="footer-vigno">
          Este proyecto fue potenciado por la <strong>Universidad Autónoma de Chile</strong>
        </footer>
      </main>
    </div>
  );
}
