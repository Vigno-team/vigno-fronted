import { createContext, useContext, useState, useEffect } from "react";
import { loginRequest, logoutRequest } from "../services/authService";
import { pedirApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [access, setAccess] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    async function verificarSesion() {
      try {
        const savedAccess = sessionStorage.getItem("access");
        const savedUser = sessionStorage.getItem("usuario");
        if (savedAccess && savedUser && savedUser !== "undefined") {
          setAccess(savedAccess);
          setUsuario(JSON.parse(savedUser));
          try {
            const datos = await pedirApi("/v1/auth/yo");
            const userObj = datos?.usuario || datos?.user || datos;
            if (userObj && typeof userObj === "object") {
              sessionStorage.setItem("usuario", JSON.stringify(userObj));
              setUsuario(userObj);
              setAccess(sessionStorage.getItem("access"));
            }
          } catch {
            if (!sessionStorage.getItem("access")) {
              setAccess(null);
              setUsuario(null);
            }
          }
        }
      } catch {
        sessionStorage.removeItem("access");
        sessionStorage.removeItem("refresh");
        sessionStorage.removeItem("usuario");
      } finally {
        setLoadingAuth(false);
      }
    }

    verificarSesion();
  }, []);

  const login = async (email, password) => {
    const data = await loginRequest(email, password);
    const userObj = data.usuario || data.user || { email };
    sessionStorage.setItem("access", data.access);
    sessionStorage.setItem("refresh", data.refresh || "");
    sessionStorage.setItem("usuario", JSON.stringify(userObj));
    setAccess(data.access);
    setUsuario(userObj);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      sessionStorage.removeItem("access");
      sessionStorage.removeItem("refresh");
      sessionStorage.removeItem("usuario");
      setAccess(null);
      setUsuario(null);
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, user: usuario, access, isAuthenticated: !!access, loadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);