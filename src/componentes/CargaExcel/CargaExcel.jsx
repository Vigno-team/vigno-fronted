import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, KeyRound, PlusCircle, RefreshCcw, Trash2, UploadCloud } from "lucide-react";
import SelectorVigno from "../SelectorVigno/SelectorVigno";
import { prevalidarExcel, confirmarExcel, obtenerHistorialCargas, registrarEstacion, eliminarEstacion } from "../../services/cargasApi";
import { loginRequest } from "../../services/authService";
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
  const { usuario } = useAuth();
  const inputArchivo = useRef(null);

  // 1. Estados: acceso, estaciones, Excel, historial y desactivación.
  const [password, setPassword] = useState("");
  const [accesoOk, setAccesoOk] = useState(false);
  const [rol, setRol] = useState("");
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
  const [filtro, setFiltro] = useState("");
  const [actualizacion, setActualizacion] = useState(0);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [estacionDesactivar, setEstacionDesactivar] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mensajeEstacion, setMensajeEstacion] = useState(null);

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
  const detallesError = error?.detalles?.errores ?? error?.detalles?.rechazos ?? error?.detalles;

  const nombreFiltro = disponibles.find((e) => e.codigo === filtro)?.nombre;
  const cargasVisibles = historial.filter((c) => !filtro || [filtro, nombreFiltro].some(
    (nombre) => nombre && normalizar(nombre) === normalizar(nombreCarga(c))
  )).sort((a, b) => (b.fecha_carga ?? "").localeCompare(a.fecha_carga ?? "") || (b.id ?? 0) - (a.id ?? 0));

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
    prevalidarExcel(archivo, estacionDestino, control.signal)
      .then((datos) => {
        if (control.signal.aborted) return;
        if (datos?.valido === false) setError({ mensaje: "El Excel contiene errores.", detalles: datos });
        else setValidacion({ archivo, estacion: estacionDestino, respuesta: datos });
      })
      .catch((e) => {
        if (e.name !== "AbortError" && !control.signal.aborted)
          setError({ mensaje: e.message, status: e.status, detalles: e.respuesta });
      });
    return () => control.abort();
  }, [archivo, estacionDestino, accesoOk]);

  // 4. Acciones que realiza el usuario.
  async function verificarAcceso() {
    setCargando(true);
    setError(null);
    try {
      const sesion = await loginRequest(usuario?.email, password);
      sessionStorage.setItem("access", sesion.access);
      if (sesion.refresh) sessionStorage.setItem("refresh", sesion.refresh);
      setAccesoOk(true);
      setRol(sesion.usuario?.rol ?? "");
      setPassword("");
    } catch (e) {
      setError({ mensaje: e.message });
    } finally {
      setCargando(false);
    }
  }

  function cerrarAcceso() {
    setAccesoOk(false);
    setRol("");
    setPassword("");
    setHistorial([]);
    setValidacion(null);
    // Solo cierra la verificación de esta pantalla; no cierra sesión global en Vigno.
  }

  function cambiarEstacion(codigo) {
    setEstacionDestino(codigo);
    if (codigo !== "nueva") setFiltro(codigo);
    setValidacion(null);
    setResultado(null);
    setError(null);
  }

  function elegirArchivo(file) {
    if (!file) return;
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
    setError(null);
    if (!/\.(xlsx|xls)$/i.test(file.name) || file.size > 20 * 1024 * 1024) {
      setError({ mensaje: "Selecciona un Excel .xlsx o .xls de máximo 20 MB." });
      return;
    }
    setArchivo(file);
    if (inputArchivo.current) inputArchivo.current.value = "";
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
    if (!accesoOk || !validacion || validacion.archivo !== archivo || validacion.estacion !== estacionDestino) return;
    setCargando(true);
    setError(null);
    try {
      const datos = await confirmarExcel(archivo, estacionDestino);
      setResultado(datos ?? {});
      setArchivo(null);
      setValidacion(null);
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
      {/* 1. VERIFICAR ACCESO */}
      <section className="ce-bloque">
        <div className="ce-titulo"><KeyRound size={18} /><h3>Verificar acceso a cargas</h3></div>
        <div className="ce-acceso">
          <label className="ce-campo ce-clave"><span>Contraseña de tu cuenta Vigno</span>
            <input type="password" value={password} autoComplete="current-password" placeholder="Confirma tu contraseña" onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="ce-boton ce-primario" type="button" disabled={!password.trim() || cargando} onClick={verificarAcceso}>
            <KeyRound size={16} /> {cargando ? "Verificando..." : "Verificar acceso"}
          </button>
          <button className="ce-boton ce-secundario" type="button" onClick={cerrarAcceso}><Trash2 size={16} /> Cerrar acceso a cargas</button>
        </div>
      </section>

      {/* 2. SUBIR EXCEL */}
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
        {archivo && !accesoOk && <p className="ce-mensaje">Confirma tu contraseña para iniciar la prevalidación.</p>}
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
            {resumen.aceptadas == null && resumen.rechazadas == null && <p>Revisa el resumen antes de confirmar.</p>}
            <button className="ce-boton ce-primario" type="button" onClick={confirmarCarga} disabled={cargando || validando || !accesoOk || !(Number(resumen.aceptadas) > 0)}>
              <UploadCloud size={16} /> {cargando ? "Confirmando..." : "Confirmar carga definitiva"}
            </button>
          </div>
        )}
        {resultado && (
          <div className="ce-exito" role="status"><CheckCircle2 size={18} />
            {resultado.repetida ? "El archivo ya estaba cargado." : "Carga confirmada. Revisa el dashboard."}
            {resultado.recalculo?.ok === false && <span>El recálculo quedó pendiente. No vuelvas a enviar el archivo.</span>}
          </div>
        )}
      </section>

      {/* 3. DESACTIVAR ESTACIÓN */}
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
        {!accesoOk && <p className="ce-ayuda">Primero verifica tu contraseña en «Acceso a cargas».</p>}
        {accesoOk && !esAdmin && <p className="ce-eliminar-error">Solo un administrador puede desactivar estaciones.</p>}
        <button className="ce-boton ce-boton-peligro" type="button" disabled={!puedeDesactivar} onClick={desactivarEstacion}>
          <Trash2 size={16} /> {cargando ? "Desactivando..." : "Desactivar estación"}
        </button>
        {mensajeEstacion && <p role="status" className={mensajeEstacion.error ? "ce-eliminar-error" : "ce-exito"}>{mensajeEstacion.texto}</p>}
      </section>

      {/* 4. HISTORIAL */}
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
        </div>
        {!accesoOk && <p className="ce-mensaje">Verifica tu contraseña para consultar las cargas registradas.</p>}
        {cargandoHistorial && <p className="ce-mensaje" role="status">Consultando cargas...</p>}
        {errorHistorial && <p className="ce-eliminar-error" role="alert">{errorHistorial}</p>}
        {accesoOk && !cargandoHistorial && !errorHistorial && (
          cargasVisibles.length ? (
            <div className="ce-tabla-contenedor ce-historial-scroll" role="region" aria-label="Historial de cargas desplazable" tabIndex={0}>
              <table className="ce-historial">
                <thead><tr><th>Estación</th><th>Archivo</th><th>Fecha y hora</th><th>Estado</th><th>Aceptadas</th><th>Rechazadas</th></tr></thead>
                <tbody>{cargasVisibles.map((c, i) => (
                  <tr key={c.id ?? i}>
                    <td>{texto(nombreCarga(c))}</td><td>{texto(c.archivo ?? c.nombre_archivo)}</td>
                    <td className="ce-fecha-chile">{fechaChile(c.fecha_carga ?? c.fecha_ejecucion ?? c.creado_en ?? c.fecha)}</td>
                    <td>{texto(c.estado ?? c.status)}</td>
                    <td>{texto(c.filas?.aceptadas ?? c.filas_aceptadas ?? c.aceptadas)}</td>
                    <td>{texto(c.filas?.rechazadas ?? c.filas_rechazadas ?? c.rechazadas)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="ce-mensaje">{filtro ? "No hay cargas de esta estación entre las recibidas." : "No hay cargas registradas."}</p>
        )}
      </section>
    </div>
  );
}
