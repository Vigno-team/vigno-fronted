import { useMemo, useState } from "react";
import SelectorVigno from "../SelectorVigno/SelectorVigno";
import { useFallasData } from "../../hooks/useFallasData";

// Muestra solo el archivo, la fila y el motivo de las fallas pendientes.
export default function AuditoriaConfiguracion({
  estaciones = [], fichasTemporada = [], temporadaEnCurso = null,
}) {
  const [estacionElegida, setEstacionElegida] = useState("");
  const [temporadaElegida, setTemporadaElegida] = useState("");

  const codigoEstacion = (e) => String(e.id ?? e.codigo ?? "");
  const estacion = estaciones.some((e) => codigoEstacion(e) === estacionElegida)
    ? estacionElegida : codigoEstacion(estaciones[0] ?? {});

  // Las temporadas se obtienen de los datos que ya recibió el dashboard.
  const temporadas = useMemo(() => {
    const lista = fichasTemporada
      .filter((f) => String(f.estacionId ?? f.estacion_id ?? "") === estacion)
      .map((f) => f.temporada).filter(Boolean);
    if (!lista.length && temporadaEnCurso) lista.push(temporadaEnCurso);
    return [...new Set(lista)].sort((a, b) => b.localeCompare(a));
  }, [fichasTemporada, estacion, temporadaEnCurso]);

  const temporada = temporadas.includes(temporadaElegida) ? temporadaElegida
    : temporadas.includes(temporadaEnCurso) ? temporadaEnCurso : temporadas[0] ?? "";

  const { data, loading, error } = useFallasData(estacion, temporada);
  const pendientes = (data?.fallas ?? [])
    .filter((f) => f.estadoCorreccion === "pendiente")
    .sort((a, b) => (a.archivoOrigen || "").localeCompare(b.archivoOrigen || "") || (a.fila ?? 0) - (b.fila ?? 0));

  const nombreArchivo = (ruta) => ruta ? String(ruta).split(/[\\/]/).pop() : "No informado";
  const descripcion = (f) => {
    if (f.motivo?.trim()) return f.motivo.trim();
    if (f.variable === "timestamp") return "Revisar la fecha y hora en el Excel.";
    if (f.tipoFalla === "nulo") return "Revisar el dato faltante.";
    if (f.tipoFalla === "fuera_de_rango") return "Verificar el valor fuera de rango.";
    return "Revisar este registro en el Excel original.";
  };

  return (
    <div className="cfg-auditoria">
      <p className="cfg-auditoria-ayuda">
        Consulta los registros pendientes y corrígelos directamente en el Excel original.
      </p>

      <div className="cfg-auditoria-filtros">
        <label>Estación
          <SelectorVigno value={estacion} disabled={!estaciones.length}
            onChange={(e) => { setEstacionElegida(e.target.value); setTemporadaElegida(""); }}>
            {estaciones.map((e) => <option key={codigoEstacion(e)} value={codigoEstacion(e)}>
              {e.nombre ?? codigoEstacion(e)}
            </option>)}
          </SelectorVigno>
        </label>
        <label>Temporada
          <SelectorVigno value={temporada} disabled={!temporadas.length}
            onChange={(e) => setTemporadaElegida(e.target.value)}>
            {temporadas.map((t) => <option key={t} value={t}>Temporada {t}</option>)}
          </SelectorVigno>
        </label>
      </div>

      {!estacion || !temporada ? (
        <p className="cfg-auditoria-estado">No hay estaciones o temporadas disponibles.</p>
      ) : error ? (
        <p className="cfg-auditoria-estado" role="alert">No fue posible consultar las fallas: {error}</p>
      ) : loading ? (
        <p className="cfg-auditoria-estado" role="status">Consultando datos de Django...</p>
      ) : pendientes.length === 0 ? (
        <p className="cfg-auditoria-estado" role="status">No hay registros pendientes de revisión.</p>
      ) : (
        <>
          <p className="cfg-auditoria-total">{pendientes.length} registros pendientes de revisión</p>
          <div className="cfg-auditoria-scroll" role="region" aria-label="Registros con fallas" tabIndex={0}>
            <table className="cfg-auditoria-tabla">
              <thead><tr><th>Archivo Excel</th><th>Fila</th><th>Observación</th></tr></thead>
              <tbody>
                {pendientes.map((f, i) => <tr key={`${f.id}-${i}`}>
                  <td data-label="Archivo Excel" title={f.archivoOrigen || ""}>{nombreArchivo(f.archivoOrigen)}</td>
                  <td data-label="Fila">{f.fila ?? "No indicada"}</td>
                  <td data-label="Observación">{descripcion(f)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
