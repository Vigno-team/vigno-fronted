import{Accessibility,ChartLine,Contrast,Moon,RotateCcw,Settings2,Sun,Type}from"lucide-react";
import{useConfiguracion}from"../../contexto/ConfiguracionContext";
import"./Configuracion.css";

const OPCIONES={
  tema:[
    {valor:"claro",texto:"Claro",icono:Sun},
    {valor:"oscuro",texto:"Oscuro",icono:Moon},
  ],
  densidad:[
    {valor:"compacta",texto:"Compacta"},
    {valor:"normal",texto:"Normal"},
    {valor:"amplia",texto:"Amplia"},
  ],
  grafico:[
    {valor:"normal",texto:"Normal"},
    {valor:"grande",texto:"Grande"},
  ],
  contraste:[
    {valor:"normal",texto:"Normal"},
    {valor:"alto",texto:"Alto",icono:Contrast},
  ],
  tipoGrafico:[
    {valor:"lineas",texto:"Líneas"},
    {valor:"puntos",texto:"Puntos"},
    {valor:"ambos",texto:"Ambos"},
  ],
  animaciones:[
    {valor:"activadas",texto:"Activadas"},
    {valor:"desactivadas",texto:"Desactivadas"},
  ],
  movimiento:[
    {valor:"no",texto:"No"},
    {valor:"si",texto:"Sí"},
  ],
};

function GrupoOpciones({valor,opciones,onChange}){
  return(
    <div className="cfg-opciones">
      {opciones.map(opcion=>{
        const Icono=opcion.icono,activa=valor===opcion.valor;

        return(
          <button
            key={opcion.valor}
            type="button"
            className={`cfg-opcion ${activa?"activa":""}`}
            aria-pressed={activa}
            onClick={()=>onChange(opcion.valor)}
          >
            {Icono&&<Icono size={15} strokeWidth={1.9}/>}
            <span>{opcion.texto}</span>
          </button>
        );
      })}
    </div>
  );
}

function Fila({titulo,descripcion,children,clase=""}){
  return(
    <div className={`cfg-fila ${clase}`}>
      <div className="cfg-info">
        <strong>{titulo}</strong>
        <span>{descripcion}</span>
      </div>
      {children}
    </div>
  );
}

function TituloSeccion({Icono,titulo,descripcion}){
  return(
    <div className="cfg-seccion-titulo">
      <Icono size={18} strokeWidth={1.8}/>
      <div>
        <h2>{titulo}</h2>
        <p>{descripcion}</p>
      </div>
    </div>
  );
}

function Configuracion(){
  const{
    tamanoTexto,tema,densidad,tamanoGrafico,contraste,tipoGrafico,
    animaciones,movimientoReducido,actualizar,restablecer,
  }=useConfiguracion();

  const cambiar=campo=>valor=>actualizar(campo,valor);

  return(
    <section className="cfg-pagina">
      <header className="cfg-cabecera">
        <div className="cfg-icono-principal">
          <Settings2 size={21} strokeWidth={1.8}/>
        </div>
        <div>
          <h1>Configuración</h1>
          <p>Personaliza la visualización y accesibilidad de VIGNO.</p>
        </div>
      </header>

      <div className="cfg-contenido">
        <section className="cfg-seccion">
          <TituloSeccion
            Icono={Type}
            titulo="Apariencia"
            descripcion="Ajusta la escala visual y el tema general."
          />

          <Fila
            clase="cfg-fila-slider"
            titulo="Tamaño del texto"
            descripcion="Afecta títulos, textos, controles, leyendas, tooltips y ejes de gráficos."
          >
            <div className="cfg-slider-area">
              <div className="cfg-slider-superior">
                <span>Escala global</span>
                <strong>{tamanoTexto}%</strong>
              </div>

              <input
                type="range"
                min="90"
                max="180"
                step="5"
                value={tamanoTexto}
                onChange={e=>actualizar("tamanoTexto",Number(e.target.value))}
                aria-label="Tamaño global del texto"
              />

              <div className="cfg-slider-limites">
                <span>90%</span>
                <span>180%</span>
              </div>
            </div>
          </Fila>

          <Fila
            titulo="Tema"
            descripcion="Cambia toda la aplicación entre modo claro y oscuro."
          >
            <GrupoOpciones
              valor={tema}
              opciones={OPCIONES.tema}
              onChange={cambiar("tema")}
            />
          </Fila>
        </section>

        <section className="cfg-seccion">
          <TituloSeccion
            Icono={ChartLine}
            titulo="Visualización"
            descripcion="Controla cómo se distribuye y representa la información."
          />

          <Fila
            titulo="Densidad de interfaz"
            descripcion="Modifica el espacio entre tarjetas y componentes."
          >
            <GrupoOpciones
              valor={densidad}
              opciones={OPCIONES.densidad}
              onChange={cambiar("densidad")}
            />
          </Fila>

          <Fila
            titulo="Tamaño de gráficos"
            descripcion="Aumenta el espacio vertical disponible para los gráficos."
          >
            <GrupoOpciones
              valor={tamanoGrafico}
              opciones={OPCIONES.grafico}
              onChange={cambiar("tamanoGrafico")}
            />
          </Fila>

          <Fila
            titulo="Contraste"
            descripcion="Refuerza textos, bordes y elementos secundarios."
          >
            <GrupoOpciones
              valor={contraste}
              opciones={OPCIONES.contraste}
              onChange={cambiar("contraste")}
            />
          </Fila>

          <Fila
            titulo="Tipo de gráfico"
            descripcion="Selecciona cómo se representan las series meteorológicas."
          >
            <GrupoOpciones
              valor={tipoGrafico}
              opciones={OPCIONES.tipoGrafico}
              onChange={cambiar("tipoGrafico")}
            />
          </Fila>
        </section>

        <section className="cfg-seccion">
          <TituloSeccion
            Icono={Accessibility}
            titulo="Accesibilidad"
            descripcion="Controla el movimiento y las transiciones de la interfaz."
          />

          <Fila
            titulo="Animaciones"
            descripcion="Activa o desactiva las animaciones generales."
          >
            <GrupoOpciones
              valor={animaciones?"activadas":"desactivadas"}
              opciones={OPCIONES.animaciones}
              onChange={valor=>actualizar("animaciones",valor==="activadas")}
            />
          </Fila>

          <Fila
            titulo="Movimiento reducido"
            descripcion="Mantiene transiciones suaves evitando escalados y desplazamientos."
          >
            <GrupoOpciones
              valor={movimientoReducido?"si":"no"}
              opciones={OPCIONES.movimiento}
              onChange={valor=>actualizar("movimientoReducido",valor==="si")}
            />
          </Fila>
        </section>

        <div className="cfg-restablecer">
          <button type="button" onClick={restablecer}>
            <RotateCcw size={16} strokeWidth={1.9}/>
            Restablecer preferencias
          </button>
        </div>
      </div>
    </section>
  );
}

export default Configuracion;