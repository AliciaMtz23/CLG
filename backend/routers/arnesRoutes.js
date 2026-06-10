import express from 'express';
import fs from 'fs';
import pool from '../db.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, codigo, nombre, imagen, descripcion, tipo, material,
              longitud_m, voltaje_max, precio, stock, activo, creado_en
       FROM arneses
       WHERE activo = 1
       ORDER BY creado_en DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener arneses', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM arneses WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Arnés no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
});

router.post('/', upload.single('imagen'), async (req, res) => {
  const {
    codigo, nombre, descripcion, tipo,
    material, longitud_m, voltaje_max, precio, stock
  } = req.body;

  if (!codigo || !nombre) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Código y nombre son obligatorios.' });
  }

  try {
    const [existe] = await pool.query(
      'SELECT id FROM arneses WHERE codigo = ?',
      [codigo]
    );
    if (existe.length > 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Ya existe un arnés con ese código.' });
    }

    const imagenNombre = req.file ? req.file.filename : null;

    const [result] = await pool.query(
      `INSERT INTO arneses
         (codigo, nombre, imagen, descripcion, tipo, material,
          longitud_m, voltaje_max, precio, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nombre, imagenNombre, descripcion || null, tipo || null,
       material || null, longitud_m || null, voltaje_max || null,
       precio || 0, stock || 0]
    );

    const [nuevo] = await pool.query('SELECT * FROM arneses WHERE id = ?', [result.insertId]);
    res.status(201).json(nuevo[0]);

  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error al crear', error: err.message });
  }
});

router.put('/:id', upload.single('imagen'), async (req, res) => {
  const {
    nombre, descripcion, tipo, material,
    longitud_m, voltaje_max, precio, stock
  } = req.body;

  if (!nombre) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'El nombre es obligatorio.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT imagen FROM arneses WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Arnés no encontrado.' });
    }

    const imagenAnterior = rows[0].imagen;

    if (req.file && imagenAnterior) {
      const rutaAnterior = `uploads/arneses/${imagenAnterior}`;
      if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
    }

    const imagenFinal = req.file ? req.file.filename : imagenAnterior;

    await pool.query(
      `UPDATE arneses SET
         nombre      = ?,
         imagen      = ?,
         descripcion = ?,
         tipo        = ?,
         material    = ?,
         longitud_m  = ?,
         voltaje_max = ?,
         precio      = ?,
         stock       = ?
       WHERE id = ?`,
      [nombre, imagenFinal, descripcion || null, tipo || null,
       material || null, longitud_m || null, voltaje_max || null,
       precio || 0, stock || 0, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM arneses WHERE id = ?', [req.params.id]);
    res.json(updated[0]);

  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT imagen FROM arneses WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Arnés no encontrado.' });

    if (rows[0].imagen) {
      const ruta = `uploads/arneses/${rows[0].imagen}`;
      if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    }

    await pool.query('UPDATE arneses SET activo = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Arnés eliminado correctamente.' });

  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar', error: err.message });
  }
});

export default router;
