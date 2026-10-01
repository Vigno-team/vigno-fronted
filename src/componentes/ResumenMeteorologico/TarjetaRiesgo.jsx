import {
  Snowflake,
  TriangleAlert,
} from "lucide-react";

import MiniGraficoLinea from "./MiniGraficoLinea";

function TarjetaRiesgo({
  datos,
  registroMinimo,
  diasBajo2,
  diasBajo0,
  formatearNumero,
  formatearFecha,
}) {
  const riesgoCritico =
    diasBajo0 > 0;

  const riesgoTermico =
    diasBajo2 > 0;

  return (
    <article
      className={`rm-card rm-card-riesgo ${
        riesgoCritico
          ? "rm-riesgo-critico"
          : riesgoTermico
            ? "rm-riesgo-atencion"
            : ""
      }`}
    >
      <div className="rm-card-top">
        <div className="rm-card-titulo">
          <div className="rm-icono rm-icono-riesgo">
            <Snowflake
              size={18}
            />
          </div>

          <div>
            <h2>
              Riesgo térmico
            </h2>
            <p>
              Basado en temperatura mínima diaria
            </p>
          </div>
        </div>

        {riesgoCritico ? (
          <span className="rm-badge-critico">
            <TriangleAlert
              size={12}
            />
            Helada crítica
          </span>
        ) : riesgoTermico ? (
          <span className="rm-badge-riesgo">
            <TriangleAlert
              size={12}
            />
            Riesgo de helada
          </span>
        ) : null}
      </div>

      <div className="rm-metricas rm-metricas-3">
        <div
          className={
            riesgoCritico
              ? "rm-metrica-roja"
              : ""
          }
        >
          <strong
            className={
              riesgoCritico
                ? "rm-rojo"
                : "rm-minima"
            }
          >
            {formatearNumero(
              registroMinimo
                ?.minima
            )}{" "}
            °C
          </strong>

          <span>
            Mínima del período
          </span>

          <small>
            {formatearFecha(
              registroMinimo
                ?.fecha
            )}
          </small>
        </div>

        <div className="rm-metrica-ambar">
          <strong>
            {diasBajo2}
          </strong>
          <span>
            Días con mínima ≤ 2 °C
          </span>
        </div>

        <div className="rm-metrica-roja">
          <strong>
            {diasBajo0}
          </strong>
          <span>
            Días con mínima ≤ 0 °C
          </span>
        </div>
      </div>

      <div className="rm-grafico">
        <MiniGraficoLinea
          datos={datos}
          destacarRiesgo
          campoRiesgo="minima"
          lineasReferencia={[
            {
              valor: 2,
              color: "#f59e0b",
            },
            {
              valor: 0,
              color: "#ef4444",
            },
          ]}
          series={[
            {
              campo: "minima",
              nombre:
                "Mínima diaria",
              unidad: " °C",
              color: "#3389f4",
              grosor: 2.3,
            },
          ]}
        />
      </div>

      <div className="rm-leyenda">
        <span>
          <i className="rm-dot rm-dot-min" />
          Mínima diaria
        </span>

        <span>
          <i className="rm-line rm-line-2" />
          Riesgo · 2 °C
        </span>

        <span>
          <i className="rm-line rm-line-0" />
          Crítico · 0 °C
        </span>
      </div>
    </article>
  );
}

export default TarjetaRiesgo;