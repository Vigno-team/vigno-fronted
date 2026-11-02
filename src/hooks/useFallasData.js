import { useState, useEffect } from "react";

export const useFallasData = (estacionId, temporada) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!estacionId || !temporada) return;

    const fetchFallas = async () => {
      setLoading(true);
      setError(null);

      try {
        // Intenta consultar el endpoint real de la API
        const response = await fetch(
          `/api/v1/calidad/fallas?estacion=${encodeURIComponent(estacionId)}&temporada=${encodeURIComponent(temporada)}`
        );

        if (response.ok) {
          const result = await response.json();
          setData(result);
        } else {
          // Fallback al JSON local de prueba mientras el backend no esté disponible
          const fallbackRes = await fetch("/data/fallasData.json");
          const fallbackData = await fallbackRes.json();
          const mockEstacion = fallbackData[estacionId] || {};
          const mockTemporada = mockEstacion[temporada] || null;

          setData(mockTemporada);
        }
      } catch (err) {
        // Fallback en caso de error de red
        try {
          const fallbackRes = await fetch("/data/fallasData.json");
          const fallbackData = await fallbackRes.json();
          const mockEstacion = fallbackData[estacionId] || {};
          const mockTemporada = mockEstacion[temporada] || null;

          setData(mockTemporada);
        } catch (localErr) {
          setError("Error al cargar los datos de auditoría de fallas.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFallas();
  }, [estacionId, temporada]);

  return { data, loading, error };
};