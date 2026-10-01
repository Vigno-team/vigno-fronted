import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  MapPin,
  Snowflake,
  ThermometerSun,
  TriangleAlert,
} from "lucide-react";
import MiniGraficoLinea from "./MiniGraficoLinea";
import "./ResumenMeteorologico.css";

// Opciones disponibles en el selector de período.
const PERIODOS = [
  { valor: "ultimo", texto: "Último día" },
  { valor: "7", texto: "7 días" },
  { valor: "30", texto: "30 días" },
  { valor: "temporada", texto: "Temporada" },
];

// Configuración de las series disponibles en el gráfico de temperatura.
const SERIES_TEMPERATURA = {
  maxima: { campo: "maxima", nombre: "Máxima", color: "#fb5263" },
  mediaDiaria: { campo: "mediaDiaria", nombre: "Media", color: "#aebed5" },
  minima: { campo: "minima", nombre: "Mínima", color: "#3389f4" },
};

// Utilidades para validar, formatear y resumir los datos.
const esNumero = (valor) => Number.isFinite(valor);

const formatearNumero = (valor, decimales = 1) => {
  if (!esNumero(valor)) return "—";
  return valor.toFixed(decimales).replace(".", ",");
};

const formatearFecha = (fecha) => {
  if (!fecha) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(`${fecha}T12:00:00`))
    .replace(".", "");
};

const promedio = (valores) => {
  const validos = valores.filter(esNumero);
  if (!validos.length) return null;
  return validos.reduce((total, valor) => total + valor, 0) / validos.length;
};

const sumar = (valores) => {
  const validos = valores.filter(esNumero);
  if (!validos.length) return null;
  return validos.reduce((total, valor) => total + valor, 0);
};

const tieneDatos = (dato) => {
  if (!dato) return false;
  return [
    dato.maxima,
    dato.minima,
    dato.mediaDiaria,
    dato.amplitudTermica,
    dato.precipitacionMm,
  ].some(esNumero);
};

