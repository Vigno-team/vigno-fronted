import { useState } from "react";

import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import HarvestProgressBar from "./componentes/HarvestProgressBar/HarvestProgressBar";
import TemperatureChart from "./componentes/TemperatureChart";
import { useClimateData } from "./hooks/useClimateData";

import "./App.css";

function App() {
  const [barraExpandida, setBarraExpandida] = useState(false);

  const { data, loading } = useClimateData();

  if (loading) {
    return (
      <div className="aplicacion">
        <BarraLateral
          expandida={barraExpandida}
          cambiarEstado={setBarraExpandida}
        />

        <main
          className={
            barraExpandida
              ? "contenido contenido-expandido"
              : "contenido contenido-contraido"
          }
        >
          <div className="estado-datos">
            Cargando datos meteorológicos...
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="aplicacion">
        <BarraLateral
          expandida={barraExpandida}
          cambiarEstado={setBarraExpandida}
        />

        <main
          className={
            barraExpandida
              ? "contenido contenido-expandido"
              : "contenido contenido-contraido"
          }
        >
          <div className="estado-datos">
            No se pudieron cargar los datos.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="aplicacion">
      <BarraLateral
        expandida={barraExpandida}
        cambiarEstado={setBarraExpandida}
      />

      <main
        className={
          barraExpandida
            ? "contenido contenido-expandido"
            : "contenido contenido-contraido"
        }
      >
        <TemperatureChart
          estaciones={data.estaciones}
          datosTemperatura={data.seriesTemperaturas}
        />
        //valores que se cambiaran segun bd
        <HarvestProgressBar
          avance={78}
          diasEstimados={12}
          temperaturas={[30, 37, 32.5, 35, 31]}
        />
      </main>
    </div>
  );
}

export default App;