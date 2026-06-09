const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /resumen — balance entre ingresos (ventas) y egresos (gastos + pagos a socios)
// Debe ir antes de GET /:id para no colisionar con la ruta parametrizada
router.get('/resumen', async (req, res, next) => {
  const { fecha_inicio, fecha_fin } = req.query;
  try {
    const params = [];
    const ventasCond = [];
    const gastosCond = [];
    const txCond = [];

    if (fecha_inicio) {
      params.push(fecha_inicio);
      const p = `$${params.length}`;
      ventasCond.push(`created_at >= ${p}`);
      gastosCond.push(`created_at >= ${p}`);
      txCond.push(`created_at >= ${p}`);
    }
    if (fecha_fin) {
      params.push(fecha_fin);
      const p = `$${params.length}`;
      ventasCond.push(`created_at <= ${p}`);
      gastosCond.push(`created_at <= ${p}`);
      txCond.push(`created_at <= ${p}`);
    }

    const wVentas = ventasCond.length ? `WHERE ${ventasCond.join(' AND ')}` : '';
    const wGastos = gastosCond.length ? `WHERE ${gastosCond.join(' AND ')}` : '';
    const wTx = txCond.length ? `WHERE ${txCond.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT
         (SELECT COALESCE(SUM(total_ingreso), 0) FROM ventas ${wVentas})       AS total_ingresos,
         (SELECT COALESCE(SUM(valor), 0)         FROM gastos ${wGastos})       AS total_gastos,
         (SELECT COALESCE(SUM(monto), 0)         FROM transacciones ${wTx})    AS total_pagos_socios,
         (SELECT COALESCE(SUM(total_ingreso), 0) FROM ventas ${wVentas})
           - (SELECT COALESCE(SUM(valor), 0) FROM gastos ${wGastos})
           - (SELECT COALESCE(SUM(monto), 0) FROM transacciones ${wTx})       AS balance`,
      params
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET / — lista con filtros opcionales: socio_id, obligacion_id, tipo_pago, fecha_inicio, fecha_fin
router.get('/', async (req, res, next) => {
  const { socio_id, obligacion_id, tipo_pago, fecha_inicio, fecha_fin } = req.query;
  try {
    const params = [];
    const condiciones = [];

    if (socio_id) {
      params.push(socio_id);
      condiciones.push(`socio_id = $${params.length}`);
    }
    if (obligacion_id) {
      params.push(obligacion_id);
      condiciones.push(`obligacion_id = $${params.length}`);
    }
    if (tipo_pago) {
      params.push(tipo_pago);
      condiciones.push(`tipo_pago = $${params.length}`);
    }
    if (fecha_inicio) {
      params.push(fecha_inicio);
      condiciones.push(`created_at >= $${params.length}`);
    }
    if (fecha_fin) {
      params.push(fecha_fin);
      condiciones.push(`created_at <= $${params.length}`);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM transacciones ${where} ORDER BY created_at DESC`,
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
