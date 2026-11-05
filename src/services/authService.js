import { API_BASE } from "./api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let promesaRefresh = null;

export async function loginRequest(email, password) {
  const emailLimpio = String(email || "").trim().toLowerCase();
  const passLimpia = String(password || "");

  if (!EMAIL_REGEX.test(emailLimpio)) {
    throw new Error("El formato del correo no es válido.");
  }
  if (passLimpia.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
  }

  let response;
  try {
    response = await fetch(`${API_BASE}/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: emailLimpio, password: passLimpia }),
    });
  } catch {
    throw new Error(`No se pudo conectar con Django (${API_BASE}). Verifica que el backend esté encendido.`);
  }

  if (response.status === 429) {
    throw new Error("Demasiados intentos. Espera un minuto antes de volver a intentar.");
  }
  if (response.status === 401 || !response.ok) {
    throw new Error("Correo o contraseña incorrectos.");
  }

  return await response.json();
}

export async function refreshAccessToken() {
  if (promesaRefresh) return promesaRefresh;

  promesaRefresh = (async () => {
    const refresh = sessionStorage.getItem("refresh");
    if (!refresh) throw new Error("Sin refresh token");

    const response = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      sessionStorage.removeItem("access");
      sessionStorage.removeItem("refresh");
      sessionStorage.removeItem("usuario");
      throw new Error("Sesión expirada");
    }

    const data = await response.json();
    if (data.access) sessionStorage.setItem("access", data.access);
    if (data.refresh) sessionStorage.setItem("refresh", data.refresh);
    return data.access;
  })().finally(() => {
    promesaRefresh = null;
  });

  return promesaRefresh;
}

export async function logoutRequest() {
  const access = sessionStorage.getItem("access");
  const refresh = sessionStorage.getItem("refresh");

  if (access && refresh) {
    try {
      await fetch(`${API_BASE}/v1/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${access}`,
        },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Ignorar errores de red en logout
    }
  }
}