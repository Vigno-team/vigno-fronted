/* eslint-disable react-refresh/only-export-components -- Provider y hook juntos para facilitar el estudio. */
import { createContext, useContext, useState } from "react";
import { loginRequest, logoutRequest, MODO_DEMO } from "../services/authService";

const AuthContext = createContext(null);
const limpiar = () => ["access", "refresh", "usuario"].forEach(k => sessionStorage.removeItem(k));

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    try {
      const access = sessionStorage.getItem("access");
      const usuario = JSON.parse(sessionStorage.getItem("usuario") || "null");
      // No reutilizar credenciales demo fuera del modo demo ni al revés.
      if (access && usuario && access.startsWith("demo-") === MODO_DEMO) return { access, usuario };
    } catch { /* Sesión incompleta */ }
    limpiar();
    return null;
  });

  async function login(email, password) {
    const data = await loginRequest(email, password);
    sessionStorage.setItem("access", data.access);
    sessionStorage.setItem("refresh", data.refresh || "");
    sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
    setSesion({ access: data.access, usuario: data.usuario });
  }

  async function logout() {
    try { await logoutRequest(); } finally { limpiar(); setSesion(null); }
  }

  return (
    <AuthContext.Provider value={{
      usuario: sesion?.usuario || null,
      access: sesion?.access || null,
      isAuthenticated: Boolean(sesion?.access),
      loadingAuth: false,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
