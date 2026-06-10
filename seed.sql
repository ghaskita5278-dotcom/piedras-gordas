-- ============================================================
-- SEED  Piedras Gordas — datos reales enero-abril 2026
-- Ejecutar en Supabase SQL Editor o con psql
-- ============================================================

-- ── PARTE 1: Limpiar datos de prueba ─────────────────────────

DELETE FROM aportes_socios;
DELETE FROM transacciones;
DELETE FROM gastos;
DELETE FROM ventas;


-- ── PARTE 2: Datos reales ────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- APORTES (tabla aportes_socios)
-- ─────────────────────────────────────────────────────────────

INSERT INTO aportes_socios (socio_id, tipo, monto, estado, created_at) VALUES

-- 10-ene: $160.000 c/u
((SELECT id FROM socios WHERE nombre ILIKE '%william%'    LIMIT 1), 'aporte', 160000,  'pendiente', '2026-01-10 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%cesar%'      LIMIT 1), 'aporte', 160000,  'pendiente', '2026-01-10 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%camilo%'     LIMIT 1), 'aporte', 160000,  'pendiente', '2026-01-10 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%juan pablo%' LIMIT 1), 'aporte', 160000,  'pendiente', '2026-01-10 08:00:00'),

-- 13-ene: $191.250 c/u
((SELECT id FROM socios WHERE nombre ILIKE '%cesar%'      LIMIT 1), 'aporte', 191250,  'pendiente', '2026-01-13 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%camilo%'     LIMIT 1), 'aporte', 191250,  'pendiente', '2026-01-13 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%william%'    LIMIT 1), 'aporte', 191250,  'pendiente', '2026-01-13 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%juan pablo%' LIMIT 1), 'aporte', 191250,  'pendiente', '2026-01-13 08:00:00'),

-- 18-ene: $125.000 c/u
((SELECT id FROM socios WHERE nombre ILIKE '%william%'    LIMIT 1), 'aporte', 125000,  'pendiente', '2026-01-18 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%cesar%'      LIMIT 1), 'aporte', 125000,  'pendiente', '2026-01-18 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%camilo%'     LIMIT 1), 'aporte', 125000,  'pendiente', '2026-01-18 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%juan pablo%' LIMIT 1), 'aporte', 125000,  'pendiente', '2026-01-18 08:00:00'),

-- 25-ene: $125.000 c/u
((SELECT id FROM socios WHERE nombre ILIKE '%william%'    LIMIT 1), 'aporte', 125000,  'pendiente', '2026-01-25 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%cesar%'      LIMIT 1), 'aporte', 125000,  'pendiente', '2026-01-25 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%camilo%'     LIMIT 1), 'aporte', 125000,  'pendiente', '2026-01-25 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%juan pablo%' LIMIT 1), 'aporte', 125000,  'pendiente', '2026-01-25 08:00:00'),

-- 31-ene: $100.000 c/u
((SELECT id FROM socios WHERE nombre ILIKE '%william%'    LIMIT 1), 'aporte', 100000,  'pendiente', '2026-01-31 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%cesar%'      LIMIT 1), 'aporte', 100000,  'pendiente', '2026-01-31 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%camilo%'     LIMIT 1), 'aporte', 100000,  'pendiente', '2026-01-31 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%juan pablo%' LIMIT 1), 'aporte', 100000,  'pendiente', '2026-01-31 08:00:00'),

-- 14-feb
((SELECT id FROM socios WHERE nombre ILIKE '%william%'    LIMIT 1), 'aporte', 1030000, 'pendiente', '2026-02-14 08:00:00'),

-- 11-abr: $140.000 c/u
((SELECT id FROM socios WHERE nombre ILIKE '%william%'    LIMIT 1), 'aporte', 140000,  'pendiente', '2026-04-11 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%cesar%'      LIMIT 1), 'aporte', 140000,  'pendiente', '2026-04-11 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%juan pablo%' LIMIT 1), 'aporte', 140000,  'pendiente', '2026-04-11 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%camilo%'     LIMIT 1), 'aporte', 140000,  'pendiente', '2026-04-11 08:00:00'),

-- 16-abr
((SELECT id FROM socios WHERE nombre ILIKE '%camilo%'     LIMIT 1), 'aporte', 237000,  'pendiente', '2026-04-16 08:00:00'),

-- 26-abr
((SELECT id FROM socios WHERE nombre ILIKE '%william%'    LIMIT 1), 'aporte', 400000,  'pendiente', '2026-04-26 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%camilo%'     LIMIT 1), 'aporte', 345000,  'pendiente', '2026-04-26 08:00:00'),
((SELECT id FROM socios WHERE nombre ILIKE '%juan pablo%' LIMIT 1), 'aporte', 345000,  'pendiente', '2026-04-26 08:00:00'),

