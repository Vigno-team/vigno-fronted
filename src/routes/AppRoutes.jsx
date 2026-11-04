import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexto/AuthContext";
import { Login } from "../pages/Login";
import App from "../App";

function Protegida() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}

function Publica() {
  return useAuth().isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Publica />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<Protegida />}>
          <Route path="/dashboard/*" element={<App />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
