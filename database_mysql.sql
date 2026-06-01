-- =============================================
-- LUMIÈRE CINE — Base de datos MySQL / MariaDB
-- Importar desde phpMyAdmin (XAMPP) o CLI
-- =============================================

DROP DATABASE IF EXISTS LumiereCine;
CREATE DATABASE LumiereCine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE LumiereCine;

-- ── SUCURSALES ──
CREATE TABLE sucursales (
  id_sucursal INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  direccion   VARCHAR(200),
  estado      VARCHAR(20) DEFAULT 'Activa'
) ENGINE=InnoDB;

-- ── USUARIOS ──
CREATE TABLE usuarios (
  id_usuario     INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  contrasena     VARCHAR(255) NOT NULL,
  rol            VARCHAR(10) NOT NULL,
  id_sucursal    INT NULL,
  ultimo_acceso  DATETIME NULL,
  estado         VARCHAR(20) DEFAULT 'Activo',
  proveedor_oauth VARCHAR(20) DEFAULT NULL, -- 'google', 'facebook' o NULL
  proveedor_id    VARCHAR(120) DEFAULT NULL,
  CONSTRAINT chk_rol CHECK (rol IN ('c','ag','al')),
  FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal)
) ENGINE=InnoDB;

-- ── PELÍCULAS ──
CREATE TABLE peliculas (
  id_pelicula   INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(150) NOT NULL,
  categoria     VARCHAR(50),
  clasificacion VARCHAR(10),
  duracion      VARCHAR(20)
) ENGINE=InnoDB;

-- ── SALAS ──
CREATE TABLE salas (
  id_sala     INT AUTO_INCREMENT PRIMARY KEY,
  id_sucursal INT NOT NULL,
  nombre      VARCHAR(50) NOT NULL,
  tipo        VARCHAR(30),
  capacidad   INT,
  FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal)
) ENGINE=InnoDB;

-- ── ASIENTOS ──
CREATE TABLE asientos (
  id_asiento INT AUTO_INCREMENT PRIMARY KEY,
  id_sala    INT NOT NULL,
  fila       VARCHAR(5) NOT NULL,
  numero     INT NOT NULL,
  tipo       VARCHAR(10) DEFAULT 'Normal',
  FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
) ENGINE=InnoDB;

-- ── FUNCIONES ──
CREATE TABLE funciones (
  id_funcion  INT AUTO_INCREMENT PRIMARY KEY,
  id_pelicula INT NOT NULL,
  id_sala     INT NOT NULL,
  fecha       DATE NOT NULL,
  horario     TIME NOT NULL,
  precio      DECIMAL(10,2),
  precio_vip  DECIMAL(10,2),
  estado      VARCHAR(20) DEFAULT 'Activa',
  FOREIGN KEY (id_pelicula) REFERENCES peliculas(id_pelicula),
  FOREIGN KEY (id_sala)     REFERENCES salas(id_sala)
) ENGINE=InnoDB;

-- ── VENTAS ──
CREATE TABLE ventas (
  id_venta    INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT NOT NULL,
  id_funcion  INT NOT NULL,
  id_asiento  INT NOT NULL,
  fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
  precio      DECIMAL(10,2) NOT NULL,
  estado_pago VARCHAR(20) DEFAULT 'pagado', -- pendiente, pagado, fallido
  metodo_pago VARCHAR(30) DEFAULT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_funcion) REFERENCES funciones(id_funcion),
  FOREIGN KEY (id_asiento) REFERENCES asientos(id_asiento)
) ENGINE=InnoDB;

-- ── PRODUCTOS ──
CREATE TABLE productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  sku         VARCHAR(20),
  precio      DECIMAL(10,2),
  unidades    INT DEFAULT 0,
  minimo      INT DEFAULT 0
) ENGINE=InnoDB;

-- ── DETALLE VENTA ──
CREATE TABLE detalle_venta (
  id_detalle  INT AUTO_INCREMENT PRIMARY KEY,
  id_venta    INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad    INT NOT NULL,
  precio      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_venta)    REFERENCES ventas(id_venta),
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
) ENGINE=InnoDB;

-- =============================================
-- DATOS DE PRUEBA — Sucursales y usuarios base
-- =============================================
INSERT INTO sucursales (nombre, direccion, estado) VALUES
('Lumière Centro',   'Av. Central 123',    'Activa'),
('Lumière Norte',    'Blvd. Norte 456',    'Activa'),
('Lumière Sur',      'Calle Sur 789',      'Mantenimiento'),
('Lumière Oriente',  'Av. Oriente 321',    'Activa'),
('Lumière Poniente', 'Blvd. Poniente 654', 'Activa');

-- Contraseñas en texto plano para el seed; server.js las rehashea con bcrypt al primer login
INSERT INTO usuarios (nombre, email, contrasena, rol, id_sucursal, ultimo_acceso, estado) VALUES
('Carlos Mendoza', 'admin@lumiere.mx',   'Admin123',   'ag', NULL, NOW(), 'Activo'),
('Laura Ríos',     'local@lumiere.mx',   'Local123',   'al', 1,    NOW(), 'Activo'),
('Juan Pérez',     'cliente@lumiere.mx', 'Cliente123', 'c',  NULL, NOW(), 'Activo');

