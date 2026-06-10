require('dotenv').config();
const express = require('express');
const cors = require('cors');

const gastosRouter = require('./routes/gastos');
const ventasRouter = require('./routes/ventas');
const trabajadoresRouter = require('./routes/trabajadores');
const sociosRouter = require('./routes/socios');
const transaccionesRouter = require('./routes/transacciones');
const aportesRouter = require('./routes/aportes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/gastos', gastosRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/trabajadores', trabajadoresRouter);
app.use('/api/socios', sociosRouter);
app.use('/api/transacciones', transaccionesRouter);
app.use('/api/aportes', aportesRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
