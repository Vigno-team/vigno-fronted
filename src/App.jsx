import { useEffect, useMemo, useState } from "react";
import "./App.css";

import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import ResumenMeteorologico from "./componentes/ResumenMeteorologico/ResumenMeteorologico";
import AlertasReportes from "./componentes/AlertasReportes/AlertasReportes";
import Historicos from "./componentes/Historicos/Historicos";
import IndicesVitivinicolasPanel from "./componentes/IndicesVitivinicolas/IndicesVitivinicolasPanel";
import Configuracion from "./componentes/Configuracion/Configuracion";
import CargaExcel from "./componentes/CargaExcel/CargaExcel";

import { adaptarPrediccionData } from "./services/adaptarPrediccionData";
import { useClimateData } from "./hooks/useClimateData";
import { adaptarClimateData } from "./services/adaptarClimateData";
import { useConfiguracion } from "./contexto/ConfiguracionContext";
import { useMarca } from "./contexto/MarcaContext";
import { useAuth } from "./contexto/AuthContext";
import { tienePermiso } from "./services/permisos";
import Usuarios from "./componentes/Usuarios/Usuarios";


export default function App() {
  const { user } = useAuth();
  const rol = user?.rol;

  const { data, loading, error, recargar } = useClimateData("/v1/datos");

  const datos = useMemo(() => adaptarClimateData(data), [data]);

  const {
    data: rawPrediccion,
    loading: loadingPrediccion,
    error: errorPrediccion,
  } = useClimateData("/v1/prediccion-ficticia");

  const datosPrediccion = useMemo(
    () => adaptarPrediccionData(rawPrediccion),
    [rawPrediccion]
  );

  const { temaOscuro } = useConfiguracion();

  const { marca } = useMarca();

  const [opcionActiva, setOpcionActiva] = useState("Resumen");

  const [barraExpandida, setBarraExpandida] = useState(
    () => localStorage.getItem("barra-expandida") !== "false"
  );

  useEffect(() => {
    localStorage.setItem("barra-expandida", String(barraExpandida));
  }, [barraExpandida]);

  const comunes = {
    estaciones: datos?.estaciones ?? [],
    fichasTemporada: datos?.fichasTemporada ?? [],
    temporadaEnCurso: datos?.temporadaEnCurso ?? null,
  };

  const sinPermisoVista = (
    <div className="app-cargando" role="status">
      <strong>No tienes permisos</strong>
    </div>
  );

  const pantallas = {
    "Resumen": () => (
      <ResumenMeteorologico
        {...comunes}
        datosTemperatura={datos?.seriesTemperaturas ?? []}
        temaOscuro={temaOscuro}
      />
    ),

    "Alertas y reportes": () => (
      <AlertasReportes
        estaciones={comunes.estaciones}
        datosTemperatura={datos?.seriesTemperaturas ?? []}
        temaOscuro={temaOscuro}
      />
    ),

    "Históricos": () => (
      <Historicos
        {...comunes}
        datosTemperatura={datos?.seriesTemperaturas ?? []}
        temaOscuro={temaOscuro}
      />
    ),

    "Configuración": () => (
      <Configuracion
        estaciones={comunes.estaciones}
        onCargaConfirmada={recargar}
      />
    ),

    "Índices vitivinícolas": () => (
      <IndicesVitivinicolasPanel
        {...comunes}
        onDatosActualizados={recargar}
        datosPrediccion={datosPrediccion}
        loadingPrediccion={loadingPrediccion}
        errorPrediccion={errorPrediccion}
      />
    ),

    "Gestion de datos y Estaciones": () =>
      tienePermiso(rol, "cargar_datos") ? (
        <div className="cargar-datos-vista">
          <CargaExcel
            estaciones={comunes.estaciones}
            onCargaConfirmada={recargar}
          />
        </div>
      ) : (
        sinPermisoVista
      ),

    "Usuarios": () =>
      tienePermiso(rol, "usuarios") ? (
        <Usuarios />
      ) : (
        sinPermisoVista
      ),
  };

  const sinDatos = loading || error || !comunes.estaciones.length;

  const vistaError = (
    <div className="app-cargando" role="status">
      <strong>
        {loading
          ? "Cargando datos desde Django..."
          : error
          ? "No se pudieron cargar los datos."
          : "No hay estaciones con datos."}
      </strong>

      {error && <span>{error}</span>}

      {!loading && (
        <button type="button" onClick={recargar}>
          Reintentar conexión
        </button>
      )}

      {!loading && tienePermiso(rol, "cargar_datos") && (
        <p>Puedes ir a Cargar datos para importar archivos Excel.</p>
      )}
    </div>
  );

  const vistaActual = pantallas[opcionActiva] || pantallas.Resumen;

  return (
    <div className={`app ${temaOscuro ? "tema-pagina-oscuro" : "tema-pagina-claro"}`}>
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
        <div className="contenido-vista">
          {["Configuración", "Gestion de datos y Estaciones", "Usuarios"].includes(opcionActiva)
            ? vistaActual()
            : sinDatos
            ? vistaError
            : vistaActual()}
        </div>

        <footer className="footer-vigno">
          {marca.texto_pie}
        </footer>
      </main>
    </div>
  );
}