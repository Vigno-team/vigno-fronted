import React, { useState } from "react";
import { RegistroFalla } from "../../types/fallas";
import "./ModalCorreccionFalla.css";

interface Props {
  falla: RegistroFalla | null;
  onCerrar: () => void;
}

export const ModalCorreccionFalla: React.FC<Props> = ({ falla, onCerrar }) => {
  const [nuevoValor, setNuevoValor] = useState("");
  const [observacion, setObservacion] = useState("");

  if (!falla) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Corrección registrada para ${falla.id}: Valor = ${nuevoValor}`);
    onCerrar();
  };

  return (
    <div className="modal-overlay">
      {/* Se remueve 'huglin-card' para evitar la transparencia */}
      <div className="modal-contenido">
        <h3>Corregir Registro Manual ({falla.id})</h3>
        <p className="modal-subtext">
          <strong>Fecha:</strong> {falla.fecha} | <strong>Variable:</strong> {falla.variable.toUpperCase()}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Valor Original:</label>
            <input type="text" value={falla.valorOriginal ?? "N/A"} disabled />
          </div>

          <div className="form-group">
            <label>Nuevo Valor Corregido:</label>
            <input
              type="number"
              step="0.1"
              required
              value={nuevoValor}
              onChange={(e) => setNuevoValor(e.target.value)}
              placeholder="Ej. 24.5"
            />
          </div>

          <div className="form-group">
            <label>Observación del Auditor:</label>
            <textarea
              required
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Describa el motivo del ajuste manual..."
            />
          </div>

          <div className="modal-acciones">
            <button type="button" className="btn-cancelar" onClick={onCerrar}>
              Cancelar
            </button>
            <button type="submit" className="btn-guardar">
              Guardar Corrección (POST /api/v1/correcciones)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCorreccionFalla;