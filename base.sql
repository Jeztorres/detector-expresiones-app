-- =====================================================
--  Esquema y Tablas (buffer + histórico)
-- =====================================================
CREATE SCHEMA IF NOT EXISTS `gestos_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gestos_db`;

-- ---------- Tablas BUFFER (se recortan a 10) ----------
CREATE TABLE IF NOT EXISTS `parpadeos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `estado` VARCHAR(50) NOT NULL,              -- 'cerrado' | 'abierto'
  `fecha_hora` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parpadeos_estado` (`estado`),
  KEY `idx_parpadeos_fecha` (`fecha_hora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cejas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `estado` VARCHAR(50) NOT NULL,              -- 'arqueadas' | 'normal'
  `fecha_hora` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cejas_estado` (`estado`),
  KEY `idx_cejas_fecha` (`fecha_hora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `boca` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `estado` VARCHAR(50) NOT NULL,              -- 'abierta' | 'cerrada'
  `fecha_hora` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_boca_estado` (`estado`),
  KEY `idx_boca_fecha` (`fecha_hora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Tablas HISTÓRICAS (guardan TODO) ----------
CREATE TABLE IF NOT EXISTS `parpadeos_hist` LIKE `parpadeos`;
CREATE TABLE IF NOT EXISTS `cejas_hist`     LIKE `cejas`;
CREATE TABLE IF NOT EXISTS `boca_hist`      LIKE `boca`;

-- =====================================================
--  Stored Procedures de Inserción (cuando cambia estado)
-- =====================================================
DELIMITER $$

-- ========= PARPADEO =========
DROP PROCEDURE IF EXISTS `sp_insertar_estado_parpadeo` $$
CREATE PROCEDURE `sp_insertar_estado_parpadeo`(IN p_estado VARCHAR(50))
BEGIN
  DECLARE v_last VARCHAR(50) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_last = NULL;

  SELECT estado INTO v_last
  FROM parpadeos_hist
  ORDER BY fecha_hora DESC, id DESC
  LIMIT 1;

  IF v_last IS NULL OR v_last <> p_estado THEN
    INSERT INTO `parpadeos_hist` (`estado`) VALUES (p_estado);
    INSERT INTO `parpadeos`      (`estado`) VALUES (p_estado);

    DELETE FROM `parpadeos`
    WHERE id NOT IN (
      SELECT * FROM (
        SELECT id FROM `parpadeos`
        ORDER BY `fecha_hora` DESC, `id` DESC
        LIMIT 10
      ) AS t
    );
  END IF;
END $$

-- ========= CEJAS =========
DROP PROCEDURE IF EXISTS `sp_insertar_estado_ceja` $$
CREATE PROCEDURE `sp_insertar_estado_ceja`(IN p_estado VARCHAR(50))
BEGIN
  DECLARE v_last VARCHAR(50) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_last = NULL;

  SELECT estado INTO v_last
  FROM cejas_hist
  ORDER BY fecha_hora DESC, id DESC
  LIMIT 1;

  IF v_last IS NULL OR v_last <> p_estado THEN
    INSERT INTO `cejas_hist` (`estado`) VALUES (p_estado);
    INSERT INTO `cejas`      (`estado`) VALUES (p_estado);

    DELETE FROM `cejas`
    WHERE id NOT IN (
      SELECT * FROM (
        SELECT id FROM `cejas`
        ORDER BY `fecha_hora` DESC, `id` DESC
        LIMIT 10
      ) AS t
    );
  END IF;
END $$

-- ========= BOCA =========
DROP PROCEDURE IF EXISTS `sp_insertar_estado_boca` $$
CREATE PROCEDURE `sp_insertar_estado_boca`(IN p_estado VARCHAR(50))
BEGIN
  DECLARE v_last VARCHAR(50) DEFAULT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_last = NULL;

  SELECT estado INTO v_last
  FROM boca_hist
  ORDER BY fecha_hora DESC, id DESC
  LIMIT 1;

  IF v_last IS NULL OR v_last <> p_estado THEN
    INSERT INTO `boca_hist` (`estado`) VALUES (p_estado);
    INSERT INTO `boca`      (`estado`) VALUES (p_estado);

    DELETE FROM `boca`
    WHERE id NOT IN (
      SELECT * FROM (
        SELECT id FROM `boca`
        ORDER BY `fecha_hora` DESC, `id` DESC
        LIMIT 10
      ) AS t
    );
  END IF;
END $$
DELIMITER ;

-- =====================================================
--  SP utilitario: resolver ventana fechas
-- =====================================================
DELIMITER $$
DROP PROCEDURE IF EXISTS _resolver_ventana_fecha $$
CREATE PROCEDURE _resolver_ventana_fecha(
  IN  p_rango VARCHAR(10),
  IN  p_desde DATE,
  IN  p_hasta DATE,
  OUT v_ini   DATETIME,
  OUT v_fin   DATETIME
)
BEGIN
  IF p_rango = 'hoy' THEN
    SET v_ini = CONCAT(CURDATE(), ' 00:00:00');
    SET v_fin = DATE_ADD(CURDATE(), INTERVAL 1 DAY);
  ELSEIF p_rango = '7' THEN
    SET v_ini = CONCAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), ' 00:00:00');
    SET v_fin = DATE_ADD(CURDATE(), INTERVAL 1 DAY);
  ELSEIF p_rango = '30' THEN
    SET v_ini = CONCAT(DATE_SUB(CURDATE(), INTERVAL 29 DAY), ' 00:00:00');
    SET v_fin = DATE_ADD(CURDATE(), INTERVAL 1 DAY);
  ELSE
    SET v_ini = CONCAT(p_desde, ' 00:00:00');
    SET v_fin = DATE_ADD(p_hasta, INTERVAL 1 DAY);
  END IF;
END $$
DELIMITER ;

-- =====================================================
--  SPs de resumen por gesto con rango
-- =====================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_resumen_boca_rango $$
CREATE PROCEDURE sp_resumen_boca_rango(IN p_rango VARCHAR(10), IN p_desde DATE, IN p_hasta DATE)
BEGIN
  DECLARE v_ini DATETIME; DECLARE v_fin DATETIME;
  CALL _resolver_ventana_fecha(p_rango, p_desde, p_hasta, v_ini, v_fin);

  SELECT DATE(fecha_hora) AS fecha,
         SUM(estado='abierta') AS abierta,
         SUM(estado='cerrada') AS cerrada
  FROM boca_hist
  WHERE fecha_hora >= v_ini AND fecha_hora < v_fin
  GROUP BY DATE(fecha_hora)
  ORDER BY fecha;
END $$

DROP PROCEDURE IF EXISTS sp_resumen_cejas_rango $$
CREATE PROCEDURE sp_resumen_cejas_rango(IN p_rango VARCHAR(10), IN p_desde DATE, IN p_hasta DATE)
BEGIN
  DECLARE v_ini DATETIME; DECLARE v_fin DATETIME;
  CALL _resolver_ventana_fecha(p_rango, p_desde, p_hasta, v_ini, v_fin);

  SELECT DATE(fecha_hora) AS fecha,
         SUM(estado='arqueadas') AS arqueadas,
         SUM(estado='normal')    AS normal
  FROM cejas_hist
  WHERE fecha_hora >= v_ini AND fecha_hora < v_fin
  GROUP BY DATE(fecha_hora)
  ORDER BY fecha;
END $$

DROP PROCEDURE IF EXISTS sp_resumen_parpadeo_rango $$
CREATE PROCEDURE sp_resumen_parpadeo_rango(IN p_rango VARCHAR(10), IN p_desde DATE, IN p_hasta DATE)
BEGIN
  DECLARE v_ini DATETIME; DECLARE v_fin DATETIME;
  CALL _resolver_ventana_fecha(p_rango, p_desde, p_hasta, v_ini, v_fin);

  SELECT DATE(fecha_hora) AS fecha,
         SUM(estado='cerrado') AS cerrado,
         SUM(estado='abierto') AS abierto
  FROM parpadeos_hist
  WHERE fecha_hora >= v_ini AND fecha_hora < v_fin
  GROUP BY DATE(fecha_hora)
  ORDER BY fecha;
END $$
DELIMITER ;

-- =====================================================
--  Vistas por gesto (histórico completo)
-- =====================================================
CREATE OR REPLACE VIEW vw_boca_por_fecha AS
SELECT DATE(fecha_hora) AS fecha,
       SUM(estado='abierta') AS abierta,
       SUM(estado='cerrada') AS cerrada
FROM boca_hist
GROUP BY DATE(fecha_hora);

CREATE OR REPLACE VIEW vw_cejas_por_fecha AS
SELECT DATE(fecha_hora) AS fecha,
       SUM(estado='arqueadas') AS arqueadas,
       SUM(estado='normal')    AS normal
FROM cejas_hist
GROUP BY DATE(fecha_hora);

CREATE OR REPLACE VIEW vw_parpadeo_por_fecha AS
SELECT DATE(fecha_hora) AS fecha,
       SUM(estado='cerrado') AS cerrado,
       SUM(estado='abierto') AS abierto
FROM parpadeos_hist
GROUP BY DATE(fecha_hora);

-- =====================================================
--  Vista unificada (los 3 gestos por fecha)
-- =====================================================
CREATE OR REPLACE VIEW vw_gestos_por_fecha AS
WITH
boca AS (
  SELECT DATE(fecha_hora) d,
         SUM(estado='abierta') AS boca_abierta,
         SUM(estado='cerrada') AS boca_cerrada
  FROM boca_hist
  GROUP BY DATE(fecha_hora)
),
cejas AS (
  SELECT DATE(fecha_hora) d,
         SUM(estado='arqueadas') AS cejas_arqueadas,
         SUM(estado='normal')    AS cejas_normal
  FROM cejas_hist
  GROUP BY DATE(fecha_hora)
),
parp AS (
  SELECT DATE(fecha_hora) d,
         SUM(estado='cerrado') AS parp_cerrado,
         SUM(estado='abierto') AS parp_abierto
  FROM parpadeos_hist
  GROUP BY DATE(fecha_hora)
),
dias AS (
  SELECT d FROM (
    SELECT DATE(fecha_hora) d FROM boca_hist
    UNION
    SELECT DATE(fecha_hora) d FROM cejas_hist
    UNION
    SELECT DATE(fecha_hora) d FROM parpadeos_hist
  ) u
)
SELECT
  dias.d AS fecha,
  COALESCE(boca.boca_abierta,0)  AS boca_abierta,
  COALESCE(boca.boca_cerrada,0)  AS boca_cerrada,
  COALESCE(cejas.cejas_arqueadas,0) AS cejas_arqueadas,
  COALESCE(cejas.cejas_normal,0)    AS cejas_normal,
  COALESCE(parp.parp_cerrado,0)  AS parpadeo_cerrado,
  COALESCE(parp.parp_abierto,0)  AS parpadeo_abierto
FROM dias
LEFT JOIN boca ON boca.d = dias.d
LEFT JOIN cejas ON cejas.d = dias.d
LEFT JOIN parp ON parp.d = dias.d;

-- =====================================================
--  Vistas rápidas de totales (hoy, 7, 30)
-- =====================================================
CREATE OR REPLACE VIEW vw_gestos_hoy AS
SELECT
  'hoy' AS rango,
  SUM(b.estado='abierta') AS boca_abierta,
  SUM(b.estado='cerrada') AS boca_cerrada,
  SUM(c.estado='arqueadas') AS cejas_arqueadas,
  SUM(c.estado='normal')    AS cejas_normal,
  SUM(p.estado='cerrado') AS parpadeo_cerrado,
  SUM(p.estado='abierto') AS parpadeo_abierto
FROM boca_hist b, cejas_hist c, parpadeos_hist p
WHERE DATE(b.fecha_hora)=CURDATE()
  AND DATE(c.fecha_hora)=CURDATE()
  AND DATE(p.fecha_hora)=CURDATE();

CREATE OR REPLACE VIEW vw_gestos_ultimos_7 AS
SELECT
  'ultimos_7' AS rango,
  SUM(b.estado='abierta') AS boca_abierta,
  SUM(b.estado='cerrada') AS boca_cerrada,
  SUM(c.estado='arqueadas') AS cejas_arqueadas,
  SUM(c.estado='normal')    AS cejas_normal,
  SUM(p.estado='cerrado') AS parpadeo_cerrado,
  SUM(p.estado='abierto') AS parpadeo_abierto
FROM boca_hist b, cejas_hist c, parpadeos_hist p
WHERE b.fecha_hora >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), ' 00:00:00')
  AND c.fecha_hora >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), ' 00:00:00')
  AND p.fecha_hora >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 6 DAY), ' 00:00:00');

CREATE OR REPLACE VIEW vw_gestos_ultimos_30 AS
SELECT
  'ultimos_30' AS rango,
  SUM(b.estado='abierta') AS boca_abierta,
  SUM(b.estado='cerrada') AS boca_cerrada,
  SUM(c.estado='arqueadas') AS cejas_arqueadas,
  SUM(c.estado='normal')    AS cejas_normal,
  SUM(p.estado='cerrado') AS parpadeo_cerrado,
  SUM(p.estado='abierto') AS parpadeo_abierto
FROM boca_hist b, cejas_hist c, parpadeos_hist p
WHERE b.fecha_hora >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 29 DAY), ' 00:00:00')
  AND c.fecha_hora >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 29 DAY), ' 00:00:00')
  AND p.fecha_hora >= CONCAT(DATE_SUB(CURDATE(), INTERVAL 29 DAY), ' 00:00:00');
