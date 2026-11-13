/* eslint-disable react-refresh/only-export-components -- Contexto y definiciones compartidos. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CLAVE_CONFIGURACION = "vigno-configuracion";

// Umbrales visuales de alertas. NO modifican el cálculo oficial del backend.
export const UMBRALES_PREDETERMINADOS = Object.freeze({
  maxima: 35,          // Temperatura máxima diaria >= 35 °C
  media: null,         // Sin umbral oficial predeterminado
  minima: null,        // Advertencia adicional en temperatura, <= valor
  amplitud: null,      // Sin umbral oficial predeterminado
  lluviaDiaria: 10,    // Precipitación diaria >= 10 mm
  lluviaPeriodo: null, // Acumulado durante el período seleccionado
  helada: 0,          // Temperatura mínima <= 0 °C
  riesgoHelada: 2,    // Advertencia preventiva <= 2 °C
});

export const CONFIGURACION_INICIAL = {
  tamanoTexto: 120,
  tema: "claro",
  densidad: "normal",
  tamanoGrafico: "normal",
  contraste: "normal",
  tipoGrafico: "ambos",
  umbrales: { ...UMBRALES_PREDETERMINADOS },
  umbralesPorEstacion: {},
};

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

const ConfiguracionContext = createContext(null);
const limitar = (valor, min, max) => Math.min(max, Math.max(min, valor));

const convertirUmbral = (clave, valor, predeterminado) => {
  if (valor === undefined || valor === null || valor === "") return predeterminado;
  const definicion = DEFINICIONES_UMBRALES.find((item) => item.clave === clave);
  const numero = Number(valor);
  if (!definicion || !Number.isFinite(numero)) return predeterminado;
  return limitar(numero, definicion.min, definicion.max);
};

const normalizarConfiguracion = (datos = {}) => {
  const tamano = Number(datos.tamanoTexto);
  const valores = datos.umbrales && typeof datos.umbrales === "object" ? datos.umbrales : {};
  const umbrales = Object.fromEntries(
    DEFINICIONES_UMBRALES.map(({ clave }) => [
      clave,
      convertirUmbral(
        clave,
        // Migración desde la opción antigua "umbralAmplitud".
        clave === "amplitud" ? valores[clave] ?? datos.umbralAmplitud : valores[clave],
        UMBRALES_PREDETERMINADOS[clave],
      ),
    ]),
  );
  const porEstacion = {};
  const guardados = datos.umbralesPorEstacion;
  if (guardados && typeof guardados === "object" && !Array.isArray(guardados)) {
    Object.entries(guardados).forEach(([codigo, configuracion]) => {
      if (!codigo || !configuracion || typeof configuracion !== "object") return;
      const propios = {};
      DEFINICIONES_UMBRALES.forEach(({ clave }) => {
        if (configuracion[clave] !== undefined && configuracion[clave] !== null && configuracion[clave] !== "") {
          const valor = convertirUmbral(clave, configuracion[clave], null);
          if (valor !== null) propios[clave] = valor;
        }
      });
      if (Object.keys(propios).length) porEstacion[codigo] = propios;
    });
  }
  return {
    tamanoTexto: Number.isFinite(tamano) ? limitar(tamano, 90, 180) : CONFIGURACION_INICIAL.tamanoTexto,
    tema: ["claro", "oscuro"].includes(datos.tema) ? datos.tema : CONFIGURACION_INICIAL.tema,
    densidad: ["compacta", "normal", "amplia"].includes(datos.densidad) ? datos.densidad : CONFIGURACION_INICIAL.densidad,
    tamanoGrafico: ["normal", "grande"].includes(datos.tamanoGrafico) ? datos.tamanoGrafico : CONFIGURACION_INICIAL.tamanoGrafico,
    contraste: ["normal", "alto"].includes(datos.contraste) ? datos.contraste : CONFIGURACION_INICIAL.contraste,
    tipoGrafico: ["lineas", "puntos", "ambos"].includes(datos.tipoGrafico) ? datos.tipoGrafico : CONFIGURACION_INICIAL.tipoGrafico,
    umbrales,
    umbralesPorEstacion: porEstacion,
  };
};

const cargarConfiguracion = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_CONFIGURACION);
    return normalizarConfiguracion(guardado ? JSON.parse(guardado) : CONFIGURACION_INICIAL);
  } catch {
    return normalizarConfiguracion(CONFIGURACION_INICIAL);
  }
};

export function ConfiguracionProvider({ children }) {
  const [configuracion, setConfiguracion] = useState(cargarConfiguracion);

  const actualizar = useCallback((clave, valor) => {
    setConfiguracion((actual) => normalizarConfiguracion({ ...actual, [clave]: valor }));
  }, []);

  const actualizarUmbral = useCallback((clave, valor, estacionCodigo = "") => {
    if (!DEFINICIONES_UMBRALES.some((item) => item.clave === clave)) return;
    setConfiguracion((actual) => {
      if (!estacionCodigo) {
        return normalizarConfiguracion({
          ...actual,
          umbrales: {
            ...actual.umbrales,
            [clave]: convertirUmbral(clave, valor, UMBRALES_PREDETERMINADOS[clave]),
          },
        });
      }
      const porEstacion = { ...actual.umbralesPorEstacion };
      const propios = { ...porEstacion[estacionCodigo] };
      if (valor === null || valor === "") {
        delete propios[clave];
      } else {
        const numero = convertirUmbral(clave, valor, null);
        if (numero !== null) propios[clave] = numero;
      }
      if (Object.keys(propios).length) porEstacion[estacionCodigo] = propios;
      else delete porEstacion[estacionCodigo];
      return normalizarConfiguracion({ ...actual, umbralesPorEstacion: porEstacion });
    });
  }, []);

  const restablecerUmbralesEstacion = useCallback((estacionCodigo) => {
    if (!estacionCodigo) return;
    setConfiguracion((actual) => {
      const porEstacion = { ...actual.umbralesPorEstacion };
      delete porEstacion[estacionCodigo];
      return normalizarConfiguracion({ ...actual, umbralesPorEstacion: porEstacion });
    });
  }, []);

  const restablecer = useCallback(() => {
    setConfiguracion(normalizarConfiguracion(CONFIGURACION_INICIAL));
  }, []);

  useEffect(() => {
    localStorage.setItem(CLAVE_CONFIGURACION, JSON.stringify(configuracion));
  }, [configuracion]);

  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--escala-texto", String(configuracion.tamanoTexto / 100));
    html.style.setProperty("--factor-texto", String(configuracion.tamanoTexto / 120));
    html.dataset.textoGrande = configuracion.tamanoTexto >= 150 ? "si" : "no";
    html.dataset.tema = configuracion.tema;
    html.dataset.densidad = configuracion.densidad;
    html.dataset.tamanoGrafico = configuracion.tamanoGrafico;
    html.dataset.contraste = configuracion.contraste;
    html.dataset.tipoGrafico = configuracion.tipoGrafico;
    // Ya no hay controles para animación o movimiento reducido.
    delete html.dataset.animaciones;
    delete html.dataset.movimiento;
    html.style.colorScheme = configuracion.tema === "oscuro" ? "dark" : "light";
  }, [configuracion]);

  const obtenerUmbralesEstacion = useCallback((estacionCodigo = "") => ({
    ...configuracion.umbrales,
    ...(configuracion.umbralesPorEstacion[estacionCodigo] ?? {}),
  }), [configuracion.umbrales, configuracion.umbralesPorEstacion]);

  const valor = useMemo(() => ({
    ...configuracion,
    temaOscuro: configuracion.tema === "oscuro",
    actualizar,
    actualizarUmbral,
    obtenerUmbralesEstacion,
    restablecerUmbralesEstacion,
    restablecer,
  }), [configuracion, actualizar, actualizarUmbral, obtenerUmbralesEstacion, restablecerUmbralesEstacion, restablecer]);

  return <ConfiguracionContext.Provider value={valor}>{children}</ConfiguracionContext.Provider>;
}

export function useConfiguracion() {
  const contexto = useContext(ConfiguracionContext);
  if (!contexto) throw new Error("useConfiguracion debe utilizarse dentro de ConfiguracionProvider");
  return contexto;
}
