
import SelectorVigno from "../SelectorVigno/SelectorVigno";
import { useState } from "react";
import {
  Accessibility, ChartLine, Contrast, Moon, Palette, RotateCcw,
  Settings2, Sun, AlertTriangle, ClipboardCheck,
} from "lucide-react";
import { useConfiguracion, DEFINICIONES_UMBRALES, CONFIGURACION_INICIAL } from "../../contexto/ConfiguracionContext";
import { useAuth } from "../../contexto/AuthContext";
import { tienePermiso } from "../../services/permisos";
import ConfiguracionMarca from "./ConfiguracionMarca";
import AuditoriaConfiguracion from "./AuditoriaConfiguracion";
import "./Configuracion.css";

// Meses visibles en los selectores de temporada (internamente se guardan como números).
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// define las opciones disponibles para personalizar la aplicacion
const OPCIONES = {
  tema: [
    { valor: "claro", texto: "Claro", icono: Sun },
    { valor: "oscuro", texto: "Oscuro", icono: Moon },
  ],
  densidad: [
    { valor: "compacta", texto: "Compacta" },
    { valor: "normal", texto: "Normal" },
    { valor: "amplia", texto: "Amplia" },
  ],
  grafico: [
    { valor: "normal", texto: "Normal" },
    { valor: "grande", texto: "Grande" },
  ],
  contraste: [
    { valor: "normal", texto: "Normal" },
    { valor: "alto", texto: "Alto", icono: Contrast },
  ],
  tipoGrafico: [
    { valor: "lineas", texto: "Líneas" },
    { valor: "puntos", texto: "Puntos" },
    { valor: "ambos", texto: "Ambos" },
  ],
};

// crea los botones para elegir una opcion de configuracion
function GrupoOpciones({ valor, opciones, onChange }) {
  return (
    <div className="cfg-opciones" role="group">

      {/* recorre las opciones y crea un boton por cada una */}
      {opciones.map((opcion) => {
        const Icono = opcion.icono;
        const activa = valor === opcion.valor;

        return (
          <button
            key={opcion.valor} type="button"
            className={`cfg-opcion ${activa ? "activa" : ""}`}
            aria-pressed={activa} onClick={() => onChange(opcion.valor)}
          >
            {/* muestra el icono si la opcion tiene uno */}
            {Icono && <Icono size={16} strokeWidth={1.9} aria-hidden="true" />}
            <span>{opcion.texto}</span>
          </button>
        );
      })}
    </div>
  );
}

// componente que organiza cada fila de configuracion
function Fila({ titulo, descripcion, children, clase = "" }) {
  return (
    <div className={`cfg-fila ${clase}`}>
      <div className="cfg-info"><strong>{titulo}</strong><span>{descripcion}</span></div>
      {children}
    </div>
  );
}

// crea una seccion que se puede abrir o cerrar
function Seccion({ id, Icono, titulo, descripcion, abierta, onToggle, children }) {
  return (
    <section className="cfg-seccion">
      <h2 className="cfg-seccion-encabezado">
        <button
          type="button" className="cfg-seccion-boton"
          aria-expanded={abierta} aria-controls={`cfg-contenido-${id}`}
          onClick={onToggle}
        >
          <span className="cfg-seccion-icono"><Icono size={20} aria-hidden="true" /></span>
          <span className="cfg-seccion-textos">
            <strong>{titulo}</strong><small>{descripcion}</small>
          </span>
          <span className={`cfg-chevron ${abierta ? "abierto" : ""}`} aria-hidden="true">⌄</span>
        </button>
      </h2>

      {/* solo muestra el contenido cuando la seccion esta abierta */}
      {abierta && <div className="cfg-seccion-cuerpo" id={`cfg-contenido-${id}`}>{children}</div>}
    </section>
  );
}

