import { useEffect, useMemo, useState } from "react";
import "./HuglinCard.css";
import BadgeCompletitud from "../BadgeCompletitud/BadgeCompletitud";
import "./HuglinCard.css";

interface Estacion {
  id: string;
  nombre?: string;
  huerto?: string;
  calidad_dato?: CalidadDato;
}

interface HuglinJSON {
  valor: number | null;
  clasificacion: string | null;
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
  indices?: { huglin?: HuglinJSON | null };
  huglin?: HuglinJSON | null;
  clasificacion?: {
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
    year: "numeric",
  })
    .format(new Date(`${v}T12:00:00`))
    .replace(".", "");
};

function HuglinCard({
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
            .map((f) => f.temporada),
        ),
      ].sort(),
    [fichasTemporada, estacionActiva],
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
          : temporadas.at(-1)!,
      );
    }
  }, [temporadas, temporada, temporadaEnCurso]);

  const ficha = useMemo(
    () =>
      fichasTemporada.find(
        (f) =>
          (f.estacionId ?? f.estacion_id) === estacionActiva &&
          f.temporada === temporada,
      ) ?? null,
    [fichasTemporada, estacionActiva, temporada],
  );

  const huglin = ficha?.indices?.huglin ?? ficha?.huglin ?? null;

  const sinDato = huglin?.valor === null || huglin?.valor === undefined;

  /* La temporada puede estar en curso aunque el índice aún no tenga valor */
  const enCurso =
    ficha?.clasificacion?.en_curso === true ||
    ficha?.temporada === temporadaEnCurso;

  const estadoTemporada = !ficha
    ? "Sin dato"
    : enCurso
      ? "En curso"
      : "Finalizada";

  return (
    <article className="huglin-card">
      <header className="huglin-card-header">
        <div className="huglin-header-top">
          <div>
            <span className="huglin-badge">Índice bioclimático</span>

            <h4>Índice Heliotérmico de Huglin (IH)</h4>
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

      <div className="huglin-card-body">
        <div className="huglin-metric">
          <span className="huglin-value">{numero(huglin?.valor)}</span>

          {!sinDato && <span className="huglin-unit">IH</span>}
        </div>

        <div className="huglin-classification">
          <span className="huglin-region">
            {huglin?.clasificacion ?? "Sin dato"}
          </span>

          <span className="huglin-desc">Clasificación heliotérmica</span>
        </div>
      </div>

      {huglin?.motivo_nulo && (
        <div className="huglin-aviso">{huglin.motivo_nulo}</div>
      )}

      <div className="huglin-temporada-info">
        <div>
          <span>Temporada</span>
          <strong>{ficha?.temporada ?? "Sin dato"}</strong>
        </div>

        <div>
          <span>Estado</span>

          <strong className={enCurso ? "estado-curso" : ""}>
            {estadoTemporada}
          </strong>
        </div>

        <div>
          <span>Inicio</span>
          <strong>{fecha(ficha?.periodo?.inicio)}</strong>
        </div>

        <div>
          <span>Fin</span>
          <strong>
            {ficha?.periodo?.fin
              ? fecha(`${ficha.periodo.fin.slice(0, 4)}-03-31`)
              : "Sin dato"}
          </strong>
        </div>
      </div>
    </article>
  );
}

export default HuglinCard;
