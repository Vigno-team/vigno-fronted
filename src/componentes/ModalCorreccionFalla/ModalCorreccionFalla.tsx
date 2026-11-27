import { useState, type FormEvent } from "react";
import { pedirApi } from "../../services/api";
import type { RegistroFalla } from "../../types/fallas";
import "./ModalCorreccionFalla.css";

interface Props {
  falla: RegistroFalla | null;
  estacionId: string;
  onCerrar: () => void;
  onGuardado: () => void;
}

export default function ModalCorreccionFalla({ falla, estacionId, onCerrar, onGuardado }: Props) {
  const [nuevoValor, setNuevoValor] = useState("");
  const [autor, setAutor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!falla) return null;

  const hora = falla.timestamp?.match(/[T ](\d{2}:\d{2}(?::\d{2})?)/)?.[1];
  const variablesValidas = [
    "temperatura_maxima", "temperatura_minima", "temperatura_media",
    "tmax", "tmin", "tmedia", "precipitacion",
  ];
  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(falla.fecha || "");
  const corregible = fechaValida && variablesValidas.includes(falla.variable)
    && (falla.frecuencia === "D" || (falla.frecuencia === "H" && Boolean(hora)));
  const fechaEnExcel = falla.tipoFalla === "rechazado" || falla.variable === "timestamp";

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!falla || !corregible) return;
    if (!nuevoValor.trim() || !Number.isFinite(Number(nuevoValor)) || !autor.trim() || !motivo.trim()) {
      setError("Completa el valor, responsable y motivo antes de guardar.");
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await pedirApi("/v1/correcciones", {
        method: "POST",
        body: {
          estacion: estacionId,
          fecha: falla.fecha,
          ...(falla.frecuencia === "H" ? { hora } : {}),
          frecuencia: falla.frecuencia,
          variable: falla.variable,
          valor_nuevo: Number(nuevoValor),
          autor: autor.trim(),
          motivo: motivo.trim(),
          ...(falla.cargaOrigen != null ? { carga_origen: falla.cargaOrigen } : {}),
          ...(falla.fila != null ? { fila_origen: falla.fila } : {}),
        },
      });
      onGuardado();
      onCerrar();
    } catch (err) {
      setError((err as Error).message || "Django no pudo guardar la corrección.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-contenido" role="dialog" aria-modal="true" aria-labelledby="titulo-correccion">
        <h3 id="titulo-correccion">{corregible ? "Corregir medición" : "Revisar inconsistencia"}</h3>
        <p className="modal-subtext">
          {falla.fecha || "Fecha no reconocida"} · {falla.variable || "Sin variable"} · Original: {falla.valorOriginal ?? "Sin dato"}
        </p>
        {!corregible ? (
          <div role="status">
            {fechaEnExcel ? (
              <>
                <p>La fecha u hora de esta fila no se pudo interpretar. No es una medición numérica que pueda corregirse aquí.</p>
                <p><strong>Para solucionarlo:</strong> abre el Excel de origen, corrige la fecha de esa fila y sube la versión corregida desde <strong>Gestión de datos</strong>.</p>
              </>
            ) : (
              <p>Este registro no tiene una fecha, variable u hora válida para una corrección manual. Revisa el archivo y el motivo de la inconsistencia.</p>
            )}
            <p><strong>Archivo:</strong> {falla.archivoOrigen || "No indicado"}</p>
            <p><strong>Fila:</strong> {falla.fila ?? "No indicada"}</p>
            <p><strong>Motivo:</strong> {falla.motivo || "Sin detalle"}</p>
          </div>
        ) : (
          <form onSubmit={guardar}>
            <div className="form-group">
              <label htmlFor="corr-valor">Nuevo valor</label>
              <input id="corr-valor" type="number" step="any" value={nuevoValor} onChange={e => setNuevoValor(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="corr-autor">Responsable</label>
              <input id="corr-autor" value={autor} onChange={e => setAutor(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="corr-motivo">Motivo de corrección</label>
              <textarea id="corr-motivo" value={motivo} onChange={e => setMotivo(e.target.value)} required />
            </div>
            {error && <p role="alert" className="modal-error">{error}</p>}
            <div className="modal-acciones">
              <button className="btn-cancelar" type="button" onClick={onCerrar}>Cancelar</button>
              <button className="btn-guardar" type="submit" disabled={guardando || !nuevoValor.trim() || !autor.trim() || !motivo.trim()}>
                {guardando ? "Guardando..." : "Guardar en Django"}
              </button>
            </div>
          </form>
        )}
        {!corregible && <button className="btn-cancelar" type="button" onClick={onCerrar}>Cerrar</button>}
      </div>
    </div>
  );
}