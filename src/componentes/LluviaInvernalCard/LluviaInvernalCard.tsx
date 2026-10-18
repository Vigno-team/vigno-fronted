import { useEffect, useMemo, useState } from "react";
import "./LluviaInvernalCard.css";

interface Estacion {
  id: string;
  nombre?: string;
  huerto?: string;
}

interface LluviaInvernalJSON {
  valor?: number | null;
  acumulado_mm?: number | null;
  acumulado?: number | null;
  promedio_historico?: number | null;
  promedio_historico_mm?: number | null;
  promedio?: number | null;
  diferencia_porcentual?: number | null;
  diferencia_pct?: number | null;
  variacion_pct?: number | null;
  motivo_nulo?: string | null;
  periodo?: {
    inicio?: string | null;
    fin?: string | null;
  };
}

interface ClasificacionJSON {
  termica?: string | null;
  hidrica?: string | null;
  criterio?: string | null;
  en_curso?: boolean | null;
  parcial_hasta?: string | null;
  motivo_nulo?: string | null;
  motivo_nulo_termica?: string | null;
  motivo_nulo_hidrica?: string | null;
}

interface FichaTemporada {
  temporada: string;
  estacion_id?: string;
  estacionId?: string;
  periodo?: {
    inicio?: string | null;
    fin?: string | null;
  };
  indices?: {
    lluvia_invernal?: LluviaInvernalJSON | null;
    winkler?: { motivo_nulo?: string | null } | null;
  };
  lluvia_invernal?: LluviaInvernalJSON | null;
  clasificacion?: ClasificacionJSON | null;
}

interface Props {
  estaciones?: Estacion[];
  fichasTemporada?: FichaTemporada[];
  temporadaEnCurso?: string | null;
}

const TEXTO_SIN_DATOS = "Sin datos suficientes";

const esNumero = (v: number | null | undefined): v is number =>
  v !== null && v !== undefined && Number.isFinite(Number(v));

const numero = (v: number | null | undefined) =>
  !esNumero(v) ? TEXTO_SIN_DATOS : Number(v).toFixed(1).replace(".", ",");

const formatearPorcentaje = (v: number | null | undefined) => {
  if (!esNumero(v)) return TEXTO_SIN_DATOS;
  const num = Number(v);
  const signo = num > 0 ? "+" : "";
  return `${signo}${num.toFixed(1).replace(".", ",")}%`;
};

const capitalizar = (texto?: string | null) => {
  if (!texto) return TEXTO_SIN_DATOS;
  const limpio = texto.trim();
  if (!limpio) return TEXTO_SIN_DATOS;
  return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
};

const desglosarCriterio = (criterio?: string | null): string[] => {
  if (!criterio) return [];
  return criterio
    .split(/\.\s+/)
    .map(oracion => oracion.trim().replace(/\.$/, ""))
    .filter(
      oracion =>
        Boolean(oracion) &&
        !oracion.toLowerCase().startsWith("temporada en curso")
    );
};

const fecha = (v?: string | null) => {
  if (!v) return TEXTO_SIN_DATOS;

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(`${v}T12:00:00`))
    .replace(".", "");
};

