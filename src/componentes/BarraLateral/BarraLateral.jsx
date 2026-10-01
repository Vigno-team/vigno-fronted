import {
  Activity,
  Clock3,
  CloudSun,
  Home,
  Menu,
  Moon,
  Settings,
  Sun,
  TriangleAlert,
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
      <div className="bl-cabecera">
        <button
          type="button"
          className="bl-menu"
          onClick={() =>
            cambiarEstado(
              (actual) => !actual
            )
          }
          title={
            expandida
              ? "Contraer menú"
              : "Expandir menú"
          }
          aria-label="Cambiar tamaño del menú"
        >
          <Menu size={23} />
        </button>

        {expandida && (
          <div className="bl-marca">
            <strong>
              VIGNO
            </strong>

            <span>
              Dashboard meteorológico
            </span>
          </div>
        )}
      </div>

      <nav className="bl-navegacion">
        {opciones.map(
          ({
            nombre,
            icono: Icono,
          }) => {
            const activa =
              opcionActiva ===
              nombre;

            return (
              <button
                key={nombre}
                type="button"
                className={`bl-opcion ${
                  activa
                    ? "activa"
                    : ""
                }`}
                onClick={() =>
                  cambiarOpcion(
                    nombre
                  )
                }
                title={
                  expandida
                    ? undefined
                    : nombre
                }
                aria-current={
                  activa
                    ? "page"
                    : undefined
                }
              >
                <span className="bl-opcion-icono">
                  <Icono
                    size={20}
                    strokeWidth={1.9}
                  />
                </span>

                {expandida && (
                  <span className="bl-opcion-texto">
                    {nombre}
                  </span>
                )}
              </button>
            );
          }
        )}
      </nav>

      <div className="bl-pie">
        <button
          type="button"
          className="bl-tema"
          onClick={
            cambiarTema
          }
          title={
            temaOscuro
              ? "Cambiar a tema claro"
              : "Cambiar a tema oscuro"
          }
        >
          {temaOscuro ? (
            <Sun
              size={19}
              strokeWidth={1.9}
            />
          ) : (
            <Moon
              size={19}
              strokeWidth={1.9}
            />
          )}

          {expandida && (
            <span>
              {temaOscuro
                ? "Tema claro"
                : "Tema oscuro"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default BarraLateral;