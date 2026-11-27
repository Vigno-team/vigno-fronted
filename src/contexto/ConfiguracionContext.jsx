import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// clave que se utiliza para guardar la configuracion en el localstorage
const CLAVE_CONFIGURACION = "vigno-configuracion";

// define los umbrales predeterminados para las alertas visuales
// estos valores no modifican los calculos oficiales del backend
export const UMBRALES_PREDETERMINADOS = Object.freeze({
  maxima: 35,
  media: null,
  minima: null,
  amplitud: null,
  lluviaDiaria: 10,
  lluviaPeriodo: null,
  helada: 0,
  riesgoHelada: 2,
});

// configuracion que tendra la aplicacion al inicio
export const CONFIGURACION_INICIAL = {
  tamanoTexto: 120,
  tema: "claro",
  densidad: "normal",
  tamanoGrafico: "normal",
  contraste: "normal",
  tipoGrafico: "ambos",
  umbrales: { ...UMBRALES_PREDETERMINADOS },
  umbralesPorEstacion: {},
  temporadaInicio: { mes: 1, dia: 1 },
  temporadaFin: { mes: 12, dia: 31 },
};

// define los umbrales que el usuario puede modificar y sus limites
export const DEFINICIONES_UMBRALES = [
  { clave: "maxima", titulo: "Temperatura máxima", descripcion: "Máxima diaria igual o superior al umbral", unidad: "°C", condicion: "≥", min: -30, max: 70 },
  { clave: "media", titulo: "Temperatura media", descripcion: "Media diaria igual o superior al umbral", unidad: "°C", condicion: "≥", min: -30, max: 60 },
  { clave: "minima", titulo: "Temperatura mínima", descripcion: "Mínima diaria igual o inferior al umbral", unidad: "°C", condicion: "≤", min: -30, max: 40 },
  { clave: "amplitud", titulo: "Amplitud térmica", descripcion: "Diferencia diaria entre máxima y mínima, igual o superior al umbral", unidad: "°C", condicion: "≥", min: 0, max: 80 },
  { clave: "lluviaDiaria", titulo: "Precipitación diaria", descripcion: "Lluvia de un día igual o superior al umbral", unidad: "mm", condicion: "≥", min: 0, max: 500 },
  { clave: "lluviaPeriodo", titulo: "Precipitación acumulada", descripcion: "Total de lluvia del período seleccionado igual o superior al umbral", unidad: "mm", condicion: "≥", min: 0, max: 5000 },
  { clave: "riesgoHelada", titulo: "Riesgo preventivo de helada", descripcion: "Mínima diaria igual o inferior al umbral preventivo", unidad: "°C", condicion: "≤", min: -30, max: 30 },
  { clave: "helada", titulo: "Helada crítica", descripcion: "Mínima diaria igual o inferior al umbral crítico", unidad: "°C", condicion: "≤", min: -30, max: 30 },
];

// crea el contexto para compartir las configuraciones entre componentes
const ConfiguracionContext = createContext(null);

// mantiene un numero dentro de los limites permitidos
const limitar = (valor, min, max) => Math.min(max, Math.max(min, valor));

// convierte el umbral a numero y comprueba que sea valido
const convertirUmbral = (clave, valor, predeterminado) => {
  if (valor === undefined || valor === null || valor === "") return predeterminado;

  const definicion = DEFINICIONES_UMBRALES.find((item) => item.clave === clave);
  const numero = Number(valor);

  if (!definicion || !Number.isFinite(numero)) return predeterminado;

  return limitar(numero, definicion.min, definicion.max);
};


// Comprueba día y mes; usamos un año común para evitar fechas inválidas en otras temporadas.
const normalizarDiaMes = (valor, defecto) => {
  const mes = Number(valor?.mes);
  const dia = Number(valor?.dia);
  if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(dia)) return { ...defecto };
  const dias = new Date(2025, mes, 0).getDate();
  return dia >= 1 && dia <= dias ? { mes, dia } : { ...defecto };
};

