import { useState, useEffect } from "react";
import { FiSearch, FiEye, FiPackage } from "react-icons/fi";
import { formatFecha, formatMoneda, estadoClass, estadoLabel, metodoPagoLabel } from "../utils/formato";
import "./AdminPedidos.css";
import { API } from "../config";

const ESTADOS = ["todos", "pendiente", "en_proceso", "en_camino", "entregado", "cancelado"];

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [loadingDet, setLoadingDet] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const adminToken = localStorage.getItem("adminToken");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` };

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/pedidos`, { headers });
      if (!res.ok) throw new Error();
      setPedidos(await res.json());
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la lista de pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarPedidos(); }, []);

  const pedidosFiltrados = pedidos.filter(p => {
    const q = busqueda.toLowerCase();
    const coincide =
      p.folio.toLowerCase().includes(q) ||
      p.cliente.toLowerCase().includes(q) ||
      (p.entrega_nombre?.toLowerCase() || "").includes(q);
    if (filtro !== "todos") return coincide && p.estado === filtro;
    return coincide;
  });

  const abrirDetalle = async (p) => {
    setDetalle(null);
    setNuevoEstado(p.estado);
    setError("");
    setModal(true);
    setLoadingDet(true);
    try {
      const res = await fetch(`${API}/api/pedidos/${p.id}`, { headers });
      const data = await res.json();
      setDetalle(data);
      setNuevoEstado(data.estado);
    } catch (err) {
      console.error(err);
      setDetalle({ ...p, items: [] });
    } finally {
      setLoadingDet(false);
    }
  };

  const cerrarModal = () => { setModal(false); setDetalle(null); setError(""); };

  const guardarEstado = async () => {
    if (!detalle || nuevoEstado === detalle.estado) return cerrarModal();
    setGuardando(true);
    try {
      const res = await fetch(`${API}/api/pedidos/${detalle.id}/estado`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error();
      await cargarPedidos();
      cerrarModal();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar el estado.");
    } finally {
      setGuardando(false);
    }
  };

  const contadorEstado = (e) => pedidos.filter(p => e === "todos" ? true : p.estado === e).length;

  return (
    <div className="ac-page">

      <div className="ac-toolbar">
        <div className="cl-toolbar-left">
          <div className="ac-search">
            <FiSearch size={14} />
            <input
              placeholder="Buscar por folio, cliente o destinatario..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="cl-filtros">
            {ESTADOS.map(e => (
              <button
                key={e}
                className={`cl-filtro${filtro === e ? " active" : ""}`}
                onClick={() => setFiltro(e)}
              >
                {estadoLabel(e)}
              </button>
            ))}
          </div>
        </div>
        <div className="cl-total-badge">
          <span>{pedidos.filter(p => p.estado === "pendiente").length}</span>
          pendientes
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="ac-table-wrap">
        {loading ? (
          <div className="loading-text">cargando pedidos...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="ac-empty">
            {pedidos.length === 0
              ? "aún no hay pedidos registrados"
              : "sin resultados para esa búsqueda"}
          </div>
        ) : (
          <table className="ac-table">
            <thead>
              <tr>
                <th>folio</th>
                <th>cliente</th>
                <th>entrega</th>
                <th>total</th>
                <th>pago</th>
                <th>fecha</th>
                <th>estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map(p => (
                <tr key={p.id}>
                  <td>
                    <span className="td-folio td-link" onClick={() => abrirDetalle(p)}>
                      {p.folio}
                    </span>
                  </td>
                  <td>
                    <div className="ap-cliente-cell">
                      <span className="ap-cliente-nombre">{p.cliente}</span>
                      {p.cliente_email && (
                        <span className="ap-cliente-email">{p.cliente_email}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="ap-entrega-cell">
                      <span>{p.entrega_nombre}</span>
                      {(p.entrega_ciudad || p.entrega_estado) && (
                        <span className="ap-entrega-loc">
                          {[p.entrega_ciudad, p.entrega_estado].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="td-folio">{formatMoneda(p.total)}</span>
                  </td>
                  <td>
                    <span className="metodo-badge">
                      {metodoPagoLabel(p.metodo_pago)}
                    </span>
                  </td>
                  <td>
                    <span className="td-fecha">{formatFecha(p.fecha_pedido)}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${estadoClass(p.estado)}`}>
                      {estadoLabel(p.estado)}
                    </span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <button className="btn-icon" onClick={() => abrirDetalle(p)} title="Ver detalle">
                        <FiEye size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && pedidos.length > 0 && (
        <div className="cl-contador">
          Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && cerrarModal()}>
          <div className="modal modal-wide">
            <button className="modal-close" onClick={cerrarModal}>✕</button>
            <div className="modal-title">detalle del pedido</div>

            {loadingDet ? (
              <div className="loading-text" style={{ padding: "40px 0" }}>cargando...</div>
            ) : detalle && (
              <>
                <div className="ap-folio-bar">
                  <span className="ap-folio-val">{detalle.folio}</span>
                  <span className={`status-pill ${estadoClass(detalle.estado)}`}>
                    {estadoLabel(detalle.estado)}
                  </span>
                </div>

                <div className="cl-detalle-grid">
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Cliente</span>
                    <span className="cl-detalle-valor">{detalle.cliente}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Email</span>
                    <span className="cl-detalle-valor">{detalle.cliente_email || "—"}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Fecha</span>
                    <span className="cl-detalle-valor">{formatFecha(detalle.fecha_pedido)}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Total</span>
                    <span className="cl-detalle-valor">{formatMoneda(detalle.total)}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Método de pago</span>
                    <span className="cl-detalle-valor">
                      {metodoPagoLabel(detalle.metodo_pago)}
                    </span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Registrado</span>
                    <span className="cl-detalle-valor">{formatFecha(detalle.creado_en)}</span>
                  </div>
                </div>

                <div className="cl-pedidos-titulo">Dirección de entrega</div>
                <div className="cl-detalle-grid" style={{ marginBottom: 20 }}>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Destinatario</span>
                    <span className="cl-detalle-valor">{detalle.entrega_nombre || "—"}</span>
                  </div>
                  <div className="cl-detalle-item">
                    <span className="cl-detalle-label">Teléfono</span>
                    <span className="cl-detalle-valor">{detalle.entrega_telefono || "—"}</span>
                  </div>
                  <div className="cl-detalle-item" style={{ gridColumn: "1 / -1" }}>
                    <span className="cl-detalle-label">Dirección</span>
                    <span className="cl-detalle-valor">
                      {[detalle.entrega_direccion, detalle.entrega_ciudad, detalle.entrega_estado]
                        .filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  {detalle.notas && (
                    <div className="cl-detalle-item" style={{ gridColumn: "1 / -1" }}>
                      <span className="cl-detalle-label">Notas</span>
                      <span className="cl-detalle-valor">{detalle.notas}</span>
                    </div>
                  )}
                </div>

                <div className="cl-pedidos-titulo">
                  <FiPackage size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Productos ({detalle.items?.length || 0})
                </div>
                {detalle.items?.length === 0 ? (
                  <div className="ac-empty" style={{ padding: "16px" }}>sin productos registrados</div>
                ) : (
                  <table className="ac-table ap-items-table">
                    <thead>
                      <tr>
                        <th>producto</th>
                        <th>código</th>
                        <th style={{ textAlign: "right" }}>cant.</th>
                        <th style={{ textAlign: "right" }}>precio u.</th>
                        <th style={{ textAlign: "right" }}>subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.items.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <div className="ap-item-nombre">{item.nombre}</div>
                            <div className="ap-item-tipo">{item.tipo}</div>
                          </td>
                          <td><span className="td-folio">{item.codigo}</span></td>
                          <td style={{ textAlign: "right" }}>{item.cantidad}</td>
                          <td style={{ textAlign: "right" }}>{formatMoneda(item.precio_unitario)}</td>
                          <td style={{ textAlign: "right" }}>
                            <span className="td-folio">
                              {formatMoneda(Number(item.precio_unitario) * item.cantidad)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="ap-estado-section">
                  <span className="cl-detalle-label">Cambiar estado</span>
                  {detalle.estado === 'cancelado' ? (
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: 6 }}>
                      Este pedido fue cancelado por falta de pago.
                    </p>
                  ) : (
                    <div className="ap-estado-row">
                      <select
                        className="ap-estado-select"
                        value={nuevoEstado}
                        onChange={e => setNuevoEstado(e.target.value)}
                      >
                        {detalle.estado === 'pendiente' && (
                          <option value="en_proceso">Confirmar pago (OXXO)</option>
                        )}
                        <option value="en_proceso" disabled={detalle.estado !== 'pendiente' && detalle.estado !== 'en_proceso'}>En proceso</option>
                        <option value="en_camino">En camino</option>
                        <option value="entregado">Entregado</option>
                      </select>
                    </div>
                  )}
                </div>

                {error && <div className="form-error" style={{ marginTop: 8 }}>{error}</div>}

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={cerrarModal}>cerrar</button>
                  <button
                    className="btn-primary-admin"
                    onClick={guardarEstado}
                    disabled={guardando || nuevoEstado === detalle.estado}
                  >
                    {guardando ? "guardando..." : "guardar estado"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
