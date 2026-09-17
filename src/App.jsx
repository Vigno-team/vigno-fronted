import { useState } from "react";

import BarraLateral from "./componentes/BarraLateral/BarraLateral";
import TemperatureChart from "./componentes/TemperatureChart";
import { seriesTemperatura } from "./datos/temperaturas";

import "./App.css";

function App() {
  const [barraExpandida, setBarraExpandida] = useState(false);

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
          seriesTemporales={seriesTemperatura}
        />
      </main>
    </div>
  );
}

export default App;