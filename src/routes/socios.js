const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM socios ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM socios WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Socio no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { nombre, porcentaje } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO socios (nombre, porcentaje) VALUES ($1, $2) RETURNING *`,
      [nombre, porcentaje]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const { nombre, porcentaje } = req.body;
  try {
    const result = await pool.query(
      `UPDATE socios SET nombre = $1, porcentaje = $2 WHERE id = $3 RETURNING *`,
      [nombre, porcentaje, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Socio no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM socios WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Socio no encontrado' });
    res.json({ mensaje: 'Eliminado', socio: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /:id/pagos — registra pago en gastos (categoria='pago_socio'), actualiza obligación si se pasa
// obligacion_id, y registra en transacciones
router.post('/:id/pagos', async (req, res, next) => {
  const { monto, descripcion, fecha, obligacion_id } = req.body;
  const socioId = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const socioResult = await client.query('SELECT * FROM socios WHERE id = $1', [socioId]);
    if (socioResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const gastoResult = await client.query(
      `INSERT INTO gastos (descripcion, monto, categoria, socio_id, fecha)
       VALUES ($1, $2, 'pago_socio', $3, $4) RETURNING *`,
      [descripcion || `Pago a socio ${socioId}`, monto, socioId, fecha || new Date()]
    );
    const gasto = gastoResult.rows[0];

    if (obligacion_id) {
      await client.query(
        `UPDATE obligaciones SET monto_pagado = COALESCE(monto_pagado, 0) + $1,
         estado = CASE WHEN COALESCE(monto_pagado, 0) + $1 >= monto THEN 'pagado' ELSE 'parcial' END
         WHERE id = $2`,
        [monto, obligacion_id]
      );
    }

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
