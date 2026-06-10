import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [[{ totalPedidos }]]     = await pool.query(
      'SELECT COUNT(*) AS totalPedidos FROM pedidos'
    );
    const [[{ pedidosPendientes }]] = await pool.query(
      "SELECT COUNT(*) AS pedidosPendientes FROM pedidos WHERE estado = 'pendiente'"
    );
    const [[{ totalClientes }]]    = await pool.query(
      'SELECT COUNT(*) AS totalClientes FROM clientes WHERE activo = 1'
    );
    const [[{ arnesStock }]]       = await pool.query(
      'SELECT COALESCE(SUM(stock), 0) AS arnesStock FROM arneses WHERE activo = 1'
    );

    res.json({ totalPedidos, pedidosPendientes, totalClientes, arnesStock });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener estadísticas', error: err.message });
  }
});

router.get('/top-stock', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, codigo, nombre, tipo, stock, precio
       FROM arneses
       WHERE activo = 1
       ORDER BY stock DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener top stock', error: err.message });
  }
});

router.get('/pedidos-recientes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         p.id,
         p.folio,
         p.estado,
         p.total,
         p.fecha_pedido,
         p.metodo_pago,
         COALESCE(c.nombre, 'Cliente') AS cliente
       FROM pedidos p
       LEFT JOIN clientes c ON p.cliente_id = c.id
       ORDER BY p.creado_en DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener pedidos recientes', error: err.message });
  }
});

router.get('/pedidos-por-mes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(fecha_pedido, '%b') AS mes,
         DATE_FORMAT(fecha_pedido, '%Y-%m') AS periodo,
         COUNT(*) AS pedidos
       FROM pedidos
       WHERE fecha_pedido >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY periodo, mes
       ORDER BY periodo ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener tendencia', error: err.message });
  }
});

export default router;