// componente principal de configuracion
function Configuracion({ estaciones = [], fichasTemporada = [], temporadaEnCurso = null }) {

  // obtiene las preferencias y funciones del contexto de configuracion
  const {
    tamanoTexto, tema, densidad, tamanoGrafico, contraste, tipoGrafico,
    umbrales, umbralesPorEstacion, actualizarUmbral, restablecerUmbralesEstacion,
    temporadaInicio, temporadaFin, actualizarTemporada,
    actualizar, restablecer,
  } = useConfiguracion();

  // obtiene el usuario y comprueba si tiene permiso para editar la marca
  const { user } = useAuth();
  const puedeEditarMarca = tienePermiso(user?.rol, "editar_marca");

  // guarda las secciones abiertas y la estacion seleccionada
  const [abiertas, setAbiertas] = useState({ accesibilidad: true });
  const [estacionUmbrales, setEstacionUmbrales] = useState("");
  const [inicio, setInicio] = useState(temporadaInicio);
  const [fin, setFin] = useState(temporadaFin);
  const [mensajeTemporada, setMensajeTemporada] = useState("");
  const esAdministrador = user?.rol === "administrador";
  // Los lectores solo pueden cambiar preferencias visuales.
  const puedeVerGestion = ["editor", "administrador"].includes(user?.rol);

  // abre o cierra una seccion sin modificar las demas
  const alternar = (clave) => setAbiertas((actual) => ({ ...actual, [clave]: !actual[clave] }));

  // crea una funcion para actualizar una preferencia especifica
  const cambiar = (campo) => (valor) => actualizar(campo, valor);

  return (
    <section className="cfg-pagina">
      <header className="cfg-cabecera">
        <div className="cfg-icono-principal"><Settings2 size={23} strokeWidth={1.8} /></div>
        <div>
          <h1>Configuración</h1>
        </div>

        {/* permite devolver las preferencias a sus valores iniciales */}
        <div className="cfg-restablecer">
          <button type="button" onClick={() => { restablecer(); setInicio(CONFIGURACION_INICIAL.temporadaInicio); setFin(CONFIGURACION_INICIAL.temporadaFin); setMensajeTemporada(""); }}><RotateCcw size={17} />Restablecer preferencias</button>
        </div>
      </header>

      <div className="cfg-contenido">

        {/* seccion para modificar las opciones de accesibilidad */}
        <Seccion id="accesibilidad" Icono={Accessibility}
          titulo="Apariencia y accesibilidad"
          descripcion="Tamaño de letra, tema y contraste"
          abierta={Boolean(abiertas.accesibilidad)} onToggle={() => alternar("accesibilidad")}
        >
          <Fila clase="cfg-fila-slider" titulo="Tamaño del texto"
            descripcion="Amplía los textos.">
            <div className="cfg-slider-area">
              <div className="cfg-slider-superior"><span>Escala global</span><strong>{tamanoTexto}%</strong></div>

              {/* cambia el tamaño del texto entre 90 y 180 */}
              <input type="range" min="90" max="180" step="5" value={tamanoTexto}
                onChange={(e) => actualizar("tamanoTexto", Number(e.target.value))}
                aria-label="Tamaño global del texto" />

              <div className="cfg-slider-limites"><span>90%</span><span>180%</span></div>
            </div>
          </Fila>

          {/* permite cambiar entre modo claro y oscuro */}
          <Fila titulo="Tema" descripcion="Cambia entre modo claro y oscuro.">
            <GrupoOpciones valor={tema} opciones={OPCIONES.tema} onChange={cambiar("tema")} />
          </Fila>

          {/* permite seleccionar el nivel de contraste */}
          <Fila titulo="Contraste" descripcion="Refuerza la legibilidad de los elementos.">
            <GrupoOpciones valor={contraste} opciones={OPCIONES.contraste} onChange={cambiar("contraste")} />
          </Fila>
        </Seccion>

        {/* seccion para modificar las opciones de los graficos */}
        <Seccion id="visualizacion" Icono={ChartLine}
          titulo="Visualización y gráficos"
          descripcion="Densidad, tamaño de gráficos y representación de series"
          abierta={Boolean(abiertas.visualizacion)} onToggle={() => alternar("visualizacion")}
        >
          <Fila titulo="Densidad de interfaz" descripcion="Cambia el espacio entre los componentes.">
            <GrupoOpciones valor={densidad} opciones={OPCIONES.densidad} onChange={cambiar("densidad")} />
          </Fila>

          <Fila titulo="Tamaño de gráficos" descripcion="Ajusta el alto de las visualizaciones.">
            <GrupoOpciones valor={tamanoGrafico} opciones={OPCIONES.grafico} onChange={cambiar("tamanoGrafico")} />
          </Fila>

          <Fila titulo="Tipo de gráfico" descripcion="Muestra líneas, puntos o ambos.">
            <GrupoOpciones valor={tipoGrafico} opciones={OPCIONES.tipoGrafico} onChange={cambiar("tipoGrafico")} />
          </Fila>
        </Seccion>

        {/* Alertas y umbrales solo para editores y administradores */}
        {puedeVerGestion && (
        <Seccion id="alertas" Icono={AlertTriangle}
          titulo="Alertas y umbrales"
          descripcion="Criterios de color rojo en el resumen meteorológico"
          abierta={Boolean(abiertas.alertas)} onToggle={() => alternar("alertas")}
        >
          <div className="cfg-temporada-config">
            <h3>Fechas de la temporada del Resumen</h3>
            <div className="cfg-fechas-temporada">
              {[["Inicio", inicio, setInicio], ["Fin", fin, setFin]].map(([etiqueta, fecha, cambiarFecha]) => (
                <fieldset key={etiqueta} disabled={!esAdministrador}>
                  <legend>{etiqueta}</legend>
                  {/* Día: muestra únicamente los días del mes elegido */}
                  <label>Día
                    <SelectorVigno value={fecha.dia} onChange={(e) =>
                      cambiarFecha({ ...fecha, dia: Number(e.target.value) })
                    }>
                      {Array.from({ length: new Date(2025, fecha.mes, 0).getDate() }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </SelectorVigno>
                  </label>

                  {/* Mes: se muestra el nombre, pero se guarda el número */}
                  <label>Mes
                    <SelectorVigno value={fecha.mes} onChange={(e) => {
                      const mes = Number(e.target.value);
                      const ultimoDia = new Date(2025, mes, 0).getDate();
                      cambiarFecha({ ...fecha, mes, dia: Math.min(fecha.dia, ultimoDia) });
                    }}>
                      {MESES.map((mes, i) => (
                        <option key={mes} value={i + 1}>{mes}</option>
                      ))}
                    </SelectorVigno>
                  </label>
                </fieldset>
              ))}
            </div>
            {esAdministrador ? (
              <button type="button" className="cfg-boton-temporada" onClick={() => {
                const valido = (f) => Number.isInteger(f.mes) && f.mes >= 1 && f.mes <= 12 &&
                  Number.isInteger(f.dia) && f.dia >= 1 && f.dia <= new Date(2025, f.mes, 0).getDate();
                setMensajeTemporada(!valido(inicio) || !valido(fin) || !actualizarTemporada(inicio, fin)
                  ? "Revisa las fechas: deben ser válidas y diferentes." : "Temporada guardada en este navegador.");
              }}>Guardar fechas</button>
            ) : <p>Solo un administrador puede modificar la temporada.</p>}
            {mensajeTemporada && <p role="status">{mensajeTemporada}</p>}
          </div>
          <div className="cfg-selector-estacion">
            <label htmlFor="cfg-estacion-umbrales">Editar umbrales de</label>

            {/* selecciona si los cambios son generales o para una estacion */}
            <SelectorVigno id="cfg-estacion-umbrales" value={estacionUmbrales}
              onChange={(e) => setEstacionUmbrales(e.target.value)}>
              <option value="">Valores generales (todas las estaciones)</option>

              {/* recorre las estaciones para agregarlas al selector */}
              {estaciones.map((estacion) => {
                const codigo = String(estacion.codigo ?? estacion.id);
                return <option key={codigo} value={codigo}>{estacion.nombre ?? codigo}</option>;
              })}
            </SelectorVigno>

            {/* cambia el mensaje dependiendo de la estacion seleccionada */}
            <p>{estacionUmbrales
              ? "Los campos vacíos usan el valor general. Los cambios solo afectan a esta estación."
              : "Estos valores se aplican a todas las estaciones que no tengan una personalización propia."}</p>
          </div>

          {/* recorre los umbrales y crea un campo para modificar cada uno */}
          {DEFINICIONES_UMBRALES.map((def) => {

            // obtiene el umbral propio de la estacion si existe
            const propio = estacionUmbrales ? umbralesPorEstacion[estacionUmbrales]?.[def.clave] : undefined;

            // utiliza el umbral general cuando no hay una estacion seleccionada
            const valor = estacionUmbrales ? (propio ?? "") : (umbrales[def.clave] ?? "");

            return (
              <Fila key={def.clave} titulo={def.titulo} descripcion={def.descripcion}>
                <label className="cfg-umbral">
                  <span>{def.condicion} · {def.unidad} {estacionUmbrales && propio === undefined
                    ? `(General: ${umbrales[def.clave] ?? "sin definir"})` : ""}</span>

                  {/* actualiza el umbral cuando el usuario cambia el numero */}
                  <input type="number" inputMode="decimal" min={def.min} max={def.max} step="0.5"
                    value={valor}
                    placeholder={estacionUmbrales
                      ? (umbrales[def.clave] == null ? "Sin configurar" : `General: ${umbrales[def.clave]}`)
                      : "Sin umbral definido"}
                    aria-label={`${def.titulo}, ${def.condicion}, ${def.unidad}`}
                    onChange={(e) => actualizarUmbral(def.clave, e.target.value, estacionUmbrales)} />
                </label>
              </Fila>
            );
          })}

          {/* permite eliminar los umbrales propios y utilizar los generales */}
          {estacionUmbrales && (
            <div className="cfg-umbral-acciones">
              <button type="button" onClick={() => restablecerUmbralesEstacion(estacionUmbrales)}>
                <RotateCcw size={16} /> Usar valores generales para esta estación
              </button>
            </div>
          )}
        </Seccion>

        )}

        {/* Auditoría solo para editores y administradores */}
        {puedeVerGestion && (
        <Seccion id="auditoria" Icono={ClipboardCheck}
          titulo="Auditoría y calidad de datos"
          descripcion="Archivos, filas y observaciones que requieren revisión"
          abierta={Boolean(abiertas.auditoria)} onToggle={() => alternar("auditoria")}
        >
          <AuditoriaConfiguracion
            estaciones={estaciones}
            fichasTemporada={fichasTemporada}
            temporadaEnCurso={temporadaEnCurso}
          />
        </Seccion>

        )}

        {/* solo muestra la configuracion de marca si el usuario tiene permiso */}
        {puedeEditarMarca && (
          <Seccion
            id="marca"
            Icono={Palette}
            titulo="Marca e identidad visual"
            descripcion="Nombre, logo, colores e identidad visual de la plataforma"
            abierta={Boolean(abiertas.marca)}
            onToggle={() => alternar("marca")}
          >
            <ConfiguracionMarca />
          </Seccion>
        )}
      </div>
    </section>
  );
}

export default Configuracion;
