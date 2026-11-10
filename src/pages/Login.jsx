import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import { cambiarClaveRequest, limpiarSesionTemporal } from '../services/authService';
import './Login.css';

const imagenesDisponibles = import.meta.glob(
  '../assets/casas-patronales-login.{png,jpg,jpeg,webp}',
  { eager: true, import: 'default' }
);
const rutaImagenVinedo = Object.values(imagenesDisponibles)[0] || null;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [modoCambioClave, setModoCambioClave] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const cancelarCambioClave = () => {
    limpiarSesionTemporal();
    setModoCambioClave(false);
    setPassword('');
    setNuevaPassword('');
    setConfirmarPassword('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (modoCambioClave) {
      if (!nuevaPassword.trim() || !confirmarPassword.trim()) {
        setError("Por favor, completa todos los campos.");
        return;
      }
      if (nuevaPassword.length < 8) {
        setError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (nuevaPassword !== confirmarPassword) {
        setError("Las contraseñas nuevas no coinciden.");
        return;
      }

      setSubmitting(true);
      try {
        await cambiarClaveRequest(password, nuevaPassword);
        await login(email, nuevaPassword);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code === "CAMBIO_CLAVE_REQUERIDO") {
        setModoCambioClave(true);
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const mostrarImagen = Boolean(rutaImagenVinedo) && !imgError;

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-image-side">
          {mostrarImagen ? (
            <img
              src={rutaImagenVinedo}
              alt="Casas Patronales"
              className="login-brand-image"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="login-brand-fallback" aria-label="Casas Patronales">
              <div className="fallback-monogram">Vigno</div>
              <span className="fallback-title">Casas Patronales</span>
            </div>
          )}
        </div>

        <div className="login-form-side">
          <form onSubmit={handleSubmit} className="login-form animate-fade" noValidate>
            <div className="login-header">
              <h1>{modoCambioClave ? 'Actualizar Contraseña' : 'Iniciar Sesión'}</h1>
              <p className="login-subtitle">
                {modoCambioClave
                  ? 'Por seguridad, debes cambiar tu contraseña provisoria antes de continuar.'
                  : 'Ingresa tus credenciales para acceder a la plataforma.'}
              </p>
            </div>

            {!modoCambioClave ? (
              <>
                <div className="input-group">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    autoComplete="email"
                  />
                </div>

                <div className="input-group">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    autoComplete="current-password"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="input-group animate-fade">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Nueva contraseña (mín. 8 caracteres)"
                    autoComplete="new-password"
                  />
                </div>

                <div className="input-group animate-fade">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Confirmar nueva contraseña"
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="auth-error-alert animate-fade" role="alert">
                <p>{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} className="login-btn">
              {submitting
                ? (modoCambioClave ? 'Actualizando...' : 'Ingresando...')
                : (modoCambioClave ? 'GUARDAR Y CONTINUAR' : 'ENTRAR')}
            </button>

            {modoCambioClave && (
              <button
                type="button"
                className="btn-secondary-action"
                onClick={cancelarCambioClave}
              >
                Volver al inicio de sesión
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}