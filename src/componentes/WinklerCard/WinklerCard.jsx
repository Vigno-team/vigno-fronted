import React from "react";
import { calcularIndiceWinkler } from "../../utils/winkler";
import "./WinklerCard.css";

export const WinklerCard = ({ seriesTemperaturas = [] }) => {
  const { gddTotal, region, descripcion } =
    calcularIndiceWinkler(seriesTemperaturas);

  return (
    <div className="winkler-card">
      <div className="winkler-card-header">
        <span className="winkler-badge">Índice Bioclimático</span>
        <h4>Índice de Winkler</h4>
      </div>

      <div className="winkler-card-body">
        <div className="winkler-metric">
          <span className="winkler-value">{gddTotal}</span>
          <span className="winkler-unit">GDD</span>
        </div>

        <div className="winkler-classification">
          <span className="winkler-region">{region}</span>
          <span className="winkler-desc">Clima {descripcion}</span>
        </div>
      </div>

      <div className="winkler-card-footer">
        <small>Grados Día Acumulados en temporada activa (Base 10°C)</small>
      </div>
    </div>
  );
};
