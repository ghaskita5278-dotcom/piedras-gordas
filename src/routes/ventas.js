const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM ventas ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM ventas WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { descripcion, monto, cliente, fecha } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ventaResult = await client.query(
      `INSERT INTO ventas (descripcion, monto, cliente, fecha)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [descripcion, monto, cliente, fecha || new Date()]
    );
    const venta = ventaResult.rows[0];

    await client.query(
      `INSERT INTO transacciones (tipo, monto, descripcion, referencia_id, referencia_tipo, fecha)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['ingreso', monto, descripcion, venta.id, 'venta', venta.fecha]
    );

    await client.query('COMMIT');
    res.status(201).json(venta);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res, next) => {
  const { descripcion, monto, cliente, fecha } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ventas SET descripcion = $1, monto = $2, cliente = $3, fecha = $4
       WHERE id = $5 RETURNING *`,
      [descripcion, monto, cliente, fecha, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM ventas WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json({ mensaje: 'Eliminada', venta: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
