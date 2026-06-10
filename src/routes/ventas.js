const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res, next) => {
  const { desde, hasta } = req.query;
  const params = [];
  const conds = [];
  if (desde) { params.push(desde); conds.push(`created_at::date >= $${params.length}::date`); }
  if (hasta) { params.push(hasta); conds.push(`created_at::date <= $${params.length}::date`); }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  try {
    const result = await pool.query(
      `SELECT * FROM ventas ${where} ORDER BY created_at DESC`,
      params
    );
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
  const {
    producto,
    kilos_primera, precio_primera,
    kilos_segunda, precio_segunda,
    total_ingreso, registrado_por,
  } = req.body;
  const rp = registrado_por || null;
  try {
    const result = await pool.query(
      `INSERT INTO ventas
         (producto, kilos_primera, precio_primera, kilos_segunda, precio_segunda, total_ingreso${rp ? ', registrado_por' : ''})
       VALUES ($1, $2, $3, $4, $5, $6${rp ? ', $7' : ''}) RETURNING *`,
      rp
        ? [producto, kilos_primera, precio_primera, kilos_segunda, precio_segunda, total_ingreso, rp]
        : [producto, kilos_primera, precio_primera, kilos_segunda, precio_segunda, total_ingreso]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const {
    producto,
    kilos_primera, precio_primera,
    kilos_segunda, precio_segunda,
    total_ingreso, registrado_por,
  } = req.body;
  const rp = registrado_por || null;
  try {
    const result = await pool.query(
      `UPDATE ventas
       SET producto = $1, kilos_primera = $2, precio_primera = $3,
           kilos_segunda = $4, precio_segunda = $5, total_ingreso = $6,
           registrado_por = $7
       WHERE id = $8 RETURNING *`,
      [producto, kilos_primera, precio_primera, kilos_segunda, precio_segunda, total_ingreso, rp, req.params.id]
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
