import SelectorVigno from "../SelectorVigno/SelectorVigno";
import { useEffect, useState } from "react";
import { Database, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import {
  codigoEstacion,
  obtenerEstaciones,
  obtenerTemporadas,
  obtenerFichaTemporada,
  obtenerRachas,
} from "../../services/vignoApi";
import "./DiagnosticoBackend.css";

const mensaje = (error) =>
  error?.estado ? `HTTP ${error.estado}: ${error.message}` : String(error?.message ?? error);

export default function DiagnosticoBackend() {
  const [catalogos, setCatalogos] = useState({ estaciones: [], temporadas: [] });
  const [estacion, setEstacion] = useState("");
  const [temporada, setTemporada] = useState("");
  const [estado, setEstado] = useState({});
  const [cargando, setCargando] = useState(false);
  const [detalles, setDetalles] = useState(null);

  // A diferencia de otras pantallas, las pruebas se hacen solo al pulsar el botón.
  // No modifica los datos ni hace cambios en el backend.
  const probarCatalogos = async () => {
    setCargando(true);
    setDetalles(null);
    const respuestas = await Promise.allSettled([
      obtenerEstaciones(),
      obtenerTemporadas(),
    ]);
    const [resultadoEstaciones, resultadoTemporadas] = respuestas;
    const estaciones = resultadoEstaciones.status === "fulfilled" &&
      Array.isArray(resultadoEstaciones.value)
        ? resultadoEstaciones.value.filter(e => typeof (e?.codigo ?? e?.id) === "string")
        : [];
    const temporadas = resultadoTemporadas.status === "fulfilled" &&
      Array.isArray(resultadoTemporadas.value) ? resultadoTemporadas.value : [];

    setEstado({
      estaciones: resultadoEstaciones.status === "fulfilled" && Array.isArray(resultadoEstaciones.value)
        ? `Conectado (${estaciones.length} estaciones)`
        : resultadoEstaciones.status === "rejected"
          ? mensaje(resultadoEstaciones.reason) : "Respuesta no es una lista",
      temporadas: resultadoTemporadas.status === "fulfilled" && Array.isArray(resultadoTemporadas.value)
        ? `Conectado (${temporadas.length} temporadas)`
        : resultadoTemporadas.status === "rejected"
          ? mensaje(resultadoTemporadas.reason) : "Respuesta no es una lista",
      estacionesOk: resultadoEstaciones.status === "fulfilled" && Array.isArray(resultadoEstaciones.value),
      temporadasOk: resultadoTemporadas.status === "fulfilled" && Array.isArray(resultadoTemporadas.value),
    });
    setCatalogos({ estaciones, temporadas });
    setEstacion(estaciones.length ? codigoEstacion(estaciones[0]) : "");
    setTemporada(temporadas.at(-1) ?? "");
    setCargando(false);
  };

  const probarFicha = async () => {
    if (!estacion || !temporada) return;
    setCargando(true);
    const respuestas = await Promise.allSettled([
      obtenerFichaTemporada(temporada, estacion),
      obtenerRachas(temporada, estacion),
    ]);
    const [ficha, rachas] = respuestas;
    setDetalles({
      ficha: ficha.status === "fulfilled" ? ficha.value : null,
      rachas: rachas.status === "fulfilled" ? rachas.value : null,
      fichaError: ficha.status === "rejected" ? mensaje(ficha.reason) : null,
      rachasError: rachas.status === "rejected" ? mensaje(rachas.reason) : null,
    });
    setCargando(false);
  };

  return (
    <section className="db-panel">
      <header className="db-cabecera">
        <div>
          <span className="db-eyebrow">Diagnóstico de integración</span>
          <h1>Conexión con el backend</h1>
          <p>Prueba de lectura de datos reales. No modifica ninguna estación ni medición.</p>
        </div>
        <button onClick={probarCatalogos} disabled={cargando} type="button">
          <RefreshCw size={16} /> {cargando ? "Consultando…" : "Probar conexión"}
        </button>
      </header>
      <div className="db-estados">
        {[
          ["Estaciones", estado.estaciones, estado.estacionesOk],
          ["Temporadas", estado.temporadas, estado.temporadasOk],
        ].map(([titulo, texto, ok]) => (
          <article key={titulo}>
            {ok ? <CheckCircle2 size={19} className="db-ok" /> : <AlertCircle size={19} />}
            <div><strong>{titulo}</strong><span>{texto ?? "Aún no comprobado"}</span></div>
          </article>
        ))}
      </div>
      <div className="db-filtros">
        <label>
          Estación
          <SelectorVigno value={estacion} onChange={e => setEstacion(e.target.value)}>
            {catalogos.estaciones.map(e => (
              <option value={codigoEstacion(e)} key={codigoEstacion(e)}>
                {e.nombre ?? codigoEstacion(e)}
              </option>
            ))}
          </SelectorVigno>
        </label>
        <label>
          Temporada
          <SelectorVigno value={temporada} onChange={e => setTemporada(e.target.value)}>
            {catalogos.temporadas.map(t => <option key={t} value={t}>{t}</option>)}
          </SelectorVigno>
        </label>
        <button type="button" disabled={!estacion || !temporada || cargando} onClick={probarFicha}>
          <Database size={16} /> Consultar ficha y rachas
        </button>
      </div>
      {detalles && (
        <div className="db-detalles">
          <article>
            <h2>Ficha de temporada</h2>
            {detalles.fichaError ? <p className="db-error">{detalles.fichaError}</p> : (
              <pre>{JSON.stringify({
                estacion_id: detalles.ficha?.estacion_id,
                temporada: detalles.ficha?.temporada,
                winkler: detalles.ficha?.indices?.winkler,
                huglin: detalles.ficha?.indices?.huglin,
                calidad: detalles.ficha?.indices?.winkler?.calidad_dato,
              }, null, 2)}</pre>
            )}
          </article>
          <article>
            <h2>Rachas</h2>
            {detalles.rachasError ? <p className="db-error">{detalles.rachasError}</p> : (
              <pre>{JSON.stringify({
                estacion_id: detalles.rachas?.estacion_id,
                temporada: detalles.rachas?.temporada,
                umbral_c: detalles.rachas?.umbral_c,
                rachas: detalles.rachas?.rachas,
              }, null, 2)}</pre>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
