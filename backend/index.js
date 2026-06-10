import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

import authRoutes      from './routers/authRouters.js';
import arnesRoutes     from './routers/arnesRoutes.js';
import dashboardRoutes from './routers/dashboardRoutes.js';
import clientesRoutes  from './routers/Clientesroutes.js';
import adminsRoutes    from './routers/administradoresRoutes.js';
import pedidosRoutes   from './routers/pedidosRoutes.js';
import webhookRoutes   from './routers/webhookRoutes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

pool.query(`ALTER TABLE clientes ADD COLUMN google_id VARCHAR(255) NULL UNIQUE`).catch(() => {});
pool.query(`ALTER TABLE pedidos MODIFY COLUMN metodo_pago VARCHAR(20) NOT NULL`).catch(() => {});

const corsOrigin = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : true;

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);

app.get('/api/arneses-publicos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, codigo, nombre, imagen, descripcion, tipo, material,
              longitud_m, voltaje_max, precio, stock
       FROM arneses
       WHERE activo = 1 AND stock > 0
       ORDER BY nombre ASC`
    );
    const base = `${req.protocol}://${req.get('host')}`;
    const data = rows.map(r => ({
      ...r,
      imagen_url: r.imagen ? `${base}/uploads/arneses/${r.imagen}` : null,
    }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener catálogo', error: err.message });
  }
});

app.use('/api/arneses',        arnesRoutes);
app.use('/api/dashboard',      dashboardRoutes);
app.use('/api/clientes',       clientesRoutes);
app.use('/api/admins',         adminsRoutes);
app.use('/api/pedidos',        pedidosRoutes);
app.use('/api/webhooks',       webhookRoutes);

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});