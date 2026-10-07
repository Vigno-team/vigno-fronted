import { ArrowUpDown } from "lucide-react";
import MiniGraficoLinea from "./MiniGraficoLinea";

const SERIE_AMPLITUD = [
  {
    campo: "amplitudTermica",
    nombre: "Amplitud térmica",
    unidad: " °C",
    color: "#9d4a1e",
    grosor: 2.3,
  },
];

function TarjetaAmplitud({
  datos,
  promedio,
  maxima,
  formatearNumero,
  formatearFecha,
}) {
  return (
    <article className="rm-card">
      <div className="rm-card-top">
        <div className="rm-card-titulo">
          <div className="rm-icono rm-icono-amplitud">
            <ArrowUpDown size={18} />
          </div>

          <div>
            <h2>Amplitud térmica</h2>
            <p>Diferencia entre máxima y mínima diaria</p>
          </div>
        </div>
      </div>

      <div className="rm-metricas rm-metricas-2">
        <div>
          <strong className="rm-amplitud">
            {formatearNumero(promedio)} °C
          </strong>
          <span>Promedio del período</span>
        </div>

        <div>
          <strong className="rm-amplitud">
            {formatearNumero(maxima?.amplitudTermica)} °C
          </strong>
          <span>Mayor amplitud</span>
          <small>{formatearFecha(maxima?.fecha)}</small>
        </div>
      </div>

      <div className="rm-grafico">
        <MiniGraficoLinea
          datos={datos}
          series={SERIE_AMPLITUD}
        />
      </div>
    </article>
  );
}

export default TarjetaAmplitud;