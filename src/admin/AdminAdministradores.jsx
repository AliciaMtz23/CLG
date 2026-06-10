import { useState, useEffect } from "react";
import { FiSearch, FiEdit2, FiXCircle, FiCheck, FiEye, FiEyeOff, FiInfo } from "react-icons/fi";
import "./AdminAdministradores.css";
import { API } from "../config";

const FORM_VACIO = { nombre: "", email: "", password: "" };

export default function AdminAdministradores({ adminActual }) {
  const [admins, setAdmins]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [modal, setModal]         = useState(null); // "nuevo" | "editar" | "estado"
  const [seleccionado, setSelec]  = useState(null);
  const [form, setForm]           = useState(FORM_VACIO);
  const [error, setError]         = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  const cargarAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admins`);
      if (!res.ok) throw new Error();
      setAdmins(await res.json());
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarAdmins(); }, []);

  const adminsFiltrados = admins.filter(a => {
    const q = busqueda.toLowerCase();
    return (
      a.nombre.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  });

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setMostrarPass(false);
    setError("");
    setModal("nuevo");
  };

  const abrirEditar = (a) => {
    setForm({ nombre: a.nombre, email: a.email, password: "" });
    setMostrarPass(false);
    setSelec(a);
    setError("");
    setModal("editar");
  };

  const abrirEstado = (a) => {
    setSelec(a);
    setError("");
    setModal("estado");
  };

  const cerrarModal = () => {
    setModal(null);
    setSelec(null);
    setForm(FORM_VACIO);
    setError("");
  };

  const handleForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim() || !form.email.trim()) {
      return setError("Nombre y email son obligatorios.");
    }
    if (modal === "nuevo" && !form.password.trim()) {
      return setError("La contraseña es obligatoria al crear un administrador.");
    }
    setGuardando(true);
    try {
      const url = modal === "nuevo" ? `${API}/api/admins` : `${API}/api/admins/${seleccionado.id}`;
      const method = modal === "nuevo" ? "POST" : "PUT";
      const body = modal === "nuevo"
        ? form
        : { nombre: form.nombre, email: form.email, ...(form.password.trim() ? { password: form.password } : {}) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Error al guardar.");
      await cargarAdmins();
      cerrarModal();
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEstado = async () => {
    setGuardando(true);
    try {
      const nuevoEstado = seleccionado.activo === 1 ? 0 : 1;
      const res = await fetch(`${API}/api/admins/${seleccionado.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevoEstado }),
      });
      if (!res.ok) {
        const data = await res.json();
        return setError(data.message || "Error al cambiar estado.");
      }
      await cargarAdmins();
      cerrarModal();
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const fmtFecha = (f) => {
    if (!f) return "nunca";
    return new Date(f).toLocaleDateString("es-MX", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const esPropiaC = (a) => adminActual?.id === a.id;
  const esSuperA = (a) => a.rol === "superadmin";
  const puedeEditar = (a) => !esSuperA(a) && !esPropiaC(a);

  return (
    <div className="aa-page">

      {/* Toolbar */}
      <div className="ac-toolbar">
        <div className="ac-search">
          <FiSearch size={14} />
          <input
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={abrirNuevo}>
          + nuevo admin
        </button>
      </div>

      {error && !modal && (
        <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Tabla */}
      <div className="ac-table-wrap">
        {loading ? (
          <div className="loading-text">cargando administradores...</div>
        ) : adminsFiltrados.length === 0 ? (
          <div className="ac-empty">
            {admins.length === 0 ? "no hay administradores registrados" : "sin resultados para esa búsqueda"}
          </div>
        ) : (
          <table className="ac-table">
            <thead>
              <tr>
                <th>nombre</th>
                <th>email</th>
                <th>rol</th>
                <th>último acceso</th>
                <th>cuenta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {adminsFiltrados.map(a => (
                <tr key={a.id} className={a.activo === 0 ? "aa-row-inactivo" : ""}>
                  <td>
                    <span className="td-nombre">
                      {a.nombre}
                      {esPropiaC(a) && <span className="aa-yo-badge">tú</span>}
                    </span>
                  </td>
                  <td>
                    <a className="td-email" href={`mailto:${a.email}`}>{a.email}</a>
                  </td>
                  <td>
                    <span className={`aa-rol-pill ${a.rol}`}>
                      {a.rol === "superadmin" ? "super admin" : "admin"}
                    </span>
                  </td>
                  <td>
                    <span className="td-fecha">{fmtFecha(a.ultimo_login)}</span>
                  </td>
                  <td>
                    <span className={`cuenta-badge ${a.activo === 1 ? "activo" : "inactivo"}`}>
                      {a.activo === 1 ? "activo" : "inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      {puedeEditar(a) ? (
                        <>
                          <button
                            className="btn-icon"
                            onClick={() => abrirEditar(a)}
                            title="Editar"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            className={`btn-icon ${a.activo === 1 ? "danger" : "success"}`}
                            onClick={() => abrirEstado(a)}
                            title={a.activo === 1 ? "Desactivar" : "Reactivar"}
                          >
                            {a.activo === 1 ? <FiXCircle size={13} /> : <FiCheck size={13} />}
                          </button>
                        </>
                      ) : (
                        <span className="aa-no-action">
                          {esSuperA(a) ? "superadmin" : "tu cuenta"}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Contador */}
      {!loading && admins.length > 0 && (
        <div className="cl-contador">
          {admins.filter(a => a.activo === 1).length} activos · {admins.length} total
        </div>
      )}

      {/* modal crear / editar */}
      {(modal === "nuevo" || modal === "editar") && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal">
            <button className="modal-close" onClick={cerrarModal}>✕</button>
            <div className="modal-title">
              {modal === "nuevo" ? "nuevo administrador" : "editar administrador"}
            </div>

            <form onSubmit={handleGuardar}>
              <div className="form-grid">

                <div className="form-field span2">
                  <label className="form-label">Nombre *</label>
                  <input
                    className="form-input"
                    name="nombre"
                    placeholder="Nombre completo"
                    value={form.nombre}
                    onChange={handleForm}
                    required
                  />
                </div>

                <div className="form-field span2">
                  <label className="form-label">Email *</label>
                  <input
                    className="form-input"
                    name="email"
                    type="email"
                    placeholder="correo@clg.com"
                    value={form.email}
                    onChange={handleForm}
                    required
                  />
                </div>

                <div className="form-field span2">
                  <label className="form-label">
                    Contraseña {modal === "editar" && <span className="aa-hint-label">— dejar vacío para no cambiar</span>}
                    {modal === "nuevo" && "*"}
                  </label>
                  <div className="aa-pass-wrap">
                    <input
                      className="form-input"
                      name="password"
                      type={mostrarPass ? "text" : "password"}
                      placeholder={modal === "nuevo" ? "Mínimo 6 caracteres" : "Nueva contraseña (opcional)"}
                      value={form.password}
                      onChange={handleForm}
                      required={modal === "nuevo"}
                    />
                    <button
                      type="button"
                      className="aa-pass-toggle"
                      onClick={() => setMostrarPass(v => !v)}
                      tabIndex={-1}
                    >
                      {mostrarPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </div>

                {modal === "nuevo" && (
                  <div className="form-field span2">
                    <div className="aa-rol-info">
                      <FiInfo size={13} />
                      El administrador se creará con rol <strong>admin</strong>. Solo puede haber un superadmin.
                    </div>
                  </div>
                )}

              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? "guardando..." : modal === "nuevo" ? "crear administrador" : "guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal cambiar estado */}
      {modal === "estado" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal confirm-modal">
            <div className="confirm-icon">
              {seleccionado?.activo === 1 ? "⚠" : "✓"}
            </div>
            <div className="confirm-title">
              {seleccionado?.activo === 1 ? "desactivar administrador" : "reactivar administrador"}
            </div>
            <p className="confirm-sub">
              {seleccionado?.activo === 1
                ? <>¿Desactivar la cuenta de <strong>{seleccionado?.nombre}</strong>? No podrá iniciar sesión en el panel.</>
                : <>¿Reactivar la cuenta de <strong>{seleccionado?.nombre}</strong>? Volverá a tener acceso al panel.</>
              }
            </p>
            {error && <div className="form-error">{error}</div>}
            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button className="btn-secondary" onClick={cerrarModal}>cancelar</button>
              <button
                className={seleccionado?.activo === 1 ? "btn-danger" : "btn-success"}
                onClick={handleEstado}
                disabled={guardando}
              >
                {guardando
                  ? "procesando..."
                  : seleccionado?.activo === 1 ? "sí, desactivar" : "sí, reactivar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
