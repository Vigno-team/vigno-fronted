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
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!falla) return null;

  const hora = falla.timestamp?.match(/T(\d{2}:\d{2}(?::\d{2})?)/)?.[1];
  const corregible = Boolean(falla.fecha && falla.variable && (falla.frecuencia !== "H" || hora));

  async function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!falla || !corregible) return;
    setGuardando(true);
    setError("");
    try {
      await pedirApi("/v1/correcciones", {
        method: "POST",
        headers: { "X-Api-Key": clave.trim() },
        body: {
          estacion: estacionId, fecha: falla.fecha,
          ...(falla.frecuencia === "H" ? { hora } : {}),
          frecuencia: falla.frecuencia, variable: falla.variable,
          valor_nuevo: Number(nuevoValor), autor: autor.trim(), motivo: motivo.trim(),
          ...(falla.cargaOrigen != null ? { carga_origen: falla.cargaOrigen } : {}),
          ...(falla.fila != null ? { fila_origen: falla.fila } : {}),
        },
      });
      onGuardado();
      onCerrar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-contenido" role="dialog" aria-modal="true" aria-labelledby="titulo-correccion">
        <h3 id="titulo-correccion">Corregir medición</h3>
        <p className="modal-subtext">{falla.fecha || "Sin fecha"} · {falla.variable || "Sin variable"} · Original: {falla.valorOriginal ?? "Sin dato"}</p>
        {!corregible ? (
          <p role="alert">Esta falla no tiene fecha, variable u hora suficientes para corregirla automáticamente.</p>
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
            <div className="form-group">
              <label htmlFor="corr-clave">Clave administrador</label>
              <input id="corr-clave" type="password" autoComplete="off" value={clave} onChange={e => setClave(e.target.value)} required />
            </div>
            {error && <p role="alert">{error}</p>}
            <div className="modal-acciones">
              <button className="btn-cancelar" type="button" onClick={onCerrar}>Cancelar</button>
              <button className="btn-guardar" type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Guardar en Django"}</button>
            </div>
          </form>
        )}
        {!corregible && <button className="btn-cancelar" type="button" onClick={onCerrar}>Cerrar</button>}
      </div>
    </div>
  );
}
