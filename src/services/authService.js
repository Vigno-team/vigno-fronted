import { API_BASE } from "./api";

// DEMO solo en desarrollo: el backend meteorológico sigue siendo real.
export const MODO_DEMO = import.meta.env.DEV && (import.meta.env.VITE_AUTH_MODE || "demo") === "demo";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginRequest(email, password) {
  const correo = String(email).trim().toLowerCase();
  if (!EMAIL.test(correo) || password.length < 8) {
    throw new Error("Ingresa un correo válido y una contraseña de al menos 8 caracteres.");
  }

  if (MODO_DEMO) {
    if (correo !== "test@test.cl" || password !== "12345678") {
      throw new Error("Credenciales de demostración incorrectas.");
    }
    return { access: "demo-access", usuario: { nombre: "Usuario de prueba", email: correo, rol: "demo" } };
  }

  // Esta ruta requiere que el equipo Django implemente autenticación JWT.
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: correo, password }),
    });
  } catch {
    throw new Error("No se pudo conectar con el servicio de autenticación de Django.");
  }

  if (respuesta.status === 404) throw new Error("El backend aún no tiene /v1/auth/token. Usa modo demo para probar la interfaz.");
  if (!respuesta.ok) throw new Error(respuesta.status === 401 ? "Correo o contraseña incorrectos." : `Error de autenticación (${respuesta.status}).`);

  const data = await respuesta.json();
  if (!data.access) throw new Error("El backend no devolvió un token de acceso.");
  return { access: data.access, refresh: data.refresh || "", usuario: data.usuario || data.user || { email: correo } };
}

export async function logoutRequest() {
  const access = sessionStorage.getItem("access");
  const refresh = sessionStorage.getItem("refresh");
  if (MODO_DEMO || !access || !refresh) return;
  try {
    await fetch(`${API_BASE}/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
      body: JSON.stringify({ refresh }),
    });
  } catch { /* La sesión se cierra localmente incluso sin conexión. */ }
}
