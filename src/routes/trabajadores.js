const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM trabajadores ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM trabajadores WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { nombre, cargo, salario } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO trabajadores (nombre, cargo, salario) VALUES ($1, $2, $3) RETURNING *`,
      [nombre, cargo, salario]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const { nombre, cargo, salario } = req.body;
  try {
    const result = await pool.query(
      `UPDATE trabajadores SET nombre = $1, cargo = $2, salario = $3 WHERE id = $4 RETURNING *`,
      [nombre, cargo, salario, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM trabajadores WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json({ mensaje: 'Eliminado', trabajador: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /:id/pagos — registra pago en gastos (categoria='pago_trabajador') y en transacciones
router.post('/:id/pagos', async (req, res, next) => {
  const { monto, descripcion, fecha } = req.body;
  const trabajadorId = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const trabajadorResult = await client.query('SELECT * FROM trabajadores WHERE id = $1', [trabajadorId]);
    if (trabajadorResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    const gastoResult = await client.query(
      `INSERT INTO gastos (descripcion, monto, categoria, trabajador_id, fecha)
       VALUES ($1, $2, 'pago_trabajador', $3, $4) RETURNING *`,
      [descripcion || `Pago a trabajador ${trabajadorId}`, monto, trabajadorId, fecha || new Date()]
    );
    const gasto = gastoResult.rows[0];

    await client.query(
      `INSERT INTO transacciones (tipo, monto, descripcion, referencia_id, referencia_tipo, fecha)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['egreso', monto, gasto.descripcion, gasto.id, 'gasto', gasto.fecha]
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

module.exports = router;
