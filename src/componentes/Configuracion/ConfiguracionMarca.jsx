import { useEffect, useState } from "react";
import { ImageUp, RotateCcw, Save } from "lucide-react";
import { MARCA_DEFECTO, BARRA_DEFECTO, useMarca } from "../../contexto/MarcaContext";
import { useConfiguracion } from "../../contexto/ConfiguracionContext";
import "./ConfiguracionMarca.css";

const TIPOGRAFIAS = [
  { valor: "Arial, sans-serif", etiqueta: "Arial (Predeterminada)" },
  {
    valor: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    etiqueta: "Segoe UI",
  },
  {
    valor: "'Inter', system-ui, -apple-system, sans-serif",
    etiqueta: "Inter / Sistema",
  },
  { valor: "Georgia, 'Times New Roman', serif", etiqueta: "Georgia (Clásica)" },
  { valor: "'Trebuchet MS', Helvetica, sans-serif", etiqueta: "Trebuchet MS" },
];

const FORMATOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANO_MAX_BYTES = 1024 * 1024; // 1 MB
const DIMENSION_MAX_PX = 4096;

function validarImagenLogo(archivo) {
  return new Promise((resolve, reject) => {
    if (!FORMATOS_PERMITIDOS.includes(archivo.type)) {
      reject(
        new Error(
          "Formato no permitido. Usa únicamente PNG, JPG o WebP (no SVG).",
        ),
      );
      return;
    }
    if (archivo.size > TAMANO_MAX_BYTES) {
      reject(new Error("El logo supera el peso máximo permitido de 1 MB."));
      return;
    }

    const urlTemporal = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const ancho = img.naturalWidth;
      const alto = img.naturalHeight;
      URL.revokeObjectURL(urlTemporal);
      if (ancho > DIMENSION_MAX_PX || alto > DIMENSION_MAX_PX) {
        reject(
          new Error(
            `Las dimensiones máximas permitidas son ${DIMENSION_MAX_PX} × ${DIMENSION_MAX_PX} px (tu imagen mide ${ancho} × ${alto} px).`,
          ),
        );
        return;
      }
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(urlTemporal);
      reject(new Error("No se pudo leer el archivo de imagen seleccionado."));
    };
    img.src = urlTemporal;
  });
}

