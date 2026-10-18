import React from 'react';
import './HarvestProgressBar.css';

export const HarvestProgressBar = ({
  avance = 0,
  diasEstimados = 0,
  temperaturas = [0, 0, 0, 0, 0],
  rachaCalor = false, // <-- Recibe la bandera directa del backend (calor.rachas.con_incidencia)
}) => {
  // Sección variables
  let progreso = avance;

  if (progreso < 0) {
    progreso = 0;
  } else if (progreso > 100) {
    progreso = 100;
  }

  // Sección alerta usando el estado que viene del backend
  const estado = rachaCalor ? "alerta" : "normal";
  const mensajeEstado = rachaCalor
    ? "Alerta de ola de calor detectada por el sistema"
    : "Registros normales en últimos 5 días";

  return (
    <div className="vigno-card">
      <div className="vigno-tiempo-estimado">
        Aproximadamente a {diasEstimados} días de ventana óptima
      </div>

      <div className="vigno-barra">
        <div className="vigno-barra-avance" style={{ width: `${progreso}%` }} />
        <div className="vigno-circulo" style={{ left: `calc(${progreso}% - 18px)` }}>
          {Math.round(progreso)}%
        </div>
      </div>

      <div className={`vigno-panel-estado ${estado}`}>
        <div className="vigno-texto-estado">
          {mensajeEstado}
        </div>

        <div className="vigno-lista-temperaturas">
          {temperaturas.map((temp, index) => (
            <div key={index} className="vigno-temp">
              {temp}°
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HarvestProgressBar;