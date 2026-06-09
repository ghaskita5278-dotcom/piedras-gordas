const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, categoria, descripcion, cantidad, unidad, valor, registrado_por, tipo_pago, firmado, created_at FROM gastos ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, categoria, descripcion, cantidad, unidad, valor, registrado_por, tipo_pago, firmado, created_at FROM gastos WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { categoria, descripcion, cantidad, unidad, valor, registrado_por, tipo_pago, firmado } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO gastos (categoria, descripcion, cantidad, unidad, valor, registrado_por, tipo_pago, firmado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [categoria, descripcion, cantidad, unidad, valor, registrado_por || null, tipo_pago || null, firmado ?? false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const { categoria, descripcion, cantidad, unidad, valor, registrado_por, tipo_pago, firmado } = req.body;
  try {
    const result = await pool.query(
      `UPDATE gastos
       SET categoria = $1, descripcion = $2, cantidad = $3, unidad = $4, valor = $5,
           registrado_por = $6, tipo_pago = $7, firmado = $8
       WHERE id = $9 RETURNING *`,
      [categoria, descripcion, cantidad, unidad, valor, registrado_por || null, tipo_pago || null, firmado ?? false, req.params.id]
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
