import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  TriangleAlert,
} from "lucide-react";

import TarjetaTemperatura from "./TarjetaTemperatura";
import TarjetaAmplitud from "./TarjetaAmplitud";
import TarjetaPrecipitacion from "./TarjetaPrecipitacion";
import TarjetaRiesgo from "./TarjetaRiesgo";
import "./ResumenMeteorologico.css";

const PERIODOS = [
  { valor: "ultimo", texto: "Último día" },
  { valor: "7", texto: "7 días" },
  { valor: "30", texto: "30 días" },
  { valor: "temporada", texto: "Temporada" },
];

const SERIES_TEMPERATURA = {
  maxima: { campo: "maxima", nombre: "Máxima", color: "#fb5263" },
  mediaDiaria: { campo: "mediaDiaria", nombre: "Media", color: "#aebed5" },
  minima: { campo: "minima", nombre: "Mínima", color: "#3389f4" },
};

const esNumero = (valor) => Number.isFinite(valor);

const formatearNumero = (valor, decimales = 1) =>
  esNumero(valor) ? valor.toFixed(decimales).replace(".", ",") : "—";

const formatearFecha = (fecha) =>
  fecha
    ? new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
        .format(new Date(`${fecha}T12:00:00`))
        .replace(".", "")
    : "—";

const promedio = (valores) => {
  const validos = valores.filter(esNumero);
  return validos.length
    ? validos.reduce((total, valor) => total + valor, 0) / validos.length
    : null;
};

const sumar = (valores) => {
  const validos = valores.filter(esNumero);
  return validos.length
    ? validos.reduce((total, valor) => total + valor, 0)
    : null;
};

const tieneDatos = (dato) =>
  Boolean(
    dato &&
      [
        dato.maxima,
        dato.minima,
        dato.mediaDiaria,
        dato.amplitudTermica,
        dato.precipitacionMm,
      ].some(esNumero)
  );

const obtenerExtremo = (datos, campo, mayor = true) =>
  datos.reduce((mejor, dato) => {
    if (!esNumero(dato[campo])) return mejor;
    if (!mejor) return dato;

    const cumple = mayor
      ? dato[campo] > mejor[campo]
      : dato[campo] < mejor[campo];

    return cumple ? dato : mejor;
  }, null);

