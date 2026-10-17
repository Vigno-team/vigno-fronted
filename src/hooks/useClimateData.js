import { useEffect, useState } from "react";

export const useClimateData = () => {
  // Los datos comienzan vacíos hasta que termina la petición.
  const [data, setData] = useState(null);

  // Indica si los datos todavía se están cargando.
  const [loading, setLoading] = useState(true);

  // Almacena cualquier error que ocurra durante la carga.
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const response = await fetch("/data/climateData.json");

        if (!response.ok) {
          throw new Error(`Error al cargar los datos: ${response.status}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        setError(err.message || "Error al obtener los datos climáticos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  return { data, loading, error };
};