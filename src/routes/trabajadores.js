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
  const { nombre } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO trabajadores (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const { nombre } = req.body;
  try {
    const result = await pool.query(
      'UPDATE trabajadores SET nombre = $1 WHERE id = $2 RETURNING *',
      [nombre, req.params.id]
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

// POST /:id/pagos — registra un gasto con categoria='pago_trabajador' y marca la obligación como
// pagada si se envía obligacion_id. Ambas escrituras van en una transacción atómica.
router.post('/:id/pagos', async (req, res, next) => {
  const { descripcion, cantidad, unidad, valor, registrado_por, obligacion_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const trab = await client.query('SELECT * FROM trabajadores WHERE id = $1', [req.params.id]);
    if (trab.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    const gastoResult = await client.query(
      `INSERT INTO gastos (categoria, descripcion, cantidad, unidad, valor, registrado_por)
       VALUES ('pago_trabajador', $1, $2, $3, $4, $5) RETURNING *`,
      [descripcion || `Pago a ${trab.rows[0].nombre}`, cantidad, unidad, valor, registrado_por]
    );

    if (obligacion_id) {
      await client.query(
        `UPDATE obligaciones SET estado = 'pagado' WHERE id = $1`,
        [obligacion_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(gastoResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
