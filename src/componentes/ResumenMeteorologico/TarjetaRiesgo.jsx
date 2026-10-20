import{Snowflake,TriangleAlert}from"lucide-react";
import MiniGraficoLinea from"./MiniGraficoLinea";

const LINEAS_REFERENCIA=[
  {valor:2,color:"#f59e0b"},
  {valor:0,color:"#ef4444"},
];

const SERIE_MINIMA=[{
  campo:"minima",
  nombre:"Mínima diaria",
  unidad:" °C",
  color:"#3389f4",
  grosor:2.3,
}];

function TarjetaRiesgo({
  datos,registroMinimo,diasBajo2,diasBajo0,
  formatearNumero,formatearFecha,
}){
  const riesgoCritico=diasBajo0>0;
  const riesgoTermico=diasBajo2>0;

  const claseRiesgo=riesgoCritico
    ?"rm-riesgo-critico"
    :riesgoTermico
      ?"rm-riesgo-atencion"
      :"";

  const badge=riesgoCritico
    ?["rm-badge-critico","Helada crítica"]
    :riesgoTermico
      ?["rm-badge-riesgo","Riesgo de helada"]
      :null;

  return(
    <article className={`rm-card rm-card-riesgo ${claseRiesgo}`}>
      <div className="rm-card-top">
        <div className="rm-card-titulo">
          <div className="rm-icono rm-icono-riesgo">
            <Snowflake size={18}/>
          </div>

          <div>
            <h2>Riesgo térmico</h2>
            <p>Basado en temperatura mínima diaria</p>
          </div>
        </div>

        {badge&&(
          <span className={badge[0]}>
            <TriangleAlert size={12}/>
            {badge[1]}
          </span>
        )}
      </div>

      <div className="rm-metricas rm-metricas-3">
        <div className={riesgoCritico?"rm-metrica-roja":""}>
          <strong className={riesgoCritico?"rm-rojo":"rm-minima"}>
            {formatearNumero(registroMinimo?.minima)} °C
          </strong>
          <span>Mínima del período</span>
          <small>{formatearFecha(registroMinimo?.fecha)}</small>
        </div>

        <div className="rm-metrica-ambar">
          <strong>{diasBajo2}</strong>
          <span>Días con mínima ≤ 2 °C</span>
        </div>

        <div className="rm-metrica-roja">
          <strong>{diasBajo0}</strong>
          <span>Días con mínima ≤ 0 °C</span>
        </div>
      </div>

      <div className="rm-grafico">
        <MiniGraficoLinea
          datos={datos}
          destacarRiesgo
          campoRiesgo="minima"
          lineasReferencia={LINEAS_REFERENCIA}
          series={SERIE_MINIMA}
        />
      </div>

      <div className="rm-leyenda">
        <span><i className="rm-dot rm-dot-min"/>Mínima diaria</span>
        <span><i className="rm-line rm-line-2"/>Riesgo · 2 °C</span>
        <span><i className="rm-line rm-line-0"/>Crítico · 0 °C</span>
      </div>
    </article>
  );
}

export default TarjetaRiesgo;