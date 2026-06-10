import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { verificarCliente, verificarToken } from '../middleware/authMiddleware.js';
import { enviarEmailEnCamino, enviarEmailEntregado } from '../services/emailService.js';

const router = express.Router();

async function validarItems(conn, items) {
  let total = 0;
  const validados = [];
  for (const item of items) {
    const [[arnes]] = await conn.query(
      'SELECT id, precio, stock FROM arneses WHERE id = ? AND activo = 1',
      [item.id]
    );
    if (!arnes) throw new Error(`Producto con id ${item.id} no disponible.`);
    if (arnes.stock < item.cantidad) throw new Error('Stock insuficiente para uno de los productos.');
    total += Number(arnes.precio) * item.cantidad;
    validados.push({ id: item.id, cantidad: item.cantidad, precio: arnes.precio });
  }
  return { total, validados };
}

async function insertarPedido(conn, { clienteId, validados, total, notas, entrega, conektaOrderId, estadoInicial, metodo }) {
  const folio = `KOAH-${Date.now().toString(36).toUpperCase()}`;

  const [result] = await conn.query(
    `INSERT INTO pedidos
       (folio, cliente_id, estado, total, metodo_pago, fecha_pedido, notas,
        entrega_nombre, entrega_telefono, entrega_direccion, entrega_ciudad, entrega_estado,
        conekta_order_id)
     VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?)`,
    [
      folio, clienteId, estadoInicial, total.toFixed(2), metodo, notas || null,
      entrega.nombre, entrega.telefono,
      entrega.direccion || null, entrega.ciudad || null, entrega.estado || null,
      conektaOrderId || null,
    ]
  );

  const pedidoId = result.insertId;
  for (const item of validados) {
    await conn.query(
      `INSERT INTO pedido_items (pedido_id, arnes_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`,
      [pedidoId, item.id, item.cantidad, item.precio]
    );
    await conn.query('UPDATE arneses SET stock = stock - ? WHERE id = ?', [item.cantidad, item.id]);
  }
  return { folio, pedidoId, total };
}

const TEST_TOKENS = new Set([
  'tok_test_visa_4242', 'tok_test_visa_1881',
  'tok_test_mastercard_4444', 'tok_test_mastercard_5100',
  'tok_test_amex_0005', 'tok_test_amex_8431', 'tok_test_amex_0006',
  'tok_test_banorte_debit', 'tok_test_banco_azteca_debit',
]);

async function cobrarConekta({ total, nombre, email, telefono, tipo, tokenId, deviceFingerprint }) {
  if (tipo === 'card' && TEST_TOKENS.has(tokenId)) {
    return { conektaOrderId: `test_order_${Date.now()}`, referencia: null, expira: null };
  }
  const auth = Buffer.from(`${process.env.CONEKTA_PRIVATE_KEY}:`).toString('base64');
  const phone = (telefono || '').replace(/\D/g, '').slice(0, 10) || '5555555555';

  const charge = tipo === 'card'
    ? { payment_method: { type: 'card', token_id: tokenId } }
    : { payment_method: { type: 'cash', expires_at: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60 } };

  const orderPayload = {
    line_items: [{ name: 'Pedido KOAH WH', unit_price: Math.round(total * 100), quantity: 1 }],
    currency: 'MXN',
    customer_info: { name: nombre, email, phone },
    shipping_contact: {
      phone,
      receiver: nombre,
      address: {
        street1: 'Dirección de entrega',
        city: 'Zapopan',
        state: 'Jalisco',
        postal_code: '45070',
        country: 'MX',
        object: 'shipping_address',
      },
    },
    charges: [charge],
  };

  if (deviceFingerprint) orderPayload.device_fingerprint = deviceFingerprint;

  const res = await fetch('https://api.conekta.io/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.conekta-v2.1.0+json',
      'Accept-Language': 'es',
    },
    body: JSON.stringify(orderPayload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Conekta error response:', JSON.stringify(data, null, 2));
    throw new Error(data.details?.[0]?.message || data.message || 'Error al procesar el pago.');
  }

  const chargeData = data.charges?.data?.[0];
  return {
    conektaOrderId: data.id || null,
    referencia: chargeData?.payment_method?.reference || null,
    expira: chargeData?.payment_method?.expires_at || null,
  };
}

