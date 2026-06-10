import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FiShoppingBag, FiPackage, FiX } from "react-icons/fi";
import { formatFecha, formatMoneda, estadoLabel, estadoClass, metodoPagoLabel } from "../utils/formato";
import "./ClienteAuth.css";
import { API } from "../config";

const ESTADO_CLASS = {
  pendiente: "pendiente",
  en_proceso: "proceso",
  en_camino: "camino",
  entregado: "completado",
  cancelado: "cancelado",
};

const PASOS = ["pendiente", "en_proceso", "en_camino", "entregado"];

function StatusPill({ estado }) {
  const cls = ESTADO_CLASS[estado] ?? "pendiente";
  return <span className={`ca-pill ${cls}`}>{estadoLabel(estado)}</span>;
}

function ProgressBar({ estado }) {
  if (estado === "cancelado") {
    return (
      <div className="mp-progress">
        <span className="mp-progress-cancelado">Pedido cancelado</span>
      </div>
    );
  }
  const actual = PASOS.indexOf(estado);
  return (
    <div className="mp-progress">
      {PASOS.map((paso, i) => (
        <div key={paso} className="mp-progress-step">
          <div className={`mp-progress-dot ${i <= actual ? "activo" : ""}`}>
            {i < actual ? "✓" : i + 1}
          </div>
          <span className={`mp-progress-label ${i <= actual ? "activo" : ""}`}>
            {estadoLabel(paso)}
          </span>
          {i < PASOS.length - 1 && (
            <div className={`mp-progress-line ${i < actual ? "activo" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MisPedidos() {
  const navigate = useNavigate();
  const { dispatch } = useCart();

  const clienteData = JSON.parse(localStorage.getItem("clienteData") || "null");
  const clienteToken = localStorage.getItem("clienteToken");

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [loadingDet, setLoadingDet] = useState(false);
  const [errorDet, setErrorDet] = useState("");

  useEffect(() => {
    if (!clienteToken) navigate("/mi-cuenta");
  }, [clienteToken, navigate]);

  useEffect(() => {
    if (!clienteToken) return;
    fetch(`${API}/api/clientes/mis-pedidos`, {
      headers: { Authorization: `Bearer ${clienteToken}` },
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem("clienteToken");
          localStorage.removeItem("clienteData");
          dispatch({ type: "CLEAR" });
          navigate("/mi-cuenta");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setPedidos(data);
      })
      .catch((err) => setError(err.message || "Error al cargar pedidos."))
      .finally(() => setLoading(false));
  }, [clienteToken, navigate]);

  const abrirDetalle = async (pedido) => {
    setDetalle(null);
    setErrorDet("");
    setModal(true);
    setLoadingDet(true);
    try {
      const res = await fetch(`${API}/api/clientes/mis-pedidos/${pedido.id}`, {
        headers: { Authorization: `Bearer ${clienteToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDetalle(data);
    } catch (err) {
      setErrorDet(err.message || "Error al cargar el detalle.");
    } finally {
      setLoadingDet(false);
    }
  };

  const cerrarModal = () => { setModal(false); setDetalle(null); setErrorDet(""); };

  const cerrarSesion = () => {
    localStorage.removeItem("clienteToken");
    localStorage.removeItem("clienteData");
    dispatch({ type: "CLEAR" });
    navigate("/mi-cuenta");
  };

  if (!clienteToken) return null;

  return (
    <div className="mp-wrap">

      <div className="mp-header">
        <div className="mp-header-left">
          <h1 className="mp-title">Mis pedidos</h1>
          {clienteData && (
            <p className="mp-bienvenida">Hola, <strong>{clienteData.nombre}</strong></p>
          )}
        </div>
        <button className="mp-logout" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>

      {loading && (
        <div className="mp-estado">
          <span className="ca-spinner mp-spinner" />
          Cargando pedidos...
        </div>
      )}

      {!loading && error && (
        <div className="mp-estado mp-error">{error}</div>
      )}

      {!loading && !error && pedidos.length === 0 && (
        <div className="mp-estado mp-vacio">
          <FiShoppingBag size={40} opacity={0.3} />
          <p>Aún no tienes pedidos registrados.</p>
        </div>
      )}

      {!loading && !error && pedidos.length > 0 && (
        <div className="mp-tabla-wrap">
          <table className="mp-tabla">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Método de pago</th>
                <th className="mp-th-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="mp-folio mp-folio-link" onClick={() => abrirDetalle(p)}>
                      {p.folio ?? "—"}
                    </span>
                  </td>
                  <td><StatusPill estado={p.estado} /></td>
                  <td className="mp-fecha">{formatFecha(p.fecha_pedido)}</td>
                  <td className="mp-metodo">{p.metodo_pago ?? "—"}</td>
                  <td className="mp-total">{formatMoneda(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mp-contador">
            {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} en total
          </p>
        </div>
      )}

      {modal && (
        <div className="mp-modal-overlay" onClick={(e) => e.target === e.currentTarget && cerrarModal()}>
          <div className="mp-modal">
            <button className="mp-modal-close" onClick={cerrarModal}>
              <FiX size={16} />
            </button>

            {loadingDet && (
              <div className="mp-estado" style={{ padding: "48px 0" }}>
                <span className="ca-spinner mp-spinner" />
                Cargando detalle...
              </div>
            )}

            {!loadingDet && errorDet && (
              <div className="mp-estado mp-error" style={{ padding: "48px 0" }}>{errorDet}</div>
            )}

            {!loadingDet && detalle && (
              <>
                <div className="mp-det-header">
                  <span className="mp-det-folio">{detalle.folio}</span>
                  <StatusPill estado={detalle.estado} />
                </div>

                <ProgressBar estado={detalle.estado} />

                <div className="mp-det-grid">
                  <div className="mp-det-item">
                    <span className="mp-det-label">Fecha</span>
                    <span className="mp-det-valor">{formatFecha(detalle.fecha_pedido)}</span>
                  </div>
                  <div className="mp-det-item">
                    <span className="mp-det-label">Total</span>
                    <span className="mp-det-valor">{formatMoneda(detalle.total)}</span>
                  </div>
                  <div className="mp-det-item">
                    <span className="mp-det-label">Método de pago</span>
                    <span className="mp-det-valor">
                      {metodoPagoLabel(detalle.metodo_pago)}
                    </span>
                  </div>
                </div>

                <div className="mp-det-seccion">Dirección de entrega</div>
                <div className="mp-det-grid">
                  <div className="mp-det-item">
                    <span className="mp-det-label">Destinatario</span>
                    <span className="mp-det-valor">{detalle.entrega_nombre || "—"}</span>
                  </div>
                  <div className="mp-det-item">
                    <span className="mp-det-label">Teléfono</span>
                    <span className="mp-det-valor">{detalle.entrega_telefono || "—"}</span>
                  </div>
                  <div className="mp-det-item mp-det-full">
                    <span className="mp-det-label">Dirección</span>
                    <span className="mp-det-valor">
                      {[detalle.entrega_direccion, detalle.entrega_ciudad, detalle.entrega_estado]
                        .filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                  {detalle.notas && (
                    <div className="mp-det-item mp-det-full">
                      <span className="mp-det-label">Notas</span>
                      <span className="mp-det-valor">{detalle.notas}</span>
                    </div>
                  )}
                </div>

                <div className="mp-det-seccion">
                  <FiPackage size={12} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Productos ({detalle.items?.length || 0})
                </div>

                {detalle.items?.length === 0 ? (
                  <p className="mp-det-vacio">Sin productos registrados.</p>
                ) : (
                  <table className="mp-det-tabla">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Código</th>
                        <th style={{ textAlign: "right" }}>Cant.</th>
                        <th style={{ textAlign: "right" }}>Precio u.</th>
                        <th style={{ textAlign: "right" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.items.map((item, i) => (
                        <tr key={i}>
                          <td>
                            <div className="mp-det-nombre">{item.nombre}</div>
                            <div className="mp-det-tipo">{item.tipo}</div>
                          </td>
                          <td className="mp-det-codigo">{item.codigo}</td>
                          <td style={{ textAlign: "right" }}>{item.cantidad}</td>
                          <td style={{ textAlign: "right" }}>{formatMoneda(item.precio_unitario)}</td>
                          <td style={{ textAlign: "right" }}>
                            <strong>{formatMoneda(Number(item.precio_unitario) * item.cantidad)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
