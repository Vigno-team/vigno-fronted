import { useState } from "react";
import {
  Menu,
  Home,
  Sun,
  Clock3,
  Activity,
  TriangleAlert,
  FileText,
  Settings
} from "lucide-react";
import "./BarraLateral.css";
function BarraLateral() {
  const [expandida, setExpandida] = useState(true);
  const [opcionActiva, setOpcionActiva] = useState("Clima en tiempo real");

  const opciones = [
    {
      nombre: "Resumen",
      icono: Home
    },
    {
      nombre: "Clima en tiempo real",
      icono: Sun
    },
    {
      nombre: "Históricos",
      icono: Clock3
    },
    {
      nombre: "Índices vitivinícolas",
      icono: Activity
    },
    {
      nombre: "Alertas",
      icono: TriangleAlert
    },
    {
      nombre: "Reportes",
      icono: FileText
    },
    {
      nombre: "Configuración",
      icono: Settings
    }
  ];
  return (
    <aside className={`barra-lateral ${expandida ? "expandida" : "contraida"}`}>
      {/* Botón menú */}
      <div className="encabezado-barra">

        <button
          className="boton-menu"
          onClick={() => setExpandida(!expandida)}
          aria-label="Abrir o cerrar menú"
        >
          <Menu size={30} />
        </button>
      </div>
      {/* Opciones */}
      <nav className="menu-navegacion">
        {opciones.map((opcion) => {
          const Icono = opcion.icono;
          const activa = opcionActiva === opcion.nombre;
          return (
            <button
              key={opcion.nombre}
              className={`opcion-menu ${activa ? "activa" : ""}`}
              onClick={() => setOpcionActiva(opcion.nombre)}
              title={!expandida ? opcion.nombre : ""}
            >
              <Icono
                className="icono-opcion"
                size={28}
                strokeWidth={2}
              />
              {expandida && (
                <span className="texto-opcion">
                  {opcion.nombre}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
export default BarraLateral;