import { Snowflake, TriangleAlert } from "lucide-react";
import MiniGraficoLinea from "./MiniGraficoLinea";

const SERIE_MINIMA = [{
  campo: "minima", nombre: "Mínima diaria", unidad: " °C",
  color: "#3389f4", grosor: 2.3,
}];

function TarjetaRiesgo({
  datos, registroMinimo, diasRiesgo, diasCriticos,
  umbralRiesgo, umbralHelada,
  formatearNumero, formatearFecha,
}) {
  const riesgoCritico = diasCriticos > 0;
  const riesgoPreventivo = diasRiesgo > 0;
  const claseRiesgo = riesgoCritico ? "rm-riesgo-critico" : riesgoPreventivo ? "rm-riesgo-atencion" : "";
  const badge = riesgoCritico
    ? ["rm-badge-critico", "Helada crítica"]
    : riesgoPreventivo ? ["rm-badge-riesgo", "Riesgo de helada"] : null;

  const lineasReferencia = [
    { valor: umbralRiesgo, color: "#f59e0b" },
    { valor: umbralHelada, color: "#ef4444" },
  ].filter((linea) => Number.isFinite(linea.valor));

  return (
    <article className={`rm-card rm-card-riesgo ${claseRiesgo} ${riesgoCritico ? "rm-card-critica" : ""}`}>
      <div className="rm-card-top">
        <div className="rm-card-titulo">
          <div className="rm-icono rm-icono-riesgo"><Snowflake size={18} /></div>
          <div><h2>Riesgo térmico</h2><p>Basado en temperatura mínima diaria</p></div>
        </div>
        {badge && <span className={badge[0]}><TriangleAlert size={12} />{badge[1]}</span>}
      </div>
      <div className="rm-metricas rm-metricas-3">
        <div className={riesgoCritico ? "rm-metrica-roja" : ""}>
          <strong className={riesgoCritico ? "rm-rojo" : "rm-minima"}>{formatearNumero(registroMinimo?.minima)} °C</strong>
          <span>Mínima del período</span><small>{formatearFecha(registroMinimo?.fecha)}</small>
        </div>
        <div className="rm-metrica-ambar">
          <strong>{diasRiesgo}</strong>
          <span>Días con mínima ≤ {formatearNumero(umbralRiesgo)} °C</span>
        </div>
        <div className={riesgoCritico ? "rm-metrica-roja" : ""}>
          <strong>{diasCriticos}</strong>
          <span>Días con mínima ≤ {formatearNumero(umbralHelada)} °C</span>
        </div>
      </div>
      <div className="rm-grafico">
        <MiniGraficoLinea
          datos={datos} destacarRiesgo campoRiesgo="minima"
          umbralRiesgo={umbralRiesgo} umbralCritico={umbralHelada}
          lineasReferencia={lineasReferencia} series={SERIE_MINIMA}
        />
      </div>
      <div className="rm-leyenda">
        <span><i className="rm-dot rm-dot-min" />Mínima diaria</span>
        <span><i className="rm-line rm-line-2" />Riesgo · {formatearNumero(umbralRiesgo)} °C</span>
        <span><i className="rm-line rm-line-0" />Crítico · {formatearNumero(umbralHelada)} °C</span>
      </div>
    </article>
  );
}
export default TarjetaRiesgo;
