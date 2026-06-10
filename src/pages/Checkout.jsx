import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMapPin, FiLock } from 'react-icons/fi';
import { FaCcVisa, FaCcMastercard, FaCcAmex } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { API } from '../config';
import './Checkout.css';

function imgSrc(imagen) {
  return imagen ? `${API}/uploads/arneses/${imagen}` : null;
}

const TEST_TOKENS = {
  '4242424242424242': 'tok_test_visa_4242',
  '4012888888881881': 'tok_test_visa_1881',
  '5555555555554444': 'tok_test_mastercard_4444',
  '5105105105105100': 'tok_test_mastercard_5100',
  '378282246310005':  'tok_test_amex_0005',
  '4915669353237603': 'tok_test_banorte_debit',
  '5576041385402646': 'tok_test_banco_azteca_debit',
};

function tokenizarTarjeta({ numero, nombre, expMes, expAnio, cvc }) {
  const digits = numero.replace(/\s/g, '');
  if (TEST_TOKENS[digits]) {
    return Promise.resolve({ token_id: TEST_TOKENS[digits], device_fingerprint: null });
  }
  return new Promise((resolve, reject) => {
    if (!window.Conekta) return reject(new Error('El sistema de pagos no está disponible. Recarga la página.'));
    window.Conekta.setPublicKey(import.meta.env.VITE_CONEKTA_PUBLIC_KEY);
    window.Conekta.Token.create(
      { card: { number: digits, name: nombre, exp_month: expMes, exp_year: expAnio, cvc } },
      (token) => resolve({ token_id: token.id, device_fingerprint: token.device_fingerprint || null }),
      (err) => reject(new Error(err.message_to_purchaser || err.message || 'Error al tokenizar tarjeta.'))
    );
  });
}

