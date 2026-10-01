import {
  ThermometerSun,
} from "lucide-react";

import MiniGraficoLinea from "./MiniGraficoLinea";

function TarjetaTemperatura({
  datos,
  textoPeriodo,
  maximo,
  minimo,
  media,
  serie,
  cambiarSerie,
  configuracionSerie,
  formatearNumero,
  formatearFecha,
}) {
  return (
    <article className="rm-card">
      <div className="rm-card-top">
        <div className="rm-card-titulo">
          <div className="rm-icono rm-icono-temperatura">
            <ThermometerSun
              size={18}
            />
          </div>

          <div>
            <h2>
              Temperatura del aire
            </h2>
            <p>
              {textoPeriodo}
            </p>
          </div>
        </div>
      </div>

      <div className="rm-metricas rm-metricas-3">
        <div>
          <strong className="rm-maxima">
            {formatearNumero(
              maximo?.maxima
            )}{" "}
            °C
          </strong>
          <span>
            Máxima del período
          </span>
          <small>
            {formatearFecha(
              maximo?.fecha
            )}
          </small>
        </div>

        <div>
          <strong className="rm-media">
            {formatearNumero(
              media
            )}{" "}
            °C
          </strong>
          <span>
            Promedio del período
          </span>
        </div>

        <div>
          <strong className="rm-minima">
            {formatearNumero(
              minimo?.minima
            )}{" "}
            °C
          </strong>
          <span>
            Mínima del período
          </span>
          <small>
            {formatearFecha(
              minimo?.fecha
            )}
          </small>
        </div>
      </div>

      <div className="rm-selector-series">
        {[
          [
            "maxima",
            "Máxima",
            "maxima",
          ],
          [
            "mediaDiaria",
            "Media",
            "media",
          ],
          [
            "minima",
            "Mínima",
            "minima",
          ],
        ].map(
          ([
            valor,
            texto,
            clase,
          ]) => (
            <button
              key={valor}
              type="button"
              className={
                serie === valor
                  ? `activo ${clase}`
                  : ""
              }
              onClick={() =>
                cambiarSerie(
                  valor
                )
              }
            >
              <i />
              {texto}
            </button>
          )
        )}
      </div>

      <div className="rm-grafico">
        <MiniGraficoLinea
          datos={datos}
          series={[
            {
              ...configuracionSerie,
              unidad: " °C",
              grosor: 2.4,
            },
          ]}
        />
      </div>
    </article>
  );
}

export default TarjetaTemperatura;