function ResumenMeteorologico({
  estaciones = [],
  datosTemperatura = [],
  temaOscuro = true,
}) {
  const [estacionId, setEstacionId] = useState("");
  const [temporada, setTemporada] = useState("");
  const [periodo, setPeriodo] = useState("30");
  const [serieTemperatura, setSerieTemperatura] = useState("maxima");

  useEffect(() => {
    if (
      estaciones.length &&
      !estaciones.some((item) => item.id === estacionId)
    ) {
      setEstacionId(estaciones[0].id);
    }
  }, [estaciones, estacionId]);

  const estacion = useMemo(
    () => estaciones.find((item) => item.id === estacionId),
    [estaciones, estacionId]
  );

  const datosEstacion = useMemo(
    () =>
      datosTemperatura
        .filter((dato) => dato.estacionId === estacionId)
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [datosTemperatura, estacionId]
  );

  const temporadas = useMemo(
    () =>
      [...new Set(datosEstacion.map((dato) => dato.fecha.slice(0, 4)))].sort(
        (a, b) => Number(b) - Number(a)
      ),
    [datosEstacion]
  );

  useEffect(() => {
    if (temporadas.length && !temporadas.includes(temporada)) {
      setTemporada(temporadas[0]);
    }
  }, [temporadas, temporada]);

  const datosTemporada = useMemo(
    () =>
      datosEstacion.filter((dato) =>
        dato.fecha.startsWith(`${temporada}-`)
      ),
    [datosEstacion, temporada]
  );

  const datosPeriodo = useMemo(() => {
    if (periodo === "temporada") return datosTemporada;
    if (periodo === "ultimo") return datosTemporada.slice(-1);
    return datosTemporada.slice(-Number(periodo));
  }, [datosTemporada, periodo]);

  const registroMaximo = useMemo(
    () => obtenerExtremo(datosPeriodo, "maxima"),
    [datosPeriodo]
  );

  const registroMinimo = useMemo(
    () => obtenerExtremo(datosPeriodo, "minima", false),
    [datosPeriodo]
  );

  const temperaturaMedia = useMemo(
    () => promedio(datosPeriodo.map((dato) => dato.mediaDiaria)),
    [datosPeriodo]
  );

  const amplitudPromedio = useMemo(
    () => promedio(datosPeriodo.map((dato) => dato.amplitudTermica)),
    [datosPeriodo]
  );

  const amplitudMaxima = useMemo(
    () => obtenerExtremo(datosPeriodo, "amplitudTermica"),
    [datosPeriodo]
  );

  const precipitacionPeriodo = useMemo(
    () => sumar(datosPeriodo.map((dato) => dato.precipitacionMm)),
    [datosPeriodo]
  );

  const precipitacionTemporada = useMemo(
    () => sumar(datosTemporada.map((dato) => dato.precipitacionMm)),
    [datosTemporada]
  );

  const maximaLluvia = useMemo(
    () => obtenerExtremo(datosPeriodo, "precipitacionMm"),
    [datosPeriodo]
  );

  const diasConLluvia = datosPeriodo.filter(
    (dato) =>
      esNumero(dato.precipitacionMm) &&
      dato.precipitacionMm > 0
  ).length;

  const diasBajo2 = datosPeriodo.filter(
    (dato) => esNumero(dato.minima) && dato.minima <= 2
  ).length;

  const diasBajo0 = datosPeriodo.filter(
    (dato) => esNumero(dato.minima) && dato.minima <= 0
  ).length;

  const diasSinDatos = datosTemporada.filter(
    (dato) => !tieneDatos(dato)
  ).length;

  const configTemporada = estacion?.temporadas?.[temporada];
  const completitud = configTemporada?.completitud ?? null;
  const confiable = configTemporada?.confiable !== false;

  const rangoInicio = datosTemporada[0]?.fecha;
  const rangoFin = datosTemporada.at(-1)?.fecha;

  const textoPeriodo =
    periodo === "ultimo"
      ? "Último día"
      : periodo === "temporada"
        ? "Temporada completa"
        : `Últimos ${periodo} días`;

  const propsFormato = { formatearNumero, formatearFecha };

  return (
    <section
      className={`rm-dashboard ${temaOscuro ? "tema-oscuro" : "tema-claro"}`}
    >
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
                value={estacionId}
                onChange={(e) => setEstacionId(e.target.value)}
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
                value={temporada}
                onChange={(e) => setTemporada(e.target.value)}
              >
                {temporadas.map((anio) => (
                  <option key={anio}>{anio}</option>
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

      <div className="rm-resumen-barra">
        <span>
          <strong>Datos</strong>{" "}
          {formatearFecha(rangoInicio)} — {formatearFecha(rangoFin)}
        </span>

        {esNumero(completitud) && (
          <span>
            <strong>{completitud} %</strong> completos
          </span>
        )}

        {confiable ? (
          <span className="rm-chip-ok">
            <CheckCircle2 size={12} />
            Confiable
          </span>
        ) : (
          <span className="rm-chip-warn">
            <TriangleAlert size={12} />
            Calidad limitada
          </span>
        )}

        {diasSinDatos > 0 && (
          <span>
            <strong>{diasSinDatos}</strong>{" "}
            {diasSinDatos === 1 ? "día sin datos" : "días sin datos"}
          </span>
        )}
      </div>

      <div className="rm-grid">
        <TarjetaTemperatura
          datos={datosPeriodo}
          textoPeriodo={textoPeriodo}
          maximo={registroMaximo}
          minimo={registroMinimo}
          media={temperaturaMedia}
          serie={serieTemperatura}
          cambiarSerie={setSerieTemperatura}
          configuracionSerie={SERIES_TEMPERATURA[serieTemperatura]}
          {...propsFormato}
        />

        <TarjetaAmplitud
          datos={datosPeriodo}
          promedio={amplitudPromedio}
          maxima={amplitudMaxima}
          {...propsFormato}
        />

        <TarjetaPrecipitacion
          datos={datosPeriodo}
          total={
            periodo === "temporada"
              ? precipitacionTemporada
              : precipitacionPeriodo
          }
          diasConLluvia={diasConLluvia}
          maxima={maximaLluvia}
          esTemporada={periodo === "temporada"}
          {...propsFormato}
        />

        <TarjetaRiesgo
          datos={datosPeriodo}
          registroMinimo={registroMinimo}
          diasBajo2={diasBajo2}
          diasBajo0={diasBajo0}
          {...propsFormato}
        />
      </div>
    </section>
  );
}

export default ResumenMeteorologico;