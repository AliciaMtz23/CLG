import express from 'express';
import pool from '../db.js';
import { enviarEmailPagoConfirmado } from '../services/emailService.js';

const router = express.Router();

router.post('/conekta', async (req, res) => {
  const { type, data } = req.body;

  if (!type) {
    return res.status(400).json({ message: 'Payload inválido.' });
  }

  if (type === 'webhook_ping') {
    return res.status(200).json({ ok: true });
  }

  if (!data || !data.object) {
    return res.status(400).json({ message: 'missing Data' });
  }

  const conektaOrderId = data.object.order_id || data.object.id;

  if (!conektaOrderId) {
    return res.status(400).json({ message: 'Sin order_id en el payload.' });
  }

  try {
    if (type === 'charge.paid') {
      await pool.query(
        `UPDATE pedidos SET estado = 'en_proceso'
         WHERE conekta_order_id = ? AND estado = 'pendiente'`,
        [conektaOrderId]
      );

      // Buscar datos del cliente para el email
      const [[pedido]] = await pool.query(
        `SELECT p.folio, p.total, c.nombre, c.email
         FROM pedidos p
         JOIN clientes c ON c.id = p.cliente_id
         WHERE p.conekta_order_id = ?`,
        [conektaOrderId]
      );

      if (pedido?.email) {
        await enviarEmailPagoConfirmado({
          email: pedido.email,
          nombre: pedido.nombre,
          folio: pedido.folio,
          total: `$${Number(pedido.total).toLocaleString('es-MX')} MXN`,
        }).catch(err => console.error('Email error:', err.message));
      }

    } else if (type === 'charge.expired') {
      await pool.query(
        `UPDATE pedidos SET estado = 'cancelado'
         WHERE conekta_order_id = ? AND estado = 'pendiente'`,
        [conektaOrderId]
      );
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ message: 'Error interno.' });
  }
});

export default router;
