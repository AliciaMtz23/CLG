import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { verificarCliente } from '../middleware/authMiddleware.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

router.post('/registro', async (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios.' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM clientes WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Ya existe una cuenta con ese email.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, email, password, telefono, activo) VALUES (?, ?, ?, ?, 1)',
      [nombre, email, hash, telefono || null]
    );

    const token = jwt.sign(
      { id: result.insertId, email, nombre, rol: 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Cuenta creada exitosamente.',
      token,
      cliente: { id: result.insertId, nombre, email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM clientes WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(404).json({ message: 'No existe una cuenta con ese email.' });
    }

    const cliente = rows[0];

    if (!cliente.activo) {
      return res.status(403).json({ message: 'Esta cuenta está desactivada. Contacta a soporte.' });
    }

    if (!cliente.password) {
      return res.status(400).json({ message: 'Esta cuenta no tiene contraseña. Usa el rastreo por email.' });
    }

    const valid = await bcrypt.compare(password, cliente.password);
    if (!valid) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    await pool.query('UPDATE clientes SET ultimo_login = NOW() WHERE id = ?', [cliente.id]);

    const token = jwt.sign(
      { id: cliente.id, email: cliente.email, nombre: cliente.nombre, rol: 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error en login', error: err.message });
  }
});

router.post('/google-auth', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Token de Google requerido.' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
      clockSkewInSeconds: 300,
    });
    const { sub: google_id, email, name: nombre } = ticket.getPayload();

    const [rows] = await pool.query(
      'SELECT * FROM clientes WHERE google_id = ? OR email = ?',
      [google_id, email]
    );

    let cliente;
    if (rows.length > 0) {
      cliente = rows[0];
      if (!cliente.activo) return res.status(403).json({ message: 'Esta cuenta está desactivada. Contacta a soporte.' });
      if (!cliente.google_id) {
        await pool.query('UPDATE clientes SET google_id = ? WHERE id = ?', [google_id, cliente.id]);
      }
      await pool.query('UPDATE clientes SET ultimo_login = NOW() WHERE id = ?', [cliente.id]);
    } else {
      const [result] = await pool.query(
        'INSERT INTO clientes (nombre, email, google_id, activo) VALUES (?, ?, ?, 1)',
        [nombre, email, google_id]
      );
      cliente = { id: result.insertId, nombre, email };
    }

    const token = jwt.sign(
      { id: cliente.id, email: cliente.email || email, nombre: cliente.nombre || nombre, rol: 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Inicio de sesión con Google exitoso.',
      token,
      cliente: { id: cliente.id, nombre: cliente.nombre || nombre, email: cliente.email || email },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ message: 'Token de Google inválido o expirado.' });
  }
});

router.get('/mis-pedidos', verificarCliente, async (req, res) => {
  try {
    const [pedidos] = await pool.query(
      `SELECT id, folio, estado, total, metodo_pago, fecha_pedido
       FROM pedidos WHERE cliente_id = ?
       ORDER BY fecha_pedido DESC`,
      [req.cliente.id]
    );
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener pedidos', error: err.message });
  }
});

router.get('/mis-pedidos/:id', verificarCliente, async (req, res) => {
  try {
    const [[pedido]] = await pool.query(
      `SELECT id, folio, estado, total, metodo_pago, fecha_pedido, notas,
              entrega_nombre, entrega_telefono, entrega_direccion,
              entrega_ciudad, entrega_estado
       FROM pedidos WHERE id = ? AND cliente_id = ?`,
      [req.params.id, req.cliente.id]
    );
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado.' });

    const [items] = await pool.query(
      `SELECT pi.cantidad, pi.precio_unitario,
              a.codigo, a.nombre, a.tipo
       FROM pedido_items pi
       JOIN arneses a ON a.id = pi.arnes_id
       WHERE pi.pedido_id = ?`,
      [req.params.id]
    );
    res.json({ ...pedido, items });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener detalle', error: err.message });
  }
});

router.get('/rastreo', async (req, res) => {
  const { folio, email } = req.query;

  if (!folio && !email) {
    return res.status(400).json({ message: 'Proporciona un folio o email.' });
  }

  try {
    let pedidos;

    if (folio) {
      const [rows] = await pool.query(
        `SELECT p.folio, p.estado, p.total, p.metodo_pago, p.fecha_pedido,
                c.nombre AS cliente_nombre
         FROM pedidos p
         JOIN clientes c ON c.id = p.cliente_id
         WHERE p.folio = ?`,
        [folio.trim()]
      );
      pedidos = rows;
    } else {
      const [clienteRows] = await pool.query(
        'SELECT id, nombre FROM clientes WHERE email = ?',
        [email.trim().toLowerCase()]
      );
      if (!clienteRows.length) {
        return res.status(404).json({ message: 'No se encontraron pedidos con ese email.' });
      }
      const [rows] = await pool.query(
        `SELECT folio, estado, total, metodo_pago, fecha_pedido
         FROM pedidos WHERE cliente_id = ?
         ORDER BY fecha_pedido DESC`,
        [clienteRows[0].id]
      );
      pedidos = rows.map(p => ({ ...p, cliente_nombre: clienteRows[0].nombre }));
    }

    if (!pedidos.length) {
      return res.status(404).json({ message: 'No se encontraron pedidos.' });
    }

    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ message: 'Error al rastrear pedido', error: err.message });
  }
});

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, telefono, direccion,
              ciudad, estado, activo, creado_en, ultimo_login
       FROM clientes
       ORDER BY creado_en DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener clientes', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, telefono, direccion,
              ciudad, estado, activo, creado_en, ultimo_login
       FROM clientes WHERE id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Cliente no encontrado.' });

    const [pedidos] = await pool.query(
      `SELECT id, folio, estado, total, metodo_pago, fecha_pedido
       FROM pedidos WHERE cliente_id = ?
       ORDER BY creado_en DESC`,
      [req.params.id]
    );

    res.json({ ...rows[0], pedidos });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

router.patch('/:id/estado', async (req, res) => {
  const { activo } = req.body;
  if (activo === undefined || (activo !== 0 && activo !== 1)) {
    return res.status(400).json({ message: 'El campo activo debe ser 0 o 1.' });
  }
  try {
    await pool.query('UPDATE clientes SET activo = ? WHERE id = ?', [activo, req.params.id]);
    res.json({ message: `Cliente ${activo === 1 ? 'activado' : 'desactivado'} correctamente.` });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar estado', error: err.message });
  }
});

export default router;
