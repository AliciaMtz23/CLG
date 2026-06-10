import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// GET /api/admins — lista todos los administradores
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, rol, activo, ultimo_login
       FROM administradores
       ORDER BY rol DESC, nombre ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener administradores', error: err.message });
  }
});

// POST /api/admins — crear nuevo administrador (rol siempre 'admin')
router.post('/', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios.' });
  }
  try {
    const [existe] = await pool.query('SELECT id FROM administradores WHERE email = ?', [email]);
    if (existe.length) {
      return res.status(409).json({ message: 'Ya existe un administrador con ese email.' });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO administradores (nombre, email, password, rol, activo) VALUES (?, ?, ?, "admin", 1)',
      [nombre.trim(), email.trim().toLowerCase(), hash]
    );
    res.status(201).json({ message: 'Administrador creado correctamente.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear administrador', error: err.message });
  }
});

// PUT /api/admins/:id — editar nombre, email, contraseña (no superadmins)
router.put('/:id', async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ message: 'Nombre y email son obligatorios.' });
  }
  try {
    const [rows] = await pool.query('SELECT rol FROM administradores WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Administrador no encontrado.' });
    if (rows[0].rol === 'superadmin') {
      return res.status(403).json({ message: 'No se puede modificar una cuenta superadmin.' });
    }

    // Verificar email duplicado en otro admin
    const [dup] = await pool.query(
      'SELECT id FROM administradores WHERE email = ? AND id != ?',
      [email.trim().toLowerCase(), req.params.id]
    );
    if (dup.length) {
      return res.status(409).json({ message: 'Ese email ya está en uso por otro administrador.' });
    }

    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE administradores SET nombre = ?, email = ?, password = ? WHERE id = ?',
        [nombre.trim(), email.trim().toLowerCase(), hash, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE administradores SET nombre = ?, email = ? WHERE id = ?',
        [nombre.trim(), email.trim().toLowerCase(), req.params.id]
      );
    }
    res.json({ message: 'Administrador actualizado.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
});

// PATCH /api/admins/:id/estado — activar / desactivar (no superadmins)
router.patch('/:id/estado', async (req, res) => {
  const { activo } = req.body;
  if (activo === undefined || (activo !== 0 && activo !== 1)) {
    return res.status(400).json({ message: 'El campo activo debe ser 0 o 1.' });
  }
  try {
    const [rows] = await pool.query('SELECT rol FROM administradores WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Administrador no encontrado.' });
    if (rows[0].rol === 'superadmin') {
      return res.status(403).json({ message: 'No se puede modificar una cuenta superadmin.' });
    }
    await pool.query('UPDATE administradores SET activo = ? WHERE id = ?', [activo, req.params.id]);
    res.json({ message: `Cuenta ${activo === 1 ? 'activada' : 'desactivada'} correctamente.` });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar estado', error: err.message });
  }
});

export default router;