// revisa que las configuraciones tengan valores validos
const normalizarConfiguracion = (datos = {}) => {
  const tamano = Number(datos.tamanoTexto);
  const valores = datos.umbrales && typeof datos.umbrales === "object" ? datos.umbrales : {};

  // recorre los umbrales y utiliza los valores validos o predeterminados
  const umbrales = Object.fromEntries(
    DEFINICIONES_UMBRALES.map(({ clave }) => [
      clave,
      convertirUmbral(
        clave,
        // permite recuperar el valor antiguo de amplitud
        clave === "amplitud" ? valores[clave] ?? datos.umbralAmplitud : valores[clave],
        UMBRALES_PREDETERMINADOS[clave],
      ),
    ]),
  );

  const porEstacion = {};
  const guardados = datos.umbralesPorEstacion;

  // revisa las configuraciones personalizadas de las estaciones
  if (guardados && typeof guardados === "object" && !Array.isArray(guardados)) {
    Object.entries(guardados).forEach(([codigo, configuracion]) => {
      if (!codigo || !configuracion || typeof configuracion !== "object") return;

      const propios = {};

      // revisa cada umbral propio de la estacion
      DEFINICIONES_UMBRALES.forEach(({ clave }) => {
        if (configuracion[clave] !== undefined && configuracion[clave] !== null && configuracion[clave] !== "") {
          const valor = convertirUmbral(clave, configuracion[clave], null);
          if (valor !== null) propios[clave] = valor;
        }
      });

      // guarda la estacion solo si tiene umbrales propios
      if (Object.keys(propios).length) porEstacion[codigo] = propios;
    });
  }

  // devuelve las configuraciones con valores validos
  return {
    tamanoTexto: Number.isFinite(tamano) ? limitar(tamano, 90, 180) : CONFIGURACION_INICIAL.tamanoTexto,
    tema: ["claro", "oscuro"].includes(datos.tema) ? datos.tema : CONFIGURACION_INICIAL.tema,
    densidad: ["compacta", "normal", "amplia"].includes(datos.densidad) ? datos.densidad : CONFIGURACION_INICIAL.densidad,
    tamanoGrafico: ["normal", "grande"].includes(datos.tamanoGrafico) ? datos.tamanoGrafico : CONFIGURACION_INICIAL.tamanoGrafico,
    contraste: ["normal", "alto"].includes(datos.contraste) ? datos.contraste : CONFIGURACION_INICIAL.contraste,
    tipoGrafico: ["lineas", "puntos", "ambos"].includes(datos.tipoGrafico) ? datos.tipoGrafico : CONFIGURACION_INICIAL.tipoGrafico,
    umbrales,
    umbralesPorEstacion: porEstacion,
    temporadaInicio: normalizarDiaMes(datos.temporadaInicio, CONFIGURACION_INICIAL.temporadaInicio),
    temporadaFin: normalizarDiaMes(datos.temporadaFin, CONFIGURACION_INICIAL.temporadaFin),
  };
};


// recupera las configuraciones guardadas en el navegador
const cargarConfiguracion = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_CONFIGURACION);
    return normalizarConfiguracion(guardado ? JSON.parse(guardado) : CONFIGURACION_INICIAL);
  } catch {
    // si ocurre un error utiliza la configuracion inicial
    return normalizarConfiguracion(CONFIGURACION_INICIAL);
  }
};


