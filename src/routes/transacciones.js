const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /resumen — debe ir antes de GET /:id para no colisionar
router.get('/resumen', async (req, res, next) => {
  const { fecha_inicio, fecha_fin } = req.query;
  try {
    const params = [];
    const condiciones = [];

    if (fecha_inicio) {
      params.push(fecha_inicio);
      condiciones.push(`fecha >= $${params.length}`);
    }
    if (fecha_fin) {
      params.push(fecha_fin);
      condiciones.push(`fecha <= $${params.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0) AS total_ingresos,
         COALESCE(SUM(CASE WHEN tipo = 'egreso'  THEN monto ELSE 0 END), 0) AS total_egresos,
         COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END), 0) AS balance
       FROM transacciones ${where}`,
      params
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET / — lista con filtros opcionales: tipo, fecha_inicio, fecha_fin, referencia_tipo
router.get('/', async (req, res, next) => {
  const { tipo, fecha_inicio, fecha_fin, referencia_tipo } = req.query;
  try {
    const params = [];
    const condiciones = [];

    if (tipo) {
      params.push(tipo);
      condiciones.push(`tipo = $${params.length}`);
    }
    if (referencia_tipo) {
      params.push(referencia_tipo);
      condiciones.push(`referencia_tipo = $${params.length}`);
    }
    if (fecha_inicio) {
      params.push(fecha_inicio);
      condiciones.push(`fecha >= $${params.length}`);
    }
    if (fecha_fin) {
      params.push(fecha_fin);
      condiciones.push(`fecha <= $${params.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT * FROM transacciones ${where} ORDER BY fecha DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM transacciones WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transacción no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
