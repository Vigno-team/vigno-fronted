
import { useEffect, useState } from "react";
import SelectorVigno from "../SelectorVigno/SelectorVigno";
import { editarEstacion, obtenerEstaciones, reactivarEstacion } from "../../services/cargasApi";

// componente que permite editar y reactivar estaciones sin borrar sus datos
export default function EditarEstaciones({ accesoOk, rol, actualizacion, actualizar }) {

  // guarda las estaciones y los datos del formulario
  const [estaciones, setEstaciones] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [formulario, setFormulario] = useState(null);
  const [esperando, setEsperando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // comprueba los permisos del usuario segun su rol
  const puedeEditar = accesoOk && ["editor", "administrador"].includes(rol);
  const esAdmin = accesoOk && rol === "administrador";

  // vuelve a consultar las estaciones desde el backend
  async function recargar() {
    if (!accesoOk) return;
    try {
      setEstaciones(await obtenerEstaciones(esAdmin));
    } catch (error) {
      setMensaje(error.message);
    }
  }

  // carga las estaciones cuando cambia el acceso, rol o actualizacion
  useEffect(() => {
    if (!accesoOk) return;
    let activo = true;

    obtenerEstaciones(esAdmin)
      .then((datos) => { if (activo) setEstaciones(datos); })
      .catch((error) => { if (activo) setMensaje(error.message); });

    // evita actualizar el estado si el efecto deja de estar activo
    return () => { activo = false; };
  }, [accesoOk, esAdmin, actualizacion]);

  // obtiene los datos de la estacion que selecciona el usuario
  function elegir(codigoNuevo) {
    setCodigo(codigoNuevo);

    const estacion = estaciones.find((item) => String(item.id ?? item.codigo) === codigoNuevo);

    // coloca los datos de la estacion dentro del formulario
    setFormulario(estacion ? {
      nombre: estacion.nombre ?? "", subzona: estacion.subzona ?? "",
      latitud: estacion.latitud ?? "", longitud: estacion.longitud ?? "",
    } : null);

    setMensaje("");
  }

  // ejecuta la edicion o reactivacion de una estacion
  async function ejecutar(accion) {
    setEsperando(true);
    setMensaje("");

    try {
      let respuesta;

      if (accion === "editar") {

        // convierte las coordenadas a numeros
        const latitud = Number(formulario.latitud);
        const longitud = Number(formulario.longitud);

        // comprueba que el nombre y las coordenadas sean validos
        if (!formulario.nombre.trim() || formulario.latitud === "" || formulario.longitud === "" ||
            !Number.isFinite(latitud) || !Number.isFinite(longitud)) {
          throw new Error("Indica un nombre y coordenadas válidas.");
        }

        // envia los cambios de la estacion al backend
        respuesta = await editarEstacion(codigo, {
          nombre: formulario.nombre.trim(), subzona: formulario.subzona,
          latitud, longitud,
        });

      } else {

        // solicita al backend reactivar la estacion
        respuesta = await reactivarEstacion(codigo);
      }

      // muestra un mensaje segun el resultado de la operacion
      setMensaje(respuesta?.recalculo?.ok === false
        ? "Cambio guardado; el recálculo está pendiente. No repitas la operación."
        : accion === "editar" ? "Estación actualizada." : "Estación reactivada.");

      // actualiza el formulario con los datos devueltos
      if (accion === "editar") {
        setFormulario({ nombre: respuesta.nombre ?? formulario.nombre,
          subzona: respuesta.subzona ?? "", latitud: respuesta.latitud ?? "",
          longitud: respuesta.longitud ?? "" });
      }

      // vuelve a cargar las estaciones y avisa al componente padre
      await recargar();
      actualizar?.({ accion, codigo });

    } catch (error) {

      // muestra el mensaje si ocurre un error
      setMensaje(error.message);

    } finally {

      // termina el estado de espera
      setEsperando(false);
    }
  }

  // busca la estacion que esta seleccionada actualmente
  const estacionActual = estaciones.find((item) => String(item.id ?? item.codigo) === codigo);

  return (
    <div className="ce-editar-estaciones">
      <h4>Editar o reactivar estaciones</h4>

      {/* permite elegir la estacion que se desea administrar */}
      <label className="ce-campo"><span>Estación</span>
        <SelectorVigno value={codigo} disabled={!puedeEditar} onChange={(e) => elegir(e.target.value)}>
          <option value="">Seleccionar estación</option>
          {estaciones.map((e) => <option key={e.id ?? e.codigo} value={e.id ?? e.codigo}>
            {e.nombre}{e.activa === false ? " (inactiva)" : ""}
          </option>)}
        </SelectorVigno>
      </label>

      {/* muestra el formulario si la estacion esta activa */}
      {accesoOk && formulario && estacionActual?.activa !== false && (
        <div className="ce-campos-grid">

          {/* crea los campos para modificar nombre, subzona y coordenadas */}
          {[["nombre", "Nombre"], ["subzona", "Subzona"], ["latitud", "Latitud"], ["longitud", "Longitud"]].map(([clave, titulo]) => (
            <label key={clave} className="ce-campo"><span>{titulo}</span>
              <input type={clave === "latitud" || clave === "longitud" ? "number" : "text"} step="any"
                value={formulario[clave]} onChange={(e) => setFormulario({ ...formulario, [clave]: e.target.value })} />
            </label>
          ))}

          {/* guarda los cambios cuando el usuario presiona el boton */}
          <button className="ce-boton ce-primario" type="button" disabled={!puedeEditar || esperando}
            onClick={() => ejecutar("editar")}>Guardar cambios</button>
        </div>
      )}

      {/* permite reactivar una estacion inactiva solo a un administrador */}
      {accesoOk && formulario && estacionActual?.activa === false && (
        <button className="ce-boton ce-primario" type="button" disabled={!esAdmin || esperando}
          onClick={() => ejecutar("reactivar")}>Reactivar estación</button>
      )}

      {/* muestra los mensajes de exito o error */}
      {mensaje && <p className="ce-mensaje" role="status">{mensaje}</p>}
    </div>
  );
}
