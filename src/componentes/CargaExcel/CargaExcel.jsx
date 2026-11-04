import SelectorVigno from "../SelectorVigno/SelectorVigno";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud, KeyRound, RefreshCcw, CheckCircle2, AlertTriangle, PlusCircle, Trash2 } from "lucide-react";
import {
  borrarClaveSesion, guardarClaveSesion, leerClaveSesion,
  prevalidarExcel, confirmarExcel, obtenerHistorialCargas, registrarEstacion,
} from "../../services/cargasApi";
import "./CargaExcel.css";

const ES_EXCEL = /\.(xlsx|xls)$/i;
const comoLista = (respuesta) => Array.isArray(respuesta) ? respuesta
  : Array.isArray(respuesta?.results) ? respuesta.results
  : Array.isArray(respuesta?.cargas) ? respuesta.cargas : [];
const texto = (valor) => valor === null || valor === undefined || valor === "" ? "—" : String(valor);
const esNumero = (v) => typeof v === "number" && Number.isFinite(v);

function resumenValidacion(datos) {
  const r = datos?.resumen ?? datos?.resultado ?? datos ?? {};
  const leidas = r.filas_leidas ?? r.total_filas ?? r.total ?? null;
  const aceptadas = r.filas_aceptadas ?? r.aceptadas ?? r.filas_validas ?? null;
  const rechazadas = r.filas_rechazadas ?? r.rechazadas ?? r.filas_invalidas ?? null;
  return { leidas, aceptadas, rechazadas, detalles: r.motivos_rechazo ?? r.errores ?? datos?.errores ?? [] };
}

function desglosarErrores(objeto) {
  const lineas = [];
  const recorrer = (valor, ruta = "") => {
    if (valor === null || valor === undefined) return;
    if (typeof valor === "string" || typeof valor === "number") {
      lineas.push(`${ruta ? `${ruta}: ` : ""}${valor}`);return;
    }
    if (Array.isArray(valor)) { valor.forEach((v, i) => recorrer(v, `${ruta}${ruta ? "." : ""}${i + 1}`));return; }
    if (typeof valor === "object") Object.entries(valor).forEach(([k,v]) => recorrer(v, ruta ? `${ruta}.${k}` : k));
  };
  recorrer(objeto);
  return lineas;
}

