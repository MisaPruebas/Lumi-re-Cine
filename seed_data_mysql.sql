-- =============================================
-- LUMIÈRE CINE — Datos de prueba MySQL
-- Ejecutar DESPUÉS de database_mysql.sql
-- =============================================
USE LumiereCine;

-- ── PELÍCULAS ──
INSERT INTO peliculas (nombre, categoria, clasificacion, duracion) VALUES
('Oscuridad Eterna',       'Sci-Fi · Drama',     'B15', '2h 38min'),
('La Casa del Abismo',     'Terror · Thriller',  'C',   '1h 54min'),
('Horizonte Cero',         'Acción · Aventura',  'B',   '2h 12min'),
('El Último Verano',       'Drama · Romance',    'A',   '2h 05min'),
('Memorias del Silencio',  'Drama',              'B',   '1h 48min'),
('Cazadores de Tormentas', 'Acción',             'B15', '2h 02min');

-- ── SALAS ──
INSERT INTO salas (id_sucursal, nombre, tipo, capacidad) VALUES
(1, 'Sala 1', 'IMAX',     140),
(1, 'Sala 2', '4DX',      120),
(1, 'Sala 3', 'Dolby',    140),
(1, 'Sala 4', 'Premium',  100),
(2, 'Sala 1', 'IMAX',     140),
(2, 'Sala 2', 'Dolby',    140),
(2, 'Sala 3', 'Estándar', 140),
(3, 'Sala 1', 'Estándar', 140),
(3, 'Sala 2', 'Premium',  100),
(4, 'Sala 1', 'IMAX',     140),
(4, 'Sala 2', 'Estándar', 140),
(5, 'Sala 1', 'Dolby',    140),
(5, 'Sala 2', 'Estándar', 140);

-- ── ASIENTOS (10 filas A-J × 14 cols, filas I/J = VIP) — generado con procedure ──
DROP PROCEDURE IF EXISTS gen_asientos;
DELIMITER //
CREATE PROCEDURE gen_asientos()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_id INT;
  DECLARE f INT;
  DECLARE n INT;
  DECLARE fila CHAR(1);
  DECLARE tipo VARCHAR(10);
  DECLARE cur CURSOR FOR SELECT id_sala FROM salas;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_id;
    IF done THEN LEAVE read_loop; END IF;
    SET f = 0;
    WHILE f < 10 DO
      SET fila = SUBSTRING('ABCDEFGHIJ', f + 1, 1);
      SET tipo = IF(fila IN ('I','J'), 'VIP', 'Normal');
      SET n = 1;
      WHILE n <= 14 DO
        INSERT INTO asientos (id_sala, fila, numero, tipo) VALUES (v_id, fila, n, tipo);
        SET n = n + 1;
      END WHILE;
      SET f = f + 1;
    END WHILE;
  END LOOP;
  CLOSE cur;
END //
DELIMITER ;
CALL gen_asientos();
DROP PROCEDURE gen_asientos;

-- ── FUNCIONES (próximos 5 días) ──
DROP PROCEDURE IF EXISTS gen_funciones;
DELIMITER //
CREATE PROCEDURE gen_funciones()
BEGIN
  DECLARE d INT DEFAULT 0;
  DECLARE f DATE;
  WHILE d < 5 DO
    SET f = DATE_ADD(CURDATE(), INTERVAL d DAY);
    INSERT INTO funciones (id_pelicula, id_sala, fecha, horario, precio, precio_vip) VALUES
    (1, 1,  f, '13:00', 130, 180), (1, 1,  f, '21:10', 130, 180),
    (2, 3,  f, '16:30', 110, 160), (2, 3,  f, '19:00', 110, 160),
    (3, 2,  f, '14:30', 140, 190), (3, 2,  f, '20:00', 140, 190),
    (4, 4,  f, '18:45', 120, 170), (5, 4,  f, '21:30', 120, 170),
    (1, 5,  f, '15:00', 130, 180), (3, 6,  f, '17:30', 130, 180),
    (6, 7,  f, '20:30', 110, 160), (4, 9,  f, '19:00', 120, 170),
    (2, 10, f, '18:00', 130, 180), (5, 11, f, '20:00', 110, 160),
    (6, 12, f, '17:00', 130, 180), (3, 13, f, '21:00', 110, 160);
    SET d = d + 1;
  END WHILE;
END //
DELIMITER ;
CALL gen_funciones();
DROP PROCEDURE gen_funciones;

-- ── PRODUCTOS ──
INSERT INTO productos (nombre, sku, precio, unidades, minimo) VALUES
('Palomitas grandes',  'SKU-001', 95.00,  4820, 500),
('Palomitas medianas', 'SKU-002', 75.00,  3400, 400),
('Palomitas chicas',   'SKU-003', 55.00,  2600, 300),
('Refresco 500ml',     'SKU-004', 60.00,  1240, 1000),
('Refresco 1L',        'SKU-005', 80.00,  980,  600),
('Agua embotellada',   'SKU-006', 35.00,  1800, 500),
('Nachos con queso',   'SKU-007', 85.00,  312,  400),
('Combo Familiar',     'SKU-008', 320.00, 540,  100),
('Combo Pareja',       'SKU-009', 220.00, 720,  150),
('Hot dog',            'SKU-012', 70.00,  890,  200),
('Café americano',     'SKU-015', 45.00,  600,  150),
('Dulces surtidos',    'SKU-019', 40.00,  180,  300),
('Chocolates',         'SKU-020', 55.00,  920,  250);

-- ── USUARIOS adicionales ──
INSERT INTO usuarios (nombre, email, contrasena, rol, id_sucursal, ultimo_acceso, estado) VALUES
('Tomás Guerrero', 'tomas@lumiere.mx', 'Local123', 'al', 2,    DATE_SUB(NOW(), INTERVAL 14 HOUR), 'Inactivo'),
('María Solís',    'maria@lumiere.mx', 'Local123', 'al', 4,    NOW(), 'Activo'),
('Ana López',      'ana@lumiere.mx',   'Cliente1', 'c',  NULL, NOW(), 'Activo');
