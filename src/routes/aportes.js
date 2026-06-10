const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET / — lista todos los aportes con nombre del socio (y del receptor si aplica)
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        a.*,
        s.nombre  AS socio_nombre,
        sr.nombre AS socio_receptor_nombre
      FROM aportes_socios a
      JOIN socios s  ON s.id  = a.socio_id
      LEFT JOIN socios sr ON sr.id = a.socio_receptor_id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /resumen — balance por socio (debe ir antes de /:id)
router.get('/resumen', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id                                                                AS socio_id,
        s.nombre                                                            AS socio_nombre,
        COALESCE(SUM(CASE WHEN a.tipo = 'aporte'     THEN a.monto END), 0) AS total_aportado,
        COALESCE(SUM(CASE WHEN a.tipo = 'prestamo'   THEN a.monto END), 0) AS total_prestado,
        COALESCE(SUM(CASE WHEN a.tipo = 'devolucion' THEN a.monto END), 0) AS total_devuelto,
        COALESCE(SUM(CASE WHEN a.tipo = 'aporte'     THEN  a.monto
                          WHEN a.tipo = 'devolucion' THEN -a.monto
                          ELSE 0 END), 0)                                   AS saldo_pendiente
      FROM socios s
      LEFT JOIN aportes_socios a ON a.socio_id = s.id
      GROUP BY s.id, s.nombre
      ORDER BY s.nombre ASC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /:id — detalle de un aporte
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        a.*,
        s.nombre  AS socio_nombre,
        sr.nombre AS socio_receptor_nombre
      FROM aportes_socios a
      JOIN socios s  ON s.id  = a.socio_id
      LEFT JOIN socios sr ON sr.id = a.socio_receptor_id
      WHERE a.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aporte no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST / — registrar aporte, préstamo o devolución
router.post('/', async (req, res, next) => {
  const {
    socio_id,
    tipo,              // 'aporte' | 'prestamo' | 'devolucion'
    monto,
    descripcion,
    socio_receptor_id, // opcional: socio que recibe (préstamo entre socios)
    fecha_devolucion,  // opcional: fecha pactada de devolución
    url_soporte,       // opcional: comprobante
  } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO aportes_socios
        (socio_id, tipo, monto, descripcion, socio_receptor_id, fecha_devolucion, url_soporte, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente')
      RETURNING *
    `, [
      socio_id,
      tipo,
      monto,
      descripcion        || null,
      socio_receptor_id  || null,
      fecha_devolucion   || null,
      url_soporte        || null,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /:id/devolver — marca un préstamo como devuelto
router.put('/:id/devolver', async (req, res, next) => {
  try {
    const result = await pool.query(`
      UPDATE aportes_socios
      SET estado = 'devuelto'
      WHERE id = $1 AND tipo = 'prestamo'
      RETURNING *
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Préstamo no encontrado o el registro no es de tipo préstamo' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
