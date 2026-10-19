import { useEffect, useMemo, useState } from "react";
import "./CalorExtremoCard.css";
import BadgeCompletitud from "../BadgeCompletitud/BadgeCompletitud";

interface Estacion {
  id: string;
  nombre?: string;
  huerto?: string;
  calidad_dato?: {
    completitud_pct?: number;
    confiable?: boolean;
  };
}

interface DiaCritico {
  fecha: string;
  tmax: number;
}

interface Racha {
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  tmax_maxima: number;
  con_incidencia?: boolean;
  interrumpida_por_dato_faltante?: boolean;
}

interface CalorJSON {
  dias_sobre_umbral?: number | null;
  umbral_c?: number | null;
  rachas_con_incidencia?: number | null;
  racha_maxima_dias?: number | null;
}

interface FichaTemporada {
  temporada: string;
  estacion_id?: string;
  estacionId?: string;
  calor?: CalorJSON | null;
  dias_criticos?: DiaCritico[];
  rachas?: Racha[];
}

interface Props {
  estaciones?: Estacion[];
  fichasTemporada?: FichaTemporada[];
  temporadaEnCurso?: string | null;
}

// Helper: Formato de número genérico
const numero = (v: number | null | undefined) =>
  v === null || v === undefined ? "Sin dato" : String(v);

// Helper: Formato de temperatura 
const formatoTemp = (v: number | null | undefined) => {
  if (v === null || v === undefined) return "Sin dato";
  return `${Number(v).toFixed(1).replace(".", ",")} °C`;
};

// Helper: Formato de fecha 
const fechaFormateada = (v?: string | null) => {
  if (!v) return "Sin dato";
  const d = new Date(`${v}T12:00:00`);
  if (isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .replace(".", "");
};

export function CalorExtremoCard({
  estaciones = [],
  fichasTemporada = [],
  temporadaEnCurso = null,
}: Props) {
  const [estacionId, setEstacionId] = useState("");
  const [temporada, setTemporada] = useState("");

  const estacionActiva =
    estacionId ||
    estaciones[0]?.id ||
    fichasTemporada[0]?.estacionId ||
    fichasTemporada[0]?.estacion_id ||
    "";

  useEffect(() => {
    if (!estacionId && estacionActiva) {
      setEstacionId(estacionActiva);
    }
  }, [estacionId, estacionActiva]);

  const estacionObjeto = estaciones.find((e) => e.id === estacionActiva);

  const temporadas = useMemo(
    () =>
      [
        ...new Set(
          fichasTemporada
            .filter((f) => (f.estacionId ?? f.estacion_id) === estacionActiva)
            .map((f) => f.temporada)
        ),
      ].sort(),
    [fichasTemporada, estacionActiva]
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

  const ficha = useMemo(
    () =>
      fichasTemporada.find(
        (f) =>
          (f.estacionId ?? f.estacion_id) === estacionActiva &&
          f.temporada === temporada
      ) ?? null,
    [fichasTemporada, estacionActiva, temporada]
  );

  const calor = ficha?.calor ?? null;
  const diasCriticos = ficha?.dias_criticos ?? [];
  const rachas = ficha?.rachas ?? [];

  return (
    <article className="huglin-card calor-card">
      <header className="huglin-card-header">
        <div className="huglin-header-top">
          <div>
            <span className="huglin-badge">ÍNDICE DE CALOR Y RIESGO TÉRMICO</span>
            <h4>Calor Extremo y Días Críticos</h4>
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
            >
              {temporadas.map((t) => (
                <option key={t} value={t}>
                  Temporada {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {estacionObjeto?.calidad_dato && (
          <div style={{ marginTop: "0.5rem" }}>
            <BadgeCompletitud
              completitud={estacionObjeto.calidad_dato.completitud_pct}
              confiable={estacionObjeto.calidad_dato.confiable}
            />
          </div>
        )}
      </header>

      {/* 1. Métricas Principales de Calor */}
      <div className="huglin-temporada-info calor-metricas-3">
        <div>
          <span>Días sobre {calor?.umbral_c ?? 35} °C</span>
          <strong>{numero(calor?.dias_sobre_umbral)}</strong>
        </div>

        <div>
          <span>Rachas con incidencia</span>
          <strong>{numero(calor?.rachas_con_incidencia)}</strong>
        </div>

        <div>
          <span>Racha máxima (días)</span>
          <strong>{numero(calor?.racha_maxima_dias)}</strong>
        </div>
      </div>

      {/* 2. Días Críticos (Top 10 T. Máx) */}
      <div className="calor-bloque-seccion">
        <span className="calor-subtitulo">Días Críticos (Top 10 T. Máx)</span>
        {diasCriticos.length > 0 ? (
          <div className="dias-criticos-chips">
            {diasCriticos.slice(0, 10).map((d, i) => (
              <div key={i} className="chip-dia">
                <span className="chip-fecha">{fechaFormateada(d.fecha)}</span>
                <strong className="chip-temp">{formatoTemp(d.tmax)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="huglin-aviso">Sin registros de días críticos.</div>
        )}
      </div>

      {/* 3 y 4. Rachas Térmicas y Advertencias */}
      <div className="calor-bloque-seccion">
        <span className="calor-subtitulo">Rachas Térmicas con Incidencia</span>
        {rachas.length > 0 ? (
          <div className="lista-rachas">
            {rachas.map((r, i) => (
              <div key={i} className="item-racha">
                <div className="racha-detalles">
                  <span><strong>Inicio:</strong> {fechaFormateada(r.fecha_inicio)}</span>
                  <span><strong>Fin:</strong> {fechaFormateada(r.fecha_fin)}</span>
                  <span><strong>Duración:</strong> {r.dias} días</span>
                  <span><strong>T. Máx:</strong> {formatoTemp(r.tmax_maxima)}</span>
                </div>

                <div className="racha-tags">
                  {r.con_incidencia && (
                    <span className="tag-incidencia">Con Incidencia</span>
                  )}
                  {r.interrumpida_por_dato_faltante && (
                    <span className="tag-advertencia" title="Racha interrumpida por dato faltante">
                      ⚠️ Dato Incompleto
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="huglin-aviso">
            No se registraron rachas de calor con incidencia en el periodo.
          </div>
        )}
      </div>
    </article>
  );
}

export default CalorExtremoCard;