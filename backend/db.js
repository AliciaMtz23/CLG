import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host:     process.env.MYSQLHOST     || process.env.DB_HOST,
  user:     process.env.MYSQLUSER     || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port:     Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
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
