import React from "react";
import { RegistroFalla, EstadoCorreccion, TipoFalla } from "../../types/fallas";
import "./TablaFallas.css";

interface Props {
  fallas: RegistroFalla[];
  estacionId: string;
  temporada: string;
  onAbrirModal: (falla: RegistroFalla) => void;
}

const formatBadgeEstado = (estado: EstadoCorreccion) => {
  switch (estado) {
    case "corregido":
      return <span className="badge-estado badge-corregido">Corregido</span>;
    case "descartado":
      return <span className="badge-estado badge-descartado">Descartado</span>;
    default:
      return <span className="badge-estado badge-pendiente">Pendiente</span>;
  }
};

const formatTipoFalla = (tipo: TipoFalla) => {
  const labels: Record<TipoFalla, string> = {
    rechazado: "Rechazado",
    nulo: "Nulo",
    sin_registro: "Sin Registro",
    fuera_de_rango: "Fuera de Rango",
  };
  return <span className={`chip-falla chip-${tipo}`}>{labels[tipo] ?? tipo}</span>;
};

export const TablaFallas: React.FC<Props> = ({
  fallas,
  estacionId,
  temporada,
  onAbrirModal,
}) => {
  // Invocación a la URL oficial según requerimiento de la API
  const handleDescargarCSV = () => {
    const url = `/api/v1/calidad/fallas?estacion=${encodeURIComponent(
      estacionId
    )}&temporada=${encodeURIComponent(temporada)}&formato=csv`;

    window.open(url, "_blank");
  };

  return (
    <div className="tabla-fallas-contenedor">
      <div className="tabla-fallas-header">
        <span className="calor-subtitulo">Detalle de Registros con Inconsistencia</span>
        <button className="btn-exportar-csv" onClick={handleDescargarCSV}>
          Descargar Reporte CSV
        </button>
      </div>

      {fallas.length === 0 ? (
        <div className="huglin-aviso">No se registraron fallas para esta estación y temporada.</div>
      ) : (
        <div className="tabla-responsive">
          <table className="tabla-vigno">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Variable</th>
                <th>Tipo de Falla</th>
                <th>Valor Orig.</th>
                <th>Archivo Origen</th>
                <th>Fila</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {fallas.map((falla) => (
                <tr key={falla.id}>
                  <td>{falla.fecha}</td>
                  <td className="col-variable">{falla.variable.toUpperCase()}</td>
                  <td>{formatTipoFalla(falla.tipoFalla)}</td>
                  <td>{falla.valorOriginal ?? "N/A"}</td>
                  <td className="col-archivo">{falla.archivoOrigen}</td>
                  <td>{falla.fila}</td>
                  <td className="col-motivo">{falla.motivo}</td>
                  <td>{formatBadgeEstado(falla.estadoCorreccion)}</td>
                  <td>
                    <button
                      className="btn-accion-corregir"
                      onClick={() => onAbrirModal(falla)}
                    >
                      Corregir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TablaFallas;