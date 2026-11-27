
import AlertaCritica from "./AlertaCritica";
import{ThermometerSun}from"lucide-react";
import MiniGraficoLinea from"./MiniGraficoLinea";

// define las opciones de temperatura que se pueden mostrar en el grafico
const SERIES=[
  ["maxima","Máxima","maxima"],
  ["mediaDiaria","Media","media"],
  ["minima","Mínima","minima"],
];

// componente que recibe los datos y las metricas de temperatura
function TarjetaTemperatura({
  datos,textoPeriodo,maximo,minimo,media,serie,
  cambiarSerie,configuracionSerie,formatearNumero,formatearFecha,
  alertaCritica=null,
}){
  return(
    <article className={`rm-card ${alertaCritica ? "rm-card-critica" : ""}`}>
      <div className="rm-card-top">
        <div className="rm-card-titulo">
          <div className="rm-icono rm-icono-temperatura">
            <ThermometerSun size={18}/>
          </div>

          <div>
            <h2>Temperatura del aire</h2>
            <p>{textoPeriodo}</p>
          </div>
        </div>

        {/* muestra una alerta si existe un mensaje */}
        <AlertaCritica mensaje={alertaCritica} />
      </div>

      <div className="rm-metricas rm-metricas-3">

        {/* muestra la temperatura maxima y la fecha en que ocurrio */}
        <div>
          <strong className="rm-maxima">
            {formatearNumero(maximo?.maxima)} °C
          </strong>
          <span>Máxima del período</span>
          <small>{formatearFecha(maximo?.fecha)}</small>
        </div>

        {/* muestra el promedio de temperatura del periodo */}
        <div>
          <strong className="rm-media">
            {formatearNumero(media)} °C
          </strong>
          <span>Promedio del período</span>
        </div>

        {/* muestra la temperatura minima y su fecha */}
        <div>
          <strong className="rm-minima">
            {formatearNumero(minimo?.minima)} °C
          </strong>
          <span>Mínima del período</span>
          <small>{formatearFecha(minimo?.fecha)}</small>
        </div>
      </div>

      {/* crea los botones para elegir maxima, media o minima */}
      <div className="rm-selector-series">
        {SERIES.map(([valor,texto,clase])=>(
          <button
            key={valor}
            type="button"
            className={serie===valor?`activo ${clase}`:""}
            onClick={()=>cambiarSerie(valor)}
          >
            <i/>
            {texto}
          </button>
        ))}
      </div>

      <div className="rm-grafico">

        {/* muestra el grafico de la serie seleccionada */}
        <MiniGraficoLinea
          datos={datos}
          series={[{
            ...configuracionSerie,
            unidad:" °C",
            grosor:2.4,
          }]}
        />
      </div>
    </article>
  );
}

export default TarjetaTemperatura;
