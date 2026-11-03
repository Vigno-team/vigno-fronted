import { useCallback, useEffect, useState } from "react";
import { obtenerDatosApi } from "../services/vignoApi";

// /api/v1/datos debe conservar las métricas reales; no completar con datos ficticios.
function normalizarDatos(respuesta) {
  // El contrato describe un objeto directo. Admitimos también un envoltorio
  // "datos" o "data" por si el backend lo incorpora en otra versión.
  const raiz = [respuesta, respuesta?.datos, respuesta?.data].find(
    (objeto) => objeto && !Array.isArray(objeto) && Array.isArray(objeto.estaciones)
  );

  if (!raiz) {
    const campos = respuesta && typeof respuesta === "object"
      ? Object.keys(respuesta).join(", ") || "ninguno"
      : typeof respuesta;
    throw new Error(
      `GET /api/v1/datos no entregó la estructura esperada. ` +
      `Campos recibidos: ${campos}. Revisa la pestaña Response en Network.`
    );
  }

  const lista = (valor, nombre) => {
    if (valor == null) return [];
    if (Array.isArray(valor)) return valor;
    throw new Error(`La propiedad ${nombre} de /api/v1/datos debe ser una lista.`);
  };

  // El contrato más reciente utiliza "codigo" para identificar estaciones.
  // Mantenemos "id" como código para no modificar los componentes existentes.
  const alias = new Map();
  const estaciones = raiz.estaciones.map((estacion) => {
    const codigo = estacion?.codigo ?? estacion?.id;
    if (codigo === null || codigo === undefined || codigo === "") {
      throw new Error(`Una estación de /datos llegó sin código ni id: ${estacion?.nombre ?? "sin nombre"}`);
    }
    const clave = String(codigo);
    if (estacion.id != null) alias.set(String(estacion.id), clave);
    if (estacion.codigo != null) alias.set(String(estacion.codigo), clave);
    return { ...estacion, idOriginal: estacion.id, id: clave, codigo: clave };
  });

  const codigoDe = (valor) => {
    if (valor == null) return valor;
    return alias.get(String(valor)) ?? String(valor);
  };
  const asociarEstacion = (registro) => {
    const identidad = registro.estacion_id ?? registro.estacion_codigo ??
      registro.codigo_estacion ??
      (typeof registro.estacion === "object"
        ? registro.estacion?.codigo ?? registro.estacion?.id
        : registro.estacion);
    return identidad == null
      ? registro
      : { ...registro, estacion_id: codigoDe(identidad) };
  };

  const resumen = lista(raiz.resumen_diario, "resumen_diario")
    .map(asociarEstacion);
  const fichas = lista(raiz.ficha_temporada ?? raiz.fichas_temporada, "ficha_temporada")
    .map(asociarEstacion);
  const rachas = lista(raiz.rachas, "rachas").map(asociarEstacion);
  const completitud = lista(raiz.completitud_por_temporada, "completitud_por_temporada")
    .map(asociarEstacion);

  // Las temporadas provienen de la API o, si faltó esa clave, de fichas reales.
  const temporadas = Array.isArray(raiz.temporadas)
    ? raiz.temporadas
    : [...new Set(fichas.map((ficha) => ficha.temporada).filter(Boolean))].sort();

  const fechaChile = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago", year: "numeric", month: "2-digit",
  }).formatToParts(new Date());
  const anio = Number(fechaChile.find((parte) => parte.type === "year")?.value);
  const mes = Number(fechaChile.find((parte) => parte.type === "month")?.value);
  const inicio = mes >= 7 ? anio : anio - 1;
  const temporadaActual = `${inicio}-${inicio + 1}`;

  const datos = {
    ...raiz,
    estaciones,
    temporadas,
    resumen_diario: resumen,
    ficha_temporada: fichas,
    rachas,
    completitud_por_temporada: completitud,
    temporada_en_curso: raiz.temporada_en_curso ??
      (temporadas.includes(temporadaActual) ? temporadaActual : null),
    mapa_calor: raiz.mapa_calor ?? null,
  };

  const avisos = [];
  if (estaciones.length === 0) {
    avisos.push("La API no entregó estaciones. Revisa la base de datos del backend.");
  }
  if (temporadas.length === 0) {
    avisos.push("La API entregó 0 temporadas. Hay que verificar la importación de mediciones en el backend.");
  }
  if (resumen.length === 0 || !resumen.some((r) => Array.isArray(r.dias) && r.dias.length)) {
    avisos.push("La API no entregó mediciones diarias: el resumen y los gráficos no podrán mostrar temperaturas reales.");
  }
  if (!fichas.length) {
    avisos.push("La API no entregó fichas de temporada: revisa la carga y cálculo de índices en el backend.");
  }

  return { datos, avisos };
}

export function useClimateData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((numero) => numero + 1), []);

  useEffect(() => {
    const controlador = new AbortController();
    setLoading(true);
    setError(null);
    setAvisos([]);

    async function cargar() {
      try {
        // Una sola lectura del backend: no disparar consultas por estación/año.
        const respuesta = await obtenerDatosApi(controlador.signal);
        const { datos, avisos: nuevosAvisos } = normalizarDatos(respuesta);
        if (controlador.signal.aborted) return;
        setData(datos);
        setAvisos(nuevosAvisos);
      } catch (err) {
        if (controlador.signal.aborted || err?.name === "AbortError") return;
        setData(null); // Nunca mostrar datos viejos como si fueran actuales.
        setError(err?.message ?? "Error consultando /api/v1/datos.");
      } finally {
        if (!controlador.signal.aborted) setLoading(false);
      }
    }

    cargar();
    return () => controlador.abort();
  }, [version]);

  return { data, loading, error, avisos, recargar, cargandoDetalles: false };
}
