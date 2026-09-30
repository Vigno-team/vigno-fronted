import {
  Menu,
  Home,
  CloudSun,
  Clock3,
  Activity,
  TriangleAlert,
  Settings,
  Sun,
  Moon,
} from "lucide-react";

import "./BarraLateral.css";

const opciones = [
  {
    nombre: "Resumen",
    icono: Home,
  },
  {
    nombre: "Clima en tiempo real",
    icono: CloudSun,
  },
  {
    nombre: "Históricos",
    icono: Clock3,
  },
  {
    nombre: "Índices vitivinícolas",
    icono: Activity,
  },
  {
    nombre: "Alertas y reportes",
    icono: TriangleAlert,
  },
  {
    nombre: "Configuración",
    icono: Settings,
  },
];

function BarraLateral({
  expandida,
  cambiarEstado,
  opcionActiva,
  cambiarOpcion,
  temaOscuro,
  cambiarTema,
}) {
  return (
    <aside
      className={`barra-lateral ${
        expandida
          ? "expandida"
          : "contraida"
      }`}
    >
      <div className="encabezado-barra">
        <button
          type="button"
          className="boton-menu"
          onClick={() =>
            cambiarEstado(!expandida)
          }
          aria-label={
            expandida
              ? "Contraer menú"
              : "Expandir menú"
          }
          title={
            !expandida
              ? "Abrir menú"
              : ""
          }
        >
          <Menu
            size={26}
            strokeWidth={2}
          />
        </button>
      </div>

      <nav className="menu-navegacion">
        {opciones.map((opcion) => {
          const Icono = opcion.icono;

          const activa =
            opcionActiva ===
            opcion.nombre;

          return (
            <button
              key={opcion.nombre}
              type="button"
              className={`opcion-menu ${
                activa
                  ? "activa"
                  : ""
              }`}
              onClick={() =>
                cambiarOpcion(
                  opcion.nombre
                )
              }
              title={
                !expandida
                  ? opcion.nombre
                  : ""
              }
              aria-current={
                activa
                  ? "page"
                  : undefined
              }
            >
              <Icono
                className="icono-opcion"
                size={23}
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

      <div className="pie-barra">
        <button
          type="button"
          className="boton-tema"
          onClick={cambiarTema}
          aria-label={
            temaOscuro
              ? "Cambiar a tema claro"
              : "Cambiar a tema oscuro"
          }
          title={
            !expandida
              ? temaOscuro
                ? "Cambiar a tema claro"
                : "Cambiar a tema oscuro"
              : ""
          }
        >
          <div className="info-tema">
            {temaOscuro ? (
              <Moon
                size={21}
                strokeWidth={2}
              />
            ) : (
              <Sun
                size={21}
                strokeWidth={2}
              />
            )}

            {expandida && (
              <span className="texto-tema">
                {temaOscuro
                  ? "Tema oscuro"
                  : "Tema claro"}
              </span>
            )}
          </div>

          {expandida && (
            <span
              className={`switch-tema ${
                !temaOscuro
                  ? "activo"
                  : ""
              }`}
            />
          )}
        </button>
      </div>
    </aside>
  );
}

export default BarraLateral;