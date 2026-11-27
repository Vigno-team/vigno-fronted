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

// Estos textos y la foto lateral son locales: la API actual de marca no los acepta.
export const BARRA_DEFECTO = Object.freeze({
  origen: "MAULE · CHILE",
  lema1: "Old Vines Dry-Farmed",
  lema2: "Maule Valley",
  fondo: null,
});
const CLAVE_BARRA = "vigno-identidad-barra";
const MarcaContext = createContext(null);

function cargarBarra() {
  try {
    return { ...BARRA_DEFECTO, ...JSON.parse(localStorage.getItem(CLAVE_BARRA) || "{}") };
  } catch { return { ...BARRA_DEFECTO }; }
}

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

// Prepara el color para el modo claro sin perder legibilidad.
// El fondo original de Vigno sigue siendo claro hasta que se elija otro color.
export function colorFondoClaro(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#F8F9FA";
  if (hex.toLowerCase() === MARCA_DEFECTO.color_fondo.toLowerCase()) return "#F8F9FA";

  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const brillo = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
  const mezcla = brillo < 190 ? (190 - brillo) / (255 - brillo) : 0;
  return `#${rgb.map((n) => Math.round(n + (255 - n) * mezcla).toString(16).padStart(2, "0")).join("")}`;
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
    texto_pie: MARCA_DEFECTO.texto_pie, // Institucional y no editable.
    logo: resolverUrlLogo(origen.logo),
  };
}

export function MarcaProvider({ children }) {
  const [marca, setMarca] = useState(MARCA_DEFECTO);
  const [cargandoMarca, setCargandoMarca] = useState(true);
  const [barraMarca, setBarraMarca] = useState(cargarBarra);

  // Guarda los textos e imagen en este navegador. No simula un guardado global.
  const guardarBarra = useCallback((datos) => {
    const nueva = {
      origen: String(datos.origen || "").trim(),
      lema1: String(datos.lema1 || "").trim(),
      lema2: String(datos.lema2 || "").trim(),
      fondo: typeof datos.fondo === "string" && /^data:image\/(?:png|jpeg|webp);base64,/.test(datos.fondo)
        ? datos.fondo : null,
    };
    try { localStorage.setItem(CLAVE_BARRA, JSON.stringify(nueva)); }
    catch { throw new Error("La imagen es demasiado grande para guardarla en este navegador."); }
    setBarraMarca(nueva);
  }, []);

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

    // Un solo color de marca, adaptado para los dos temas.
    root.style.setProperty("--vigno-bg-dark", marca.color_fondo);
    root.style.setProperty("--vigno-bg-light", colorFondoClaro(marca.color_fondo));

    document.title = marca.nombre_sistema || MARCA_DEFECTO.nombre_sistema;
  }, [marca]);

  const guardarConfiguracion = useCallback(
    async (payload) => {
      // No enviar el pie al backend, aunque una versión anterior lo haya guardado.
      const camposEditables = { ...payload };
      delete camposEditables.texto_pie;
      const datos = await pedirApi("/v1/configuracion", {
        method: "PATCH",
        body: camposEditables,
      });
      const actualizada = normalizarMarca(datos || { ...marca, ...camposEditables });
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
      barraMarca,
      guardarBarra,
      cargandoMarca,
      recargarMarca: cargarMarca,
      guardarConfiguracion,
      subirLogo,
    }),
    [marca, barraMarca, guardarBarra, cargandoMarca, cargarMarca, guardarConfiguracion, subirLogo],
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
