import React from "react";
import "./HarvestProgressBar.css";

export const HarvestProgressBar = ({
  avance = 0,
  diasEstimados = 0,
  temperaturas = [0, 0, 0, 0, 0],
  rachaCalor = false,
}) => {
  const progresoNumerico = Number.isFinite(Number(avance)) ? Number(avance) : 0;
  const progreso = Math.min(Math.max(progresoNumerico, 0), 100);
  const dias = Number.isFinite(Number(diasEstimados)) ? Number(diasEstimados) : 0;
  const listaTemperaturas =
    Array.isArray(temperaturas) && temperaturas.length > 0
      ? temperaturas
      : [0, 0, 0, 0, 0];

  const estado = rachaCalor ? "alerta" : "normal";
  const mensajeEstado = rachaCalor
    ? "Alerta de ola de calor detectada por el sistema"
    : "Registros normales en últimos 5 días";

  return (
    <div className="vigno-card">
      <div className="vigno-header-top">
        <div>
          <span className="winkler-badge">
            ESTADO FENOLÓGICO Y PROGRESO DE VENDIMIA
          </span>
          <p className="winkler-desc">
            Seguimiento de madurez y comportamiento térmico reciente.
          </p>
        </div>

        <p className="winkler-desc vigno-tiempo-estimado">
          A <strong>{dias} días</strong> de ventana óptima
        </p>
      </div>

      <div className="vigno-barra-contenedor">
        <div
          className="vigno-barra"
          role="progressbar"
          aria-valuenow={Math.round(progreso)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="vigno-barra-avance"
            style={{ width: `${progreso}%` }}
          />
          <div
            className="winkler-desc vigno-circulo"
            style={{
              left: `clamp(0px, calc(${progreso}% - 17px), calc(100% - 34px))`,
            }}
          >
            {Math.round(progreso)}%
          </div>
        </div>
      </div>

      <div className={`vigno-panel-estado ${estado}`}>
        <p className="winkler-desc vigno-texto-estado">{mensajeEstado}</p>

        <div className="vigno-lista-temperaturas">
          {listaTemperaturas.map((temp, index) => (
            <span
              key={index}
              className="winkler-desc vigno-temp"
              title={`Día ${index + 1}`}
            >
              {Number.isFinite(Number(temp)) ? Number(temp) : 0}°
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HarvestProgressBar;