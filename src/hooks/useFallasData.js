import { useEffect, useState } from "react";
import { pedirApi } from "../services/api";

// Traduce el JSON de Django a las propiedades usadas por las tarjetas.
export function useFallasData(estacionId, temporada) {
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState({ clave: "", data: null, error: null });
  const clave = `${estacionId}-${temporada}-${intento}`;

  useEffect(() => {
    if (!estacionId || !temporada) return;
    const control = new AbortController();
    const filtro = `?estacion=${encodeURIComponent(estacionId)}&temporada=${encodeURIComponent(temporada)}`;

    pedirApi(`/v1/calidad/fallas${filtro}`, { signal: control.signal })
      .then(json => {
        if (control.signal.aborted) return;
        setEstado({ clave, error: null, data: {
          resumen: {
            totalFallas: json.resumen?.total ?? 0,
            porTipo: json.resumen?.por_tipo ?? {},
            porVariable: json.resumen?.por_variable ?? {},
          },
          fallas: (json.fallas ?? []).map((f, i) => ({
            id: String(f.medicion_id ?? `${f.fecha || "sin-fecha"}-${i}`),
            fecha: f.fecha ?? "", timestamp: f.timestamp ?? null,
            variable: f.variable ?? "", frecuencia: f.frecuencia ?? "D",
            tipoFalla: f.tipo, valorOriginal: f.valor_original,
            archivoOrigen: f.archivo ?? "", fila: f.fila ?? null,
            cargaOrigen: f.carga ?? null, motivo: f.motivo ?? "",
            estadoCorreccion: f.corregido ? "corregido" : "pendiente",
          })),
        } });
      })
      .catch(error => {
        if (!control.signal.aborted) setEstado({ clave, data: null, error: error.message });
      });
    return () => control.abort();
  }, [estacionId, temporada, clave]);

  const disponible = Boolean(estacionId && temporada);
  const actual = estado.clave === clave;
  return {
    data: disponible && actual ? estado.data : null,
    error: disponible && actual ? estado.error : null,
    loading: disponible && !actual,
    recargar: () => setIntento(n => n + 1),
  };
}