// Recibe los datos meteorológicos, calcula los indicadores y construye el resumen visual.
function ResumenMeteorologico({ estaciones = [], datosTemperatura = [], temaOscuro = true }) {
  // Filtros y controles seleccionados por el usuario.
  const [estacionSeleccionada, setEstacionSeleccionada] = useState("");
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState("");
  const [periodo, setPeriodo] = useState("30");
  const [serieTemperatura, setSerieTemperatura] = useState("maxima");

  // Selecciona automáticamente la primera estación válida disponible.
  useEffect(() => {
    if (!estaciones.length) return;
    const existe = estaciones.some((estacion) => estacion.id === estacionSeleccionada);
    if (!existe) setEstacionSeleccionada(estaciones[0].id);
  }, [estaciones, estacionSeleccionada]);

  // Obtiene la estación seleccionada y sus registros ordenados cronológicamente.
  const estacion = useMemo(
    () => estaciones.find((item) => item.id === estacionSeleccionada),
    [estaciones, estacionSeleccionada]
  );

  const datosEstacion = useMemo(
    () =>
      datosTemperatura
        .filter((dato) => dato.estacionId === estacionSeleccionada)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [datosTemperatura, estacionSeleccionada]
  );

  // Obtiene las temporadas disponibles y deja primero la más reciente.
  const temporadasDisponibles = useMemo(() => {
    const temporadas = [...new Set(datosEstacion.map((dato) => dato.fecha.slice(0, 4)))];
    return temporadas.sort((a, b) => Number(b) - Number(a));
  }, [datosEstacion]);

  // Mantiene seleccionada una temporada válida.
  useEffect(() => {
    if (!temporadasDisponibles.length) return;
    const existe = temporadasDisponibles.includes(String(temporadaSeleccionada));
    if (!existe) setTemporadaSeleccionada(temporadasDisponibles[0]);
  }, [temporadasDisponibles, temporadaSeleccionada]);

  // Filtra los registros según la temporada y el período elegido.
  const datosTemporada = useMemo(() => {
    if (!temporadaSeleccionada) return [];
    return datosEstacion.filter((dato) => dato.fecha.startsWith(`${temporadaSeleccionada}-`));
  }, [datosEstacion, temporadaSeleccionada]);

  const datosPeriodo = useMemo(() => {
    if (periodo === "temporada") return datosTemporada;
    if (periodo === "ultimo") return datosTemporada.slice(-1);
    return datosTemporada.slice(-Number(periodo));
  }, [datosTemporada, periodo]);

  // Metadatos de calidad de la estación y temporada seleccionadas.
  const configuracionTemporada = estacion?.temporadas?.[temporadaSeleccionada];
  const confiable = configuracionTemporada?.confiable !== false;
  const completitud = configuracionTemporada?.completitud ?? null;

  const diasSinDatos = useMemo(
    () => datosTemporada.filter((dato) => !tieneDatos(dato)).length,
    [datosTemporada]
  );

  // Indicadores de temperatura del período visible.
  const registroMaximo = useMemo(
    () =>
      datosPeriodo.reduce((mejor, dato) => {
        if (!esNumero(dato.maxima)) return mejor;
        return !mejor || dato.maxima > mejor.maxima ? dato : mejor;
      }, null),
    [datosPeriodo]
  );

  const registroMinimo = useMemo(
    () =>
      datosPeriodo.reduce((mejor, dato) => {
        if (!esNumero(dato.minima)) return mejor;
        return !mejor || dato.minima < mejor.minima ? dato : mejor;
      }, null),
    [datosPeriodo]
  );

  const temperaturaMedia = useMemo(
    () => promedio(datosPeriodo.map((dato) => dato.mediaDiaria)),
    [datosPeriodo]
  );

  // Indicadores de amplitud térmica.
  const amplitudPromedio = useMemo(
    () => promedio(datosPeriodo.map((dato) => dato.amplitudTermica)),
    [datosPeriodo]
  );

  const amplitudMaxima = useMemo(
    () =>
      datosPeriodo.reduce((mejor, dato) => {
        if (!esNumero(dato.amplitudTermica)) return mejor;
        return !mejor || dato.amplitudTermica > mejor.amplitudTermica ? dato : mejor;
      }, null),
    [datosPeriodo]
  );

  // Acumulados y estadísticas de precipitación.
  const precipitacionPeriodo = useMemo(
    () => sumar(datosPeriodo.map((dato) => dato.precipitacionMm)),
    [datosPeriodo]
  );

  const precipitacionTemporada = useMemo(
    () => sumar(datosTemporada.map((dato) => dato.precipitacionMm)),
    [datosTemporada]
  );

  const maxLluviaDiaria = useMemo(
    () =>
      datosPeriodo.reduce((mejor, dato) => {
        if (!esNumero(dato.precipitacionMm)) return mejor;
        return !mejor || dato.precipitacionMm > mejor.precipitacionMm ? dato : mejor;
      }, null),
    [datosPeriodo]
  );

  const diasConLluvia = useMemo(
    () => datosPeriodo.filter((dato) => esNumero(dato.precipitacionMm) && dato.precipitacionMm > 0).length,
    [datosPeriodo]
  );

  // Umbrales usados para identificar riesgo térmico.
  const diasBajo2 = useMemo(
    () => datosPeriodo.filter((dato) => esNumero(dato.minima) && dato.minima <= 2).length,
    [datosPeriodo]
  );

  const diasBajo0 = useMemo(
    () => datosPeriodo.filter((dato) => esNumero(dato.minima) && dato.minima <= 0).length,
    [datosPeriodo]
  );

  const riesgoTermico = diasBajo2 > 0;
  const riesgoCritico = diasBajo0 > 0;

  // Valores auxiliares utilizados por la interfaz.
  const rangoInicio = datosTemporada[0]?.fecha;
  const rangoFin = datosTemporada[datosTemporada.length - 1]?.fecha;
  const textoPeriodo =
    periodo === "ultimo"
      ? "Último día"
      : periodo === "temporada"
        ? "Temporada completa"
        : `Últimos ${periodo} días`;
  const serieActual = SERIES_TEMPERATURA[serieTemperatura];

  return (
    <section className={`rm-dashboard ${temaOscuro ? "tema-oscuro" : "tema-claro"}`}>
      {/* Encabezado y controles principales */}
      <header className="rm-header">
        <div className="rm-header-texto">
          <h1>Resumen meteorológico</h1>
          <p>Principales condiciones observadas en la estación.</p>
        </div>

        <div className="rm-controles">
          <label className="rm-control">
            <span>Estación</span>
            <div className="rm-select">
              <MapPin size={14} />
              <select
                value={estacionSeleccionada}
                onChange={(evento) => setEstacionSeleccionada(evento.target.value)}
              >
                {estaciones.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre ?? item.huerto}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="rm-control rm-control-temporada">
            <span>Temporada</span>
            <div className="rm-select">
              <CalendarDays size={14} />
              <select
                value={temporadaSeleccionada}
                onChange={(evento) => setTemporadaSeleccionada(evento.target.value)}
              >
                {temporadasDisponibles.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>
          </label>

          <div className="rm-control">
            <span>Período</span>
            <div className="rm-periodos">
              {PERIODOS.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  className={periodo === opcion.valor ? "activo" : ""}
                  onClick={() => setPeriodo(opcion.valor)}
                >
                  {opcion.texto}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Estado general y calidad de los datos */}
      <div className="rm-resumen-barra">
        <span>
          <strong>Datos</strong> {formatearFecha(rangoInicio)} — {formatearFecha(rangoFin)}
        </span>

        {esNumero(completitud) && (
          <span><strong>{completitud} %</strong> completos</span>
        )}

        {confiable ? (
          <span className="rm-chip-ok"><CheckCircle2 size={12} />Confiable</span>
        ) : (
          <span className="rm-chip-warn"><TriangleAlert size={12} />Calidad limitada</span>
        )}

        {diasSinDatos > 0 && (
          <span>
            <strong>{diasSinDatos}</strong> {diasSinDatos === 1 ? "día sin datos" : "días sin datos"}
          </span>
        )}
      </div>

      <div className="rm-grid">
        {/* Tarjeta: temperatura del aire */}
        <article className="rm-card">
          <div className="rm-card-top">
            <div className="rm-card-titulo">
              <div className="rm-icono rm-icono-temperatura"><ThermometerSun size={18} /></div>
              <div>
                <h2>Temperatura del aire</h2>
                <p>{textoPeriodo}</p>
              </div>
            </div>
          </div>

          <div className="rm-metricas rm-metricas-3">
            <div>
              <strong className="rm-maxima">{formatearNumero(registroMaximo?.maxima)} °C</strong>
              <span>Máxima del período</span>
              <small>{formatearFecha(registroMaximo?.fecha)}</small>
            </div>
            <div>
              <strong className="rm-media">{formatearNumero(temperaturaMedia)} °C</strong>
              <span>Promedio del período</span>
            </div>
            <div>
              <strong className="rm-minima">{formatearNumero(registroMinimo?.minima)} °C</strong>
              <span>Mínima del período</span>
              <small>{formatearFecha(registroMinimo?.fecha)}</small>
            </div>
          </div>

          <div className="rm-selector-series">
            <button
              type="button"
              aria-pressed={serieTemperatura === "maxima"}
              className={serieTemperatura === "maxima" ? "activo maxima" : ""}
              onClick={() => setSerieTemperatura("maxima")}
            >
              <i />Máxima
            </button>
            <button
              type="button"
              aria-pressed={serieTemperatura === "mediaDiaria"}
              className={serieTemperatura === "mediaDiaria" ? "activo media" : ""}
              onClick={() => setSerieTemperatura("mediaDiaria")}
            >
              <i />Media
            </button>
            <button
              type="button"
              aria-pressed={serieTemperatura === "minima"}
              className={serieTemperatura === "minima" ? "activo minima" : ""}
              onClick={() => setSerieTemperatura("minima")}
            >
              <i />Mínima
            </button>
          </div>

          <div className="rm-grafico">
            <MiniGraficoLinea
              datos={datosPeriodo}
              series={[{ ...serieActual, unidad: " °C", grosor: 2.4 }]}
            />
          </div>
        </article>

        {/* Tarjeta: amplitud térmica */}
        <article className="rm-card">
          <div className="rm-card-top">
            <div className="rm-card-titulo">
              <div className="rm-icono rm-icono-amplitud"><ArrowUpDown size={18} /></div>
              <div>
                <h2>Amplitud térmica</h2>
                <p>Diferencia entre máxima y mínima diaria</p>
              </div>
            </div>
          </div>

          <div className="rm-metricas rm-metricas-2">
            <div>
              <strong className="rm-amplitud">{formatearNumero(amplitudPromedio)} °C</strong>
              <span>Promedio del período</span>
            </div>
            <div>
              <strong className="rm-amplitud">{formatearNumero(amplitudMaxima?.amplitudTermica)} °C</strong>
              <span>Mayor amplitud</span>
              <small>{formatearFecha(amplitudMaxima?.fecha)}</small>
            </div>
          </div>

          <div className="rm-grafico">
            <MiniGraficoLinea
              datos={datosPeriodo}
              series={[{
                campo: "amplitudTermica",
                nombre: "Amplitud térmica",
                unidad: " °C",
                color: "#8b5cf6",
                grosor: 2.3,
              }]}
            />
          </div>
        </article>

        {/* Tarjeta: precipitación */}
        <article className="rm-card">
          <div className="rm-card-top">
            <div className="rm-card-titulo">
              <div className="rm-icono rm-icono-lluvia"><CloudRain size={18} /></div>
              <div>
                <h2>Precipitación</h2>
                <p>Lluvia observada durante el período</p>
              </div>
            </div>
          </div>

          <div className="rm-metricas rm-metricas-3">
            <div>
              <strong className="rm-lluvia">
                {formatearNumero(periodo === "temporada" ? precipitacionTemporada : precipitacionPeriodo)} mm
              </strong>
              <span>{periodo === "temporada" ? "Total temporada" : "Total del período"}</span>
            </div>
            <div>
              <strong className="rm-lluvia">{diasConLluvia}</strong>
              <span>Días con lluvia</span>
            </div>
            <div>
              <strong className="rm-lluvia">{formatearNumero(maxLluviaDiaria?.precipitacionMm)} mm</strong>
              <span>Máxima diaria</span>
              <small>{formatearFecha(maxLluviaDiaria?.fecha)}</small>
            </div>
          </div>

          <div className="rm-grafico">
            <MiniGraficoLinea
              datos={datosPeriodo}
              tipo="barras"
              series={[{
                campo: "precipitacionMm",
                nombre: "Precipitación",
                unidad: " mm",
                color: "#38a5ff",
              }]}
            />
          </div>
        </article>

        {/* Tarjeta: riesgo térmico */}
        <article
          className={`rm-card rm-card-riesgo ${
            riesgoCritico ? "rm-riesgo-critico" : riesgoTermico ? "rm-riesgo-atencion" : ""
          }`}
        >
          <div className="rm-card-top">
            <div className="rm-card-titulo">
              <div className="rm-icono rm-icono-riesgo"><Snowflake size={18} /></div>
              <div>
                <h2>Riesgo térmico</h2>
                <p>Basado en temperatura mínima diaria</p>
              </div>
            </div>

            {riesgoCritico ? (
              <span className="rm-badge-critico"><TriangleAlert size={12} />Helada crítica</span>
            ) : riesgoTermico ? (
              <span className="rm-badge-riesgo"><TriangleAlert size={12} />Riesgo de helada</span>
            ) : null}
          </div>

          <div className="rm-metricas rm-metricas-3">
            <div className={riesgoCritico ? "rm-metrica-roja" : ""}>
              <strong className={riesgoCritico ? "rm-rojo" : "rm-minima"}>
                {formatearNumero(registroMinimo?.minima)} °C
              </strong>
              <span>Mínima del período</span>
              <small>{formatearFecha(registroMinimo?.fecha)}</small>
            </div>
            <div className="rm-metrica-ambar">
              <strong>{diasBajo2}</strong>
              <span>Días con mínima ≤ 2 °C</span>
            </div>
            <div className="rm-metrica-roja">
              <strong>{diasBajo0}</strong>
              <span>Días con mínima ≤ 0 °C</span>
            </div>
          </div>

          <div className="rm-grafico">
            <MiniGraficoLinea
              datos={datosPeriodo}
              destacarRiesgo
              campoRiesgo="minima"
              lineasReferencia={[
                { valor: 2, color: "#f59e0b" },
                { valor: 0, color: "#ef4444" },
              ]}
              series={[{
                campo: "minima",
                nombre: "Mínima diaria",
                unidad: " °C",
                color: "#3389f4",
                grosor: 2.3,
              }]}
            />
          </div>

          <div className="rm-leyenda">
            <span><i className="rm-dot rm-dot-min" />Mínima diaria</span>
            <span><i className="rm-line rm-line-2" />Riesgo · 2 °C</span>
            <span><i className="rm-line rm-line-0" />Crítico · 0 °C</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ResumenMeteorologico;
