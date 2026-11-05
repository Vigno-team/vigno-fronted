import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContext';
import './Login.css';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Estados de control y formulario
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // para fade
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const cambiarModo = () => {
    setEsRegistro(!esRegistro);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (esRegistro) {
      if (!nombreUsuario.trim() || !email.trim() || !password.trim() || !confirmarPassword.trim()) {
        setError("Por favor, completa todos los campos del registro.");
        return;
      }
      if (password !== confirmarPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      setError("El registro visual está activo (sin backend configurado).");
      return;
    }

    // Lógica normal intacta de inicio de sesión
    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form animate-fade">
        <h1>{esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}</h1>

        {esRegistro && (
          <div className="input-group">
            <input
              type="text"
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
              placeholder="Nombre de usuario"
            />
          </div>
        )}

        <div className="input-group">
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
          />
        </div>

        {esRegistro && (
          <div className="input-group animate-fade">
            <input
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Confirmar contraseña"
            />
          </div>
        )}

        {/* El aviso de error o estado */}
        {error && (
          <div className="auth-error-alert animate-fade">
            <p>{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting} className="login-btn">
          {submitting ? 'Ingresando...' : (esRegistro ? 'REGISTRARSE' : 'ENTRAR')}
        </button>

        {!esRegistro && (
          <button
            type="button"
            className="forgot-password-btn"
            onClick={() => setError("Módulo de recuperación de contraseña próximamente.")}
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}

        <div className="divider"></div>

        <button
          type="button"
          className="btn-register-action"
          onClick={cambiarModo}
        >
          {esRegistro ? 'Volver a iniciar sesión' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}