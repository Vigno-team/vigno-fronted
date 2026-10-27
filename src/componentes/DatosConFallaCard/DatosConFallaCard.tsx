import React, { useState, useEffect, useMemo } from "react";
import { useFallasData } from "../../hooks/useFallasData";
import TablaFallas from "../TablaFallas/TablaFallas";
import ModalCorreccionFalla from "../ModalCorreccionFalla/ModalCorreccionFalla";
import { RegistroFalla } from "../../types/fallas";
import "./DatosConFallaCard.css";

interface Estacion {
  id: string;
  nombre?: string;
  huerto?: string;
}

interface Props {
  estaciones?: Estacion[];
  fichasTemporada?: Array<{ estacion_id?: string; estacionId?: string; temporada: string }>;
  temporadaEnCurso?: string | null;
}

export function DatosConFallaCard({
  estaciones = [],
  fichasTemporada = [],
  temporadaEnCurso = null,
}: Props) {
  const [estacionId, setEstacionId] = useState("");
  const [temporada, setTemporada] = useState("");
  const [fallaParaCorregir, setFallaParaCorregir] = useState<RegistroFalla | null>(null);

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

  // Hook que consulta la API /api/v1/calidad/fallas?estacion={estacionActiva}&temporada={temporada}
  const { data, loading, error } = useFallasData(estacionActiva, temporada);

  const resumen = data?.resumen;
  const fallas = data?.fallas ?? [];

  return (
    <article className="huglin-card fallas-card">
      <header className="huglin-card-header">
        <div className="huglin-header-top">
          <div>
            <span className="huglin-badge">AUDITORÍA Y CALIDAD DE DATOS</span>
            <h4>Datos con Falla e Inconsistencias</h4>
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
      </header>

      {/* Métricas Resumen */}
      <div className="huglin-temporada-info fallas-metricas">
        <div>
          <span>Total Fallas</span>
          <strong>{loading ? "..." : (resumen?.totalFallas ?? 0)}</strong>
        </div>
        <div>
          <span>Por Tipo (Rech/Nulo/Fuera)</span>
          <strong>
            {loading
              ? "..."
              : `${resumen?.porTipo?.rechazado ?? 0} / ${resumen?.porTipo?.nulo ?? 0} / ${resumen?.porTipo?.fuera_de_rango ?? 0}`}
          </strong>
        </div>
        <div>
          <span>Por Var (Tmax/Tmin/Pcp)</span>
          <strong>
            {loading
              ? "..."
              : `${resumen?.porVariable?.tmax ?? 0} / ${resumen?.porVariable?.tmin ?? 0} / ${resumen?.porVariable?.precipitacion ?? 0}`}
          </strong>
        </div>
      </div>

      {/* Tabla con detalle */}
      <TablaFallas
        fallas={fallas}
        estacionId={estacionActiva}
        temporada={temporada}
        onAbrirModal={(falla) => setFallaParaCorregir(falla)}
      />

      {/* Modal de Corrección Manual */}
      <ModalCorreccionFalla
        falla={fallaParaCorregir}
        onCerrar={() => setFallaParaCorregir(null)}
      />
    </article>
  );
}

export default DatosConFallaCard;