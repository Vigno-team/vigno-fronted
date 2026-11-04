import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MODO_DEMO } from '../services/authService';
import { useAuth } from '../contexto/AuthContext';
import './Login.css';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Iniciar sesión</h1>
        

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
        {error && (
          <div className="auth-error-alert animate-fade">
            <p>{error}</p>
          </div>
        )}
        
        <button type="submit" disabled={submitting} className="login-btn">
          {submitting ? 'Ingresando...' : 'ENTRAR'}
        </button>
      </form>
    </div>
  );
}