router.post('/pagar', async (req, res) => {
  const { items, metodo, conekta_token, device_fingerprint, entrega, notas,
          nombre: bodyNombre, email: bodyEmail } = req.body;

  if (!items?.length) return res.status(400).json({ message: 'El carrito está vacío.' });
  if (!metodo) return res.status(400).json({ message: 'Método de pago requerido.' });
  if (!entrega?.nombre?.trim()) return res.status(400).json({ message: 'El nombre de entrega es obligatorio.' });
  if (!entrega?.telefono?.trim()) return res.status(400).json({ message: 'El teléfono de entrega es obligatorio.' });
  if (metodo === 'Tarjeta' && !conekta_token) return res.status(400).json({ message: 'Token de tarjeta requerido.' });

  let clienteToken = null;
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      if (decoded.rol === 'cliente') clienteToken = decoded;
    } catch {}
  }

  const nombre = clienteToken?.nombre || bodyNombre?.trim();
  const email = clienteToken?.email || bodyEmail?.trim()?.toLowerCase();
  if (!nombre) return res.status(400).json({ message: 'El nombre es obligatorio.' });
  if (!email) return res.status(400).json({ message: 'El correo es obligatorio.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { total, validados } = await validarItems(conn, items);

    const tipoPago = metodo === 'Tarjeta' ? 'card' : 'cash';
    const conektaResult = await cobrarConekta({
      total, nombre, email,
      telefono: entrega.telefono,
      tipo: tipoPago,
      tokenId: conekta_token,
      deviceFingerprint: device_fingerprint || null,
    });

    // tarjeta = confirmado al instante, OXXO = espera pago en tienda
    const estadoInicial = tipoPago === 'card' ? 'en_proceso' : 'pendiente';

    const [[existente]] = await conn.query('SELECT id FROM clientes WHERE email = ?', [email]);
    let clienteId;
    if (clienteToken) {
      clienteId = clienteToken.id;
    } else if (existente) {
      clienteId = existente.id;
    } else {
      const [ins] = await conn.query(
        'INSERT INTO clientes (nombre, email, telefono, activo) VALUES (?, ?, ?, 1)',
        [nombre, email, entrega.telefono?.trim() || null]
      );
      clienteId = ins.insertId;
    }

    const resultado = await insertarPedido(conn, {
      clienteId, validados, total, notas,
      metodo,
      estadoInicial,
      conektaOrderId: conektaResult.conektaOrderId,
      entrega: {
        nombre: entrega.nombre.trim(),
        telefono: entrega.telefono.trim(),
        direccion: entrega.direccion?.trim() || null,
        ciudad: entrega.ciudad?.trim() || null,
        estado: entrega.estado?.trim() || null,
      },
    });

    await conn.commit();

    res.status(201).json({
      folio: resultado.folio,
      total: resultado.total.toFixed(2),
      ...(conektaResult.referencia && {
        oxxo_referencia: conektaResult.referencia,
        oxxo_expira: conektaResult.expira,
      }),
    });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ message: err.message });
  } finally {
    conn.release();
  }
});

router.get('/', verificarToken, async (req, res) => {
  const { estado, q } = req.query;
  try {
    const params = [];
    let where = 'WHERE 1=1';
    if (estado && estado !== 'todos') {
      where += ' AND p.estado = ?';
      params.push(estado);
    }
    if (q?.trim()) {
      where += ' AND (p.folio LIKE ? OR c.nombre LIKE ? OR p.entrega_nombre LIKE ?)';
      const like = `%${q.trim()}%`;
      params.push(like, like, like);
    }
    const [rows] = await pool.query(
      `SELECT p.id, p.folio, p.estado, p.total, p.metodo_pago,
              p.fecha_pedido, p.creado_en,
              p.entrega_nombre, p.entrega_telefono, p.entrega_ciudad, p.entrega_estado,
              c.nombre AS cliente, c.email AS cliente_email
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       ${where}
       ORDER BY p.id DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', verificarToken, async (req, res) => {
  try {
    const [[pedido]] = await pool.query(
      `SELECT p.*, c.nombre AS cliente, c.email AS cliente_email
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado.' });

    const [items] = await pool.query(
      `SELECT pi.cantidad, pi.precio_unitario,
              a.codigo, a.nombre, a.tipo, a.imagen
       FROM pedido_items pi
       JOIN arneses a ON a.id = pi.arnes_id
       WHERE pi.pedido_id = ?`,
      [req.params.id]
    );
    res.json({ ...pedido, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// admin solo puede cambiar a en_camino o entregado, el sistema maneja el resto
router.patch('/:id/estado', verificarToken, async (req, res) => {
  const { estado } = req.body;
  const validos = ['en_camino', 'entregado'];
  if (!validos.includes(estado)) {
    return res.status(400).json({ message: 'El admin solo puede cambiar a "en_camino" o "entregado".' });
  }
  try {
    const [[pedidoActual]] = await pool.query('SELECT estado FROM pedidos WHERE id = ?', [req.params.id]);
    if (!pedidoActual) return res.status(404).json({ message: 'Pedido no encontrado.' });
    if (pedidoActual.estado !== 'en_proceso' && estado === 'en_camino') {
      return res.status(400).json({ message: 'Solo se puede marcar en camino si el pago está confirmado.' });
    }
    await pool.query('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, req.params.id]);

    const [[pedidoCliente]] = await pool.query(
      `SELECT p.folio, c.nombre, c.email
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (pedidoCliente?.email) {
      if (estado === 'en_camino') {
        enviarEmailEnCamino({ email: pedidoCliente.email, nombre: pedidoCliente.nombre, folio: pedidoCliente.folio })
          .catch(err => console.error('Email error:', err.message));
      } else if (estado === 'entregado') {
        enviarEmailEntregado({ email: pedidoCliente.email, nombre: pedidoCliente.nombre, folio: pedidoCliente.folio })
          .catch(err => console.error('Email error:', err.message));
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/items', verificarCliente, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pi.cantidad, pi.precio_unitario,
              a.codigo, a.nombre, a.tipo, a.imagen
       FROM pedido_items pi
       JOIN arneses a ON a.id = pi.arnes_id
       JOIN pedidos p ON p.id = pi.pedido_id
       WHERE pi.pedido_id = ? AND p.cliente_id = ?`,
      [req.params.id, req.cliente.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener items', error: err.message });
  }
});

export default router;
