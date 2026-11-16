import { useEffect, useState } from "react";
import { Users, UserPlus, Edit3, KeyRound, UserCheck, UserX, X } from "lucide-react";
import {
  obtenerUsuarios,
  crearUsuario,
  editarUsuario,
  desactivarUsuario,
  restablecerClaveUsuario,
} from "../../services/usuariosApi";
import "./Usuarios.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState("");

  const [filtroRol, setFiltroRol] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("");

  const [modalActivo, setModalActivo] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre: "",
    email: "",
    rol: "lector",
    clave_temporal: "",
  });

  const cargarLista = async () => {
    setCargando(true);
    setErrorLista("");
    try {
      const lista = await obtenerUsuarios({
        rol: filtroRol,
        activo: filtroActivo,
      });
      setUsuarios(lista);
    } catch (error) {
      setErrorLista(error.message || "Error al cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLista();
  }, [filtroRol, filtroActivo]);

  const abrirModalCrear = () => {
    setUsuarioSeleccionado(null);
    setFormulario({
      nombre: "",
      email: "",
      rol: "lector",
      clave_temporal: "",
    });
    setErrorModal("");
    setModalActivo("crear");
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormulario({
      nombre: usuario.nombre || "",
      email: usuario.email || usuario.correo || "",
      rol: usuario.rol || "lector",
      clave_temporal: "",
    });
    setErrorModal("");
    setModalActivo("editar");
  };

  const abrirModalClave = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormulario({
      nombre: usuario.nombre || "",
      email: usuario.email || usuario.correo || "",
      rol: usuario.rol || "lector",
      clave_temporal: "",
    });
    setErrorModal("");
    setModalActivo("clave");
  };

  const abrirModalEstado = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setErrorModal("");
    setModalActivo("estado");
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalActivo(null);
    setUsuarioSeleccionado(null);
    setErrorModal("");
  };

  const cambiarCampo = (e) => {
    const { name, value } = e.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const manejarCrear = async (e) => {
    e.preventDefault();
    const nombreLimpio = formulario.nombre.trim();
    const emailLimpio = formulario.email.trim().toLowerCase();
    const clave = formulario.clave_temporal;

    if (!nombreLimpio || !emailLimpio || !clave) {
      setErrorModal("Por favor, completa todos los campos.");
      return;
    }
    if (!EMAIL_REGEX.test(emailLimpio)) {
      setErrorModal("El formato del correo no es válido.");
      return;
    }
    if (clave.length < 8) {
      setErrorModal("La clave temporal debe tener al menos 8 caracteres.");
      return;
    }

    setGuardando(true);
    setErrorModal("");
    try {
      await crearUsuario({
        nombre: nombreLimpio,
        email: emailLimpio,
        rol: formulario.rol,
        clave_temporal: clave,
      });
      setModalActivo(null);
      await cargarLista();
    } catch (error) {
      setErrorModal(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const manejarEditar = async (e) => {
    e.preventDefault();
    const nombreLimpio = formulario.nombre.trim();
    const emailLimpio = formulario.email.trim().toLowerCase();

    if (!nombreLimpio || !emailLimpio) {
      setErrorModal("El nombre y el correo son obligatorios.");
      return;
    }
    if (!EMAIL_REGEX.test(emailLimpio)) {
      setErrorModal("El formato del correo no es válido.");
      return;
    }

    setGuardando(true);
    setErrorModal("");
    try {
      await editarUsuario(usuarioSeleccionado.id, {
        nombre: nombreLimpio,
        email: emailLimpio,
        rol: formulario.rol,
      });
      setModalActivo(null);
      await cargarLista();
    } catch (error) {
      setErrorModal(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const manejarRestablecerClave = async (e) => {
    e.preventDefault();
    const clave = formulario.clave_temporal;

    if (!clave) {
      setErrorModal("Ingresa una nueva clave temporal.");
      return;
    }
    if (clave.length < 8) {
      setErrorModal("La clave temporal debe tener al menos 8 caracteres.");
      return;
    }

    setGuardando(true);
    setErrorModal("");
    try {
      await restablecerClaveUsuario(usuarioSeleccionado.id, clave);
      setModalActivo(null);
      await cargarLista();
    } catch (error) {
      setErrorModal(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambiarEstado = async () => {
    if (!usuarioSeleccionado) return;
    const estaActivo = usuarioSeleccionado.activo !== false;

    setGuardando(true);
    setErrorModal("");
    try {
      if (estaActivo) {
        await desactivarUsuario(usuarioSeleccionado.id);
      } else {
        await editarUsuario(usuarioSeleccionado.id, { activo: true });
      }
      setModalActivo(null);
      await cargarLista();
    } catch (error) {
      setErrorModal(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="usr-pagina">
      <header className="usr-cabecera">
        <div className="usr-titulo-bloque">
          <div className="usr-icono-principal">
            <Users size={23} strokeWidth={1.8} />
          </div>
          <div>
            <h1>Gestión de Usuarios</h1>
          </div>
        </div>
      </header>

      <div className="usr-barra-filtros">
        <div className="usr-filtro-grupo">
          <label htmlFor="filtro-rol">Filtrar por rol</label>
          <select
            id="filtro-rol"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="">Todos los roles</option>
            <option value="administrador">Administrador</option>
            <option value="editor">Editor</option>
            <option value="lector">Lector</option>
          </select>
        </div>

        <div className="usr-filtro-grupo">
          <label htmlFor="filtro-estado">Filtrar por estado</label>
          <select
            id="filtro-estado"
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>

        <button type="button" className="usr-btn-primario" onClick={abrirModalCrear}>
          <UserPlus size={18} />
          <span>+ Nuevo Usuario</span>
        </button>
      </div>

      {errorLista && (
        <div className="usr-alerta-error" role="alert">
          <span>{errorLista}</span>
          <button type="button" onClick={cargarLista}>
            Reintentar
          </button>
        </div>
      )}

      <div className="usr-tabla-contenedor">
        {cargando ? (
          <div className="usr-estado-vacio">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div className="usr-estado-vacio">No se encontraron usuarios con esos filtros.</div>
        ) : (
          <table className="usr-tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Cambio de clave</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const activo = u.activo !== false;
                const correo = u.email || u.correo || "";

                return (
                  <tr key={u.id} className={!activo ? "usr-fila-inactiva" : ""}>
                    <td className="usr-celda-nombre">{u.nombre}</td>
                    <td>{correo}</td>
                    <td>
                      <span className={"usr-badge usr-rol-" + u.rol}>
                        {u.rol}
                      </span>
                    </td>
                    <td>
                      <span className={"usr-badge " + (activo ? "usr-estado-activo" : "usr-estado-inactivo")}>
                        {activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <span className={"usr-badge " + (u.debe_cambiar_clave ? "usr-clave-pendiente" : "usr-clave-ok")}>
                        {u.debe_cambiar_clave ? "Pendiente" : "Al día"}
                      </span>
                    </td>
                    <td>
                      <div className="usr-acciones">
                        <button
                          type="button"
                          className="usr-btn-accion"
                          onClick={() => abrirModalEditar(u)}
                          title="Editar usuario"
                        >
                          <Edit3 size={15} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          className="usr-btn-accion"
                          onClick={() => abrirModalClave(u)}
                          title="Restablecer contraseña"
                        >
                          <KeyRound size={15} />
                          <span>Clave</span>
                        </button>

                        <button
                          type="button"
                          className={"usr-btn-accion " + (activo ? "usr-btn-peligro" : "usr-btn-activar")}
                          onClick={() => abrirModalEstado(u)}
                          title={activo ? "Desactivar usuario" : "Activar usuario"}
                        >
                          {activo ? <UserX size={15} /> : <UserCheck size={15} />}
                          <span>{activo ? "Desactivar" : "Activar"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalActivo && (
        <div className="usr-modal-fondo" onClick={cerrarModal}>
          <div className="usr-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <header className="usr-modal-cabecera">
              <h2>
                {modalActivo === "crear" && "Crear nuevo usuario"}
                {modalActivo === "editar" && "Editar usuario"}
                {modalActivo === "clave" && "Restablecer clave temporal"}
                {modalActivo === "estado" && (usuarioSeleccionado?.activo !== false ? "Desactivar usuario" : "Activar usuario")}
              </h2>
              <button type="button" className="usr-modal-cerrar" onClick={cerrarModal} aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>

            {errorModal && (
              <div className="usr-modal-error" role="alert">
                {errorModal}
              </div>
            )}

            {(modalActivo === "crear" || modalActivo === "editar") && (
              <form onSubmit={modalActivo === "crear" ? manejarCrear : manejarEditar} className="usr-formulario" noValidate>
                <div className="usr-campo">
                  <label htmlFor="usr-nombre">Nombre completo</label>
                  <input
                    id="usr-nombre"
                    name="nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={cambiarCampo}
                    placeholder="Ej: María González"
                    required
                  />
                </div>

                <div className="usr-campo">
                  <label htmlFor="usr-email">Correo electrónico</label>
                  <input
                    id="usr-email"
                    name="email"
                    type="email"
                    value={formulario.email}
                    onChange={cambiarCampo}
                    placeholder="usuario@vigno.cl"
                    required
                  />
                </div>

                <div className="usr-campo">
                  <label htmlFor="usr-rol">Rol en el sistema</label>
                  <select
                    id="usr-rol"
                    name="rol"
                    value={formulario.rol}
                    onChange={cambiarCampo}
                  >
                    <option value="lector">Lector (solo visualización)</option>
                    <option value="editor">Editor (carga de datos y correcciones)</option>
                    <option value="administrador">Administrador (acceso total)</option>
                  </select>
                </div>

                {modalActivo === "crear" && (
                  <div className="usr-campo">
                    <label htmlFor="usr-clave">Clave temporal</label>
                    <input
                      id="usr-clave"
                      name="clave_temporal"
                      type="password"
                      value={formulario.clave_temporal}
                      onChange={cambiarCampo}
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <small>El usuario deberá cambiar esta clave al iniciar sesión por primera vez.</small>
                  </div>
                )}

                <div className="usr-modal-botones">
                  <button type="button" className="usr-btn-secundario" onClick={cerrarModal} disabled={guardando}>
                    Cancelar
                  </button>
                  <button type="submit" className="usr-btn-primario" disabled={guardando}>
                    {guardando ? "Guardando..." : modalActivo === "crear" ? "Crear usuario" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}

            {modalActivo === "clave" && (
              <form onSubmit={manejarRestablecerClave} className="usr-formulario" noValidate>
                <p className="usr-modal-texto">
                  Asignarás una nueva clave temporal para <strong>{usuarioSeleccionado?.nombre}</strong> ({usuarioSeleccionado?.email || usuarioSeleccionado?.correo}).
                </p>

                <div className="usr-campo">
                  <label htmlFor="usr-nueva-clave">Nueva clave temporal</label>
                  <input
                    id="usr-nueva-clave"
                    name="clave_temporal"
                    type="password"
                    value={formulario.clave_temporal}
                    onChange={cambiarCampo}
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                  <small>Al ingresar con esta clave, el sistema le exigirá definir una contraseña propia.</small>
                </div>

                <div className="usr-modal-botones">
                  <button type="button" className="usr-btn-secundario" onClick={cerrarModal} disabled={guardando}>
                    Cancelar
                  </button>
                  <button type="submit" className="usr-btn-primario" disabled={guardando}>
                    {guardando ? "Actualizando..." : "Asignar clave"}
                  </button>
                </div>
              </form>
            )}

            {modalActivo === "estado" && (
              <div className="usr-formulario">
                <p className="usr-modal-texto">
                  {usuarioSeleccionado?.activo !== false
                    ? "¿Estás seguro de que deseas desactivar la cuenta de "
                    : "¿Deseas volver a activar la cuenta de "}
                  <strong>{usuarioSeleccionado?.nombre}</strong>?
                </p>

                {usuarioSeleccionado?.activo !== false && (
                  <p className="usr-modal-subtexto">
                    El usuario no podrá iniciar sesión hasta que un administrador reactive su cuenta.
                  </p>
                )}

                <div className="usr-modal-botones">
                  <button type="button" className="usr-btn-secundario" onClick={cerrarModal} disabled={guardando}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={usuarioSeleccionado?.activo !== false ? "usr-btn-confirmar-peligro" : "usr-btn-primario"}
                    onClick={manejarCambiarEstado}
                    disabled={guardando}
                  >
                    {guardando
                      ? "Procesando..."
                      : usuarioSeleccionado?.activo !== false
                      ? "Sí, desactivar"
                      : "Sí, activar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Usuarios;