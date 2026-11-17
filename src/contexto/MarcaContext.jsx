/* eslint-disable react-refresh/only-export-components -- Contexto y constantes compartidos. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE, apiUrl, pedirApi } from "../services/api";

export const MARCA_DEFECTO = Object.freeze({
  nombre_organizacion: "Vignadores de Carignan",
  nombre_sistema: "VIGNO",
  color_primario: "#C86D3B",
  color_secundario: "#2A2421",
  color_acento: "#D99B26",
  color_fondo: "#0F1115",
  tipografia: "Arial, sans-serif",
  texto_pie:
    "Este proyecto fue potenciado por la Universidad Autónoma de Chile",
  logo: null,
});

const MarcaContext = createContext(null);

function hexARgba(hex, alpha) {
  const limpio = String(hex || "")
    .replace("#", "")
    .trim();
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return `rgba(200, 109, 59, ${alpha})`;
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function esColorOscuro(hex) {
  const limpio = String(hex || "")
    .replace("#", "")
    .trim();
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) return true;
  const r = parseInt(limpio.slice(0, 2), 16);
  const g = parseInt(limpio.slice(2, 4), 16);
  const b = parseInt(limpio.slice(4, 6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia < 0.5;
}

function resolverUrlLogo(logo) {
  if (!logo || typeof logo !== "string") return null;
  if (/^(https?:\/\/|data:|blob:)/i.test(logo)) return logo;
  const origenBackend = API_BASE.replace(/\/api\/?$/i, "");
  return `${origenBackend}/${logo.replace(/^\/+/, "")}`;
}

function normalizarMarca(datos = {}) {
  const origen = datos && typeof datos === "object" ? datos : {};
  const limpiarTexto = (valor, defecto) =>
    typeof valor === "string" && valor.trim() ? valor.trim() : defecto;
  const limpiarColor = (valor, defecto) =>
    typeof valor === "string" && /^#[0-9a-fA-F]{6}$/.test(valor.trim())
      ? valor.trim()
      : defecto;

  return {
    nombre_organizacion: limpiarTexto(
      origen.nombre_organizacion,
      MARCA_DEFECTO.nombre_organizacion,
    ),
    nombre_sistema: limpiarTexto(
      origen.nombre_sistema,
      MARCA_DEFECTO.nombre_sistema,
    ),
    color_primario: limpiarColor(
      origen.color_primario,
      MARCA_DEFECTO.color_primario,
    ),
    color_secundario: limpiarColor(
      origen.color_secundario,
      MARCA_DEFECTO.color_secundario,
    ),
    color_acento: limpiarColor(origen.color_acento, MARCA_DEFECTO.color_acento),
    color_fondo: limpiarColor(origen.color_fondo, MARCA_DEFECTO.color_fondo),
    tipografia: limpiarTexto(origen.tipografia, MARCA_DEFECTO.tipografia),
    texto_pie: limpiarTexto(origen.texto_pie, MARCA_DEFECTO.texto_pie),
    logo: resolverUrlLogo(origen.logo),
  };
}

export function MarcaProvider({ children }) {
  const [marca, setMarca] = useState(MARCA_DEFECTO);
  const [cargandoMarca, setCargandoMarca] = useState(true);

  const cargarMarca = useCallback(async () => {
    try {
      const respuesta = await fetch(apiUrl("/v1/configuracion"), {
        headers: { Accept: "application/json" },
      });
      if (!respuesta.ok) return;
      const datos = await respuesta.json();
      setMarca(normalizarMarca(datos));
    } catch {
      // Mantiene MARCA_DEFECTO si el backend no responde.
    } finally {
      setCargandoMarca(false);
    }
  }, []);

  useEffect(() => {
    cargarMarca();
  }, [cargarMarca]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--vigno-accent", marca.color_primario);
    root.style.setProperty("--vigno-accent-hover", marca.color_primario);
    root.style.setProperty("--vigno-terracota", marca.color_primario);
    root.style.setProperty("--vigno-terracota-hover", marca.color_primario);
    root.style.setProperty(
      "--vigno-terracota-suave",
      hexARgba(marca.color_primario, 0.14),
    );
    root.style.setProperty(
      "--vigno-terracota-borde",
      hexARgba(marca.color_primario, 0.38),
    );

    root.style.setProperty("--marca-primario", marca.color_primario);
    root.style.setProperty("--marca-secundario", marca.color_secundario);
    root.style.setProperty("--marca-acento", marca.color_acento);
    root.style.setProperty("--marca-fondo", marca.color_fondo);
    root.style.setProperty("--vigno-tierra", marca.color_secundario);
    root.style.setProperty("--vigno-tipografia", marca.tipografia);

    if (esColorOscuro(marca.color_fondo)) {
      root.style.setProperty("--vigno-bg-dark", marca.color_fondo);
    } else {
      root.style.setProperty("--vigno-bg-light", marca.color_fondo);
    }

    document.title = marca.nombre_sistema || MARCA_DEFECTO.nombre_sistema;
  }, [marca]);

  const guardarConfiguracion = useCallback(
    async (payload) => {
      const datos = await pedirApi("/v1/configuracion", {
        method: "PATCH",
        body: payload,
      });
      const actualizada = normalizarMarca(datos || { ...marca, ...payload });
      setMarca(actualizada);
      return actualizada;
    },
    [marca],
  );

  const subirLogo = useCallback(
    async (archivo) => {
      const formData = new FormData();
      formData.append("logo", archivo);
      const datos = await pedirApi("/v1/configuracion/logo", {
        method: "PUT",
        body: formData,
      });
      if (datos && typeof datos === "object" && "logo" in datos) {
        const conCacheBust = datos.logo
          ? `${resolverUrlLogo(datos.logo)}?t=${Date.now()}`
          : null;
        setMarca((actual) => ({ ...actual, logo: conCacheBust }));
      } else {
        await cargarMarca();
      }
    },
    [cargarMarca],
  );

  const valor = useMemo(
    () => ({
      marca,
      cargandoMarca,
      recargarMarca: cargarMarca,
      guardarConfiguracion,
      subirLogo,
    }),
    [marca, cargandoMarca, cargarMarca, guardarConfiguracion, subirLogo],
  );

  return (
    <MarcaContext.Provider value={valor}>{children}</MarcaContext.Provider>
  );
}

export function useMarca() {
  const contexto = useContext(MarcaContext);
  if (!contexto)
    throw new Error("useMarca debe utilizarse dentro de MarcaProvider");
  return contexto;
}