function CargaExcel({ estaciones = [], onCargaConfirmada }) {
  const [clave, setClave] = useState(leerClaveSesion);
  const [claveEntrada, setClaveEntrada] = useState(leerClaveSesion);
  const [estacionesLocales, setEstacionesLocales] = useState([]);
  const [destino, setDestino] = useState("");
  const [nueva, setNueva] = useState({ nombre: "", latitud: "", longitud: "", subzona: "" });
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [validando, setValidando] = useState(false);
  const [validacion, setValidacion] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [fallo, setFallo] = useState(null);
  const [operando, setOperando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [falloHistorial, setFalloHistorial] = useState("");
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const inputArchivo = useRef(null);

  const disponibles = useMemo(() => {
    const mapa = new Map();
    [...estaciones, ...estacionesLocales].forEach((estacion) => {
      const codigo = estacion.codigo ?? estacion.id;
      if (codigo !== null && codigo !== undefined) mapa.set(String(codigo), { ...estacion, codigo: String(codigo) });
    });
    return [...mapa.values()];
  }, [estaciones, estacionesLocales]);

  const aplicarClave = () => {
    guardarClaveSesion(claveEntrada);
    setClave(claveEntrada);
    setValidacion(null);
    setResultado(null);
    setFallo(null);
  };

  const actualizarHistorial = async (signal) => {
    if (!clave.trim()) { setHistorial([]); setFalloHistorial("Ingresa la clave administrador para consultar el historial."); return; }
    setCargandoHistorial(true);
    setFalloHistorial("");
    try { const res = await obtenerHistorialCargas(clave, signal); if (!signal?.aborted) setHistorial(comoLista(res)); }
    catch (err) { if (err.name !== "AbortError" && !signal?.aborted) setFalloHistorial(err.message); }
    finally { if (!signal?.aborted) setCargandoHistorial(false); }
  };

  useEffect(() => {
    if (!clave.trim()) return;
    const controlador = new AbortController();
    obtenerHistorialCargas(clave, controlador.signal)
      .then((res) => { if (!controlador.signal.aborted) { setHistorial(comoLista(res)); setFalloHistorial(""); } })
      .catch((err) => { if (err.name !== "AbortError" && !controlador.signal.aborted) setFalloHistorial(err.message); });
    return () => controlador.abort();
  }, [clave]);

  useEffect(() => {
    setValidacion(null);
    setResultado(null);
    setFallo(null);
    if (!archivo || !destino || destino === "nueva" || !clave.trim()) {
      setValidando(false);
      return;
    }
    const controlador = new AbortController();
    setValidando(true);
    prevalidarExcel(archivo, destino, clave, controlador.signal)
      .then((respuesta) => {
        if (!controlador.signal.aborted) setValidacion({ archivo, destino, clave, respuesta });
      })
      .catch((err) => {
        if (!controlador.signal.aborted && err.name !== "AbortError") {
          setFallo({ mensaje: err.message, status: err.status, detalles: err.respuesta });
        }
      })
      .finally(() => { if (!controlador.signal.aborted) setValidando(false); });
    return () => controlador.abort();
  }, [archivo, destino, clave]);

  const elegirArchivo = (file) => {
    if (!file) return;
    setValidacion(null);setResultado(null);setFallo(null);
    if (!ES_EXCEL.test(file.name)) {
      setArchivo(null);setFallo({ mensaje: "Selecciona un archivo .xlsx o .xls." });return;
    }
    setArchivo(file);
    if (inputArchivo.current) inputArchivo.current.value = "";
  };

  const crear = async (e) => {
    e.preventDefault();
    const lat = Number(nueva.latitud), lon = Number(nueva.longitud);
    if (!nueva.nombre.trim() || nueva.latitud === "" || nueva.longitud === "" ||
        !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -56 || lat > -17 || lon < -76 || lon > -66) {
      setFallo({ mensaje: "Ingresa un nombre y coordenadas válidas dentro de Chile." });return;
    }
    setOperando(true);setFallo(null);
    try {
      const res = await registrarEstacion({
        nombre: nueva.nombre.trim(), latitud: lat, longitud: lon,
        ...(nueva.subzona.trim() ? { subzona: nueva.subzona.trim() } : {}),
      }, clave);
      const codigo = res?.codigo ?? res?.id ?? res?.estacion?.codigo ?? res?.estacion?.id;
      if (codigo == null) throw new Error("La estación fue creada, pero no llegó su código. Actualiza el catálogo antes de continuar.");
      setEstacionesLocales((anterior) => [...anterior, { ...nueva, ...res, id: String(codigo), codigo: String(codigo) }]);
      setDestino(String(codigo));setNueva({ nombre: "", latitud: "", longitud: "", subzona: "" });
      // La estación nueva ya queda disponible en el selector local.
    } catch (err) { setFallo({ mensaje: err.message, status: err.status, detalles: err.respuesta }); }
    finally { setOperando(false); }
  };

  const confirmar = async () => {
    if (!validacion || validacion.archivo !== archivo || validacion.destino !== destino || validacion.clave !== clave) return;
    setOperando(true);setFallo(null);setResultado(null);
    try {
      const res = await confirmarExcel(archivo, destino, clave);
      setResultado(res ?? { detail: "Carga confirmada." });
      setArchivo(null);setValidacion(null);
      if (inputArchivo.current) inputArchivo.current.value = "";
      await actualizarHistorial();
    } catch (err) { setFallo({ mensaje: err.message, status: err.status, detalles: err.respuesta }); }
    finally { setOperando(false); }
  };

  const resumen = validacion ? resumenValidacion(validacion.respuesta) : null;
  const errores = fallo?.detalles ? desglosarErrores(fallo.detalles) : [];
  const detallesValidacion = resumen ? desglosarErrores(resumen.detalles) : [];

  return (
    <div className="ce-panel">
      <div className="ce-bloque">
        <div className="ce-titulo"><KeyRound size={18} /><h3>Acceso de administrador</h3></div>
        <div className="ce-acceso">
          <label className="ce-campo ce-clave"><span>Clave administrador (solo durante esta sesión)</span>
            <input type="password" value={claveEntrada} autoComplete="off" placeholder="Ingresa la clave administrador"
              onChange={(e) => setClaveEntrada(e.target.value)} />
          </label>
          <button className="ce-boton ce-primario" type="button" onClick={aplicarClave}
            disabled={!claveEntrada.trim() || claveEntrada === clave}><KeyRound size={16} /> Usar clave</button>
          <button className="ce-boton ce-secundario" type="button" onClick={() => {
            borrarClaveSesion();setClave("");setClaveEntrada("");setHistorial([]);setValidacion(null);
          }}><Trash2 size={16} /> Borrar clave</button>
        </div>
      </div>

      <div className="ce-bloque">
        <div className="ce-titulo"><FileSpreadsheet size={18} /><h3>Subir planilla meteorológica</h3></div>
        <label className="ce-campo"><span>Estación de destino</span>
          <SelectorVigno value={destino} onChange={(e) => setDestino(e.target.value)}>
            <option value="">Seleccionar estación</option>
            {disponibles.map((estacion) => <option key={estacion.codigo} value={estacion.codigo}>
              {estacion.nombre || estacion.codigo}
            </option>)}
            <option value="nueva">+ Crear localidad nueva</option>
          </SelectorVigno>
        </label>

        {destino === "nueva" && (
          <form className="ce-formulario" onSubmit={crear}>
            <h4><PlusCircle size={16} /> Nueva localidad</h4>
            <div className="ce-campos-grid">
              <label className="ce-campo"><span>Nombre *</span><input required value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} /></label>
              <label className="ce-campo"><span>Subzona (opcional)</span><input value={nueva.subzona} onChange={(e) => setNueva({ ...nueva, subzona: e.target.value })} /></label>
              <label className="ce-campo"><span>Latitud *</span><input type="number" step="any" required placeholder="-35.5" value={nueva.latitud} onChange={(e) => setNueva({ ...nueva, latitud: e.target.value })} /></label>
              <label className="ce-campo"><span>Longitud *</span><input type="number" step="any" required placeholder="-71.6" value={nueva.longitud} onChange={(e) => setNueva({ ...nueva, longitud: e.target.value })} /></label>
            </div>
            <button className="ce-boton ce-primario" type="submit" disabled={operando || !clave.trim()}>
              <PlusCircle size={16} /> {operando ? "Creando..." : "Crear localidad"}
            </button>
          </form>
        )}

        <div className={`ce-dropzone ${arrastrando ? "ce-arrastrando" : ""}`}
          role="button" tabIndex={0} aria-label="Seleccionar o arrastrar archivo Excel"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault();inputArchivo.current?.click(); } }}
          onDragEnter={(e) => { e.preventDefault();setArrastrando(true); }}
          onDragOver={(e) => { e.preventDefault();setArrastrando(true); }}
          onDragLeave={(e) => { e.preventDefault();setArrastrando(false); }}
          onDrop={(e) => { e.preventDefault();setArrastrando(false);elegirArchivo(e.dataTransfer.files?.[0]); }}
          onClick={() => inputArchivo.current?.click()}
        >
          <UploadCloud size={29} aria-hidden="true" />
          <strong>{archivo ? archivo.name : "Arrastra tu Excel o haz clic para seleccionarlo"}</strong>
          <span>Solo archivos .xlsx y .xls · la estructura se comprueba en el servidor</span>
          <input ref={inputArchivo} type="file" accept=".xlsx,.xls" className="ce-archivo-oculto"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => elegirArchivo(e.target.files?.[0])} />
        </div>

        {archivo && !clave.trim() && <p className="ce-mensaje">Ingresa la clave y pulsa «Usar clave» para iniciar la prevalidación.</p>}
        {archivo && !destino && <p className="ce-mensaje">Selecciona una estación para prevalidar.</p>}
        {validando && <p className="ce-mensaje" role="status">Validando estructura del Excel en el backend...</p>}
        {fallo && <div className="ce-error" role="alert">
          <strong><AlertTriangle size={16} /> {fallo.status === 422 ? "Error de estructura (422)" : "No se pudo completar la operación"}</strong>
          <p>{fallo.mensaje}</p>
          {errores.length > 0 && <ul>{errores.map((linea,i) => <li key={i}>{linea}</li>)}</ul>}
        </div>}
        {resumen && <div className="ce-validacion" role="status">
          <strong><CheckCircle2 size={17} /> Prevalidación completada </strong>
          <table><thead><tr><th>Filas leídas</th><th>Aceptadas</th><th>Rechazadas</th></tr></thead>
          <tbody><tr><td>{texto(resumen.leidas)}</td><td>{texto(resumen.aceptadas)}</td><td>{texto(resumen.rechazadas)}</td></tr></tbody></table>
          {detallesValidacion.length > 0 && <details><summary>Motivos y observaciones</summary><ul>{detallesValidacion.map((linea,i) => <li key={i}>{linea}</li>)}</ul></details>}
          {!esNumero(resumen.aceptadas) && !esNumero(resumen.rechazadas) &&
            <p>El servidor no devolvió un conteo estándar. Revisa el resumen antes de confirmar.</p>}
          <button className="ce-boton ce-primario" type="button" onClick={confirmar} disabled={operando || validando}>
            <UploadCloud size={16} /> {operando ? "Confirmando..." : "Confirmar carga definitiva"}
          </button>
        </div>}
        {resultado && <div className="ce-exito" role="status">
          <CheckCircle2 size={18} /> Carga confirmada . Si los gráficos aún no cambian, el servidor podría necesitar recalcular sus resultados.
          {onCargaConfirmada && <button className="ce-boton ce-secundario" type="button" onClick={onCargaConfirmada}>Actualizar datos de Vigno</button>}
        </div>}
      </div>

      <div className="ce-bloque">
        <div className="ce-titulo ce-historial-titulo"><FileSpreadsheet size={18} /><h3>Historial de cargas</h3>
          <button type="button" className="ce-boton ce-secundario" disabled={cargandoHistorial}
            onClick={() => actualizarHistorial()}><RefreshCcw size={15} /> Actualizar</button>
        </div>
        {falloHistorial && <p className="ce-mensaje" role="status">{falloHistorial}</p>}
        <div className="ce-tabla-contenedor"><table className="ce-historial"><thead>
          <tr><th>Archivo</th><th>Estación</th><th>Fecha</th><th>Estado</th><th>Aceptadas</th><th>Rechazadas</th></tr>
        </thead><tbody>
          {historial.map((item,i) => <tr key={item.id ?? i}>
            <td>{texto(item.archivo ?? item.nombre_archivo)}</td>
            <td>{texto(item.estacion?.nombre ?? item.estacion_nombre ?? item.estacion_codigo ?? item.estacion_id ?? item.estacion)}</td>
            <td>{texto(item.fecha_ejecucion ?? item.creado_en ?? item.creado ?? item.fecha)}</td>
            <td>{texto(item.estado ?? item.status)}</td>
            <td>{texto(item.filas_aceptadas ?? item.aceptadas)}</td>
            <td>{texto(item.filas_rechazadas ?? item.rechazadas)}</td>
          </tr>)}
        </tbody></table></div>
        {!historial.length && !cargandoHistorial && !falloHistorial && <p className="ce-mensaje">No hay cargas registradas.</p>}
      </div>
    </div>
  );
}

export default CargaExcel;
