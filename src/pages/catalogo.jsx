import { useState, useEffect } from "react";
import { FiCheck, FiPlus, FiX } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import "./Catalogo.css";
import { API } from "../config";

export default function Catalogo() {
  const { items, dispatch, setIsOpen } = useCart();
  const [arneses, setArneses]     = useState([]);
  const [filtro, setFiltro]       = useState("Todos");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/arneses-publicos`)
      .then(r => r.json())
      .then(data => { setArneses(data); setLoading(false); })
      .catch(() => { setError("No se pudo cargar el catálogo."); setLoading(false); });
  }, []);

  const tipos = ["Todos", ...new Set(arneses.map(a => a.tipo))];
  const arnesesFiltrados = filtro === "Todos" ? arneses : arneses.filter(a => a.tipo === filtro);

  const isEnCarrito = (id) => items.some(i => i.id === id);

  const handleAgregar = (arnes, e) => {
    e.stopPropagation();
    dispatch({ type: 'ADD', item: arnes });
    setIsOpen(true);
  };

  const cerrarModal = () => setSeleccionado(null);

  if (loading) return <div className="cat-estado">CARGANDO CATÁLOGO...</div>;
  if (error)   return <div className="cat-estado cat-error">{error}</div>;

  return (
    <div className="cat-root">

      <div className="filtros">
        <span className="filtro-label">filtrar</span>
        {tipos.map(t => (
          <button
            key={t}
            className={`filtro-btn ${filtro === t ? "active" : ""}`}
            onClick={() => setFiltro(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {arnesesFiltrados.length === 0 ? (
        <div className="cat-estado">SIN PRODUCTOS DISPONIBLES</div>
      ) : (
        <div className="productos-grid">
          {arnesesFiltrados.map((arnes, i) => {
            const agotado = arnes.stock === 0;
            const enCarrito = isEnCarrito(arnes.id);
            return (
              <div
                className="tarjeta"
                key={arnes.id}
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => setSeleccionado(arnes)}
              >
                <div className="tarjeta-imagen">
                  {arnes.imagen_url
                    ? <img src={arnes.imagen_url} alt={arnes.nombre} />
                    : (
                      <div className="tarjeta-placeholder">
                        <span className="tarjeta-codigo">{arnes.codigo}</span>
                      </div>
                    )
                  }
                  <span className="tarjeta-tipo-badge">{arnes.tipo}</span>
                  {agotado && <span className="badge-agotado">Agotado</span>}
                  {!agotado && arnes.stock <= 5 && (
                    <span className="badge-stock-low">⚠ {arnes.stock} disp.</span>
                  )}
                </div>

                <div className="tarjeta-body">
                  <div className="tarjeta-nombre">{arnes.nombre}</div>
                  <div className="tarjeta-footer">
                    <div className="tarjeta-precio">
                      ${Number(arnes.precio).toLocaleString("es-MX")} <span>MXN</span>
                    </div>
                    <button
                      className={`btn-agregar ${enCarrito ? "en-carrito" : ""} ${agotado ? "deshabilitado" : ""}`}
                      onClick={(e) => handleAgregar(arnes, e)}
                      disabled={agotado}
                    >
                      {enCarrito ? (
                        <><FiCheck size={10} />agregado</>
                      ) : (
                        <><FiPlus size={10} />agregar</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {seleccionado && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>

            <button className="modal-cerrar" onClick={cerrarModal}>
              <FiX size={16} />
            </button>

            <div className="modal-imagen">
              {seleccionado.imagen_url
                ? <img src={seleccionado.imagen_url} alt={seleccionado.nombre} />
                : (
                  <div className="tarjeta-placeholder">
                    <span className="tarjeta-codigo">{seleccionado.codigo}</span>
                  </div>
                )
              }
              {seleccionado.stock === 0 && <span className="badge-agotado">Agotado</span>}
            </div>

            <div className="modal-info">
              <div className="modal-tipo">{seleccionado.tipo}</div>
              <h2 className="modal-nombre">{seleccionado.nombre}</h2>
              <div className="modal-precio">
                ${Number(seleccionado.precio).toLocaleString("es-MX")}
                <span> MXN</span>
              </div>

              <div className="modal-specs">
                {[
                  ["código",    seleccionado.codigo],
                  ["material",  seleccionado.material],
                  ["longitud",  seleccionado.longitud_m ? `${seleccionado.longitud_m} m` : null],
                  ["voltaje",   seleccionado.voltaje_max],
                  ["corriente", seleccionado.corriente_max],
                  ["calibre",   seleccionado.calibre],
                  ["conector",  seleccionado.tipo_conector],
                  ["norma",     seleccionado.norma],
                  ["stock",     seleccionado.stock !== undefined ? `${seleccionado.stock} unidades` : null],
                ].filter(([, v]) => v != null && v !== "").map(([k, v]) => (
                  <div className="spec-row" key={k}>
                    <span className="spec-key">{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>

              {seleccionado.descripcion && (
                <p className="modal-descripcion">{seleccionado.descripcion}</p>
              )}

              <button
                className={`btn-modal-agregar ${isEnCarrito(seleccionado.id) ? "en-carrito" : ""}`}
                disabled={seleccionado.stock === 0}
                onClick={(e) => handleAgregar(seleccionado, e)}
              >
                {seleccionado.stock === 0
                  ? "Sin stock"
                  : isEnCarrito(seleccionado.id)
                    ? "✓ En el carrito"
                    : "+ Agregar al carrito"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
