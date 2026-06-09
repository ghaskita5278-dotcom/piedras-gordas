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
  const { nombre, telefono_whatsapp } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO socios (nombre, telefono_whatsapp) VALUES ($1, $2) RETURNING *',
      [nombre, telefono_whatsapp]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const { nombre, telefono_whatsapp } = req.body;
  try {
    const result = await pool.query(
      'UPDATE socios SET nombre = $1, telefono_whatsapp = $2 WHERE id = $3 RETURNING *',
      [nombre, telefono_whatsapp, req.params.id]
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

// POST /:id/pagos — registra en transacciones y, si se envía obligacion_id, marca la obligación
// como pagada. Ambas escrituras van en una transacción atómica.
router.post('/:id/pagos', async (req, res, next) => {
  const { monto, tipo_pago, url_soporte, obligacion_id } = req.body;
  const socioId = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const socio = await client.query('SELECT * FROM socios WHERE id = $1', [socioId]);
    if (socio.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const txResult = await client.query(
      `INSERT INTO transacciones (socio_id, obligacion_id, monto, tipo_pago, url_soporte)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [socioId, obligacion_id || null, monto, tipo_pago, url_soporte || null]
    );

    if (obligacion_id) {
      await client.query(
        `UPDATE obligaciones SET estado = 'pagado' WHERE id = $1`,
        [obligacion_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(txResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
