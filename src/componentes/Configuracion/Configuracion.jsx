import SelectorVigno from "../SelectorVigno/SelectorVigno";
import { useState } from "react";
import {
  Accessibility, ChartLine, Contrast, Moon, RotateCcw,
  Settings2, Sun, AlertTriangle,
} from "lucide-react";
import { useConfiguracion, DEFINICIONES_UMBRALES } from "../../contexto/ConfiguracionContext";
import "./Configuracion.css";

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

function GrupoOpciones({ valor, opciones, onChange }) {
  return (
    <div className="cfg-opciones" role="group">
      {opciones.map((opcion) => {
        const Icono = opcion.icono;
        const activa = valor === opcion.valor;
        return (
          <button
            key={opcion.valor} type="button"
            className={`cfg-opcion ${activa ? "activa" : ""}`}
            aria-pressed={activa} onClick={() => onChange(opcion.valor)}
          >
            {Icono && <Icono size={16} strokeWidth={1.9} aria-hidden="true" />}
            <span>{opcion.texto}</span>
          </button>
        );
      })}
    </div>
  );
}

function Fila({ titulo, descripcion, children, clase = "" }) {
  return (
    <div className={`cfg-fila ${clase}`}>
      <div className="cfg-info"><strong>{titulo}</strong><span>{descripcion}</span></div>
      {children}
    </div>
  );
}

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
      {abierta && <div className="cfg-seccion-cuerpo" id={`cfg-contenido-${id}`}>{children}</div>}
    </section>
  );
}

function Configuracion({ estaciones = [] }) {
  const {
    tamanoTexto, tema, densidad, tamanoGrafico, contraste, tipoGrafico,
    umbrales, umbralesPorEstacion, actualizarUmbral, restablecerUmbralesEstacion,
    actualizar, restablecer,
  } = useConfiguracion();
  const [abiertas, setAbiertas] = useState({ accesibilidad: true });
  const [estacionUmbrales, setEstacionUmbrales] = useState("");
  const alternar = (clave) => setAbiertas((actual) => ({ ...actual, [clave]: !actual[clave] }));
  const cambiar = (campo) => (valor) => actualizar(campo, valor);

  return (
    <section className="cfg-pagina">
      <header className="cfg-cabecera">
        <div className="cfg-icono-principal"><Settings2 size={23} strokeWidth={1.8} /></div>
        <div>
          <h1>Configuración</h1>
        </div>
        <div className="cfg-restablecer">
          <button type="button" onClick={restablecer}><RotateCcw size={17} />Restablecer preferencias</button>
        </div>
      </header>

      <div className="cfg-contenido">
        <Seccion id="accesibilidad" Icono={Accessibility}
          titulo="Apariencia y accesibilidad"
          descripcion="Tamaño de letra, tema y contraste"
          abierta={Boolean(abiertas.accesibilidad)} onToggle={() => alternar("accesibilidad")}
        >
          <Fila clase="cfg-fila-slider" titulo="Tamaño del texto"
            descripcion="Amplía los textos.">
            <div className="cfg-slider-area">
              <div className="cfg-slider-superior"><span>Escala global</span><strong>{tamanoTexto}%</strong></div>
              <input type="range" min="90" max="180" step="5" value={tamanoTexto}
                onChange={(e) => actualizar("tamanoTexto", Number(e.target.value))}
                aria-label="Tamaño global del texto" />
              <div className="cfg-slider-limites"><span>90%</span><span>180%</span></div>
            </div>
          </Fila>
          <Fila titulo="Tema" descripcion="Cambia entre modo claro y oscuro.">
            <GrupoOpciones valor={tema} opciones={OPCIONES.tema} onChange={cambiar("tema")} />
          </Fila>
          <Fila titulo="Contraste" descripcion="Refuerza la legibilidad de los elementos.">
            <GrupoOpciones valor={contraste} opciones={OPCIONES.contraste} onChange={cambiar("contraste")} />
          </Fila>
        </Seccion>

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

        <Seccion id="alertas" Icono={AlertTriangle}
          titulo="Alertas y umbrales"
          descripcion="Criterios de color rojo en el resumen meteorológico"
          abierta={Boolean(abiertas.alertas)} onToggle={() => alternar("alertas")}
        >
          <div className="cfg-selector-estacion">
            <label htmlFor="cfg-estacion-umbrales">Editar umbrales de</label>
            <SelectorVigno id="cfg-estacion-umbrales" value={estacionUmbrales}
              onChange={(e) => setEstacionUmbrales(e.target.value)}>
              <option value="">Valores generales (todas las estaciones)</option>
              {estaciones.map((estacion) => {
                const codigo = String(estacion.codigo ?? estacion.id);
                return <option key={codigo} value={codigo}>{estacion.nombre ?? codigo}</option>;
              })}
            </SelectorVigno>
            <p>{estacionUmbrales
              ? "Los campos vacíos usan el valor general. Los cambios solo afectan a esta estación."
              : "Estos valores se aplican a todas las estaciones que no tengan una personalización propia."}</p>
          </div>
          {DEFINICIONES_UMBRALES.map((def) => {
            const propio = estacionUmbrales ? umbralesPorEstacion[estacionUmbrales]?.[def.clave] : undefined;
            const valor = estacionUmbrales ? (propio ?? "") : (umbrales[def.clave] ?? "");
            return (
              <Fila key={def.clave} titulo={def.titulo} descripcion={def.descripcion}>
                <label className="cfg-umbral">
                  <span>{def.condicion} · {def.unidad} {estacionUmbrales && propio === undefined
                    ? `(General: ${umbrales[def.clave] ?? "sin definir"})` : ""}</span>
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
          {estacionUmbrales && (
            <div className="cfg-umbral-acciones">
              <button type="button" onClick={() => restablecerUmbralesEstacion(estacionUmbrales)}>
                <RotateCcw size={16} /> Usar valores generales para esta estación
              </button>
            </div>
          )}
        </Seccion>



        
      </div>
    </section>
  );
}

export default Configuracion;
