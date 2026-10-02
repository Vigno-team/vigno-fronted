import {
  CheckCircle2,
  X,
} from "lucide-react";

import {
  formatearFechaCompleta,
  nombreEstacion,
} from "./alertasConfig";

import ReporteAcordeon from "./ReporteAcordeon";

function PanelReportes({
  fecha,
  estacion,
  reportes,
  reporteAbierto,
  cambiarReporte,
  cerrar,
}) {
  if (!fecha) {
    return (
      <aside className="ar-detalle" />
    );
  }

  return (
    <aside className="ar-detalle">
      <div className="ar-detalle-header">
        <div>
          <span className="ar-detalle-etiqueta">
            Reportes del día
          </span>

          <h2>
            {formatearFechaCompleta(
              fecha
            )}
          </h2>

          <p>
            {nombreEstacion(
              estacion
            )}
            {" · "}
            {reportes.length === 1
              ? "1 registro"
              : `${reportes.length} registros`}
          </p>
        </div>

        <button
          type="button"
          className="ar-cerrar"
          onClick={cerrar}
          aria-label="Cerrar detalle"
        >
          <X size={19} />
        </button>
      </div>

      {reportes.length ? (
        <div className="ar-lista-reportes">
          {reportes.map(
            (reporte, indice) => (
              <ReporteAcordeon
                key={reporte.id}
                reporte={reporte}
                indice={indice}
                abierto={
                  reporteAbierto ===
                  reporte.id
                }
                onCambiar={() =>
                  cambiarReporte(
                    reporteAbierto ===
                      reporte.id
                      ? null
                      : reporte.id
                  )
                }
              />
            )
          )}
        </div>
      ) : (
        <div className="ar-sin-reportes">
          <CheckCircle2
            size={40}
          />

          <strong>
            Sin información disponible
          </strong>

          <span>
            No existen registros disponibles para esta fecha.
          </span>
        </div>
      )}
    </aside>
  );
}

export default PanelReportes;