import React from 'react';
import './HarvestProgressBar.css';

export const HarvestProgressBar = ({
  avance= 0,
  diasEstimados= 0,
  temperaturas= [0, 0, 0, 0, 0],
}) => {
  //Seccion variables a usar
  let progreso= avance;
  let estado= "";
  let mensajeEstado= "";

  //Seccion barra
  if(progreso<0){
    progreso= 0;
  }else if(progreso > 100){
    progreso= 100;
  }
  

  //Seccion alerta
  let alertaOlaCalor = temperaturas.length >= 5 && temperaturas.every(temp => temp > 35);

  if (alertaOlaCalor) {
    estado = "alerta";
    mensajeEstado = "Registros mayores a 35 °C en últimos 5 días";
  } else {
    estado = "normal";
    mensajeEstado = "Registros normales en últimos 5 días";
  }

  //Card devuelto
  return (
    <div className="vigno-card">

      <div className="vigno-tiempo-estimado">
        Aproximadamente a {diasEstimados} días de ventana óptima
      </div>

      <div className="vigno-barra">
        <div className="vigno-barra-avance" style={{width: `${progreso}%`}} />
        <div className="vigno-circulo" style={{left: `calc(${progreso}% - 18px)`}}>
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