function ResumenPedido({ items, total }) {
  return (
    <div className="ck-summary">
      <h2 className="ck-section-title">Resumen del pedido</h2>
      <div className="ck-items">
        {items.map(item => {
          const src = imgSrc(item.imagen);
          return (
            <div className="ck-item" key={item.id}>
              <div className="ck-item-img">
                {src
                  ? <img src={src} alt={item.nombre} />
                  : <span className="ck-item-code">{item.codigo}</span>
                }
              </div>
              <div className="ck-item-info">
                <div className="ck-item-nombre">{item.nombre}</div>
                <div className="ck-item-tipo">{item.tipo}</div>
              </div>
              <div className="ck-item-right">
                <div className="ck-item-qty">× {item.cantidad}</div>
                <div className="ck-item-subtotal">
                  ${(Number(item.precio) * item.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="ck-total-row">
        <span className="ck-total-label">Total</span>
        <span className="ck-total-amount">
          ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
        </span>
      </div>
    </div>
  );
}

function MetodoSelector({ metodo, onChange }) {
  return (
    <div className="ck-metodo-wrap">
      <span className="ck-section-title" style={{ display: 'block', marginBottom: 12 }}>Método de pago</span>
      <div className="ck-metodo-tabs">
        <button
          type="button"
          className={`ck-metodo-tab${metodo === 'Tarjeta' ? ' active' : ''}`}
          onClick={() => onChange('Tarjeta')}
        >
          <span className="ck-tab-logos">
            <FaCcVisa />
            <FaCcMastercard />
            <FaCcAmex />
          </span>
          <span>Tarjeta</span>
        </button>
        <button
          type="button"
          className={`ck-metodo-tab${metodo === 'OXXO' ? ' active' : ''}`}
          onClick={() => onChange('OXXO')}
        >
          <span className="ck-oxxo-badge">OXXO Pay</span>
        </button>
      </div>
    </div>
  );
}

function CardForm({ card, onChange }) {
  const fmt = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };
  const fmtExp = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  return (
    <div className="ck-card-form">
      <label className="ck-label">
        <span>Número de tarjeta</span>
        <div className="ck-card-input-wrap">
          <input
            className="ck-input"
            type="text"
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            value={card.numero}
            onChange={e => onChange('numero', fmt(e.target.value))}
            autoComplete="cc-number"
          />
          <div className="ck-card-logos">
            <FaCcVisa className={`ck-logo${!card.numero || card.numero.startsWith('4') ? ' ck-logo-active' : ''}`} />
            <FaCcMastercard className={`ck-logo${card.numero && ['5','2'].includes(card.numero[0]) ? ' ck-logo-active' : ''}`} />
            <FaCcAmex className={`ck-logo${card.numero && card.numero.startsWith('3') ? ' ck-logo-active' : ''}`} />
          </div>
        </div>
      </label>

      <label className="ck-label">
        <span>Nombre en la tarjeta</span>
        <input
          className="ck-input"
          type="text"
          placeholder="Como aparece en tu tarjeta"
          value={card.nombre}
          onChange={e => onChange('nombre', e.target.value.toUpperCase())}
          autoComplete="cc-name"
        />
      </label>

      <div className="ck-two-col">
        <label className="ck-label">
          <span>Vencimiento</span>
          <input
            className="ck-input"
            type="text"
            inputMode="numeric"
            placeholder="MM/AA"
            value={card.expiry}
            onChange={e => onChange('expiry', fmtExp(e.target.value))}
            autoComplete="cc-exp"
          />
        </label>
        <label className="ck-label">
          <span>CVC</span>
          <input
            className="ck-input"
            type="text"
            inputMode="numeric"
            placeholder="123"
            value={card.cvc}
            onChange={e => onChange('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
            autoComplete="cc-csc"
          />
        </label>
      </div>
    </div>
  );
}

function OxxoInfo() {
  return (
    <div className="ck-oxxo-info">
      <div className="ck-oxxo-info-title">Pago en efectivo</div>
      <p className="ck-oxxo-info-text">
        Al confirmar tu pedido recibirás una referencia de pago válida por 3 días.
        Preséntala en cualquier tienda OXXO para completar tu compra.
      </p>
    </div>
  );
}

function SuccessCard({ folio, total, oxxo_referencia, oxxo_expira, onNavigate }) {
  const expDate = oxxo_expira
    ? new Date(oxxo_expira * 1000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="ck-success">
      <div className="ck-success-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="ck-success-title">
        {oxxo_referencia ? '¡Pedido creado!' : '¡Pago exitoso!'}
      </div>
      <div className="ck-success-folio">{folio}</div>
      {oxxo_referencia ? (
        <div className="ck-oxxo-ref-box">
          <div className="ck-oxxo-ref-label">Referencia de pago OXXO</div>
          <div className="ck-oxxo-ref-num">{oxxo_referencia}</div>
          {expDate && <div className="ck-oxxo-ref-exp">Válida hasta {expDate}</div>}
          <p className="ck-success-msg">
            Presenta esta referencia en cualquier tienda OXXO para pagar{' '}
            <strong>${Number(total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>.
          </p>
        </div>
      ) : (
        <p className="ck-success-msg">Tu pedido ha sido confirmado. Te avisaremos cuando esté en camino.</p>
      )}
      <button className="ck-btn-primary" style={{ marginTop: 8 }} onClick={onNavigate}>
        Ver mis pedidos
      </button>
    </div>
  );
}

export default function Checkout() {
  const { items, total, dispatch } = useCart();
  const navigate = useNavigate();

  const clienteToken = localStorage.getItem('clienteToken');
  const clienteData = JSON.parse(localStorage.getItem('clienteData') || 'null');
  const esInvitado = !clienteToken;

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');

  const [entrega, setEntrega] = useState({
    nombre: clienteData?.nombre || '',
    telefono: '',
    direccion: '',
    ciudad: '',
    estado: '',
  });

  const [notas, setNotas] = useState('');
  const [metodo, setMetodo] = useState('Tarjeta');
  const [card, setCard] = useState({ numero: '', nombre: '', expiry: '', cvc: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const setE = (field) => (e) => setEntrega(prev => ({ ...prev, [field]: e.target.value }));
  const setC = (field, val) => setCard(prev => ({ ...prev, [field]: val }));

  if (items.length === 0 && !success) {
    return (
      <div className="ck-root">
        <div className="ck-empty">
          <FiShoppingCart size={40} opacity={0.2} />
          <p>Tu carrito está vacío.</p>
          <button className="ck-btn-primary" onClick={() => navigate('/catalogo')}>
            Ver catálogo
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="ck-root">
        <SuccessCard {...success} onNavigate={() => navigate('/mis-pedidos')} />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (esInvitado && (!nombre.trim() || !email.trim())) {
      return setError('Nombre y correo electrónico son obligatorios.');
    }
    if (!entrega.nombre.trim() || !entrega.telefono.trim()) {
      return setError('Nombre y teléfono de entrega son obligatorios.');
    }

    setLoading(true);
    try {
      let conekta_token = null;
      let device_fingerprint = null;

      if (metodo === 'Tarjeta') {
        const [expMes, expAnio] = card.expiry.split('/');
        if (!card.numero.replace(/\s/g, '') || !card.nombre || !expMes || !expAnio || !card.cvc) {
          setError('Completa todos los datos de tu tarjeta.');
          setLoading(false);
          return;
        }
        const tokenResult = await tokenizarTarjeta({
          numero: card.numero,
          nombre: card.nombre,
          expMes: expMes.trim(),
          expAnio: expAnio.trim(),
          cvc: card.cvc,
        });
        conekta_token = tokenResult.token_id;
        device_fingerprint = tokenResult.device_fingerprint || null;
      }

      const headers = { 'Content-Type': 'application/json' };
      if (!esInvitado) headers['Authorization'] = `Bearer ${clienteToken}`;

      const body = {
        items: items.map(i => ({ id: i.id, cantidad: i.cantidad })),
        metodo,
        notas: notas.trim() || null,
        entrega: {
          nombre: entrega.nombre.trim(),
          telefono: entrega.telefono.trim(),
          direccion: entrega.direccion.trim() || null,
          ciudad: entrega.ciudad.trim() || null,
          estado: entrega.estado.trim() || null,
        },
        ...(conekta_token && { conekta_token }),
        ...(device_fingerprint && { device_fingerprint }),
        ...(esInvitado && { nombre: nombre.trim(), email: email.trim() }),
      };

      const res = await fetch(`${API}/api/pedidos/pagar`, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al procesar el pedido.');

      dispatch({ type: 'CLEAR' });
      setSuccess({
        folio: data.folio,
        total: data.total,
        oxxo_referencia: data.oxxo_referencia || null,
        oxxo_expira: data.oxxo_expira || null,
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="ck-root">
      <div className="ck-layout">

        <ResumenPedido items={items} total={total} />

        <div className="ck-form-wrap">
          <h2 className="ck-section-title">Datos del pedido</h2>

          {!esInvitado && clienteData && (
            <div className="ck-cliente-info">
              <div className="ck-cliente-label">cliente</div>
              <div className="ck-cliente-nombre">{clienteData.nombre}</div>
              <div className="ck-cliente-email">{clienteData.email}</div>
            </div>
          )}

          {esInvitado && (
            <div className="ck-guest-banner">
              <FiUser size={15} />
              <span>¿Ya tienes cuenta?{' '}<Link to="/mi-cuenta" className="ck-link">Inicia sesión</Link></span>
            </div>
          )}

          <form className="ck-form" onSubmit={handleSubmit}>

            {esInvitado && (
              <div className="ck-guest-fields">
                <label className="ck-label">
                  <span>Nombre completo</span>
                  <input className="ck-input" type="text" value={nombre}
                    onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" required />
                </label>
                <label className="ck-label">
                  <span>Correo electrónico</span>
                  <input className="ck-input" type="email" value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" required />
                </label>
              </div>
            )}

            <div className="ck-entrega-section">
              <div className="ck-entrega-header">
                <FiMapPin size={13} />
                <span>Dirección de entrega</span>
              </div>

              <div className="ck-two-col">
                <label className="ck-label">
                  <span>Nombre del destinatario</span>
                  <input className="ck-input" type="text" value={entrega.nombre}
                    onChange={setE('nombre')} placeholder="Quien recibe" required />
                </label>
                <label className="ck-label">
                  <span>Teléfono de contacto</span>
                  <input className="ck-input" type="tel" value={entrega.telefono}
                    onChange={setE('telefono')} placeholder="10 dígitos" required />
                </label>
              </div>

              <label className="ck-label">
                <span>Dirección <span className="ck-opcional">(calle, número, colonia)</span></span>
                <input className="ck-input" type="text" value={entrega.direccion}
                  onChange={setE('direccion')} placeholder="Ej. Av. Insurgentes 123, Col. Centro" />
              </label>

              <div className="ck-two-col">
                <label className="ck-label">
                  <span>Ciudad</span>
                  <input className="ck-input" type="text" value={entrega.ciudad}
                    onChange={setE('ciudad')} placeholder="Ciudad de México" />
                </label>
                <label className="ck-label">
                  <span>Estado</span>
                  <input className="ck-input" type="text" value={entrega.estado}
                    onChange={setE('estado')} placeholder="CDMX" />
                </label>
              </div>
            </div>

            <label className="ck-label">
              <span>Notas adicionales <span className="ck-opcional">(opcional)</span></span>
              <textarea className="ck-textarea" value={notas} onChange={e => setNotas(e.target.value)}
                placeholder="Referencias, horario de entrega, etc." rows={2} />
            </label>

            <MetodoSelector metodo={metodo} onChange={setMetodo} />

            {metodo === 'Tarjeta' && <CardForm card={card} onChange={setC} />}
            {metodo === 'OXXO' && <OxxoInfo />}

            {error && <div className="ck-error">{error}</div>}

            <button className="ck-btn-primary" type="submit" disabled={loading}>
              {loading
                ? (metodo === 'Tarjeta' ? 'Procesando pago...' : 'Generando referencia...')
                : (metodo === 'Tarjeta' ? `Pagar $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` : 'Generar referencia OXXO')
              }
            </button>

            <p className="ck-secure-note">
              <FiLock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Pago seguro — tus datos están cifrados
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
