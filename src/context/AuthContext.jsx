import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir o recargar la app, revisamos si habia sesion guardada
  useEffect(() => {
    const tokenGuardado = localStorage.getItem("vigno_token") || sessionStorage.getItem("vigno_token");
    if (tokenGuardado) {
      setToken(tokenGuardado);
    }
    setCargando(false);
  }, []);

  // Iniciar sesion y guardar segun la casilla Recordarme
  const iniciarSesion = (jwtToken, recordar = false) => {
    setToken(jwtToken);
    if (recordar) {
      localStorage.setItem("vigno_token", jwtToken);
    } else {
      localStorage.removeItem("vigno_token");
      sessionStorage.setItem("vigno_token", jwtToken);
    }
  };

  // Cerrar sesion: limpia memoria y almacenamientos
  const cerrarSesion = () => {
    setToken(null);
    localStorage.removeItem("vigno_token");
    sessionStorage.removeItem("vigno_token");
  };

  const valoresCompartidos = {
    token,
    autenticado: token !== null,
    cargando,
    iniciarSesion,
    cerrarSesion,
  };

  return (
    <AuthContext.Provider value={valoresCompartidos}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return contexto;
}