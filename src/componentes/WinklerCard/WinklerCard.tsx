import { useEffect, useMemo, useState } from "react";
import BadgeCompletitud from "../BadgeCompletitud/BadgeCompletitud";
import "./WinklerCard.css";

interface CalidadDato {
  completitud_pct?: number;
  confiable?: boolean;
}

interface Estacion {
  id: string;
  nombre?: string;
  huerto?: string;
  calidad_dato?: CalidadDato;
}

interface WinklerJSON {
  valor: number | null;
  region: string | null;
  motivo_nulo?: string | null;
}

interface FichaTemporada {
  temporada: string;
  estacion_id?: string;
  estacionId?: string;
  periodo?: {
    inicio?: string | null;
    fin?: string | null;
  };
  indices?: { winkler?: WinklerJSON | null };
  winkler?: WinklerJSON | null;
  clasificacion?: {
    termica?: string | null;
    en_curso?: boolean | null;
  };
}

interface Props {
  estaciones?: Estacion[];
  fichasTemporada?: FichaTemporada[];
  temporadaEnCurso?: string | null;
}

const numero = (v: number | null | undefined) =>
  v === null || v === undefined
    ? "Sin dato"
    : Number(v).toFixed(1).replace(".", ",");

const fecha = (v?: string | null) => {
  if (!v) return "Sin dato";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  })
    .format(new Date(`${v}T12:00:00`))
    .replace(".", "");
};

function WinklerCard({
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

  const temporadas = useMemo(() => [
    ...new Set(
      fichasTemporada
        .filter(
          f => (f.estacionId ?? f.estacion_id) === estacionActiva
        )
        .map(f => f.temporada)
    )
  ].sort(), [
    fichasTemporada,
    estacionActiva
  ]);

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
  }, [
    temporadas,
    temporada,
    temporadaEnCurso
  ]);

  const ficha = useMemo(() =>
    fichasTemporada.find(
      f =>
        (f.estacionId ?? f.estacion_id) === estacionActiva &&
        f.temporada === temporada
    ) ?? null,
  [
    fichasTemporada,
    estacionActiva,
    temporada
  ]);

  const winkler =
    ficha?.indices?.winkler ??
    ficha?.winkler ??
    null;

  const sinDato =
    winkler?.valor === null ||
    winkler?.valor === undefined;

  /* La temporada puede estar en curso aunque Winkler aún no tenga valor */
  const enCurso =
    ficha?.clasificacion?.en_curso === true ||
    ficha?.temporada === temporadaEnCurso;

  const estadoTemporada =
    !ficha
      ? "Sin dato"
      : enCurso
        ? "En curso"
        : "Finalizada";

  return (
    <article className="winkler-card">

      <header className="winkler-card-header">
        <div className="winkler-header-top">

          <div>
            <span className="winkler-badge">
              Índice bioclimático
            </span>

            <h4>
              Índice de Winkler
            </h4>
          </div>

          <div className="winkler-selectores">

            <select
              className="winkler-select"
              value={estacionActiva}
              onChange={e =>
                setEstacionId(e.target.value)
              }
            >
              {estaciones.map(est => (
                <option
                  key={est.id}
                  value={est.id}
                >
                  {est.nombre ?? est.huerto ?? est.id}
                </option>
              ))}
            </select>

            <select
              className="winkler-select"
              value={temporada}
              onChange={e =>
                setTemporada(e.target.value)
              }
            >
              {temporadas.map(t => (
                <option
                  key={t}
                  value={t}
                >
                  Temporada {t}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* Muestra el badge de calidad de la estación activa si existe */}
        {estacionObjeto?.calidad_dato && (
          <div style={{ marginTop: "0.5rem" }}>
            <BadgeCompletitud
              completitud={estacionObjeto.calidad_dato.completitud_pct}
              confiable={estacionObjeto.calidad_dato.confiable}
            />
          </div>
        )}
      </header>

      <div className="winkler-card-body">

        <div className="winkler-metric">
          <span className="winkler-value">
            {numero(winkler?.valor)}
          </span>

          {!sinDato && (
            <span className="winkler-unit">
              GDD
            </span>
          )}
        </div>

        <div className="winkler-classification">

          <span className="winkler-region">
            {winkler?.region
              ? `Región ${winkler.region}`
              : "Región sin dato"
            }
          </span>

          <span className="winkler-desc">
            Clasificación térmica · {ficha?.clasificacion?.termica ?? "Sin dato"}
          </span>

        </div>
      </div>

      {winkler?.motivo_nulo && (
        <div className="winkler-aviso">
          {winkler.motivo_nulo}
        </div>
      )}

      <div className="winkler-temporada-info">

        <div>
          <span>Temporada</span>
          <strong>
            {ficha?.temporada ?? "Sin dato"}
          </strong>
        </div>

        <div>
          <span>Estado</span>

          <strong
            className={
              enCurso
                ? "estado-curso"
                : ""
            }
          >
            {estadoTemporada}
          </strong>
        </div>

        <div>
          <span>Inicio</span>

          <strong>
            {fecha(ficha?.periodo?.inicio)}
          </strong>
        </div>

        <div>
          <span>Fin</span>

          <strong>
            {fecha(ficha?.periodo?.fin)}
          </strong>
        </div>

      </div>

    </article>
  );
}

export default WinklerCard;