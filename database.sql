-- =============================================
-- LUMIÈRE CINE — Base de datos SQL Server
-- =============================================

CREATE DATABASE LumiereCine;
GO
USE LumiereCine;
GO

-- ── SUCURSALES ──
CREATE TABLE sucursales (
    id_sucursal INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    direccion NVARCHAR(200),
    estado NVARCHAR(20) DEFAULT 'Activa' -- Activa, Mantenimiento, Inactiva
);

-- ── USUARIOS ──
CREATE TABLE usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    contrasena NVARCHAR(255) NOT NULL,
    rol NVARCHAR(10) NOT NULL CHECK (rol IN ('c','ag','al')),
    id_sucursal INT NULL,
    ultimo_acceso DATETIME NULL,
    estado NVARCHAR(20) DEFAULT 'Activo',
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal)
);

-- ── PELICULAS ──
CREATE TABLE peliculas (
    id_pelicula INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(150) NOT NULL,
    categoria NVARCHAR(50),
    clasificacion NVARCHAR(10),
    duracion NVARCHAR(20)
);

-- ── SALAS ──
CREATE TABLE salas (
    id_sala INT IDENTITY(1,1) PRIMARY KEY,
    id_sucursal INT NOT NULL,
    nombre NVARCHAR(50) NOT NULL,
    tipo NVARCHAR(30),
    capacidad INT,
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal)
);

-- ── ASIENTOS ──
CREATE TABLE asientos (
    id_asiento INT IDENTITY(1,1) PRIMARY KEY,
    id_sala INT NOT NULL,
    fila NVARCHAR(5) NOT NULL,
    numero INT NOT NULL,
    tipo NVARCHAR(10) DEFAULT 'Normal',
    FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);

-- ── FUNCIONES ──
CREATE TABLE funciones (
    id_funcion INT IDENTITY(1,1) PRIMARY KEY,
    id_pelicula INT NOT NULL,
    id_sala INT NOT NULL,
    fecha DATE NOT NULL,
    horario TIME NOT NULL,
    precio DECIMAL(10,2),
    precio_vip DECIMAL(10,2),
    estado NVARCHAR(20) DEFAULT 'Activa',
    FOREIGN KEY (id_pelicula) REFERENCES peliculas(id_pelicula),
    FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);

-- ── VENTAS ──
CREATE TABLE ventas (
    id_venta INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_funcion INT NOT NULL,
    id_asiento INT NOT NULL,
    fecha_venta DATETIME DEFAULT GETDATE(),
    precio DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_funcion) REFERENCES funciones(id_funcion),
    FOREIGN KEY (id_asiento) REFERENCES asientos(id_asiento)
);

-- ── PRODUCTOS ──
CREATE TABLE productos (
    id_producto INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    sku NVARCHAR(20),
    precio DECIMAL(10,2),
    unidades INT DEFAULT 0,
    minimo INT DEFAULT 0
);

-- ── DETALLE VENTA ──
CREATE TABLE detalle_venta (
    id_detalle INT IDENTITY(1,1) PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- =============================================
-- DATOS DE PRUEBA — Solo usuarios y sucursales
-- =============================================

-- Sucursales
INSERT INTO sucursales (nombre, direccion, estado) VALUES
('Lumière Centro',   'Av. Central 123',      'Activa'),
('Lumière Norte',    'Blvd. Norte 456',       'Activa'),
('Lumière Sur',      'Calle Sur 789',         'Mantenimiento'),
('Lumière Oriente',  'Av. Oriente 321',       'Activa'),
('Lumière Poniente', 'Blvd. Poniente 654',    'Activa');

-- Usuarios de prueba (texto plano sólo para seed; el servidor los rehashea con bcrypt en el primer login)
INSERT INTO usuarios (nombre, email, contrasena, rol, id_sucursal, ultimo_acceso, estado) VALUES
('Carlos Mendoza', 'admin@lumiere.mx',   'Admin123',   'ag', NULL, GETDATE(), 'Activo'),
('Laura Ríos',     'local@lumiere.mx',   'Local123',   'al', 1,    GETDATE(), 'Activo'),
('Juan Pérez',     'cliente@lumiere.mx', 'Cliente123', 'c',  NULL, GETDATE(), 'Activo');

GO
