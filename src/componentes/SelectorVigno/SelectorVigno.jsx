import { Children, Fragment, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import "./SelectorVigno.css";

/*
 * Selector visual reutilizable, compatible con los <option> existentes.
 * Conserva la firma onChange(evento) para no alterar filtros ni formularios.
 * El menú se renderiza en un portal para evitar recortes de overflow.
 */
function textoOpcion(nodo) {
  if (nodo == null || typeof nodo === "boolean") return "";
  if (typeof nodo === "string" || typeof nodo === "number") return String(nodo);
  if (Array.isArray(nodo)) return nodo.map(textoOpcion).join("");
  if (isValidElement(nodo)) return textoOpcion(nodo.props.children);
  return "";
}

function opcionesDesde(children) {
  const opciones = [];
  function recorrer(nodos) {
    Children.forEach(nodos, (nodo) => {
      if (!isValidElement(nodo)) return;
      if (nodo.type === Fragment || nodo.type === "optgroup") {
        recorrer(nodo.props.children);
      } else if (nodo.type === "option") {
        const etiqueta = nodo.props.label ?? textoOpcion(nodo.props.children).trim();
        const valor = String(nodo.props.value ?? etiqueta);
        opciones.push({
          valor,
          etiqueta: String(etiqueta),
          disabled: Boolean(nodo.props.disabled),
          hidden: Boolean(nodo.props.hidden),
        });
      }
    });
  }
  recorrer(children);
  return opciones.filter((item) => !item.hidden);
}

export default function SelectorVigno({
  children,
  value,
  defaultValue,
  onChange,
  className = "",
  disabled = false,
  name,
  id,
  title,
  placeholder = "Seleccionar opción",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...resto
}) {
  const [interno, setInterno] = useState(String(defaultValue ?? ""));
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [posicion, setPosicion] = useState(null);
  const [oscuro, setOscuro] = useState(false);
  const botonRef = useRef(null);
  const menuRef = useRef(null);
  const idReact = useId().replace(/:/g, "");
  const listaId = `vigno-lista-${idReact}`;
  const opciones = useMemo(() => opcionesDesde(children), [children]);
  const valor = String(value ?? interno);
  const seleccionada = opciones.find((opcion) => opcion.valor === valor);
  const habilitadas = opciones.map((opcion, indice) => (!opcion.disabled ? indice : -1)).filter((i) => i >= 0);

  const medir = useCallback(() => {
    const boton = botonRef.current;
    if (!boton) return;
    const rect = boton.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom - 12;
    const espacioArriba = rect.top - 12;
    const abrirArriba = espacioAbajo < 185 && espacioArriba > espacioAbajo;
    const alturaEstimada = Math.min(288, opciones.length * 38 + 12);
    const altura = Math.max(80, Math.min(288, abrirArriba ? espacioArriba : espacioAbajo));
    const ancho = Math.min(Math.max(rect.width, 155), window.innerWidth - 16);
    const izquierda = Math.max(8, Math.min(rect.left, window.innerWidth - ancho - 8));
    setPosicion({
      top: abrirArriba ? Math.max(8, rect.top - Math.min(altura, alturaEstimada) - 5) : rect.bottom + 5,
      left: izquierda,
      width: ancho,
      maxHeight: altura,
    });
    setOscuro(Boolean(
      boton.closest(".tema-pagina-oscuro, .ar-oscuro, .tema-oscuro") ||
      document.body.classList.contains("body-oscuro")
    ));
  }, [opciones.length]);

  const abrir = () => {
    if (disabled || !habilitadas.length) return;
    const elegida = opciones.findIndex((opcion) => opcion.valor === valor && !opcion.disabled);
    setActivo(elegida >= 0 ? elegida : habilitadas[0]);
    medir();
    setAbierto(true);
  };

  const cerrar = () => setAbierto(false);
  const elegir = (indice) => {
    const opcion = opciones[indice];
    if (!opcion || opcion.disabled) return;
    if (value === undefined) setInterno(opcion.valor);
    if (opcion.valor !== valor) onChange?.({ target: { value: opcion.valor, name }, currentTarget: { value: opcion.valor, name } });
    cerrar();
    botonRef.current?.focus();
  };

  useEffect(() => {
    if (!abierto) return;
    medir();
    function fuera(evento) {
      if (!botonRef.current?.contains(evento.target) && !menuRef.current?.contains(evento.target)) cerrar();
    }
    function reposicionar() { medir(); }
    function escapeGlobal(evento) {
      if (evento.key === "Escape") { evento.preventDefault(); cerrar(); botonRef.current?.focus(); }
    }
    document.addEventListener("pointerdown", fuera, true);
    document.addEventListener("keydown", escapeGlobal);
    window.addEventListener("resize", reposicionar);
    window.addEventListener("scroll", reposicionar, true);
    return () => {
      document.removeEventListener("pointerdown", fuera, true);
      document.removeEventListener("keydown", escapeGlobal);
      window.removeEventListener("resize", reposicionar);
      window.removeEventListener("scroll", reposicionar, true);
    };
  }, [abierto, medir]);

  useEffect(() => {
    if (!abierto || activo < 0) return;
    menuRef.current?.querySelector(`[data-vigno-indice="${activo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [abierto, activo]);

  // Mantener cerrado cuando el filtro se deshabilita.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (disabled) cerrar(); }, [disabled]);

  function mover(paso) {
    if (!habilitadas.length) return;
    const posicionActual = habilitadas.indexOf(activo);
    const siguiente = (posicionActual + paso + habilitadas.length) % habilitadas.length;
    setActivo(habilitadas[siguiente]);
  }

  function tecla(evento) {
    if (disabled) return;
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(evento.key)) {
      evento.preventDefault();
      if (evento.key === "Escape") { cerrar(); return; }
      if (!abierto) { abrir(); return; }
      if (evento.key === "ArrowDown") mover(1);
      if (evento.key === "ArrowUp") mover(-1);
      if (evento.key === "Home") setActivo(habilitadas[0] ?? -1);
      if (evento.key === "End") setActivo(habilitadas[habilitadas.length - 1] ?? -1);
      if (evento.key === "Enter" || evento.key === " ") elegir(activo);
    } else if (abierto && evento.key.length === 1 && !evento.ctrlKey && !evento.metaKey && !evento.altKey) {
      const buscada = opciones.findIndex((opcion) => !opcion.disabled && opcion.etiqueta.toLocaleLowerCase("es").startsWith(evento.key.toLocaleLowerCase("es")));
      if (buscada >= 0) setActivo(buscada);
    }
  }

  return (
    <>
      <button
        {...resto}
        type="button"
        role="combobox"
        aria-autocomplete="none"
        id={id}
        title={title}
        ref={botonRef}
        className={`vigno-select ${className} ${abierto ? "vigno-select--abierto" : ""}`}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? listaId : undefined}
        aria-activedescendant={abierto && activo >= 0 ? `${listaId}-${activo}` : undefined}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={tecla}
        onBlur={cerrar}
      >
        <span className={`vigno-select__texto ${!seleccionada ? "vigno-select__placeholder" : ""}`}>
          {seleccionada?.etiqueta || placeholder}
        </span>
        <ChevronDown className="vigno-select__flecha" aria-hidden="true" size={15} strokeWidth={2} />
      </button>
      {name && <input type="hidden" name={name} value={valor} />}
      {abierto && posicion && createPortal(
        <div
          id={listaId}
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel ?? title ?? "Opciones disponibles"}
          className={`vigno-lista ${oscuro ? "vigno-lista--oscura" : "vigno-lista--clara"}`}
          style={posicion}
          onMouseDown={(evento) => evento.preventDefault()}
        >
          {opciones.map((opcion, indice) => (
            <div
              key={`${opcion.valor}-${indice}`}
              id={`${listaId}-${indice}`}
              data-vigno-indice={indice}
              role="option"
              aria-selected={opcion.valor === valor}
              aria-disabled={opcion.disabled || undefined}
              className={`vigno-lista__opcion ${opcion.valor === valor ? "seleccionada" : ""} ${activo === indice ? "activa" : ""} ${opcion.disabled ? "deshabilitada" : ""}`}
              onPointerMove={() => { if (!opcion.disabled && activo !== indice) setActivo(indice); }}
              onClick={() => elegir(indice)}
            >
              <span>{opcion.etiqueta}</span>
              {opcion.valor === valor && <Check size={15} aria-hidden="true" />}
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
