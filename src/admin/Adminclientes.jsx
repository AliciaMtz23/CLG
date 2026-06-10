import { useState, useEffect } from "react";
import { FiSearch, FiEye, FiXCircle, FiCheck } from "react-icons/fi";
import { formatFecha, fmtPeso, estadoClass, estadoLabel, metodoPagoLabel } from "../utils/formato";
import "./Adminclientes.css";
import { API } from "../config";

export default function AdminClientes() {
  const [clientes, setClientes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState("");
  const [filtro, setFiltro]       = useState("todos");
  const [modal, setModal]         = useState(null); // "detalle" | "estado"
  const [seleccionado, setSelec]  = useState(null);
  const [detalle, setDetalle]     = useState(null);
  const [loadingDet, setLoadingDet] = useState(false);
  const [error, setError]         = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/clientes`);
      if (!res.ok) throw new Error();
      setClientes(await res.json());
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarClientes(); }, []);

  const clientesFiltrados = clientes.filter(c => {
    const q = busqueda.toLowerCase();
    const coincide =
      c.nombre.toLowerCase().includes(q) ||
      (c.email?.toLowerCase()    || "").includes(q) ||
      (c.ciudad?.toLowerCase()   || "").includes(q) ||
      (c.direccion?.toLowerCase() || "").includes(q);
    if (filtro === "activos")   return coincide && c.activo === 1;
    if (filtro === "inactivos") return coincide && c.activo === 0;
    return coincide;
  });

  const abrirDetalle = async (c) => {
    setSelec(c);
    setDetalle(null);
    setModal("detalle");
    setLoadingDet(true);
    try {
      const res = await fetch(`${API}/api/clientes/${c.id}`);
      const data = await res.json();
      setDetalle(data);
    } catch (err) {
      console.error(err);
      setDetalle({ ...c, pedidos: [] });
    } finally {
      setLoadingDet(false);
    }
  };

  const abrirEstado = (c) => { setSelec(c); setModal("estado"); };
  const cerrarModal = () => { setModal(null); setSelec(null); setDetalle(null); setError(""); };

  const handleEstado = async () => {
    setGuardando(true);
    try {
      const nuevoEstado = seleccionado.activo === 1 ? 0 : 1;
      const res = await fetch(`${API}/api/clientes/${seleccionado.id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevoEstado }),
      });
      if (!res.ok) throw new Error();
      await cargarClientes();
      cerrarModal();
    } catch (err) {
      console.error(err);
      setError("Error al cambiar el estado.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="ac-page">

      <div className="ac-toolbar">
        <div className="cl-toolbar-left">
          <div className="ac-search">
            <FiSearch size={14} />
            <input
              placeholder="Buscar por nombre, empresa, email o ciudad..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="cl-filtros">
            {["todos","activos","inactivos"].map(f => (
              <button
                key={f}
                className={`cl-filtro ${filtro === f ? "active" : ""}`}
                onClick={() => setFiltro(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="cl-total-badge">
          <span>{clientes.filter(c => c.activo === 1).length}</span>
          clientes activos
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="ac-table-wrap">
        {loading ? (
          <div className="loading-text">cargando clientes...</div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="ac-empty">
            {clientes.length === 0
              ? "aún no hay clientes registrados"
              : "sin resultados para esa búsqueda"}
          </div>
        ) : (
          <table className="ac-table">
            <thead>
              <tr>
                <th>nombre</th>
                <th>email</th>
                <th>teléfono</th>
                <th>ciudad / estado</th>
                <th>último acceso</th>
                <th>cuenta</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map(c => (
                <tr
                  key={c.id}
                  className={c.activo === 0 ? "row-inactivo" : ""}
                >
                  <td>
                    <span
                      className="td-nombre td-link"
                      onClick={() => abrirDetalle(c)}
                    >
                      {c.nombre}
                    </span>
                  </td>
                  <td>
                    {c.email
                      ? <a className="td-email" href={`mailto:${c.email}`}>{c.email}</a>
                      : <span className="td-vacio">—</span>}
                  </td>
                  <td>{c.telefono || <span className="td-vacio">—</span>}</td>
                  <td>
                    {c.ciudad || c.estado
                      ? `${c.ciudad || ""}${c.ciudad && c.estado ? ", " : ""}${c.estado || ""}`
                      : <span className="td-vacio">—</span>}
                  </td>
                  <td>
                    <span className="td-fecha">{formatFecha(c.ultimo_login)}</span>
                  </td>
                  <td>
                    <span className={`cuenta-badge ${c.activo === 1 ? "activo" : "inactivo"}`}>
                      {c.activo === 1 ? "activo" : "inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-icon" onClick={() => abrirDetalle(c)} title="Ver detalle">
                        <FiEye size={13} />
                      </button>
                      <button
                        className={`btn-icon ${c.activo === 1 ? "danger" : "success"}`}
                        onClick={() => abrirEstado(c)}
                        title={c.activo === 1 ? "Desactivar" : "Reactivar"}
                      >
                        {c.activo === 1 ? <FiXCircle size={13} /> : <FiCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && clientes.length > 0 && (
        <div className="cl-contador">
          Mostrando {clientesFiltrados.length} de {clientes.length} clientes registrados
        </div>
      )}

      {modal === "detalle" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal modal-wide">
            <button className="modal-close" onClick={cerrarModal}>✕</button>
            <div className="modal-title">detalle del cliente</div>

            {loadingDet ? (
              <div className="loading-text" style={{ padding: "40px 0" }}>cargando...</div>
            ) : detalle && (
              <>
                <div className="cl-detalle-grid">
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Nombre</span>
                    <span className="cl-detalle-valor">{detalle.nombre}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Email</span>
                    <span className="cl-detalle-valor">{detalle.email}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Teléfono</span>
                    <span className="cl-detalle-valor">{detalle.telefono || "—"}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Dirección</span>
                    <span className="cl-detalle-valor">{detalle.direccion || "—"}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Ciudad</span>
                    <span className="cl-detalle-valor">{detalle.ciudad || "—"}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Estado</span>
                    <span className="cl-detalle-valor">{detalle.estado || "—"}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Registrado</span>
                    <span className="cl-detalle-valor">{formatFecha(detalle.creado_en)}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Último acceso</span>
                    <span className="cl-detalle-valor">{formatFecha(detalle.ultimo_login)}</span>
                  </div>
                </div>

                <div className="cl-pedidos-titulo">
                  Pedidos ({detalle.pedidos?.length || 0})
                </div>

                {detalle.pedidos?.length === 0 ? (
                  <div className="ac-empty" style={{ padding: "20px" }}>
                    este cliente aún no ha realizado pedidos
                  </div>
                ) : (
                  <table className="ac-table" style={{ marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>folio</th>
                        <th>fecha</th>
                        <th>total</th>
                        <th>pago</th>
                        <th>estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.pedidos.map(p => (
                        <tr key={p.id}>
                          <td><span className="td-codigo">{p.folio}</span></td>
                          <td>{formatFecha(p.fecha_pedido)}</td>
                          <td><span className="td-precio">{fmtPeso(p.total)}</span></td>
                          <td>
                            <span className="metodo-badge">
                              {metodoPagoLabel(p.metodo_pago)}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${estadoClass(p.estado)}`}>
                              {estadoLabel(p.estado)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={cerrarModal}>cerrar</button>
                  <button
                    className={detalle.activo === 1 ? "btn-danger" : "btn-success"}
                    onClick={() => { cerrarModal(); abrirEstado(detalle); }}
                  >
                    {detalle.activo === 1 ? "desactivar cuenta" : "reactivar cuenta"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modal === "estado" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal confirm-modal">
            <div className="confirm-icon">
              {seleccionado?.activo === 1 ? "⚠" : "✓"}
            </div>
            <div className="confirm-title">
              {seleccionado?.activo === 1 ? "desactivar cliente" : "reactivar cliente"}
            </div>
            <p className="confirm-sub">
              {seleccionado?.activo === 1
                ? <>¿Desactivar la cuenta de <strong>{seleccionado?.nombre}</strong>? No podrá iniciar sesión ni realizar pedidos.</>
                : <>¿Reactivar la cuenta de <strong>{seleccionado?.nombre}</strong>? Volverá a poder iniciar sesión.</>
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