import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ rutaRedireccion = "/login" }) {
  const { autenticado, cargando } = useAuth(); //traemos verificacion de estado

  // Esperamos a que el contexto termine de leer localStorage al recargar
  if (cargando) {
    return null;
  }

  /*
  if (!autenticado) {
    return <Navigate to={rutaRedireccion} replace />;
  }
  */

  // Mientras este comentado, siempre dejara pasar y mostrara las vistas internas
  return <Outlet />;
}