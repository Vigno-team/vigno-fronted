import { useState } from "react";
import "./LoginView.css";

//const URL_BASE_API = "http://localhost:8000/api";

export function LoginView({ onLoginSuccess }) {
  // Variables de control de pantalla
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorServidor, setErrorServidor] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [errores, setErrores] = useState({});

  // Campos de formulario para Login
  const [correoLogin, setCorreoLogin] = useState("");
  const [claveLogin, setClaveLogin] = useState("");
  const [recordarme, setRecordarme] = useState(false);

  // Campos de formulario para Registro
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [correoRegistro, setCorreoRegistro] = useState("");
  const [claveRegistro, setClaveRegistro] = useState("");
  const [confirmarClaveRegistro, setConfirmarClaveRegistro] = useState("");

  // Funciones para escribir en Login
  const manejarCambioCorreoLogin = (evento) => {
    setCorreoLogin(evento.target.value);
    if (errores.correoLogin) {
      setErrores({ ...errores, correoLogin: "" });
    }
  };

  const manejarCambioClaveLogin = (evento) => {
    setClaveLogin(evento.target.value);
    if (errores.claveLogin) {
      setErrores({ ...errores, claveLogin: "" });
    }
  };

  const manejarCambioRecordarme = (evento) => {
    setRecordarme(evento.target.checked);
  };

  // Funciones para escribir en Registro
  const manejarCambioNombreUsuario = (evento) => {
    setNombreUsuario(evento.target.value);
    if (errores.nombreUsuario) {
      setErrores({ ...errores, nombreUsuario: "" });
    }
  };

  const manejarCambioCorreoRegistro = (evento) => {
    setCorreoRegistro(evento.target.value);
    if (errores.correoRegistro) {
      setErrores({ ...errores, correoRegistro: "" });
    }
  };

  const manejarCambioClaveRegistro = (evento) => {
    setClaveRegistro(evento.target.value);
    if (errores.claveRegistro) {
      setErrores({ ...errores, claveRegistro: "" });
    }
  };

  const manejarCambioConfirmarClave = (evento) => {
    setConfirmarClaveRegistro(evento.target.value);
    if (errores.confirmarClaveRegistro) {
      setErrores({ ...errores, confirmarClaveRegistro: "" });
    }
  };

  // Cambiar entre la pantalla de Login y Registro
  const cambiarModo = () => {
    setEsRegistro(!esRegistro);
    setErrores({});
    setErrorServidor("");
    setMensajeExito("");
  };

  // Validaciones de Login
  const validarLogin = () => {
    const nuevosErrores = {};
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (correoLogin.trim() === "") {
      nuevosErrores.correoLogin = "El correo es obligatorio";
    } else if (!formatoCorreo.test(correoLogin)) {
      nuevosErrores.correoLogin = "Formato de correo no válido";
    }

    if (claveLogin === "") {
      nuevosErrores.claveLogin = "La contraseña es obligatoria";
    } else if (claveLogin.length < 6) {
      nuevosErrores.claveLogin = "Mínimo 6 caracteres";
    }

    return nuevosErrores;
  };

  // Validaciones de Registro
  const validarRegistro = () => {
    const nuevosErrores = {};
    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (nombreUsuario.trim() === "") {
      nuevosErrores.nombreUsuario = "El nombre de usuario es obligatorio";
    }

    if (correoRegistro.trim() === "") {
      nuevosErrores.correoRegistro = "El correo es obligatorio";
    } else if (!formatoCorreo.test(correoRegistro)) {
      nuevosErrores.correoRegistro = "Formato de correo no válido";
    }

    if (claveRegistro === "") {
      nuevosErrores.claveRegistro = "La contraseña es obligatoria";
    } else if (claveRegistro.length < 6) {
      nuevosErrores.claveRegistro = "Mínimo 6 caracteres";
    }

    if (claveRegistro !== confirmarClaveRegistro) {
      nuevosErrores.confirmarClaveRegistro = "Las contraseñas no coinciden";
    }

    return nuevosErrores;
  };

  // Enviar formulario de Login
  const enviarLogin = async (evento) => {
    evento.preventDefault();
    setErrorServidor("");
    setMensajeExito("");

    const erroresDetectados = validarLogin();
    if (Object.keys(erroresDetectados).length > 0) {
      setErrores(erroresDetectados);
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(URL_BASE_API + "/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: correoLogin,
          password: claveLogin,
        }),
      });

      if (!respuesta.ok) {
        const datosError = await respuesta.json().catch(() => ({}));
        throw new Error(datosError.detail || "Credenciales inválidas o no autorizadas.");
      }

      const datos = await respuesta.json();
      const token = datos.access || datos.token;

      if (recordarme) {
        localStorage.setItem("vigno_token", token);
      } else {
        localStorage.removeItem("vigno_token");
        sessionStorage.setItem("vigno_token", token);
      }

      if (onLoginSuccess) {
        onLoginSuccess(token);
      }
    } catch (error) {
      if (error.name === "TypeError") {
        setErrorServidor("Error de conexión: No se pudo comunicar con el servidor.");
      } else {
        setErrorServidor(error.message);
      }
    } finally {
      setCargando(false);
    }
  };

  // Enviar formulario de Registro
  const enviarRegistro = async (evento) => {
    evento.preventDefault();
    setErrorServidor("");
    setMensajeExito("");

    const erroresDetectados = validarRegistro();
    if (Object.keys(erroresDetectados).length > 0) {
      setErrores(erroresDetectados);
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(URL_BASE_API + "/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nombreUsuario,
          email: correoRegistro,
          password: claveRegistro,
        }),
      });

      if (!respuesta.ok) {
        const datosError = await respuesta.json().catch(() => ({}));
        throw new Error(datosError.detail || "No se pudo completar el registro.");
      }

      setMensajeExito("Registro exitoso. Ya puedes iniciar sesión.");
      setEsRegistro(false);
    } catch (error) {
      if (error.name === "TypeError") {
        setErrorServidor("Error de conexión: No se pudo comunicar con el servidor.");
      } else {
        setErrorServidor(error.message);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-card">
      {errorServidor && <div className="alert-error">{errorServidor}</div>}
      {mensajeExito && <div className="alert-success">{mensajeExito}</div>}

      {!esRegistro ? (
        // Sección de Inicio de Sesión
        <form className="login-form" onSubmit={enviarLogin} noValidate>
          <div>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                placeholder="Usuario o correo"
                className={`login-input ${errores.correoLogin ? "input-error" : ""}`}
                value={correoLogin}
                onChange={manejarCambioCorreoLogin}
              />
            </div>
            {errores.correoLogin && <div className="error-text">{errores.correoLogin}</div>}
          </div>

          <div>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                className={`login-input ${errores.claveLogin ? "input-error" : ""}`}
                value={claveLogin}
                onChange={manejarCambioClaveLogin}
              />
            </div>
            {errores.claveLogin && <div className="error-text">{errores.claveLogin}</div>}
          </div>

          <button type="submit" className="btn-login-submit" disabled={cargando}>
            {cargando ? <span className="spinner"></span> : "Iniciar sesión"}
          </button>

          <div className="login-options-row">
            <label className="remember-label">
              <input
                type="checkbox"
                name="rememberMe"
                className="remember-checkbox"
                checked={recordarme}
                onChange={manejarCambioRecordarme}
              />
              Recordarme
            </label>

            <button
              type="button"
              className="forgot-link"
              onClick={() => alert("Recuperación de contraseña")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="divider"></div>

          <button
            type="button"
            className="btn-register-action"
            onClick={cambiarModo}
          >
            Registrarse
          </button>
        </form>
      ) : (
        // Sección de Registro de Usuario
        <form className="login-form" onSubmit={enviarRegistro} noValidate>
          <div>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="text"
                name="username"
                placeholder="Nombre de usuario"
                className={`login-input ${errores.nombreUsuario ? "input-error" : ""}`}
                value={nombreUsuario}
                onChange={manejarCambioNombreUsuario}
              />
            </div>
            {errores.nombreUsuario && <div className="error-text">{errores.nombreUsuario}</div>}
          </div>

          <div>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                className={`login-input ${errores.correoRegistro ? "input-error" : ""}`}
                value={correoRegistro}
                onChange={manejarCambioCorreoRegistro}
              />
            </div>
            {errores.correoRegistro && <div className="error-text">{errores.correoRegistro}</div>}
          </div>

          <div>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                className={`login-input ${errores.claveRegistro ? "input-error" : ""}`}
                value={claveRegistro}
                onChange={manejarCambioClaveRegistro}
              />
            </div>
            {errores.claveRegistro && <div className="error-text">{errores.claveRegistro}</div>}
          </div>

          <div>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                className={`login-input ${errores.confirmarClaveRegistro ? "input-error" : ""}`}
                value={confirmarClaveRegistro}
                onChange={manejarCambioConfirmarClave}
              />
            </div>
            {errores.confirmarClaveRegistro && (
              <div className="error-text">{errores.confirmarClaveRegistro}</div>
            )}
          </div>

          <button type="submit" className="btn-login-submit" disabled={cargando}>
            {cargando ? <span className="spinner"></span> : "Crear cuenta"}
          </button>

          <div className="divider"></div>

          <button
            type="button"
            className="btn-register-action"
            onClick={cambiarModo}
          >
            Volver a iniciar sesión
          </button>
        </form>
      )}
    </div>
  );
}

export default LoginView;