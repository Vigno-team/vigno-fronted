import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest, logoutRequest } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [access, setAccess] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    try {
      const savedAccess = sessionStorage.getItem("access");
      const savedUser = sessionStorage.getItem("usuario");
      if (savedAccess && savedUser) {
        setAccess(savedAccess);
        setUsuario(JSON.parse(savedUser));
      }
    } catch {
      sessionStorage.removeItem("access");
      sessionStorage.removeItem("refresh");
      sessionStorage.removeItem("usuario");
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    sessionStorage.setItem("access", data.access);
    sessionStorage.setItem("refresh", data.refresh);
    sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
    setAccess(data.access);
    setUsuario(data.usuario);
  };

  const logout = async () => {
    await logoutRequest();
    sessionStorage.removeItem("access");
    sessionStorage.removeItem("refresh");
    sessionStorage.removeItem("usuario");
    setAccess(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, access, isAuthenticated: !!access, loadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);