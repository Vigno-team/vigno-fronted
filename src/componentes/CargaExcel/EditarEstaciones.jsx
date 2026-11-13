import { useEffect, useState } from "react";
import SelectorVigno from "../SelectorVigno/SelectorVigno";
import { editarEstacion, obtenerEstaciones, reactivarEstacion } from "../../services/cargasApi";

// Edición y reactivación: no cambia ni elimina mediciones históricas.
export default function EditarEstaciones({ accesoOk, rol, actualizacion, actualizar }) {
  const [estaciones, setEstaciones] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [formulario, setFormulario] = useState(null);
  const [esperando, setEsperando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const puedeEditar = accesoOk && ["editor", "administrador"].includes(rol);
  const esAdmin = accesoOk && rol === "administrador";

  async function recargar() {
    if (!accesoOk) return;
    try {
      setEstaciones(await obtenerEstaciones(esAdmin));
    } catch (error) {
      setMensaje(error.message);
    }
  }

  useEffect(() => {
    if (!accesoOk) return;
    let activo = true;
    obtenerEstaciones(esAdmin)
      .then((datos) => { if (activo) setEstaciones(datos); })
      .catch((error) => { if (activo) setMensaje(error.message); });
    return () => { activo = false; };
  }, [accesoOk, esAdmin, actualizacion]);

  function elegir(codigoNuevo) {
    setCodigo(codigoNuevo);
    const estacion = estaciones.find((item) => String(item.id ?? item.codigo) === codigoNuevo);
    setFormulario(estacion ? {
      nombre: estacion.nombre ?? "", subzona: estacion.subzona ?? "",
      latitud: estacion.latitud ?? "", longitud: estacion.longitud ?? "",
    } : null);
    setMensaje("");
  }

  async function ejecutar(accion) {
    setEsperando(true);
    setMensaje("");
    try {
      let respuesta;
      if (accion === "editar") {
        const latitud = Number(formulario.latitud);
        const longitud = Number(formulario.longitud);
        if (!formulario.nombre.trim() || formulario.latitud === "" || formulario.longitud === "" ||
            !Number.isFinite(latitud) || !Number.isFinite(longitud)) {
          throw new Error("Indica un nombre y coordenadas válidas.");
        }
        respuesta = await editarEstacion(codigo, {
          nombre: formulario.nombre.trim(), subzona: formulario.subzona,
          latitud, longitud,
        });
      } else {
        respuesta = await reactivarEstacion(codigo);
      }
      setMensaje(respuesta?.recalculo?.ok === false
        ? "Cambio guardado; el recálculo está pendiente. No repitas la operación."
        : accion === "editar" ? "Estación actualizada." : "Estación reactivada.");
      if (accion === "editar") {
        setFormulario({ nombre: respuesta.nombre ?? formulario.nombre,
          subzona: respuesta.subzona ?? "", latitud: respuesta.latitud ?? "",
          longitud: respuesta.longitud ?? "" });
      }
      await recargar();
      actualizar?.({ accion, codigo });
    } catch (error) {
      setMensaje(error.message);
    } finally {
      setEsperando(false);
    }
  }

  const estacionActual = estaciones.find((item) => String(item.id ?? item.codigo) === codigo);

  return (
    <div className="ce-editar-estaciones">
      <h4>Editar o reactivar estaciones</h4>
      <p className="ce-ayuda">Los editores pueden modificar una estación; solo los administradores pueden reactivarla.</p>
      <label className="ce-campo"><span>Estación</span>
        <SelectorVigno value={codigo} disabled={!puedeEditar} onChange={(e) => elegir(e.target.value)}>
          <option value="">Seleccionar estación</option>
          {estaciones.map((e) => <option key={e.id ?? e.codigo} value={e.id ?? e.codigo}>
            {e.nombre}{e.activa === false ? " (inactiva)" : ""}
          </option>)}
        </SelectorVigno>
      </label>
      {accesoOk && formulario && estacionActual?.activa !== false && (
        <div className="ce-campos-grid">
          {[["nombre", "Nombre"], ["subzona", "Subzona"], ["latitud", "Latitud"], ["longitud", "Longitud"]].map(([clave, titulo]) => (
            <label key={clave} className="ce-campo"><span>{titulo}</span>
              <input type={clave === "latitud" || clave === "longitud" ? "number" : "text"} step="any"
                value={formulario[clave]} onChange={(e) => setFormulario({ ...formulario, [clave]: e.target.value })} />
            </label>
          ))}
          <button className="ce-boton ce-primario" type="button" disabled={!puedeEditar || esperando}
            onClick={() => ejecutar("editar")}>Guardar cambios</button>
        </div>
      )}
      {accesoOk && formulario && estacionActual?.activa === false && (
        <button className="ce-boton ce-primario" type="button" disabled={!esAdmin || esperando}
          onClick={() => ejecutar("reactivar")}>Reactivar estación</button>
      )}
      {mensaje && <p className="ce-mensaje" role="status">{mensaje}</p>}
    </div>
  );
}