function LluviaInvernalCard({
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

  const temporadas = useMemo(
    () =>
      [
        ...new Set(
          fichasTemporada
            .filter(f => (f.estacionId ?? f.estacion_id) === estacionActiva)
            .map(f => f.temporada)
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
        f =>
          (f.estacionId ?? f.estacion_id) === estacionActiva &&
          f.temporada === temporada
      ) ?? null,
    [fichasTemporada, estacionActiva, temporada]
  );

  const lluvia = ficha?.indices?.lluvia_invernal ?? ficha?.lluvia_invernal ?? null;
  const clasif = ficha?.clasificacion ?? null;

  const valorAcumulado =
    lluvia?.acumulado_mm ?? lluvia?.valor ?? lluvia?.acumulado ?? null;

  const promedioHistorico =
    lluvia?.promedio_historico_mm ??
    lluvia?.promedio_historico ??
    lluvia?.promedio ??
    null;

  const diferenciaPctDirecta =
    lluvia?.diferencia_porcentual ??
    lluvia?.diferencia_pct ??
    lluvia?.variacion_pct ??
    null;

  const diferenciaPct =
    esNumero(diferenciaPctDirecta)
      ? diferenciaPctDirecta
      : esNumero(valorAcumulado) &&
        esNumero(promedioHistorico) &&
        promedioHistorico > 0
      ? ((valorAcumulado - promedioHistorico) / promedioHistorico) * 100
      : null;

  const sinDato = !esNumero(valorAcumulado);

  const anioInicio = ficha?.temporada ? ficha.temporada.split("-")[0] : null;
  const inicioInvernal =
    lluvia?.periodo?.inicio ?? (anioInicio ? `${anioInicio}-05-01` : null);
  const finInvernal =
    lluvia?.periodo?.fin ?? (anioInicio ? `${anioInicio}-08-31` : null);

  const ejeTermico = clasif?.termica ?? null;
  const ejeHidrico = clasif?.hidrica ?? null;

  const motivoNuloTermico =
    clasif?.motivo_nulo_termica ??
    ficha?.indices?.winkler?.motivo_nulo ??
    "No hay un resultado calculado para este índice y temporada.";

  const motivoNuloHidrico =
    clasif?.motivo_nulo_hidrica ??
    lluvia?.motivo_nulo ??
    "No hay un resultado calculado para este índice y temporada.";

  const listaCriterios = useMemo(
    () => desglosarCriterio(clasif?.criterio),
    [clasif?.criterio]
  );

  /* Condiciones independientes para que ambos avisos se muestren por separado */
  const esEnCurso = Boolean(clasif?.en_curso === true);
  const faltaHidrico = !ejeHidrico || ejeHidrico === TEXTO_SIN_DATOS || ejeHidrico === "null";
  const faltaTermico = !ejeTermico || ejeTermico === TEXTO_SIN_DATOS || ejeTermico === "null";
  const faltaGeneral = sinDato && Boolean(lluvia?.motivo_nulo) && !faltaHidrico;

  return (
    <article className="winkler-card">
      <header className="winkler-card-header">
        <div className="winkler-header-top">
          <div>
            <span className="winkler-badge">
              Índice Hídrico y Clasificación Integral
            </span>
            <h4>Lluvia Invernal (Mayo – Agosto)</h4>
          </div>

          <div className="winkler-selectores">
            <select
              className="winkler-select"
              value={estacionActiva}
              onChange={e => setEstacionId(e.target.value)}
            >
              {estaciones.map(est => (
                <option key={est.id} value={est.id}>
                  {est.nombre ?? est.huerto ?? est.id}
                </option>
              ))}
            </select>

            <select
              className="winkler-select"
              value={temporada}
              onChange={e => setTemporada(e.target.value)}
            >
              {temporadas.map(t => (
                <option key={t} value={t}>
                  Temporada {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Acumulado (mm) y Clasificación Hídrica + Térmica */}
      <div className="winkler-card-body">
        <div className="winkler-metric">
          <span className="winkler-value">{numero(valorAcumulado)}</span>
          {!sinDato && <span className="winkler-unit">mm</span>}
        </div>

        <div className="winkler-classification">
          <span className="winkler-region">
            {ejeHidrico
              ? `Temporada ${capitalizar(ejeHidrico)}`
              : `Clasificación hídrica · ${TEXTO_SIN_DATOS}`}
          </span>

          <div className="lluvia-ejes">
            <span className="winkler-desc">
              Eje Hídrico · <strong>{capitalizar(ejeHidrico)}</strong>
            </span>
            <span className="winkler-desc">
              Eje Térmico · <strong>{capitalizar(ejeTermico)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/*Criterio agronómico*/}
      {listaCriterios.length > 0 && (
        <div className="lluvia-criterio-box">
          <span className="winkler-badge">Criterio agronómico</span>
          <div className="lluvia-criterio-lista">
            {listaCriterios.map((regla, idx) => (
              <p key={idx} className="winkler-desc">
                {regla}.
              </p>
            ))}
          </div>
        </div>
      )}

      {/*Aviso de temporada en curso */}
      {clasif?.en_curso === true && (
        <div className="winkler-aviso">
          Clasificación parcial hasta{" "}
          {clasif.parcial_hasta ? fecha(clasif.parcial_hasta) : "la fecha actual"}.
        </div>
      )}

      {/* Avisos independientes para cada eje */}
      {faltaHidrico && (
        <div className="winkler-aviso">
          <strong>Eje Hídrico:</strong> {motivoNuloHidrico}
        </div>
      )}

      {faltaTermico && (
        <div className="winkler-aviso">
          <strong>Eje Térmico:</strong> {motivoNuloTermico}
        </div>
      )}

      {faltaGeneral && (
        <div className="winkler-aviso">{lluvia?.motivo_nulo}</div>
      )}

      {/* Ficha inferior de 4 columnas */}
      <div className="winkler-temporada-info">
        <div>
          <span>Promedio histórico</span>
          <strong>
            {esNumero(promedioHistorico)
              ? `${numero(promedioHistorico)} mm`
              : TEXTO_SIN_DATOS}
          </strong>
        </div>

        <div>
          <span>Diferencia %</span>
          <strong
            className={
              esNumero(diferenciaPct)
                ? diferenciaPct >= 0
                  ? "estado-curso"
                  : ""
                : ""
            }
          >
            {formatearPorcentaje(diferenciaPct)}
          </strong>
        </div>

        <div>
          <span>Inicio (Mayo)</span>
          <strong>{fecha(inicioInvernal)}</strong>
        </div>

        <div>
          <span>Fin (Agosto)</span>
          <strong>{fecha(finInvernal)}</strong>
        </div>
      </div>
    </article>
  );
}

export default LluviaInvernalCard;