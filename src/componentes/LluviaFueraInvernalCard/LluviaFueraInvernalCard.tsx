import React, { useMemo, useState, useEffect } from "react";
import "./LluviaFueraInvernalCard.css";

// 1. Mapeamos exactamente la interfaz de completitud_por_temporada del contrato
interface CompletitudTemporada {
  estacion_id?: string;
  estacionId?: string;
  temporada: string;
  lluvia_fuera_invierno_mm?: number | null;
}

interface Estacion {
  id: string;
  nombre?: string;
  huerto?: string;
}

interface Props {
  estaciones?: Estacion[];
  fichasTemporada?: CompletitudTemporada[]; // Recibe completitud_por_temporada o completitudPorTemporada
  completitudPorTemporada?: CompletitudTemporada[];
  temporadaEnCurso?: string | null;
}

// Helper: Formato de lluvia con coma chilena
const formatoLluvia = (v: number | null | undefined) => {
  if (v === null || v === undefined) return "Sin dato";
  return `${Number(v).toFixed(1).replace(".", ",")} mm`;
};

export function LluviaFueraInvernalCard({
  estaciones = [],
  fichasTemporada = [],
  completitudPorTemporada,
  temporadaEnCurso = null,
}: Props) {
  const listaFichas = useMemo(
    () =>
      fichasTemporada && fichasTemporada.length > 0
        ? fichasTemporada
        : (completitudPorTemporada ?? []),
    [fichasTemporada, completitudPorTemporada]
  );

  const [estacionId, setEstacionId] = useState("");
  const [temporada, setTemporada] = useState("");

  const estacionActiva =
    estacionId ||
    estaciones[0]?.id ||
    listaFichas[0]?.estacion_id ||
    listaFichas[0]?.estacionId ||
    "";

  useEffect(() => {
    if (!estacionId && estacionActiva) {
      setEstacionId(estacionActiva);
    }
  }, [estacionId, estacionActiva]);

  // Filtramos las temporadas disponibles exclusivamente para la estación activa
  const temporadas = useMemo(
    () =>
      [
        ...new Set(
          listaFichas
            .filter((f) => (f.estacion_id ?? f.estacionId) === estacionActiva)
            .map((f) => f.temporada)
        ),
      ].sort(),
    [listaFichas, estacionActiva]
  );

  useEffect(() => {
    if (!temporadas.length) {
      setTemporada("");
      return;
    }

    if (!temporadas.includes(temporada)) {
      setTemporada(
        temporadas.includes(temporadaEnCurso ?? "")
          ? temporadaEnCurso!
          : temporadas.at(-1)!
      );
    }
  }, [temporadas, temporada, temporadaEnCurso]);

  // Buscamos el registro exacto que hace match con estación y temporada
  const registroActual = useMemo(
    () =>
      listaFichas.find(
        (f) =>
          (f.estacion_id ?? f.estacionId) === estacionActiva &&
          f.temporada === temporada
      ) ?? null,
    [listaFichas, estacionActiva, temporada]
  );

  const lluviaMm = registroActual?.lluvia_fuera_invierno_mm;
  const sinDato = lluviaMm === null || lluviaMm === undefined;

  return (
    <article className="huglin-card lluvia-invernal-card">
      <header className="huglin-card-header">
        <div className="huglin-header-top">
          <div>
            <span className="huglin-badge">ÍNDICE HÍDRICO</span>
            <h4>Lluvia Fuera de Invierno</h4>
          </div>

          <div className="huglin-selectores">
            <select
              className="huglin-select"
              value={estacionActiva}
              onChange={(e) => setEstacionId(e.target.value)}
            >
              {estaciones.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre ?? est.huerto ?? est.id}
                </option>
              ))}
            </select>

            <select
              className="huglin-select"
              value={temporada}
              onChange={(e) => setTemporada(e.target.value)}
              disabled={temporadas.length === 0}
            >
              {temporadas.length === 0 ? (
                <option value="">Sin temporadas</option>
              ) : (
                temporadas.map((t) => (
                  <option key={t} value={t}>
                    Temporada {t}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </header>

      {/* Bloque principal de la métrica */}
      <div className="lluvia-bloque-seccion">
        <span className="lluvia-subtitulo">Precipitación Acumulada Extra-Invernal</span>
        
        <div className="item-lluvia">
          <div className="lluvia-detalles">
            <span><strong>Total Registrado:</strong></span>
            {sinDato ? (
              <span className="huglin-aviso" style={{ padding: 0, background: 'transparent', border: 'none' }}>
                Sin dato
              </span>
            ) : (
              <strong className="chip-mm">{formatoLluvia(lluviaMm)}</strong>
            )}
          </div>

          <div className="lluvia-tags">
            {sinDato && (
              <span className="tag-advertencia" title="No hay registros para este periodo">
                ⚠️ Dato Incompleto
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default LluviaFueraInvernalCard;