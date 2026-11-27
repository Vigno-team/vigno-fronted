import { Activity, Clock3, Home, Menu, Settings, TriangleAlert, FileUp, LogOut, Users } from "lucide-react";
import { useAuth } from "../../contexto/AuthContext";
import { useMarca } from "../../contexto/MarcaContext";
import { tienePermiso } from "../../services/permisos";
import "./BarraLateral.css";

const opciones = [
  { nombre: "Resumen", icono: Home, permiso: "ver_dashboard" },
  { nombre: "Alertas y reportes", icono: TriangleAlert, permiso: "ver_dashboard" },
  { nombre: "Índices vitivinícolas", icono: Activity, permiso: "ver_dashboard" },
  { nombre: "Históricos", icono: Clock3, permiso: "ver_dashboard" },
  { nombre: "Gestion de datos y Estaciones", icono: FileUp, permiso: "cargar_datos" },
  { nombre: "Usuarios", icono: Users, permiso: "usuarios" },
  { nombre: "Configuración", icono: Settings, permiso: "ver_dashboard" },
];

function BarraLateral({ expandida, setExpandida, opcionActiva, setOpcionActiva }) {
  const { user, logout } = useAuth();
  const { marca, barraMarca } = useMarca();

  return (
    <aside className={`barra-lateral ${expandida ? "expandida" : "contraida"}`}
      style={barraMarca.fondo ? { "--imagen-barra": `url("${barraMarca.fondo}")` } : undefined}>
      <div className="barra-superior">
        <button
          type="button"
          className="barra-menu"
          onClick={() => setExpandida((actual) => !actual)}
          aria-label={expandida ? "Contraer menú" : "Expandir menú"}
          title={expandida ? "Contraer menú" : "Expandir menú"}
        >
          <Menu size={21} strokeWidth={1.8} />
          {expandida && <span>Menú</span>}
        </button>

        {expandida && (
          <div className="barra-brand">
            <div className="barra-brand-superior">
              <span className="barra-brand-linea" />
              <span className="barra-brand-origen">{barraMarca.origen}</span>
            </div>

            {marca.logo && (
              <img
                src={marca.logo}
                alt={`Logo ${marca.nombre_sistema}`}
                className="barra-logo-img"
              />
            )}

            <strong className="barra-logo">{marca.nombre_sistema}</strong>
            <span className="barra-submarca">{marca.nombre_organizacion}</span>
            <div className="barra-brand-divisor" />
            <span className="barra-eslogan">{barraMarca.lema1}</span>
            <span className="barra-eslogan">{barraMarca.lema2}</span>
          </div>
        )}
      </div>

      <nav className="barra-opciones">
        {opciones
          .filter((opcion) => tienePermiso(user?.rol, opcion.permiso))
          .map(({ nombre, icono: Icono }) => {
            const activa = opcionActiva === nombre;

            return (
              <button
                key={nombre}
                type="button"
                className={`barra-opcion ${activa ? "activa" : ""}`}
                onClick={() => setOpcionActiva(nombre)}
                aria-current={activa ? "page" : undefined}
                aria-label={nombre}
                title={!expandida ? nombre : undefined}
              >
                <Icono size={21} strokeWidth={1.8} />
                {expandida && <span>{nombre}</span>}
              </button>
            );
          })}
      </nav>

      <button
        type="button"
        className="barra-opcion"
        style={{ marginTop: "auto" }}
        onClick={logout}
        aria-label="Cerrar sesión"
        title={!expandida ? "Cerrar sesión" : undefined}
      >
        <LogOut size={21} strokeWidth={1.8} />
        {expandida && <span>Cerrar sesión</span>}
      </button>
    </aside>
  );
}

export default BarraLateral;