// componente que comparte la configuracion con los demas componentes
export function ConfiguracionProvider({ children }) {

  // guarda la configuracion y la carga desde el localstorage
  const [configuracion, setConfiguracion] = useState(cargarConfiguracion);

  // permite actualizar una preferencia como el tema o tamaño de texto
  const actualizar = useCallback((clave, valor) => {
    setConfiguracion((actual) => normalizarConfiguracion({ ...actual, [clave]: valor }));
  }, []);


  // permite cambiar un umbral general o de una estacion
  const actualizarUmbral = useCallback((clave, valor, estacionCodigo = "") => {

    // comprueba que el umbral exista
    if (!DEFINICIONES_UMBRALES.some((item) => item.clave === clave)) return;

    setConfiguracion((actual) => {

      // si no hay una estacion seleccionada modifica el umbral general
      if (!estacionCodigo) {
        return normalizarConfiguracion({
          ...actual,
          umbrales: {
            ...actual.umbrales,
            [clave]: convertirUmbral(clave, valor, UMBRALES_PREDETERMINADOS[clave]),
          },
        });
      }

      // copia los umbrales personalizados de las estaciones
      const porEstacion = { ...actual.umbralesPorEstacion };
      const propios = { ...porEstacion[estacionCodigo] };

      // si el campo esta vacio elimina el umbral propio
      if (valor === null || valor === "") {
        delete propios[clave];
      } else {
        const numero = convertirUmbral(clave, valor, null);
        if (numero !== null) propios[clave] = numero;
      }

      // guarda los umbrales propios o elimina la estacion si no tiene ninguno
      if (Object.keys(propios).length) porEstacion[estacionCodigo] = propios;
      else delete porEstacion[estacionCodigo];

      return normalizarConfiguracion({ ...actual, umbralesPorEstacion: porEstacion });
    });
  }, []);


  // Configura las fechas de temporada para el Resumen, sin modificar índices oficiales.
  const actualizarTemporada = useCallback((inicio, fin) => {
    const desde = normalizarDiaMes(inicio, CONFIGURACION_INICIAL.temporadaInicio);
    const hasta = normalizarDiaMes(fin, CONFIGURACION_INICIAL.temporadaFin);
    if (desde.mes === hasta.mes && desde.dia === hasta.dia) return false;
    setConfiguracion((actual) => normalizarConfiguracion({
      ...actual, temporadaInicio: desde, temporadaFin: hasta,
    }));
    return true;
  }, []);

  // elimina los umbrales propios de una estacion para usar los generales
  const restablecerUmbralesEstacion = useCallback((estacionCodigo) => {
    if (!estacionCodigo) return;

    setConfiguracion((actual) => {
      const porEstacion = { ...actual.umbralesPorEstacion };
      delete porEstacion[estacionCodigo];
      return normalizarConfiguracion({ ...actual, umbralesPorEstacion: porEstacion });
    });
  }, []);


  // restablece toda la configuracion a los valores iniciales
  const restablecer = useCallback(() => {
    setConfiguracion(normalizarConfiguracion(CONFIGURACION_INICIAL));
  }, []);


  // guarda los cambios en el localstorage cada vez que cambia la configuracion
  useEffect(() => {
    localStorage.setItem(CLAVE_CONFIGURACION, JSON.stringify(configuracion));
  }, [configuracion]);


  // aplica las preferencias visuales a toda la pagina
  useEffect(() => {
    const html = document.documentElement;

    // modifica la escala del texto segun la configuracion
    html.style.setProperty("--escala-texto", String(configuracion.tamanoTexto / 100));
    html.style.setProperty("--factor-texto", String(configuracion.tamanoTexto / 120));

    // aplica el tamaño de texto, tema, densidad y opciones de graficos
    html.dataset.textoGrande = configuracion.tamanoTexto >= 150 ? "si" : "no";
    html.dataset.tema = configuracion.tema;
    html.dataset.densidad = configuracion.densidad;
    html.dataset.tamanoGrafico = configuracion.tamanoGrafico;
    html.dataset.contraste = configuracion.contraste;
    html.dataset.tipoGrafico = configuracion.tipoGrafico;

    // elimina configuraciones antiguas de animaciones y movimiento
    delete html.dataset.animaciones;
    delete html.dataset.movimiento;

    // cambia el esquema de color segun el tema seleccionado
    html.style.colorScheme = configuracion.tema === "oscuro" ? "dark" : "light";
  }, [configuracion]);


  // obtiene los umbrales de una estacion y utiliza los generales cuando no tiene propios
  const obtenerUmbralesEstacion = useCallback((estacionCodigo = "") => ({
    ...configuracion.umbrales,
    ...(configuracion.umbralesPorEstacion[estacionCodigo] ?? {}),
  }), [configuracion.umbrales, configuracion.umbralesPorEstacion]);


  // agrupa todas las configuraciones y funciones para compartirlas
  const valor = useMemo(() => ({
    ...configuracion,
    temaOscuro: configuracion.tema === "oscuro",
    actualizar,
    actualizarUmbral,
    actualizarTemporada,
    obtenerUmbralesEstacion,
    restablecerUmbralesEstacion,
    restablecer,
  }), [configuracion, actualizar, actualizarUmbral, actualizarTemporada, obtenerUmbralesEstacion, restablecerUmbralesEstacion, restablecer]);

  // permite que los componentes hijos accedan a la configuracion
  return <ConfiguracionContext.Provider value={valor}>{children}</ConfiguracionContext.Provider>;
}


// hook que permite utilizar la configuracion desde otros componentes
export function useConfiguracion() {
  const contexto = useContext(ConfiguracionContext);

  // muestra un error si se utiliza fuera del provider
  if (!contexto) throw new Error("useConfiguracion debe utilizarse dentro de ConfiguracionProvider");

  return contexto;
}
