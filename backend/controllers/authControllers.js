import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const loginAdministrador = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM administradores WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'El administrador no existe.' });
    }

    const admin = rows[0];

    if (!admin.activo) {
      return res.status(403).json({ message: 'Esta cuenta está desactivada. Contacta al superadmin.' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    await pool.query(
      'UPDATE administradores SET ultimo_login = NOW() WHERE id = ?',
      [admin.id]
    );

    const token = jwt.sign(
      { id: admin.id, email: admin.email, nombre: admin.nombre, rol: admin.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      admin: { id: admin.id, nombre: admin.nombre, email: admin.email, rol: admin.rol }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
};
