import { ChevronDown } from "lucide-react";
import { TIPOS } from "./alertasConfig";

function ReporteAcordeon({
  reporte,
  indice,
  abierto,
  onCambiar,
}) {
  const config = TIPOS[reporte.tipo];
  const Icono = config.Icono;

  return (
    <article
      className={`ar-reporte ${reporte.tipo} ${
        abierto ? "abierto" : ""
      }`}
    >
      <button
        type="button"
        className="ar-reporte-cabecera"
        aria-expanded={abierto}
        onClick={onCambiar}
      >
        <div className="ar-reporte-identidad">
          <span className="ar-reporte-icono">
            <Icono size={23} />
          </span>

          <div>
            <strong>
              {String(indice + 1).padStart(2, "0")} · {reporte.titulo}
            </strong>
            <small>{reporte.resumen}</small>
          </div>
        </div>

        <div className="ar-reporte-acciones">
          <span className={`ar-badge ${reporte.tipo}`}>
            {config.texto}
          </span>

          <ChevronDown
            size={18}
            className={abierto ? "girado" : ""}
          />
        </div>
      </button>

      <div
        className={`ar-reporte-contenido ${
          abierto ? "visible" : ""
        }`}
      >
        <div className="ar-reporte-datos">
          {reporte.detalles.map((detalle) => (
            <div key={detalle.etiqueta}>
              <span>{detalle.etiqueta}</span>
              <strong>{detalle.valor}</strong>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default ReporteAcordeon;