-- 27-abr
((SELECT id FROM socios WHERE nombre ILIKE '%cesar%'      LIMIT 1), 'aporte', 345000,  'pendiente', '2026-04-27 08:00:00');


-- ─────────────────────────────────────────────────────────────
-- VENTAS
-- ─────────────────────────────────────────────────────────────

INSERT INTO ventas
  (producto, kilos_primera, precio_primera, kilos_segunda, precio_segunda,
   kilos_tercera, precio_tercera, total_ingreso, created_at)
VALUES
--  04-feb
('aguacate', 160, 8200,  80, 6000, NULL, NULL, 1792000, '2026-02-04 08:00:00'),
--  09-feb
('aguacate',  42, 8000, NULL, NULL, NULL, NULL,  336000, '2026-02-09 08:00:00'),
--  02-mar
('aguacate', 200, 6500,  80, 4500, NULL, NULL, 1660000, '2026-03-02 08:00:00'),
--  09-mar
('aguacate', 280, 8500,  62, 5500, NULL, NULL, 2721000, '2026-03-09 08:00:00'),
--  16-mar
('aguacate',  61, 6000,  12, 4000, NULL, NULL,  414000, '2026-03-16 08:00:00'),
--  26-mar
('aguacate', 177, 7500,  50, 5500, NULL, NULL, 1602500, '2026-03-26 08:00:00'),
--  06-abr
('aguacate', 170, 8300, 100, 6000, NULL, NULL, 2011000, '2026-04-06 08:00:00'),
--  30-abr
('aguacate',  90, 9500,  35, 7000, NULL, NULL, 1100000, '2026-04-30 08:00:00');


-- ─────────────────────────────────────────────────────────────
-- GASTOS — pago trabajador (Arley Castro Cruz, id = 1)
-- ─────────────────────────────────────────────────────────────

INSERT INTO gastos
  (categoria, descripcion, valor, registrado_por, tipo_pago, firmado, created_at)
VALUES
('pago_trabajador', 'Arley Castro Cruz',  640000, 1, 'efectivo', false, '2026-01-10 09:00:00'),
('pago_trabajador', 'Arley Castro Cruz',  500000, 1, 'efectivo', false, '2026-01-18 09:00:00'),
('pago_trabajador', 'Arley Castro Cruz',  500000, 1, 'efectivo', false, '2026-01-25 09:00:00'),
('pago_trabajador', 'Arley Castro Cruz',  500000, 1, 'efectivo', false, '2026-02-07 09:00:00'),
('pago_trabajador', 'Arley Castro Cruz',  310000, 1, 'efectivo', false, '2026-02-15 09:00:00'),
('pago_trabajador', 'Arley Castro Cruz', 1100000, 1, 'efectivo', false, '2026-03-02 09:00:00'),
('pago_trabajador', 'Arley Castro Cruz', 1220000, 1, 'efectivo', false, '2026-03-29 09:00:00'),
('pago_trabajador', 'Arley Castro Cruz',  820000, 1, 'efectivo', false, '2026-04-11 09:00:00'),
('pago_trabajador', 'Arley Castro Cruz',  900000, 1, 'efectivo', false, '2026-04-28 09:00:00');


-- ─────────────────────────────────────────────────────────────
-- GASTOS — insumos
-- ─────────────────────────────────────────────────────────────

INSERT INTO gastos
  (categoria, descripcion, valor, registrado_por, tipo_pago, firmado, created_at)
VALUES
-- 13-ene
('insumos', 'Compra veneno y abono',             765400, NULL, 'efectivo', false, '2026-01-13 09:00:00'),

-- 05-feb (múltiples compras mismo día — minutos distintos para conservar orden)
('insumos', 'Veneno fumigar',                    380000, NULL, 'efectivo', false, '2026-02-05 09:00:00'),
('insumos', 'Veneno hormigas',                    44000, NULL, 'efectivo', false, '2026-02-05 09:01:00'),
('insumos', 'Gasolina',                           85000, NULL, 'efectivo', false, '2026-02-05 09:02:00'),
('insumos', 'Aceite',                             32000, NULL, 'efectivo', false, '2026-02-05 09:03:00'),
('insumos', 'Veneno fumiga',                     370000, NULL, 'efectivo', false, '2026-02-05 09:04:00'),
('insumos', 'Gasolina',                           85000, NULL, 'efectivo', false, '2026-02-05 09:05:00'),
('insumos', 'Veneno fumiga',                      80000, NULL, 'efectivo', false, '2026-02-05 09:06:00'),

