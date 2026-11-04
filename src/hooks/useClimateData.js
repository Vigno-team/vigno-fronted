import { useState, useEffect } from "react";
import { refreshAccessToken } from "../services/authService";

export function useClimateData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function fetchData() {
      try {
        const hacerPeticion = async (tokenActual) => {
          const headers = {
            Accept: "application/json",
            ...(tokenActual ? { Authorization: `Bearer ${tokenActual}` } : {}),
          };
          return await fetch(url, {
            method: "GET",
            headers,
            signal: controller.signal,
          });
        };

        let access = sessionStorage.getItem("access");
        let response = await hacerPeticion(access);

        if (response.status === 401 && sessionStorage.getItem("refresh")) {
          try {
            access = await refreshAccessToken();
            response = await hacerPeticion(access);
          } catch {
            window.location.href = "/login";
            throw new Error("Sesión expirada");
          }
        }

        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("access");
          sessionStorage.removeItem("refresh");
          sessionStorage.removeItem("usuario");
          window.location.href = "/login";
          throw new Error("No autorizado");
        }

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Formato JSON inválido");
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setData(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
}