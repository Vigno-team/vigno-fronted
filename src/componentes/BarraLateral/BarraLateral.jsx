import{
  Activity,
  Clock3,
  Home,
  Menu,
  Settings,
  TriangleAlert,
  Map,
}from"lucide-react";

import"./BarraLateral.css";

const opciones=[
  {
    nombre:"Resumen",
    icono:Home,
  },
  {
    nombre:"Alertas y reportes",
    icono:TriangleAlert,
  },
  {
    nombre:"Índices vitivinícolas",
    icono:Activity,
  },
  {
    nombre:"Históricos",
    icono:Clock3,
  },
  {
    nombre:"Mapa Satelital",
    icono:Map,
  },
  {
    nombre:"Configuración",
    icono:Settings,
  },
];

function BarraLateral({
  expandida,
  setExpandida,
  opcionActiva,
  setOpcionActiva,
}){

  const alternarBarra=()=>{
    setExpandida(actual=>!actual);
  };

  return(
    <aside
      className={
        `barra-lateral ${
          expandida
            ?"expandida"
            :"contraida"
        }`
      }
    >

      <div className="barra-superior">

        <button
          type="button"
          className="barra-menu"
          onClick={alternarBarra}
          aria-label={
            expandida
              ?"Contraer menú"
              :"Expandir menú"
          }
          title={
            expandida
              ?"Contraer menú"
              :"Expandir menú"
          }
        >
          <Menu
            size={21}
            strokeWidth={1.8}
          />

          {expandida&&(
            <span>
              Menú
            </span>
          )}
        </button>

        {expandida&&(
          <div className="barra-brand">

            <div className="barra-brand-superior">

              <span className="barra-brand-linea"/>

              <span className="barra-brand-origen">
                MAULE · CHILE
              </span>

            </div>

            <strong className="barra-logo">
              VIGNO
            </strong>

            <span className="barra-submarca">
              Vignadores de Carignan
            </span>

            <div className="barra-brand-divisor"/>

            <span className="barra-eslogan">
              Old Vines Dry-Farmed
            </span>

            <span className="barra-eslogan">
              Maule Valley
            </span>

          </div>
        )}

      </div>

      <nav className="barra-opciones">

        {opciones.map(({
          nombre,
          icono:Icono
        })=>{

          const activa=
            opcionActiva===nombre;

          return(
            <button
              key={nombre}
              type="button"
              className={
                `barra-opcion ${
                  activa
                    ?"activa"
                    :""
                }`
              }
              onClick={()=>
                setOpcionActiva(nombre)
              }
              aria-current={
                activa
                  ?"page"
                  :undefined
              }
              aria-label={nombre}
              title={
                !expandida
                  ?nombre
                  :undefined
              }
            >

              <Icono
                size={21}
                strokeWidth={1.8}
              />

              {expandida&&(
                <span>
                  {nombre}
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