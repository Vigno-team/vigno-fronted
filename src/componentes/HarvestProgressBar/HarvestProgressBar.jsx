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
  if (temperaturas[0]>=35 && temperaturas[1]>=35 && temperaturas[2]>=35 && temperaturas[3]>=35 && temperaturas[4]>=35) {
    estado= "alerta";
    mensajeEstado= "Registros mayores a 35 °C en últimos 5 días";
  }else{
    estado= "normal";
    mensajeEstado= "Registros normales en últimos 5 días";
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
          <div className="vigno-temp">{temperaturas[0] ?? "--"}°</div>
          <div className="vigno-temp">{temperaturas[1] ?? "--"}°</div>
          <div className="vigno-temp">{temperaturas[2] ?? "--"}°</div>
          <div className="vigno-temp">{temperaturas[3] ?? "--"}°</div>
          <div className="vigno-temp">{temperaturas[4] ?? "--"}°</div>
        </div>
      </div>
    </div>
  );
};
export default HarvestProgressBar;