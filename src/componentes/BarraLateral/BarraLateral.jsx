import{
  Activity,
  Clock3,
  Home,
  Menu,
  Moon,
  Settings,
  Sun,
  TriangleAlert,
}from"lucide-react";
import"./BarraLateral.css";

const opciones=[
  {nombre:"Resumen",icono:Home},
  {nombre:"Alertas y reportes",icono:TriangleAlert},
  {nombre:"Índices vitivinícolas",icono:Activity},
  {nombre:"Históricos",icono:Clock3},
  {nombre:"Configuración",icono:Settings},
];

function BarraLateral({
  expandida,
  setExpandida,
  opcionActiva,
  setOpcionActiva,
  temaOscuro,
  setTemaOscuro,
}){
  return(
    <aside className={`barra-lateral ${expandida?"expandida":"contraida"}`}>
      <button
        type="button"
        className="barra-menu"
        onClick={()=>setExpandida(v=>!v)}
        aria-label={expandida?"Contraer menú":"Expandir menú"}
      >
        <Menu size={21}/>
        {expandida&&<span>Menú</span>}
      </button>

      <nav className="barra-opciones">
        {opciones.map(({nombre,icono:Icono})=>(
          <button
            key={nombre}
            type="button"
            className={`barra-opcion ${opcionActiva===nombre?"activa":""}`}
            onClick={()=>setOpcionActiva(nombre)}
            title={!expandida?nombre:undefined}
          >
            <Icono size={21}/>
            {expandida&&<span>{nombre}</span>}
          </button>
        ))}
      </nav>

      <div className="barra-inferior">
        <button
          type="button"
          className="barra-tema"
          onClick={()=>setTemaOscuro(v=>!v)}
          title={temaOscuro?"Cambiar a tema claro":"Cambiar a tema oscuro"}
        >
          {temaOscuro?<Sun size={20}/>:<Moon size={20}/>}
          {expandida&&<span>{temaOscuro?"Tema claro":"Tema oscuro"}</span>}
        </button>
      </div>
    </aside>
  );
}

export default BarraLateral;