export function obtenerRolActual() {
  const datos = sessionStorage.getItem("usuario");
  if (!datos) {
    return "";
  }
  try {
    const usuario = JSON.parse(datos);
    return usuario.rol || "";
  } catch (error) {
    return "";
  }
}

export function tienePermiso(rol, accion) {
  const rolUsuario = rol || obtenerRolActual();

  switch (rolUsuario) {
    case "administrador":
      return true;

    case "editor":
      switch (accion) {
        case "ver_dashboard":
        case "cargar_datos":
        case "corregir_fallas":
        case "crear_estaciones":
        case "editar_estaciones":
          return true;
        default:
          return false;
      }

    case "lector":
      switch (accion) {
        case "ver_dashboard":
          return true;
        default:
          return false;
      }

    default:
      return false;
  }
}