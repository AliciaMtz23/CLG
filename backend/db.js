import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
});

pool.getConnection()
  .then(conn => {
    console.log(`✅ Conectado a la base de datos: ${process.env.DB_NAME}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error de conexión a la base de datos:', err.message);
  });

export default pool;
