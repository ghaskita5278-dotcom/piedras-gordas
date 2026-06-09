const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: 'postgresql://postgres.pxpmpptxsihlnlrpqlcn:X0YrizWuRwI2xx04@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: false
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conexión exitosa. Hora del servidor:', result.rows[0].now);
  }
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensaje: '¡Piedras Gordas funcionando!', hora_servidor: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});
