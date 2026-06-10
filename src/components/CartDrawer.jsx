import { useNavigate } from 'react-router-dom';
import { FiX, FiTrash2, FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

const API = 'http://localhost:4000';

function imgSrc(imagen) {
  return imagen ? `${API}/uploads/arneses/${imagen}` : null;
}

export default function CartDrawer() {
  const { items, dispatch, total, isOpen, setIsOpen } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="cd-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Panel */}
      <div className={`cd-panel ${isOpen ? 'cd-panel--open' : ''}`}>
        <div className="cd-header">
          <span className="cd-title">Carrito</span>
          <button className="cd-close" onClick={() => setIsOpen(false)}>
            <FiX size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cd-empty">
            <FiShoppingCart size={36} opacity={0.2} />
            <p>Tu carrito está vacío</p>
          </div>
        ) : (
          <>
            <div className="cd-items">
              {items.map(item => {
                const src = imgSrc(item.imagen);
                return (
                  <div className="cd-item" key={item.id}>
                    <div className="cd-item-img">
                      {src
                        ? <img src={src} alt={item.nombre} />
                        : <span className="cd-item-code">{item.codigo}</span>
                      }
                    </div>
                    <div className="cd-item-info">
                      <div className="cd-item-nombre">{item.nombre}</div>
                      <div className="cd-item-precio">
                        ${Number(item.precio).toLocaleString('es-MX')} MXN
                      </div>
                      <div className="cd-item-controls">
                        <button
                          className="cd-qty-btn"
                          onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, cantidad: item.cantidad - 1 })}
                          disabled={item.cantidad <= 1}
                        >
                          <FiMinus size={11} />
                        </button>
                        <span className="cd-qty">{item.cantidad}</span>
                        <button
                          className="cd-qty-btn"
                          onClick={() => dispatch({ type: 'UPDATE_QTY', id: item.id, cantidad: item.cantidad + 1 })}
                          disabled={item.cantidad >= item.stock}
                        >
                          <FiPlus size={11} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="cd-remove"
                      onClick={() => dispatch({ type: 'REMOVE', id: item.id })}
                      title="Eliminar"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="cd-footer">
              <div className="cd-total-row">
                <span className="cd-total-label">Subtotal</span>
                <span className="cd-total-amount">
                  ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
              <button className="cd-btn-checkout" onClick={handleCheckout}>
                Proceder al pago
              </button>
              <button
                className="cd-btn-vaciar"
                onClick={() => dispatch({ type: 'CLEAR' })}
              >
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
