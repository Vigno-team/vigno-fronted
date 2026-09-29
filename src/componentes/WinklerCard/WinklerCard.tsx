import React, { useState, useMemo } from 'react';
import { SeriesDiariasTemperaturas, MetadatosEstaciones } from '../../types/climate';
import { calcularIndiceWinkler, obtenerTemporadasDisponibles } from '../../utils/winkler';
// @ts-ignore
import './WinklerCard.css';

interface WinklerCardProps {
  seriesTemperaturas?: SeriesDiariasTemperaturas[];
  estaciones?: MetadatosEstaciones[];
}

export const WinklerCard: React.FC<WinklerCardProps> = ({
  seriesTemperaturas = [],
  estaciones = [],
}) => {
  const temporadas = useMemo(
    () => obtenerTemporadasDisponibles(seriesTemperaturas),
    [seriesTemperaturas]
  );

  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState<string>('');
  const [estacionSeleccionada, setEstacionSeleccionada] = useState<string>('');

  const temporadaActiva = temporadaSeleccionada || temporadas[temporadas.length - 1] || '';
  const estacionActiva = estacionSeleccionada || (seriesTemperaturas[0]?.estacionId ?? '');

  const { gddTotal, region, descripcion, temporada } = useMemo(
    () => calcularIndiceWinkler(seriesTemperaturas, estacionActiva, temporadaActiva),
    [seriesTemperaturas, estacionActiva, temporadaActiva]
  );

  return (
    <div className="winkler-card">
      <div className="winkler-card-header">
        <div className="winkler-header-top">
          <span className="winkler-badge">Índice Bioclimático</span>
          
          <div className="winkler-selectores">
            {estaciones.length > 1 && (
              <select
                className="winkler-select"
                value={estacionActiva}
                onChange={(e) => setEstacionSeleccionada(e.target.value)}
              >
                {estaciones.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.huerto}
                  </option>
                ))}
              </select>
            )}

            <select
              className="winkler-select"
              value={temporadaActiva}
              onChange={(e) => setTemporadaSeleccionada(e.target.value)}
            >
              {temporadas.map((temp) => (
                <option key={temp} value={temp}>
                  Temporada {temp}
                </option>
              ))}
            </select>
          </div>
        </div>

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
        <small>
          {temporada ? `Temporada activa ${temporada} (1 Oct - 30 Abr)` : 'Ciclo vegetativo'} · Base 10°C
        </small>
      </div>
    </div>
  );
};