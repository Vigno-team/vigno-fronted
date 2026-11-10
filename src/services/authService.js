import { API_BASE } from "./api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let promesaRefresh = null;
let sesionCambioClaveCompletada = null;

export async function loginRequest(email, password) {
  if (sesionCambioClaveCompletada) {
    const datos = sesionCambioClaveCompletada;
    sesionCambioClaveCompletada = null;
    return datos;
  }

  const emailLimpio = String(email || "").trim().toLowerCase();
  const passLimpia = String(password || "");

  if (!emailLimpio || !passLimpia) {
    throw new Error("Por favor, completa todos los campos.");
  }
  if (!EMAIL_REGEX.test(emailLimpio)) {
    throw new Error("El formato del correo no es válido.");
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

  if (response.status === 401) {
    throw new Error("Correo o contraseña incorrectos.");
  }
  if (response.status === 429) {
    throw new Error("Demasiados intentos. Espera un minuto antes de volver a intentar.");
  }
  if (response.status >= 500) {
    throw new Error("Error interno del servidor. Intenta nuevamente más tarde.");
  }
  if (!response.ok) {
    throw new Error(`No se pudo iniciar sesión (HTTP ${response.status}).`);
  }

  const data = await response.json();

  if (data?.usuario?.debe_cambiar_clave) {
    sessionStorage.setItem("temp_access", data.access || "");
    sessionStorage.setItem("temp_refresh", data.refresh || "");
    sessionStorage.setItem("temp_usuario", JSON.stringify(data.usuario));
    const errorCambio = new Error("Debes cambiar tu contraseña provisoria antes de continuar.");
    errorCambio.code = "CAMBIO_CLAVE_REQUERIDO";
    throw errorCambio;
  }

  return data;
}

export async function cambiarClaveRequest(claveActual, claveNueva) {
  const actual = String(claveActual || "");
  const nueva = String(claveNueva || "");

  if (!actual || !nueva) {
    throw new Error("Por favor, completa todos los campos.");
  }
  if (nueva.length < 8) {
    throw new Error("La nueva contraseña debe tener al menos 8 caracteres.");
  }
  if (actual === nueva) {
    throw new Error("La nueva contraseña debe ser distinta a la actual.");
  }

  const tempAccess = sessionStorage.getItem("temp_access");
  if (!tempAccess) {
    throw new Error("La sesión temporal expiró. Vuelve a iniciar sesión.");
  }

  let response;
  try {
    response = await fetch(`${API_BASE}/v1/auth/cambiar-clave`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${tempAccess}`,
      },
      body: JSON.stringify({ clave_actual: actual, clave_nueva: nueva }),
    });
  } catch {
    throw new Error(`No se pudo conectar con Django (${API_BASE}). Verifica que el backend esté encendido.`);
  }

  if (response.status === 429) {
    throw new Error("Demasiados intentos. Espera un minuto antes de volver a intentar.");
  }
  if (response.status >= 500) {
    throw new Error("Error interno del servidor al actualizar la contraseña.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detalle =
      data?.detail ||
      (Array.isArray(data?.clave_nueva) ? data.clave_nueva[0] : null) ||
      (Array.isArray(data?.clave_actual) ? data.clave_actual[0] : null) ||
      "No se pudo actualizar la contraseña. Revisa que no sea demasiado común o numérica.";
    throw new Error(detalle);
  }

  const usuarioGuardado = JSON.parse(sessionStorage.getItem("temp_usuario") || "{}");
  const usuarioActualizado = {
    ...(data.usuario || usuarioGuardado),
    debe_cambiar_clave: false,
  };

  sessionStorage.removeItem("temp_access");
  sessionStorage.removeItem("temp_refresh");
  sessionStorage.removeItem("temp_usuario");

  sesionCambioClaveCompletada = {
    access: data.access || tempAccess,
    refresh: data.refresh || "",
    usuario: usuarioActualizado,
  };

  return sesionCambioClaveCompletada;
}

export function limpiarSesionTemporal() {
  sessionStorage.removeItem("temp_access");
  sessionStorage.removeItem("temp_refresh");
  sessionStorage.removeItem("temp_usuario");
  sesionCambioClaveCompletada = null;
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