-- =============================================
-- LUMIÈRE CINE — Datos de prueba (cartelera, salas, funciones, productos)
-- Ejecutar DESPUES de database.sql
-- =============================================
USE LumiereCine;
GO

-- ── PELICULAS ──
INSERT INTO peliculas (nombre, categoria, clasificacion, duracion) VALUES
('Oscuridad Eterna',       'Sci-Fi · Drama',     'B15', '2h 38min'),
('La Casa del Abismo',     'Terror · Thriller',  'C',   '1h 54min'),
('Horizonte Cero',         'Acción · Aventura',  'B',   '2h 12min'),
('El Último Verano',       'Drama · Romance',    'A',   '2h 05min'),
('Memorias del Silencio',  'Drama',              'B',   '1h 48min'),
('Cazadores de Tormentas', 'Acción',             'B15', '2h 02min');
GO

-- ── SALAS (4 salas para Lumière Centro, 3 para Norte, 2 para Sur) ──
INSERT INTO salas (id_sucursal, nombre, tipo, capacidad) VALUES
(1, 'Sala 1', 'IMAX',    140),
(1, 'Sala 2', '4DX',     120),
(1, 'Sala 3', 'Dolby',   140),
(1, 'Sala 4', 'Premium', 100),
(2, 'Sala 1', 'IMAX',    140),
(2, 'Sala 2', 'Dolby',   140),
(2, 'Sala 3', 'Estándar',140),
(3, 'Sala 1', 'Estándar',140),
(3, 'Sala 2', 'Premium', 100),
(4, 'Sala 1', 'IMAX',    140),
(4, 'Sala 2', 'Estándar',140),
(5, 'Sala 1', 'Dolby',   140),
(5, 'Sala 2', 'Estándar',140);
GO

-- ── ASIENTOS (10 filas A-J × 14 cols, filas I y J = VIP) para cada sala ──
DECLARE @id_sala INT;
DECLARE @f INT;
DECLARE @n INT;
DECLARE @fila NVARCHAR(2);
DECLARE @tipo NVARCHAR(10);
DECLARE @letras NVARCHAR(26) = N'ABCDEFGHIJ';
DECLARE c CURSOR FOR SELECT id_sala FROM salas;
OPEN c;
FETCH NEXT FROM c INTO @id_sala;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @f = 0;
    WHILE @f < 10
    BEGIN
        SET @fila = SUBSTRING(@letras, @f + 1, 1);
        SET @tipo = CASE WHEN @fila IN (N'I', N'J') THEN N'VIP' ELSE N'Normal' END;
        SET @n = 1;
        WHILE @n <= 14
        BEGIN
            INSERT INTO asientos (id_sala, fila, numero, tipo) VALUES (@id_sala, @fila, @n, @tipo);
            SET @n = @n + 1;
        END
        SET @f = @f + 1;
    END
    FETCH NEXT FROM c INTO @id_sala;
END
CLOSE c; DEALLOCATE c;
GO

-- ── FUNCIONES (próximos 5 días, varias por sala) ──
DECLARE @hoy DATE = CAST(GETDATE() AS DATE);
DECLARE @d INT = 0;
DECLARE @fecha DATE;
WHILE @d < 5
BEGIN
    SET @fecha = DATEADD(DAY, @d, @hoy);

    -- Sucursal 1 (Centro)
    INSERT INTO funciones (id_pelicula, id_sala, fecha, horario, precio, precio_vip) VALUES
    (1, 1, @fecha, '13:00', 130, 180),
    (1, 1, @fecha, '21:10', 130, 180),
    (2, 3, @fecha, '16:30', 110, 160),
    (2, 3, @fecha, '19:00', 110, 160),
    (3, 2, @fecha, '14:30', 140, 190),
    (3, 2, @fecha, '20:00', 140, 190),
    (4, 4, @fecha, '18:45', 120, 170),
    (5, 4, @fecha, '21:30', 120, 170);

    -- Sucursal 2 (Norte)
    INSERT INTO funciones (id_pelicula, id_sala, fecha, horario, precio, precio_vip) VALUES
    (1, 5, @fecha, '15:00', 130, 180),
    (3, 6, @fecha, '17:30', 130, 180),
    (6, 7, @fecha, '20:30', 110, 160);

    -- Sucursal 3 (Sur — mantenimiento sólo sala 2)
    INSERT INTO funciones (id_pelicula, id_sala, fecha, horario, precio, precio_vip) VALUES
    (4, 9, @fecha, '19:00', 120, 170);

    -- Sucursal 4 (Oriente)
    INSERT INTO funciones (id_pelicula, id_sala, fecha, horario, precio, precio_vip) VALUES
    (2, 10, @fecha, '18:00', 130, 180),
    (5, 11, @fecha, '20:00', 110, 160);

    -- Sucursal 5 (Poniente)
    INSERT INTO funciones (id_pelicula, id_sala, fecha, horario, precio, precio_vip) VALUES
    (6, 12, @fecha, '17:00', 130, 180),
    (3, 13, @fecha, '21:00', 110, 160);

    SET @d = @d + 1;
END
GO

-- ── PRODUCTOS (dulcería) ──
INSERT INTO productos (nombre, sku, precio, unidades, minimo) VALUES
('Palomitas grandes',     'SKU-001', 95.00,  4820, 500),
('Palomitas medianas',    'SKU-002', 75.00,  3400, 400),
('Palomitas chicas',      'SKU-003', 55.00,  2600, 300),
('Refresco 500ml',        'SKU-004', 60.00,  1240, 1000),
('Refresco 1L',           'SKU-005', 80.00,  980,  600),
('Agua embotellada',      'SKU-006', 35.00,  1800, 500),
('Nachos con queso',      'SKU-007', 85.00,  312,  400),
('Combo Familiar',        'SKU-008', 320.00, 540,  100),
('Combo Pareja',          'SKU-009', 220.00, 720,  150),
('Hot dog',               'SKU-012', 70.00,  890,  200),
('Café americano',        'SKU-015', 45.00,  600,  150),
('Dulces surtidos',       'SKU-019', 40.00,  180,  300),
('Chocolates',            'SKU-020', 55.00,  920,  250);
GO

-- ── USUARIOS adicionales para pruebas ──
INSERT INTO usuarios (nombre, email, contrasena, rol, id_sucursal, ultimo_acceso, estado) VALUES
('Tomás Guerrero',  'tomas@lumiere.mx',  'Local123', 'al', 2,    DATEADD(HOUR, -14, GETDATE()), 'Inactivo'),
('María Solís',     'maria@lumiere.mx',  'Local123', 'al', 4,    GETDATE(),                     'Activo'),
('Ana López',       'ana@lumiere.mx',    'Cliente1', 'c',  NULL, GETDATE(),                     'Activo');
GO

PRINT 'Datos de prueba cargados correctamente.';
GO
