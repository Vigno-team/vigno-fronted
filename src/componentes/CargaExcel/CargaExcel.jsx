import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, PlusCircle, RefreshCcw, Trash2, UploadCloud } from "lucide-react";
import SelectorVigno from "../SelectorVigno/SelectorVigno";
import { prevalidarExcel, confirmarExcel, obtenerHistorialCargas, registrarEstacion, eliminarEstacion, obtenerVariables, obtenerDetalleCarga, cambiarColumnasCarga } from "../../services/cargasApi";
import ColumnasExcel from "./ColumnasExcel";
import EditarEstaciones from "./EditarEstaciones";
import { pedirApi } from "../../services/api";
import { useAuth } from "../../contexto/AuthContext";
import "./CargaExcel.css";

const ESTACION_VACIA = { nombre: "", latitud: "", longitud: "", subzona: "" };
const texto = (valor) => valor === null || valor === undefined || valor === "" ? "—" : String(valor);
function comoLista(datos) {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.results)) return datos.results;
  if (Array.isArray(datos?.cargas)) return datos.cargas;
  return [];
}
const nombreCarga = (c) => c.estacion?.nombre ?? c.estacion ?? c.estacion_nombre ?? c.estacion_codigo;
const normalizar = (valor) => String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// El navegador convierte UTC a la hora de Chile, incluso con horario de verano.
function fechaChile(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return String(valor);
  const partes = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(fecha);
  const dato = (tipo) => partes.find((p) => p.type === tipo)?.value;
  return `${dato("day")}/${dato("month")}/${dato("year")} ${dato("hour")}:${dato("minute")}`;
}

// Una carga está deshecha si Django confirma que TODAS sus variables están excluidas.
// Así el historial sigue correcto al recargar o entrar desde otro computador.
function cargaDeshecha(carga) {
  const procesadas = carga?.variables_procesadas ?? [];
  const excluidas = carga?.variables_excluidas ?? [];
  const disponibles = [...new Set([...procesadas, ...excluidas])];
  return disponibles.length > 0 && disponibles.every((variable) => excluidas.includes(variable));
}

// Respuestas de Django: cantidad de filas válidas, inválidas y observaciones.
function resumenExcel(datos) {
  const filas = datos?.filas ?? datos?.resumen ?? datos?.resultado ?? datos ?? {};
  return {
    leidas: filas.leidas ?? filas.filas_leidas ?? filas.total_filas ?? filas.total,
    aceptadas: filas.aceptadas ?? filas.filas_aceptadas ?? filas.filas_validas,
    rechazadas: filas.rechazadas ?? filas.filas_rechazadas ?? filas.filas_invalidas,
    observaciones: [...(datos?.rechazos ?? []), ...(datos?.advertencias ?? [])],
  };
}

// Convierte los errores anidados de Django en mensajes legibles.
function mensajesError(datos, prefijo = "") {
  if (datos == null) return [];
  if (typeof datos !== "object") return [`${prefijo ? `${prefijo}: ` : ""}${datos}`];
  return Object.entries(datos).flatMap(([clave, valor]) => {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave;
    return mensajesError(valor, ruta);
  });
}

