import React, { useState, useMemo } from 'react';
import { SeriesDiariasTemperaturas, MetadatosEstaciones } from '../../types/climate';
import { obtenerTemporadasDisponibles } from '../../utils/winkler';
import { calcularIndiceHuglin } from '../../utils/huglin';
// @ts-ignore
import './HuglinCard.css';

interface HuglinCardProps {
  seriesTemperaturas?: SeriesDiariasTemperaturas[];
  estaciones?: MetadatosEstaciones[];
}

export const HuglinCard: React.FC<HuglinCardProps> = ({
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

  const {
    ihTotal,
    clasificacion,
    descripcion,
    temporada,
  } = useMemo(
    () => calcularIndiceHuglin(seriesTemperaturas, estacionActiva, temporadaActiva),
    [seriesTemperaturas, estacionActiva, temporadaActiva]
  );

  return (
    <div className="huglin-card">
      <div className="huglin-card-header">
        <div className="huglin-header-top">
          <span className="huglin-badge">Índice Bioclimático</span>

          <div className="huglin-selectores">
            {estaciones.length > 1 && (
              <select
                className="huglin-select"
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
              className="huglin-select"
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

        <h4>Índice Heliotérmico de Huglin (IH)</h4>
      </div>

      <div className="huglin-card-body">
        <div className="huglin-metric">
          <span className="huglin-value">{ihTotal}</span>
          <span className="huglin-unit">IH</span>
        </div>

        <div className="huglin-classification">
          <span className="huglin-region">{clasificacion}</span>
          <span className="huglin-desc">{descripcion}</span>
        </div>
      </div>

      <div className="huglin-card-footer">
        <small>
          {temporada ? `Temporada activa ${temporada} (1 Oct - 30 Abr)` : 'Ciclo vegetativo'} · Base 10°C (d=1.02)
        </small>
      </div>
    </div>
  );
};