import { useEffect, useState } from "react";
import { ClimateDataResponse } from "../types/climate";
import climateData from "../mock/climateData.json";

export const useClimateData = () => {
  // Los datos comienzan vacíos hasta que termina la carga simulada.
  const [data, setData] = useState<ClimateDataResponse | null>(null);

  // Indica si los datos todavía se están cargando.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula el tiempo que posteriormente tardaría una petición a la API.
    const temporizador = setTimeout(() => {
      setData(climateData as ClimateDataResponse);
      setLoading(false);
    }, 1000);

    // Cancela el temporizador si el componente deja de utilizarse.
    return () => clearTimeout(temporizador);
  }, []);

  return { data, loading };
};