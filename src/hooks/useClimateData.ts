import { useState, useEffect } from "react";
import { ClimateDataResponse } from '../types/climate';

import climateData from "../mock/climateData.json";

export const useClimateData = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClimateDataResponse | null>(null);// Le indica a typescript que la variable arranca en null pero tendra un objeto con la forma de 'ClimateDataResponse'

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setData(climateData); // Guardamos los datos simulados
      setLoading(false); // Apagamos la pantalla de carga
    }, 1000);

    // Limpieza de memoria si el usuario cambia de pantalla antes del segundo
    return () => clearTimeout(temporizador);
  }, []);

  return { data, loading };
};
