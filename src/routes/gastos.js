const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM gastos ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM gastos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { descripcion, monto, categoria, fecha } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gastoResult = await client.query(
      `INSERT INTO gastos (descripcion, monto, categoria, fecha)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [descripcion, monto, categoria, fecha || new Date()]
    );
    const gasto = gastoResult.rows[0];

    await client.query(
      `INSERT INTO transacciones (tipo, monto, descripcion, referencia_id, referencia_tipo, fecha)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['egreso', monto, descripcion, gasto.id, 'gasto', gasto.fecha]
    );

    await client.query('COMMIT');
    res.status(201).json(gasto);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res, next) => {
  const { descripcion, monto, categoria, fecha } = req.body;
  try {
    const result = await pool.query(
      `UPDATE gastos SET descripcion = $1, monto = $2, categoria = $3, fecha = $4
       WHERE id = $5 RETURNING *`,
      [descripcion, monto, categoria, fecha, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM gastos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json({ mensaje: 'Eliminado', gasto: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
