import{
  Accessibility,
  ChartLine,
  Contrast,
  Moon,
  RotateCcw,
  Settings2,
  Sun,
  Type,
}from"lucide-react";

import{
  useConfiguracion
}from"../../contexto/ConfiguracionContext";

import"./Configuracion.css";

function GrupoOpciones({
  valor,
  opciones,
  onChange,
}){
  return(
    <div className="cfg-opciones">

      {opciones.map(opcion=>{
        const Icono=opcion.icono;

        return(
          <button
            key={opcion.valor}
            type="button"
            className={
              valor===opcion.valor
                ?"cfg-opcion activa"
                :"cfg-opcion"
            }
            aria-pressed={
              valor===opcion.valor
            }
            onClick={()=>
              onChange(opcion.valor)
            }
          >
            {Icono&&(
              <Icono
                size={15}
                strokeWidth={1.9}
              />
            )}

            <span>
              {opcion.texto}
            </span>
          </button>
        );
      })}

    </div>
  );
}

function Configuracion(){

  const{
    tamanoTexto,
    tema,
    densidad,
    tamanoGrafico,
    contraste,
    tipoGrafico,
    animaciones,
    movimientoReducido,
    actualizar,
    restablecer,
  }=useConfiguracion();

  return(
    <section className="cfg-pagina">

      {/* CABECERA */}
      <header className="cfg-cabecera">

        <div className="cfg-icono-principal">
          <Settings2
            size={21}
            strokeWidth={1.8}
          />
        </div>

        <div>
          <h1>
            Configuración
          </h1>

          <p>
            Personaliza la visualización y accesibilidad de VIGNO.
          </p>
        </div>

      </header>

      <div className="cfg-contenido">

        {/* =========================================
            APARIENCIA
        ========================================== */}
        <section className="cfg-seccion">

          <div className="cfg-seccion-titulo">

            <Type
              size={18}
              strokeWidth={1.8}
            />

            <div>
              <h2>
                Apariencia
              </h2>

              <p>
                Ajusta la escala visual y el tema general.
              </p>
            </div>

          </div>

          {/* TAMAÑO TEXTO */}
          <div className="cfg-fila cfg-fila-slider">

            <div className="cfg-info">
              <strong>
                Tamaño del texto
              </strong>

              <span>
                Afecta títulos, textos, controles,
                leyendas, tooltips y ejes de gráficos.
              </span>
            </div>

            <div className="cfg-slider-area">

              <div className="cfg-slider-superior">
                <span>
                  Escala global
                </span>

                <strong>
                  {tamanoTexto}%
                </strong>
              </div>

              <input
                type="range"
                min="90"
                max="150"
                step="5"
                value={tamanoTexto}
                onChange={evento=>
                  actualizar(
                    "tamanoTexto",
                    Number(
                      evento.target.value
                    )
                  )
                }
                aria-label="Tamaño global del texto"
              />

              <div className="cfg-slider-limites">
                <span>
                  90%
                </span>

                <span>
                  150%
                </span>
              </div>

            </div>

          </div>

          {/* TEMA */}
          <div className="cfg-fila">

            <div className="cfg-info">
              <strong>
                Tema
              </strong>

              <span>
                Cambia toda la aplicación entre modo claro y oscuro.
              </span>
            </div>

            <GrupoOpciones
              valor={tema}
              onChange={valor=>
                actualizar(
                  "tema",
                  valor
                )
              }
              opciones={[
                {
                  valor:"claro",
                  texto:"Claro",
                  icono:Sun,
                },
                {
                  valor:"oscuro",
                  texto:"Oscuro",
                  icono:Moon,
                },
              ]}
            />

          </div>

        </section>

        {/* =========================================
            VISUALIZACIÓN
        ========================================== */}
        <section className="cfg-seccion">

          <div className="cfg-seccion-titulo">

            <ChartLine
              size={18}
              strokeWidth={1.8}
            />

            <div>
              <h2>
                Visualización
              </h2>

              <p>
                Controla cómo se distribuye y representa la información.
              </p>
            </div>

          </div>

          {/* DENSIDAD */}
          <div className="cfg-fila">

            <div className="cfg-info">
              <strong>
                Densidad de interfaz
              </strong>

              <span>
                Modifica el espacio entre tarjetas y componentes.
              </span>
            </div>

            <GrupoOpciones
              valor={densidad}
              onChange={valor=>
                actualizar(
                  "densidad",
                  valor
                )
              }
              opciones={[
                {
                  valor:"compacta",
                  texto:"Compacta",
                },
                {
                  valor:"normal",
                  texto:"Normal",
                },
                {
                  valor:"amplia",
                  texto:"Amplia",
                },
              ]}
            />

          </div>

          {/* TAMAÑO GRÁFICOS */}
          <div className="cfg-fila">

            <div className="cfg-info">
              <strong>
                Tamaño de gráficos
              </strong>

              <span>
                Aumenta el espacio vertical disponible para los gráficos.
              </span>
            </div>

            <GrupoOpciones
              valor={tamanoGrafico}
              onChange={valor=>
                actualizar(
                  "tamanoGrafico",
                  valor
                )
              }
              opciones={[
                {
                  valor:"normal",
                  texto:"Normal",
                },
                {
                  valor:"grande",
                  texto:"Grande",
                },
              ]}
            />

          </div>

          {/* CONTRASTE */}
          <div className="cfg-fila">

            <div className="cfg-info">
              <strong>
                Contraste
              </strong>

              <span>
                Refuerza textos, bordes y elementos secundarios.
              </span>
            </div>

            <GrupoOpciones
              valor={contraste}
              onChange={valor=>
                actualizar(
                  "contraste",
                  valor
                )
              }
              opciones={[
                {
                  valor:"normal",
                  texto:"Normal",
                },
                {
                  valor:"alto",
                  texto:"Alto",
                  icono:Contrast,
                },
              ]}
            />

          </div>

          {/* TIPO GRÁFICO */}
          <div className="cfg-fila">

            <div className="cfg-info">
              <strong>
                Tipo de gráfico
              </strong>

              <span>
                Selecciona cómo se representan las series meteorológicas.
              </span>
            </div>

            <GrupoOpciones
              valor={tipoGrafico}
              onChange={valor=>
                actualizar(
                  "tipoGrafico",
                  valor
                )
              }
              opciones={[
                {
                  valor:"lineas",
                  texto:"Líneas",
                },
                {
                  valor:"puntos",
                  texto:"Puntos",
                },
                {
                  valor:"ambos",
                  texto:"Ambos",
                },
              ]}
            />

          </div>

        </section>

        {/* =========================================
            ACCESIBILIDAD
        ========================================== */}
        <section className="cfg-seccion">

          <div className="cfg-seccion-titulo">

            <Accessibility
              size={18}
              strokeWidth={1.8}
            />

            <div>
              <h2>
                Accesibilidad
              </h2>

              <p>
                Controla el movimiento y las transiciones de la interfaz.
              </p>
            </div>

          </div>

          {/* ANIMACIONES */}
          <div className="cfg-fila">

            <div className="cfg-info">
              <strong>
                Animaciones
              </strong>

              <span>
                Activa o desactiva las animaciones generales.
              </span>
            </div>

            <GrupoOpciones
              valor={
                animaciones
                  ?"activadas"
                  :"desactivadas"
              }
              onChange={valor=>
                actualizar(
                  "animaciones",
                  valor==="activadas"
                )
              }
              opciones={[
                {
                  valor:"activadas",
                  texto:"Activadas",
                },
                {
                  valor:"desactivadas",
                  texto:"Desactivadas",
                },
              ]}
            />

          </div>

          {/* MOVIMIENTO REDUCIDO */}
          <div className="cfg-fila">

            <div className="cfg-info">
              <strong>
                Movimiento reducido
              </strong>

              <span>
                Mantiene transiciones suaves evitando escalados y desplazamientos.
              </span>
            </div>

            <GrupoOpciones
              valor={
                movimientoReducido
                  ?"si"
                  :"no"
              }
              onChange={valor=>
                actualizar(
                  "movimientoReducido",
                  valor==="si"
                )
              }
              opciones={[
                {
                  valor:"no",
                  texto:"No",
                },
                {
                  valor:"si",
                  texto:"Sí",
                },
              ]}
            />

          </div>

        </section>

        {/* RESTABLECER */}
        <div className="cfg-restablecer">

          <button
            type="button"
            onClick={restablecer}
          >
            <RotateCcw
              size={16}
              strokeWidth={1.9}
            />

            Restablecer preferencias
          </button>

        </div>

      </div>

    </section>
  );
}

export default Configuracion;