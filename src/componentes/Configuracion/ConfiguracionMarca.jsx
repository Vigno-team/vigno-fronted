import { useEffect, useState } from "react";
import { ImageUp, Palette, RotateCcw, Save } from "lucide-react";
import { MARCA_DEFECTO, useMarca } from "../../contexto/MarcaContext";
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
  const { marca, guardarConfiguracion, subirLogo } = useMarca();

  const [form, setForm] = useState({
    nombre_organizacion: marca.nombre_organizacion,
    nombre_sistema: marca.nombre_sistema,
    color_primario: marca.color_primario,
    color_secundario: marca.color_secundario,
    color_acento: marca.color_acento,
    color_fondo: marca.color_fondo,
    tipografia: marca.tipografia,
    texto_pie: marca.texto_pie,
  });

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
      texto_pie: marca.texto_pie,
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
      setMensaje("Identidad visual actualizada correctamente.");
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
      texto_pie: MARCA_DEFECTO.texto_pie,
    });
    setMensaje(
      "Valores por defecto de VIGNO cargados. Haz clic en 'Guardar marca' para aplicarlos.",
    );
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

  return (
    <div className="marca-admin">
      <div
        className="marca-preview"
        style={{
          backgroundColor: form.color_fondo,
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
        <small className="marca-preview-pie">{form.texto_pie}</small>
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

          <label className="marca-campo">
            <span>Texto pie de página</span>
            <input
              type="text"
              value={form.texto_pie}
              onChange={(e) => actualizarCampo("texto_pie", e.target.value)}
            />
          </label>
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