-- 14-feb
('insumos', 'Melata',                             45000, NULL, 'efectivo', false, '2026-02-14 09:00:00'),

-- 03-mar
('insumos', 'Agrocentro fumiga plaga',           412000, NULL, 'efectivo', false, '2026-03-03 09:00:00'),
('insumos', 'Gasolina',                           97015, NULL, 'efectivo', false, '2026-03-03 09:01:00'),

-- 11-mar
('insumos', 'Compra abono',                     2435000, NULL, 'efectivo', false, '2026-03-11 09:00:00'),
('insumos', 'Flete laguneta abono',               40000, NULL, 'efectivo', false, '2026-03-11 09:01:00'),
('insumos', 'Cable guadaña',                      36000, NULL, 'efectivo', false, '2026-03-11 09:02:00'),
('insumos', 'Veneno hormigas',                    22000, NULL, 'efectivo', false, '2026-03-11 09:03:00'),

-- 18-mar
('insumos', 'Compra AgroMoana abono',            612000, NULL, 'efectivo', false, '2026-03-18 09:00:00'),

-- 19-mar
('insumos', 'Gasolina moto',                      30000, NULL, 'efectivo', false, '2026-03-19 09:00:00'),
('insumos', 'Gasolina bidón',                     70000, NULL, 'efectivo', false, '2026-03-19 09:01:00'),

-- 20-mar
('insumos', 'Aceite estacionaria',                32000, NULL, 'efectivo', false, '2026-03-20 09:00:00'),
('insumos', 'Yoyo guadaña',                       50000, NULL, 'efectivo', false, '2026-03-20 09:01:00'),
('insumos', 'Aceite guadaña',                     25000, NULL, 'efectivo', false, '2026-03-20 09:02:00'),

-- 08-abr
('insumos', 'Abono',                              88000, NULL, 'efectivo', false, '2026-04-08 09:00:00'),
('insumos', 'Abono HidroComplex',                499400, NULL, 'efectivo', false, '2026-04-08 09:01:00'),

-- 09-abr
('insumos', 'Compra Alga 600',                   222000, NULL, 'efectivo', false, '2026-04-09 09:00:00'),
('insumos', 'Compra veneno monte',               423000, NULL, 'efectivo', false, '2026-04-09 09:01:00'),
('insumos', 'Compra abono aguacate',             264000, NULL, 'efectivo', false, '2026-04-09 09:02:00'),
('insumos', 'Miel de purga',                      96000, NULL, 'efectivo', false, '2026-04-09 09:03:00'),

-- 28-abr
('insumos', 'Compra veneno monte',               400000, NULL, 'efectivo', false, '2026-04-28 09:00:00'),
('insumos', 'Compra gasolina',                    80000, NULL, 'efectivo', false, '2026-04-28 09:01:00'),

-- 30-abr
('insumos', 'Ducha, uniones, llave manguera',     66000, NULL, 'efectivo', false, '2026-04-30 09:00:00'),
('insumos', 'Mascara, llave, pala, cinta teflon', 39500, NULL, 'efectivo', false, '2026-04-30 09:01:00'),
('insumos', 'Venenos plaga, calcio y boro',       905000, NULL, 'efectivo', false, '2026-04-30 09:02:00'),
('insumos', 'Compra gasolina',                     80000, NULL, 'efectivo', false, '2026-04-30 09:03:00');


-- ─────────────────────────────────────────────────────────────
-- GASTOS — otros
-- ─────────────────────────────────────────────────────────────

INSERT INTO gastos
  (categoria, descripcion, valor, registrado_por, tipo_pago, firmado, created_at)
VALUES
-- 09-mar
('otro', 'Pago doña Nelly almuerzo',  100000, NULL, 'efectivo', false, '2026-03-09 09:00:00'),
-- 16-abr
('otro', 'Pago predial Buenos Aires', 237000, NULL, 'efectivo', false, '2026-04-16 09:00:00');


-- ─────────────────────────────────────────────────────────────
-- Verificación rápida (opcional — comentar antes de ejecutar
-- en producción si no se quieren resultados en el log)
-- ─────────────────────────────────────────────────────────────
/*
SELECT 'aportes'     AS tabla, COUNT(*) FROM aportes_socios
UNION ALL
SELECT 'ventas',              COUNT(*) FROM ventas
UNION ALL
SELECT 'gastos',              COUNT(*) FROM gastos;
*/