// La tabla mantiene agrupados el número de fila, su valor y el motivo.
function Observaciones({ datos, titulo = "Motivos y observaciones" }) {
  const lista = Array.isArray(datos) ? datos : datos ? [datos] : [];
  const filas = lista.filter((x) => x && typeof x === "object" && "fila" in x);
  const avisos = lista.filter((x) => !filas.includes(x)).flatMap((x) => mensajesError(x));
  if (!filas.length && !avisos.length) return null;

  return (
    <details className="ce-observaciones">
      <summary><span>{titulo}</span><span className="ce-observaciones-total">{filas.length + avisos.length} registros</span></summary>
      {filas.length > 0 && (
        <div className="ce-observaciones-scroll">
          <table className="ce-observaciones-tabla">
            <thead><tr><th>Fila</th><th>Fecha o valor original</th><th>Motivo del rechazo</th></tr></thead>
            <tbody>{filas.map((f, i) => (
              <tr key={`${f.fila}-${i}`}>
                <td data-label="Fila"><span className="ce-observaciones-fila">{texto(f.fila)}</span></td>
                <td data-label="Valor original" className="ce-observaciones-valor">{texto(f.valor_original ?? f.fecha)}</td>
                <td data-label="Motivo">{texto(f.motivo ?? f.aviso)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {avisos.length > 0 && <ul className="ce-observaciones-avisos">{avisos.map((aviso, i) => <li key={i}>{aviso}</li>)}</ul>}
    </details>
  );
}

export default function CargaExcel({ estaciones = [], onCargaConfirmada }) {
  // Se reutiliza la sesión de Vigno: no se pide la contraseña por segunda vez.
  const { usuario, isAuthenticated } = useAuth();
  const accesoOk = isAuthenticated;
  const rol = usuario?.rol ?? "";
  const inputArchivo = useRef(null);

  // Estados de las estaciones, Excel e historial.
  const [estacionesApi, setEstacionesApi] = useState([]);
  const [inactivas, setInactivas] = useState([]);
  const [estacionDestino, setEstacionDestino] = useState("");
  const [nueva, setNueva] = useState(ESTACION_VACIA);
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [validacion, setValidacion] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  // El estado deshecho viene de Django; no depende de localStorage.
  const [mostrarOcultas, setMostrarOcultas] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [actualizacion, setActualizacion] = useState(0);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [estacionDesactivar, setEstacionDesactivar] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mensajeEstacion, setMensajeEstacion] = useState(null);

  // Catálogo y selección de columnas: null significa "usar todas".
  const [catalogo, setCatalogo] = useState(null);
  const [columnasElegidas, setColumnasElegidas] = useState(null);
  const [diagnostico, setDiagnostico] = useState([]);
  const [detalleCarga, setDetalleCarga] = useState(null);
  const [excluidas, setExcluidas] = useState([]);
  const [mensajeColumnas, setMensajeColumnas] = useState("");
  const [guardandoColumnas, setGuardandoColumnas] = useState(false);

  // 2. Estaciones disponibles: se combinan las del dashboard y las de Django.
  const mapa = new Map();
  [...estaciones, ...estacionesApi].forEach((e) => {
    const codigo = String(e.codigo ?? e.id ?? "");
    if (codigo && e.activa !== false && !inactivas.includes(codigo)) mapa.set(codigo, { ...e, codigo });
  });
  const disponibles = [...mapa.values()];
  const opciones = disponibles.map((e) => <option key={e.codigo} value={e.codigo}>{e.nombre ?? e.codigo}</option>);
  const seleccionada = disponibles.find((e) => e.codigo === estacionDesactivar);
  const nombreSeleccionado = seleccionada?.nombre ?? seleccionada?.codigo ?? "";
  const esAdmin = accesoOk && rol === "administrador";
  const puedeDesactivar = esAdmin && seleccionada && confirmacion.trim() === nombreSeleccionado && !cargando;
  const validando = archivo && estacionDestino && estacionDestino !== "nueva" && accesoOk && !validacion && !error;
  const resumen = validacion ? resumenExcel(validacion.respuesta) : null;
  const columnas = validacion?.respuesta?.columnas ?? diagnostico;
  const seleccionadas = columnasElegidas ?? validacion?.respuesta?.variables_procesadas ?? columnas.map((c) => c.variable);
  const variablesEnvio = esAdmin && columnasElegidas !== null ? columnasElegidas : undefined;
  const columnasDetalle = detalleCarga ? [...new Set([
    ...(detalleCarga.variables_procesadas ?? []), ...(detalleCarga.variables_excluidas ?? []),
  ])].map((variable) => ({ variable })) : [];
  const incluidasDetalle = columnasDetalle.map((c) => c.variable).filter((v) => !excluidas.includes(v));
  const excluidasOriginales = detalleCarga?.variables_excluidas ?? [];
  const seleccionCambio = [...excluidas].sort().join() !== [...excluidasOriginales].sort().join();
  const detallesError = error?.detalles?.errores ?? error?.detalles?.rechazos ?? error?.detalles;

  const nombreFiltro = disponibles.find((e) => e.codigo === filtro)?.nombre;
  const cargasVisibles = historial.filter((c) => {
    // Historial normal = activas; «Ver deshechas» = solo deshechas.
    if (cargaDeshecha(c) !== mostrarOcultas) return false;
    return !filtro || [filtro, nombreFiltro].some(
      (nombre) => nombre && normalizar(nombre) === normalizar(nombreCarga(c))
    );
  }).sort((a, b) => (b.fecha_carga ?? "").localeCompare(a.fecha_carga ?? "") || (b.id ?? 0) - (a.id ?? 0));
  const cantidadOcultas = historial.filter(cargaDeshecha).length;

  // 3. Consultas automáticas: catálogo, historial y prevalidación.
  useEffect(() => {
    const control = new AbortController();
    pedirApi("/v1/estaciones", { signal: control.signal })
      .then((datos) => { if (!control.signal.aborted) setEstacionesApi(comoLista(datos)); })
      .catch((e) => { if (!control.signal.aborted) setError({ mensaje: `No se pudieron consultar las estaciones: ${e.message}` }); });
    return () => control.abort();
  }, []);

  useEffect(() => {
    if (!accesoOk) return;
    obtenerVariables().then(setCatalogo).catch(() => setCatalogo(null));
  }, [accesoOk]);

  useEffect(() => {
    if (!accesoOk) return;
    const control = new AbortController();
    async function consultar() {
      setCargandoHistorial(true);
      setErrorHistorial("");
      try {
        const datos = await obtenerHistorialCargas(control.signal);
        if (!control.signal.aborted) setHistorial(comoLista(datos));
      } catch (e) {
        if (e.name !== "AbortError" && !control.signal.aborted) setErrorHistorial(e.message);
      } finally {
        if (!control.signal.aborted) setCargandoHistorial(false);
      }
    }
    consultar();
    return () => control.abort();
  }, [accesoOk, actualizacion]);

  useEffect(() => {
    if (!archivo || !estacionDestino || estacionDestino === "nueva" || !accesoOk) return;
    const control = new AbortController();
    prevalidarExcel(archivo, estacionDestino, control.signal, variablesEnvio)
      .then((datos) => {
        if (control.signal.aborted) return;
        if (datos?.valido === false) setError({ mensaje: "El Excel contiene errores.", detalles: datos });
        else {
          setDiagnostico(datos?.columnas ?? []);
          setValidacion({ archivo, estacion: estacionDestino, variables: variablesEnvio, respuesta: datos });
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError" && !control.signal.aborted) {
          if (Array.isArray(e.respuesta?.columnas)) setDiagnostico(e.respuesta.columnas);
          setError({ mensaje: e.message, status: e.status, detalles: e.respuesta });
        }
      });
    return () => control.abort();
  }, [archivo, estacionDestino, accesoOk, columnasElegidas, esAdmin]);

  // 4. Acciones que realiza el usuario.
  function cambiarEstacion(codigo) {
    setEstacionDestino(codigo);
    if (codigo !== "nueva") setFiltro(codigo);
    setValidacion(null);
    setColumnasElegidas(null);
    setDiagnostico([]);
    setResultado(null);
    setError(null);
  }

  function elegirArchivo(file) {
    if (!file) return;
    setArchivo(null);
    setValidacion(null);
    setColumnasElegidas(null);
    setDiagnostico([]);
    setResultado(null);
    setError(null);
    if (!/\.(xlsx|xls)$/i.test(file.name) || file.size > 20 * 1024 * 1024) {
      setError({ mensaje: "Selecciona un Excel .xlsx o .xls de máximo 20 MB." });
      return;
    }
    setArchivo(file);
    if (inputArchivo.current) inputArchivo.current.value = "";
  }

  function alternarColumna(variable) {
    const elegidas = seleccionadas.includes(variable)
      ? seleccionadas.filter((item) => item !== variable)
      : [...seleccionadas, variable];
    if (!elegidas.length) return; // Django necesita al menos una variable al cargar.
    setColumnasElegidas(elegidas);
    setValidacion(null); // Siempre repetir la prevalidación antes de confirmar.
    setError(null);
  }

  async function abrirColumnas(carga) {
    if (detalleCarga?.id === carga.id) { setDetalleCarga(null); return; }
    setGuardandoColumnas(true);
    setMensajeColumnas("");
    try {
      const detalle = await obtenerDetalleCarga(carga.id);
      setDetalleCarga(detalle);
      setExcluidas(detalle.variables_excluidas ?? []);
    } catch (error) {
      setMensajeColumnas(error.message);
    } finally {
      setGuardandoColumnas(false);
    }
  }

  // Deshacer una carga solo excluye sus variables; el Excel original se conserva.
  async function deshacerCarga() {
    if (!esAdmin || !detalleCarga || guardandoColumnas || !columnasDetalle.length || !incluidasDetalle.length) return;
    const confirmar = window.confirm(
      `¿Deshacer la carga #${detalleCarga.id} (${detalleCarga.archivo})?\n\n` +
      "Sus variables dejarán de aportar a los cálculos. No se borrará el Excel original. " +
      "Luego podrás subir una versión corregida."
    );
    if (!confirmar) return;

    setGuardandoColumnas(true);
    setMensajeColumnas("");
    try {
      const todas = columnasDetalle.map((columna) => columna.variable);
      const respuesta = await cambiarColumnasCarga(detalleCarga.id, todas);
      if (!cargaDeshecha(respuesta)) {
        throw new Error("Django no confirmó que todas las variables estén excluidas. Revisa el estado de la carga antes de repetir.");
      }
      // Ocultar inmediatamente y actualizar los registros con la respuesta real.
      setHistorial((actual) => actual.map((c) =>
        String(c.id) === String(detalleCarga.id) ? { ...c, ...respuesta } : c
      ));
      setDetalleCarga(null);
      setMostrarOcultas(false);
      setMensajeColumnas(respuesta.recalculo?.ok === false
        ? "La carga quedó deshecha en Django, pero el recálculo sigue pendiente. No repitas la operación."
        : "Carga deshecha. Ya no aparece en el historial normal; encuéntrala en «Ver deshechas». Puedes subir el Excel corregido.");
      setActualizacion((n) => n + 1);
      onCargaConfirmada?.();
    } catch (e) {
      setMensajeColumnas(`No se pudo deshacer la carga: ${e.message}. No se ocultó porque Django no confirmó la operación.`);
    } finally {
      setGuardandoColumnas(false);
    }
  }

  // Busca la estación original para facilitar la carga del Excel corregido.
  function cargarCorreccion() {
    const estacion = disponibles.find((e) => normalizar(e.nombre) === normalizar(nombreCarga(detalleCarga)));
    if (!estacion) {
      setMensajeColumnas("La estación de esta carga no está activa. Selecciónala o reactívala antes de subir el Excel corregido.");
      return;
    }
    cambiarEstacion(estacion.codigo);
    inputArchivo.current?.click();
  }

  async function guardarColumnas() {
    if (!esAdmin || !detalleCarga || !seleccionCambio) return;
    if (!incluidasDetalle.length && !window.confirm(
      "Vas a excluir todas las columnas de esta carga. Sus aportes dejarán de usarse en los cálculos. ¿Confirmas?"
    )) return;
    setGuardandoColumnas(true);
    setMensajeColumnas("");
    try {
      const resultado = await cambiarColumnasCarga(detalleCarga.id, excluidas);
      if (!Array.isArray(resultado?.variables_excluidas)) {
        throw new Error("Django no devolvió las variables excluidas; revisa la carga antes de continuar.");
      }
      const deshecha = cargaDeshecha(resultado);
      setHistorial((actual) => actual.map((c) =>
        String(c.id) === String(detalleCarga.id) ? { ...c, ...resultado } : c
      ));
      setDetalleCarga(deshecha ? null : resultado);
      if (!deshecha) setMostrarOcultas(false); // Una carga recuperada vuelve al historial normal.
      setExcluidas(resultado.variables_excluidas);
      setMensajeColumnas(resultado.recalculo?.ok === false
        ? "Cambios guardados en Django, pero el recálculo quedó pendiente. No repitas la operación."
        : deshecha ? "Carga deshecha y movida a «Ver deshechas»." : "Columnas actualizadas. Si recuperaste una carga, volvió al historial normal.");
      setActualizacion((n) => n + 1);
      onCargaConfirmada?.();
    } catch (error) {
      setMensajeColumnas(error.message);
    } finally {
      setGuardandoColumnas(false);
    }
  }

  async function crearEstacion(e) {
    e.preventDefault();
    const lat = Number(nueva.latitud);
    const lon = Number(nueva.longitud);
    if (!nueva.nombre.trim() || nueva.latitud === "" || nueva.longitud === "" ||
        !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -56 || lat > -17 || lon < -76 || lon > -66) {
      setError({ mensaje: "Ingresa un nombre y coordenadas válidas dentro de Chile." });
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const datos = await registrarEstacion({ nombre: nueva.nombre.trim(), latitud: lat, longitud: lon,
        ...(nueva.subzona.trim() ? { subzona: nueva.subzona.trim() } : {}) });
      const codigo = datos?.codigo ?? datos?.id ?? datos?.estacion?.codigo ?? datos?.estacion?.id;
      if (codigo == null) throw new Error("La estación fue creada, pero Django no devolvió su código.");
      setEstacionesApi((prev) => [...prev, { ...nueva, ...datos, codigo: String(codigo) }]);
      cambiarEstacion(String(codigo));
      setNueva(ESTACION_VACIA);
      onCargaConfirmada?.();
    } catch (e2) {
      setError({ mensaje: e2.message, status: e2.status, detalles: e2.respuesta });
    } finally {
      setCargando(false);
    }
  }

  async function confirmarCarga() {
    if (!accesoOk || !validacion || validacion.archivo !== archivo || validacion.estacion !== estacionDestino ||
        JSON.stringify(validacion.variables ?? null) !== JSON.stringify(variablesEnvio ?? null)) return;
    const actualizadas = Number(validacion.respuesta?.conteos?.actualizados ?? 0);
    if (actualizadas > 0 && !window.confirm(
      `Atención: esta carga actualizaría ${actualizadas} mediciones existentes de la estación.\n` +
      "Comprueba que el archivo y la estación sean correctos. ¿Deseas continuar?"
    )) return;
    setCargando(true);
    setError(null);
    try {
      const datos = await confirmarExcel(archivo, estacionDestino, variablesEnvio);
      setResultado(datos ?? {});
      setArchivo(null);
      setValidacion(null);
      setColumnasElegidas(null);
      onCargaConfirmada?.();
      setFiltro(estacionDestino);
      setActualizacion((n) => n + 1);
    } catch (e) {
      setError({ mensaje: e.message, status: e.status, detalles: e.respuesta });
    } finally {
      setCargando(false);
    }
  }

  async function desactivarEstacion() {
    if (!puedeDesactivar) return;
    setCargando(true);
    setMensajeEstacion(null);
    try {
      const datos = await eliminarEstacion(estacionDesactivar);
      if (datos?.activa !== false) throw new Error("Django no confirmó la desactivación.");
      setInactivas((prev) => [...prev, estacionDesactivar]);
      setEstacionesApi((prev) => prev.filter((e) => String(e.codigo ?? e.id) !== estacionDesactivar));
      if (estacionDestino === estacionDesactivar) cambiarEstacion("");
      if (filtro === estacionDesactivar) setFiltro("");
      setEstacionDesactivar("");
      setConfirmacion("");
      setMensajeEstacion({ error: false, texto: datos.recalculo?.ok === false
        ? "Estación desactivada. El recálculo está pendiente; no repitas la operación."
        : "Estación desactivada. Sus mediciones históricas se conservan." });
      onCargaConfirmada?.();
      setActualizacion((n) => n + 1);
    } catch (e) {
      setMensajeEstacion({ error: true, texto: e.message });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="ce-panel">
      {/* 1. SUBIR EXCEL */}
      <section className="ce-bloque">
        <div className="ce-titulo"><FileSpreadsheet size={18} /><h3>Subir planilla meteorológica</h3></div>
        <label className="ce-campo"><span>Estación de destino</span>
          <SelectorVigno value={estacionDestino} onChange={(e) => cambiarEstacion(e.target.value)}>
            <option value="">Seleccionar estación</option>{opciones}<option value="nueva">+ Crear localidad nueva</option>
          </SelectorVigno>
        </label>
        {estacionDestino === "nueva" && (
          <form className="ce-formulario" onSubmit={crearEstacion}>
            <h4><PlusCircle size={16} /> Nueva localidad</h4>
            <div className="ce-campos-grid">
              <label className="ce-campo"><span>Nombre *</span>
                <input required value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} />
              </label>
              <label className="ce-campo"><span>Subzona (opcional)</span>
                <input value={nueva.subzona} onChange={(e) => setNueva({ ...nueva, subzona: e.target.value })} />
              </label>
              <label className="ce-campo"><span>Latitud *</span>
                <input required type="number" step="any" placeholder="-35.5" value={nueva.latitud} onChange={(e) => setNueva({ ...nueva, latitud: e.target.value })} />
              </label>
              <label className="ce-campo"><span>Longitud *</span>
                <input required type="number" step="any" placeholder="-71.6" value={nueva.longitud} onChange={(e) => setNueva({ ...nueva, longitud: e.target.value })} />
              </label>
            </div>
            <button className="ce-boton ce-primario" type="submit" disabled={cargando || !accesoOk}><PlusCircle size={16} /> Crear localidad</button>
          </form>
        )}
        <div className={`ce-dropzone ${arrastrando ? "ce-arrastrando" : ""}`} role="button" tabIndex={0}
          aria-label="Seleccionar o arrastrar archivo Excel"
          onClick={() => inputArchivo.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputArchivo.current?.click(); } }}
          onDragEnter={(e) => { e.preventDefault(); setArrastrando(true); }}
          onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
          onDragLeave={(e) => { e.preventDefault(); setArrastrando(false); }}
          onDrop={(e) => { e.preventDefault(); setArrastrando(false); elegirArchivo(e.dataTransfer.files?.[0]); }}>
          <UploadCloud size={29} aria-hidden="true" />
          <strong>{archivo?.name ?? "Arrastra tu Excel o haz clic para seleccionarlo"}</strong>
          <span>Solo archivos .xlsx y .xls · la estructura se comprueba en el servidor</span>
          <input ref={inputArchivo} type="file" accept=".xlsx,.xls" className="ce-archivo-oculto"
            onClick={(e) => e.stopPropagation()} onChange={(e) => elegirArchivo(e.target.files?.[0])} />
        </div>
        {archivo && !accesoOk && <p className="ce-mensaje">Inicia sesión en Vigno para prevalidar el Excel.</p>}
        {archivo && !estacionDestino && <p className="ce-mensaje">Selecciona una estación para prevalidar.</p>}
        {validando && <p className="ce-mensaje" role="status">Validando Excel en Django...</p>}
        {error && (
          <div className="ce-error" role="alert">
            <strong><AlertTriangle size={16} /> {error.status === 422 ? "Error de estructura" : "No se pudo completar la operación"}</strong>
            <p>{error.mensaje}</p><Observaciones datos={detallesError} titulo="Ver detalles del error" />
          </div>
        )}
        {resumen && (
          <div className="ce-validacion" role="status">
            <strong><CheckCircle2 size={17} /> Prevalidación completada</strong>
            <table><thead><tr><th>Filas leídas</th><th>Aceptadas</th><th>Rechazadas</th></tr></thead>
              <tbody><tr><td>{texto(resumen.leidas)}</td><td>{texto(resumen.aceptadas)}</td><td>{texto(resumen.rechazadas)}</td></tr></tbody></table>
            <Observaciones datos={resumen.observaciones} />
            {validacion.respuesta?.conteos && (
              <p className="ce-ayuda">Nuevas mediciones: {texto(validacion.respuesta.conteos.insertados)} ·
                Actualizaciones: {texto(validacion.respuesta.conteos.actualizados)} ·
                Sin cambios: {texto(validacion.respuesta.conteos.sin_cambio)}</p>
            )}
            {Number(validacion.respuesta?.conteos?.actualizados ?? 0) > 0 && (
              <p className="ce-aviso-dependencias" role="alert">
                Atención: este Excel actualizaría mediciones que ya existen en la estación.
                Verifica el archivo antes de confirmar para no reemplazar datos de otra carga.
              </p>
            )}
            {resumen.aceptadas == null && resumen.rechazadas == null && <p>Revisa el resumen antes de confirmar.</p>}
            <button className="ce-boton ce-primario" type="button" onClick={confirmarCarga} disabled={cargando || validando || !accesoOk || !(Number(resumen.aceptadas) > 0)}>
              <UploadCloud size={16} /> {cargando ? "Confirmando..." : "Confirmar carga definitiva"}
            </button>
          </div>
        )}
        {columnas.length > 0 && (
          <ColumnasExcel columnas={columnas} seleccionadas={seleccionadas}
            catalogo={catalogo} editable={esAdmin} onChange={alternarColumna} />
        )}
        {resultado && (
          <div className="ce-exito" role="status"><CheckCircle2 size={18} />
            {resultado.repetida ? "El archivo ya estaba cargado." : "Carga confirmada. Revisa el dashboard."}
            {resultado.recalculo?.ok === false && <span>El recálculo quedó pendiente. No vuelvas a enviar el archivo.</span>}
          </div>
        )}
      </section>

      {/* 2. ADMINISTRAR ESTACIONES */}
      <section className="ce-bloque" aria-label="Administrar estaciones">
        <div className="ce-titulo"><Trash2 size={18} /><h3>Administrar estaciones</h3></div>
        <p className="ce-ayuda">Puedes ocultar una estación del dashboard sin borrar sus datos históricos. Solo un administrador puede hacerlo.</p>
        <div className="ce-eliminar-grid">
          <label className="ce-campo"><span>Estación que deseas desactivar</span>
            <SelectorVigno value={estacionDesactivar} onChange={(e) => { setEstacionDesactivar(e.target.value); setConfirmacion(""); setMensajeEstacion(null); }}>
              <option value="">Seleccionar estación</option>{opciones}
            </SelectorVigno>
          </label>
          {seleccionada && <label className="ce-campo"><span>Escribe «{nombreSeleccionado}» para confirmar</span>
            <input type="text" autoComplete="off" value={confirmacion} placeholder="Nombre exacto de la estación"
              onChange={(e) => setConfirmacion(e.target.value)} />
          </label>}
        </div>
        {!accesoOk && <p className="ce-ayuda">Inicia sesión en Vigno con tu cuenta para administrar estaciones.</p>}
        {accesoOk && !esAdmin && <p className="ce-eliminar-error">Solo un administrador puede desactivar estaciones.</p>}
        <button className="ce-boton ce-boton-peligro" type="button" disabled={!puedeDesactivar} onClick={desactivarEstacion}>
          <Trash2 size={16} /> {cargando ? "Desactivando..." : "Desactivar estación"}
        </button>
        {mensajeEstacion && <p role="status" className={mensajeEstacion.error ? "ce-eliminar-error" : "ce-exito"}>{mensajeEstacion.texto}</p>}
        <EditarEstaciones accesoOk={accesoOk} rol={rol} actualizacion={actualizacion}
          actualizar={({ accion, codigo }) => {
            if (accion === "reactivar") setInactivas((actuales) => actuales.filter((id) => id !== codigo));
            pedirApi("/v1/estaciones").then((datos) => setEstacionesApi(comoLista(datos)))
              .catch((e) => setMensajeEstacion({ error: true, texto: e.message }));
            setActualizacion((n) => n + 1);
            onCargaConfirmada?.();
          }} />
      </section>

      {/* 3. HISTORIAL */}
      <section className="ce-bloque">
        <div className="ce-titulo ce-historial-titulo"><FileSpreadsheet size={18} /><h3>Historial de cargas</h3></div>
        <div className="ce-historial-filtros">
          <label className="ce-campo"><span>Filtrar por estación</span>
            <SelectorVigno value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Todas las estaciones</option>{opciones}
            </SelectorVigno>
          </label>
          <button className="ce-boton ce-secundario" type="button" disabled={!accesoOk || cargandoHistorial} onClick={() => setActualizacion((n) => n + 1)}>
            <RefreshCcw size={15} /> Actualizar
          </button>
          {cantidadOcultas > 0 && (
            <button className="ce-boton ce-secundario" type="button" onClick={() => setMostrarOcultas((actual) => !actual)}>
              {mostrarOcultas ? "Ocultar deshechas" : `Ver deshechas (${cantidadOcultas})`}
            </button>
          )}
        </div>
        {!accesoOk && <p className="ce-mensaje">Inicia sesión en Vigno para consultar las cargas registradas.</p>}
        {cargandoHistorial && <p className="ce-mensaje" role="status">Consultando cargas...</p>}
        {errorHistorial && <p className="ce-eliminar-error" role="alert">{errorHistorial}</p>}
        {accesoOk && !cargandoHistorial && !errorHistorial && (
          cargasVisibles.length ? (
            <div className="ce-tabla-contenedor ce-historial-scroll" role="region" aria-label="Historial de cargas desplazable" tabIndex={0}>
              <table className="ce-historial">
                <thead><tr><th>Estación</th><th>Archivo</th><th>Fecha y hora</th><th>Estado</th><th>Aceptadas</th><th>Rechazadas</th><th>Columnas</th></tr></thead>
                <tbody>{cargasVisibles.map((c, i) => (
                  <tr key={c.id ?? i}>
                    <td>{texto(nombreCarga(c))}{cargaDeshecha(c) && <span> (deshecha)</span>}</td><td>{texto(c.archivo ?? c.nombre_archivo)}</td>
                    <td className="ce-fecha-chile">{fechaChile(c.fecha_carga ?? c.fecha_ejecucion ?? c.creado_en ?? c.fecha)}</td>
                    <td>{texto(c.estado ?? c.status)}</td>
                    <td>{texto(c.filas?.aceptadas ?? c.filas_aceptadas ?? c.aceptadas)}</td>
                    <td>{texto(c.filas?.rechazadas ?? c.filas_rechazadas ?? c.rechazadas)}</td>
                    <td><button type="button" className="ce-boton ce-secundario"
                      onClick={() => abrirColumnas(c)} disabled={guardandoColumnas}>Ver / editar</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            ) : <p className="ce-mensaje">
              {cantidadOcultas && !mostrarOcultas
                ? "No hay cargas activas visibles. Usa «Ver deshechas» para revisar las excluidas."
                : filtro ? "No hay cargas de esta estación en esta vista." : "No hay cargas registradas en esta vista."}
            </p>
        )}
        {mensajeColumnas && <p className={mensajeColumnas.startsWith("No se pudo") ? "ce-eliminar-error" : "ce-mensaje"}
          role={mensajeColumnas.startsWith("No se pudo") ? "alert" : "status"}>{mensajeColumnas}</p>}
        {detalleCarga && (
          <div className="ce-detalle-carga">
            <h4>Columnas de {texto(detalleCarga.archivo)} (carga #{detalleCarga.id})</h4>
            <p className="ce-ayuda">Desmarcar una columna excluye su aporte de los cálculos; no borra el archivo ni sus datos originales.</p>
            {columnasDetalle.length ? (
              <ColumnasExcel columnas={columnasDetalle} seleccionadas={incluidasDetalle}
                catalogo={catalogo} editable={esAdmin} permitirVacio
                onChange={(variable) => setExcluidas((actual) => actual.includes(variable)
                  ? actual.filter((item) => item !== variable) : [...actual, variable])} />
            ) : <p className="ce-ayuda">Esta carga no tiene información de columnas disponible.</p>}
            {esAdmin && columnasDetalle.length > 0 && (
              <div className="ce-acciones-detalle">
                <button type="button" className="ce-boton ce-boton-peligro"
                  disabled={guardandoColumnas || !incluidasDetalle.length} onClick={deshacerCarga}>
                  <Trash2 size={16} /> {guardandoColumnas ? "Procesando..." : "Deshacer carga"}
                </button>
                <button type="button" className="ce-boton ce-secundario" disabled={guardandoColumnas}
                  onClick={() => setExcluidas([])}>Incluir todas</button>
              </div>
            )}
            {esAdmin && columnasDetalle.length > 0 && incluidasDetalle.length === 0 && !seleccionCambio && (
              <p className="ce-ayuda">Esta carga está deshecha: sus variables están excluidas. Puedes reincorporar el Excel original con «Incluir todas» y «Guardar selección», o elegir un archivo corregido.</p>
            )}
            <div className="ce-acciones-detalle">
              {esAdmin && columnasDetalle.length > 0 && incluidasDetalle.length === 0 && !seleccionCambio && (
                <button type="button" className="ce-boton ce-secundario" disabled={guardandoColumnas} onClick={cargarCorreccion}>
                  <UploadCloud size={16} /> Subir Excel corregido
                </button>
              )}
              <button type="button" className="ce-boton ce-primario" disabled={!esAdmin || !columnasDetalle.length || !seleccionCambio || guardandoColumnas}
                onClick={guardarColumnas}>Guardar selección</button>
              <button type="button" className="ce-boton ce-secundario" onClick={() => { setDetalleCarga(null); setMensajeColumnas(""); }}>Cerrar</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
