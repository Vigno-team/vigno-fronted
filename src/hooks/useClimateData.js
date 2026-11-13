import { useEffect, useState } from "react";
import { pedirApi } from "../services/api";

// Devuelve datos reales y permite reintentar sin usar JSON ficticios.
export function useClimateData(ruta) {
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState({ clave: "", data: null, error: null });
  const clave = `${ruta}-${intento}`;

  useEffect(() => {
    const control = new AbortController();
    pedirApi(ruta, { signal: control.signal })
      .then(data => { if (!control.signal.aborted) setEstado({ clave, data, error: null }); })
      .catch(error => {
        if (!control.signal.aborted) setEstado({ clave, data: null, error: error.message });
      });
    return () => control.abort();
  }, [ruta, clave]);

  const actual = estado.clave === clave;
  return {
    data: actual ? estado.data : null,
    error: actual ? estado.error : null,
    loading: !actual,
    recargar: () => setIntento(n => n + 1),
  };
}
