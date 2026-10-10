import { CloudRain } from "lucide-react";
import MiniGraficoLinea from "./MiniGraficoLinea";

const SERIE_PRECIPITACION = [
  {
    campo: "precipitacionMm",
    nombre: "Precipitación",
    unidad: " mm",
    color: "#38a5ff",
  },
];

function TarjetaPrecipitacion({
  datos,
  total,
  diasConLluvia,
  maxima,
  esTemporada,
  formatearNumero,
  formatearFecha,
}) {
  return (
    <article className="rm-card">
      <div className="rm-card-top">
        <div className="rm-card-titulo">
          <div className="rm-icono rm-icono-lluvia">
            <CloudRain size={18} />
          </div>

          <div>
            <h2>Precipitación</h2>
            <p>Lluvia observada durante el período</p>
          </div>
        </div>
      </div>

      <div className="rm-metricas rm-metricas-3">
        <div>
          <strong className="rm-lluvia">
            {formatearNumero(total)} mm
          </strong>
          <span>{esTemporada ? "Total temporada" : "Total del período"}</span>
        </div>

        <div>
          <strong className="rm-lluvia">{diasConLluvia}</strong>
          <span>Días con lluvia</span>
        </div>

        <div>
          <strong className="rm-lluvia">
            {formatearNumero(maxima?.precipitacionMm)} mm
          </strong>
          <span>Máxima diaria</span>
          <small>{formatearFecha(maxima?.fecha)}</small>
        </div>
      </div>

      <div className="rm-grafico">
        <MiniGraficoLinea
          datos={datos}
          tipo="barras"
          series={SERIE_PRECIPITACION}
        />
      </div>
    </article>
  );
}

export default TarjetaPrecipitacion;