export default function ConfiguracionMarca() {
  const { marca, barraMarca, guardarBarra, guardarConfiguracion, subirLogo } = useMarca();
  const { temaOscuro } = useConfiguracion();
  const [vistaOscura, setVistaOscura] = useState(temaOscuro);
  const [barraForm, setBarraForm] = useState(barraMarca);
  const [subiendoFondo, setSubiendoFondo] = useState(false);

  const [form, setForm] = useState({
    nombre_organizacion: marca.nombre_organizacion,
    nombre_sistema: marca.nombre_sistema,
    color_primario: marca.color_primario,
    color_secundario: marca.color_secundario,
    color_acento: marca.color_acento,
    color_fondo: marca.color_fondo,
    tipografia: marca.tipografia,
  });

  useEffect(() => { setBarraForm(barraMarca); }, [barraMarca]);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      nombre_organizacion: marca.nombre_organizacion,
      nombre_sistema: marca.nombre_sistema,
      color_primario: marca.color_primario,
      color_secundario: marca.color_secundario,
      color_acento: marca.color_acento,
      color_fondo: marca.color_fondo,
      tipografia: marca.tipografia,
      });
  }, [marca]);

  const actualizarCampo = (campo, valor) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    setMensaje("");
    setError("");
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");
    setError("");
    try {
      await guardarConfiguracion(form);
      guardarBarra(barraForm);
      setMensaje("Marca guardada. Los textos y la imagen lateral se guardaron en este navegador.");
    } catch (err) {
      setError(err.message || "No se pudo guardar la configuración de marca.");
    } finally {
      setGuardando(false);
    }
  };

  const handleRestaurarVigno = () => {
    setForm({
      nombre_organizacion: MARCA_DEFECTO.nombre_organizacion,
      nombre_sistema: MARCA_DEFECTO.nombre_sistema,
      color_primario: MARCA_DEFECTO.color_primario,
      color_secundario: MARCA_DEFECTO.color_secundario,
      color_acento: MARCA_DEFECTO.color_acento,
      color_fondo: MARCA_DEFECTO.color_fondo,
      tipografia: MARCA_DEFECTO.tipografia,
    });
    setBarraForm({ ...BARRA_DEFECTO });
    setMensaje("Valores originales preparados; presiona Guardar marca para aplicarlos.");
    setError("");
  };

  const handleSeleccionLogo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    setMensaje("");
    setError("");
    setSubiendoLogo(true);
    try {
      await validarImagenLogo(archivo);
      await subirLogo(archivo);
      setMensaje("Logo actualizado correctamente.");
    } catch (err) {
      setError(err.message || "Error al subir el logo.");
    } finally {
      setSubiendoLogo(false);
    }
  };

  // Carga un fondo local (PNG, JPG, WebP). Nunca lo manda a Django.
  const cambiarFondo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!FORMATOS_PERMITIDOS.includes(archivo.type) || archivo.size > 700 * 1024) {
      setError("Usa PNG, JPG o WebP de máximo 700 KB para guardar el fondo en tu navegador.");
      return;
    }
    setSubiendoFondo(true);
    setError("");
    try {
      await validarImagenLogo(archivo);
      const fondo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
        reader.readAsDataURL(archivo);
      });
      setBarraForm((actual) => ({ ...actual, fondo }));
      setMensaje("Fondo preparado. Presiona Guardar marca para aplicarlo.");
    } catch (e2) { setError(e2.message); }
    finally { setSubiendoFondo(false); }
  };

  return (
    <div className="marca-admin">
      <div className="marca-temas-vista">
        <span>Vista previa</span>
        <button type="button" className={!vistaOscura ? "activo" : ""} onClick={() => setVistaOscura(false)}>Claro</button>
        <button type="button" className={vistaOscura ? "activo" : ""} onClick={() => setVistaOscura(true)}>Oscuro</button>
      </div>
      <div className={`marca-preview ${vistaOscura ? "preview-oscuro" : "preview-claro"}`}
        style={{
          backgroundColor: vistaOscura ? form.color_fondo : "#fffaf6",
          borderColor: form.color_primario,
          fontFamily: form.tipografia,
        }}
      >
        <div className="marca-preview-top">
          {marca.logo && (
            <img
              src={marca.logo}
              alt="Vista previa logo"
              className="marca-preview-logo"
            />
          )}
          <div>
            <strong style={{ color: form.color_primario }}>
              {form.nombre_sistema || "SISTEMA"}
            </strong>
            <span>{form.nombre_organizacion || "Organización"}</span>
          </div>
          <span
            className="marca-preview-chip"
            style={{ backgroundColor: form.color_acento }}
          >
            Acento
          </span>
        </div>
        <small className="marca-preview-pie">
          Este proyecto fue potenciado por la{" "}
          <strong>Universidad Autónoma de Chile</strong>
        </small>
        <div className="marca-preview-barra" style={barraForm.fondo ? {
          backgroundImage: `linear-gradient(rgba(6,8,12,.65),rgba(6,8,12,.8)),url("${barraForm.fondo}")`,
        } : undefined}>
          <span>{barraForm.origen}</span>
          <strong>{form.nombre_sistema}</strong>
          <span>{form.nombre_organizacion}</span>
          <small>{barraForm.lema1} · {barraForm.lema2}</small>
        </div>
      </div>

      <form className="marca-form" onSubmit={handleGuardar}>
        <div className="marca-grid-2">
          <label className="marca-campo">
            <span>Nombre del sistema</span>
            <input
              type="text"
              value={form.nombre_sistema}
              onChange={(e) =>
                actualizarCampo("nombre_sistema", e.target.value)
              }
              required
            />
          </label>

          <label className="marca-campo">
            <span>Nombre de la organización</span>
            <input
              type="text"
              value={form.nombre_organizacion}
              onChange={(e) =>
                actualizarCampo("nombre_organizacion", e.target.value)
              }
              required
            />
          </label>
        </div>

        <div className="marca-grid-4">
          {[
            { clave: "color_primario", etiqueta: "Color primario" },
            { clave: "color_secundario", etiqueta: "Color secundario" },
            { clave: "color_acento", etiqueta: "Color de acento" },
            { clave: "color_fondo", etiqueta: "Color de fondo" },
          ].map(({ clave, etiqueta }) => (
            <label key={clave} className="marca-color-campo">
              <span>{etiqueta}</span>
              <div className="marca-color-control">
                <input
                  type="color"
                  value={form[clave]}
                  onChange={(e) => actualizarCampo(clave, e.target.value)}
                  aria-label={etiqueta}
                />
                <code>{form[clave].toUpperCase()}</code>
              </div>
            </label>
          ))}
        </div>

        <div className="marca-grid-2">
          <label className="marca-campo">
            <span>Tipografía</span>
            <select
              value={form.tipografia}
              onChange={(e) => actualizarCampo("tipografia", e.target.value)}
            >
              {TIPOGRAFIAS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
              {!TIPOGRAFIAS.some((t) => t.valor === form.tipografia) && (
                <option value={form.tipografia}>{form.tipografia}</option>
              )}
            </select>
          </label>

        </div>

        <div className="marca-identidad-lateral">
          <strong>Texto e imagen de la barra lateral</strong>
          <div className="marca-grid-2">
            {[["origen", "Texto superior"], ["lema1", "Primera línea del lema"], ["lema2", "Segunda línea del lema"]].map(([clave, etiqueta]) => (
              <label className="marca-campo" key={clave}>
                <span>{etiqueta}</span>
                <input type="text" maxLength={70} value={barraForm[clave]}
                  onChange={(e) => setBarraForm({ ...barraForm, [clave]: e.target.value })} />
              </label>
            ))}
          </div>
          <div className="marca-logo-fila">
            <div><strong>Imagen de fondo del menú</strong><small>PNG, JPG o WebP · máximo 700 KB</small></div>
            <label className="marca-btn-logo"><ImageUp size={17} /> {subiendoFondo ? "Preparando..." : "Elegir imagen"}
              <input type="file" accept="image/png,image/jpeg,image/webp" disabled={subiendoFondo}
                onChange={cambiarFondo} hidden />
            </label>
            {barraForm.fondo && <button type="button" className="marca-btn-secundario" onClick={() => setBarraForm({ ...barraForm, fondo: null })}>Usar foto original</button>}
          </div>
          <small>El fondo y los textos del menú se guardan solo en este navegador. El nombre, colores y logo siguen guardándose en Django.</small>
        </div>

        <div className="marca-logo-fila">
          <div>
            <strong>Logo institucional</strong>
            <small>
              Formatos PNG, JPG o WebP · Máximo 1 MB · Hasta 4096 × 4096 px
            </small>
          </div>
          <label
            className={`marca-btn-logo ${subiendoLogo ? "deshabilitado" : ""}`}
          >
            <ImageUp size={17} />
            <span>
              {subiendoLogo ? "Subiendo logo..." : "Subir nuevo logo"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleSeleccionLogo}
              disabled={subiendoLogo}
              hidden
            />
          </label>
        </div>

        {error && (
          <p className="marca-alerta error" role="alert">
            {error}
          </p>
        )}
        {mensaje && (
          <p className="marca-alerta exito" role="status">
            {mensaje}
          </p>
        )}

        <div className="marca-acciones">
          <button
            type="button"
            className="marca-btn-secundario"
            onClick={handleRestaurarVigno}
          >
            <RotateCcw size={16} /> Cargar valores VIGNO
          </button>
          <button
            type="submit"
            className="marca-btn-primario"
            disabled={guardando}
          >
            <Save size={16} /> {guardando ? "Guardando..." : "Guardar marca"}
          </button>
        </div>
      </form>
    </div>
  );
}
