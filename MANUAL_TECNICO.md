# Manual Técnico — LUMIÈRE Cine

Documentación técnica del sistema desarrollado por **Aura Systems**.
Dirigido a desarrolladores, mantenedores y administradores de sistemas.

---

## 1. Arquitectura general

Aplicación web cliente-servidor en tres capas:

```
┌─────────────────────────┐
│   Navegador (cliente)   │  HTML + CSS + JS vanilla
│   login.html, admUsu… │  Sin frameworks de front
└────────────┬────────────┘
             │  HTTP/JSON  (fetch)
┌────────────▼────────────┐
│   Servidor Node.js      │  Express 4 + express-session + bcryptjs
│   server.js             │  Endpoints REST en /api/*
└────────────┬────────────┘
             │  TDS protocol (driver mssql)
┌────────────▼────────────┐
│   SQL Server            │  Base de datos relacional
│   LumiereCine           │  9 tablas
└─────────────────────────┘
```

### 1.1 Decisiones de diseño

| Decisión | Justificación |
|---|---|
| Sin framework de front (React/Vue) | El alcance académico no lo requiere; vanilla mantiene la dependencia mínima y facilita la lectura. |
| Sin ORM (`mssql` directo) | El doc pedía SQL Server con queries explícitas, alineado con la materia BD Avanzadas. |
| Sesiones server-side (`express-session`) | Más simple que JWT para el alcance; sesión persiste en memoria, vive 24h. |
| `bcryptjs` (no `bcrypt`) | Implementación pure-JS — evita compilación nativa, problema común en Windows. |
| Cursor custom + paleta oscura | Identidad visual del proyecto: tonos oscuros + acentos metálicos por rol. |

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 18+ |
| Framework HTTP | Express | 4.21 |
| Sesiones | express-session | 1.18 |
| Driver SQL | mssql | 11.0 |
| Hashing | bcryptjs | 2.4 |
| Base de datos | SQL Server | 2019/2022/2025 |
| Front | HTML5, CSS3 (Grid + Flexbox), JS ES2020 | nativo |
| Tipografías | Bebas Neue, Cormorant Garamond, DM Mono | Google Fonts |

---

## 3. Estructura del proyecto

```
proyectoCineWeb/
├── server.js                  Servidor + endpoints API
├── package.json               Manifest de dependencias
├── database.sql               DDL: crea BD, tablas, usuarios mínimos
├── seed_data.sql              DML: datos de prueba completos
│
├── login.html                 Pantalla de acceso (login + registro)
├── admUsu.html                Panel principal con 3 vistas (cliente/AG/AL)
│
├── sucursales.html            CRUD sucursales (AG)            ── RF4
├── peliculas.html             CRUD películas (AG)
├── salas.html                 CRUD salas + asientos
├── funciones.html             Programación individual + masiva ── RF6
├── productos.html             Inventario de dulcería
├── ventas.html                Historial / compra
├── reportes.html              Reporte comparativo entre sucursales ── RF7
│
├── app.css                    Estilos compartidos
└── app.js                     Lógica común: sesión, api(), toast(),
                               renderTopbar(), bindHoverAll()
```

---

## 4. Modelo de datos

### 4.1 Diagrama relacional

```
sucursales (1) ──┬── (N) salas (1) ── (N) asientos
                 │                          │
                 └── (N) usuarios           │
                          │                 │
peliculas (1) ── (N) funciones (1) ── (N) ventas (1) ── (N) detalle_venta
                                                                  │
                                                productos (1) ────┘
```

### 4.2 Tablas

| Tabla | Propósito | Llaves foráneas |
|---|---|---|
| `sucursales` | Cada cine de la cadena. | — |
| `usuarios` | Clientes y administradores. | `id_sucursal` (sólo AL) |
| `peliculas` | Catálogo cinematográfico. | — |
| `salas` | Salas físicas de cada sucursal. | `id_sucursal` |
| `asientos` | Butacas de cada sala (Normal o VIP). | `id_sala` |
| `funciones` | Proyecciones programadas. | `id_pelicula`, `id_sala` |
| `ventas` | Boleto vendido (1 fila = 1 asiento). | `id_usuario`, `id_funcion`, `id_asiento` |
| `productos` | Inventario de dulcería. | — |
| `detalle_venta` | Productos comprados con cada boleto. | `id_venta`, `id_producto` |

### 4.3 Roles (campo `usuarios.rol`)

| Código | Nombre | Acceso |
|---|---|---|
| `c` | Cliente | Cartelera, compra, comprobante. |
| `ag` | Admin Global | Cadena completa: sucursales, películas, productos, reportes. |
| `al` | Admin Local | Operación de su sucursal: funciones, salas, productos. |

### 4.4 Convenciones SQL

- Todas las PK son `INT IDENTITY(1,1)`.
- Texto: `NVARCHAR` (Unicode) para soportar acentos del español.
- Dinero: `DECIMAL(10,2)` siempre.
- Fechas: `DATE` para días, `TIME` para horarios, `DATETIME` para auditoría (`fecha_venta`, `ultimo_acceso`).
- FKs sin `ON DELETE CASCADE` — la baja de sucursales valida dependencias en el endpoint.

---

## 5. API REST

Todos los endpoints viven en `/api/*`. Devuelven JSON. Errores devuelven `{ error: "mensaje" }` con el código HTTP apropiado.

### 5.1 Autenticación

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/api/login` | público | Valida credenciales (bcrypt). Crea sesión. |
| `POST` | `/api/register` | público | Registra usuario nuevo (hashea con bcrypt). |
| `GET` | `/api/session` | autenticado | Devuelve la sesión activa. |
| `POST` | `/api/logout` | público | Destruye la sesión. |

### 5.2 Sucursales

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/sucursales/publicas` | público | Lista nombres (necesario en login para AL). |
| `GET` | `/api/sucursales` | autenticado | Lista completa con conteos de salas y usuarios. |
| `GET` | `/api/sucursales/resumen` | AG | Resumen del día por sucursal (cards del dashboard). |
| `POST` | `/api/sucursales` | AG | Alta. |
| `PUT` | `/api/sucursales/:id` | AG | Edición. |
| `DELETE` | `/api/sucursales/:id` | AG | Baja con guard de FK (rechaza si tiene salas o usuarios). |

### 5.3 Películas

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/peliculas` | autenticado | Catálogo. |
| `POST/PUT/DELETE` | `/api/peliculas[/:id]` | AG | CRUD. |

### 5.4 Salas y asientos

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/salas?id_sucursal=` | autenticado | Lista (opcionalmente filtrada). |
| `POST/PUT/DELETE` | `/api/salas[/:id]` | AG, AL | CRUD. |
| `GET` | `/api/salas/:id/asientos` | autenticado | Mapa de asientos. |
| `POST` | `/api/salas/:id/asientos` | AG, AL | (Re)genera la matriz de asientos. |

### 5.5 Funciones

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/funciones?id_sucursal=&fecha=` | autenticado | Lista filtrable. |
| `POST` | `/api/funciones` | AG, AL | Alta individual. |
| `POST` | `/api/funciones/masivo` | AG, AL | **RF6**: alta por lote (salas × días × horarios) en transacción. |
| `PUT/DELETE` | `/api/funciones/:id` | AG, AL | Edición / baja. |
| `GET` | `/api/funciones/:id/asientos` | autenticado | Mapa con flag `ocupado`. |

### 5.6 Productos

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/productos` | autenticado | Inventario. |
| `POST/PUT/DELETE` | `/api/productos[/:id]` | AG, AL | CRUD. |
| `POST` | `/api/productos/:id/stock` | AG, AL | Ajuste de stock por delta. |

### 5.7 Ventas

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/ventas` | autenticado | Historial (cliente sólo ve las suyas). |
| `POST` | `/api/ventas` | autenticado | **Compra atómica**: valida asientos, descuenta stock y crea ventas en una transacción. |
| `GET` | `/api/ventas/:id/detalle` | autenticado | Detalle de productos asociados. |

### 5.8 Reportes

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/reportes/global` | AG | Resumen del día (KPIs). |
| `GET` | `/api/reportes/sucursal/:id` | AG, AL | Resumen del día de una sucursal. |
| `GET` | `/api/reportes/comparativo?desde=&hasta=` | AG | **RF7**: KPIs + por sucursal + top películas + top productos. |

### 5.9 Usuarios

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `GET` | `/api/usuarios` | AG | Lista de usuarios del sistema. |

---

## 6. Seguridad

### 6.1 Autenticación

- **Sesión server-side** con cookie firmada (`express-session`). TTL: 24 h.
- **bcryptjs** con `BCRYPT_ROUNDS = 10`.
- **Auto-upgrade**: si se detecta una contraseña en texto plano (legado/seed) en login, se compara directo, se valida y se rehashea en la misma transacción.
- Detección de hash bcrypt: regex `/^\$2[aby]\$\d{2}\$/`.

### 6.2 Autorización

Dos middlewares en `server.js`:

```js
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado.' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'No autenticado.' });
    if (!roles.includes(req.session.user.role)) return res.status(403).json({ error: 'Sin permiso.' });
    next();
  };
}
```

### 6.3 Validaciones críticas

- **`/api/ventas` (POST)**: `sql.Transaction` + verificación de asiento ocupado dentro de la transacción → **RNF4 (atomicidad / no sobreventa)**.
- **`/api/funciones/masivo`**: validación previa de salas vs sucursal del AL antes de iterar.
- **`DELETE /api/sucursales/:id`**: chequeo de dependencias antes del `DELETE` para devolver error humano-legible.

### 6.4 Inputs

- Todos los parámetros se pasan como `pool.request().input(...)` — **siempre parametrizados**, nunca interpolados, evitando inyección SQL.

---

## 7. Front-end

### 7.1 Convenciones visuales (basadas en el doc)

| Variable CSS | Hex | Uso |
|---|---|---|
| `--bg` | #080808 | Fondo principal |
| `--surface` | #0f0f0f | Bandas alternas |
| `--card` | #131313 | Tarjetas |
| `--gold` | #c9a84c | Acento Cliente |
| `--blue` | #185fa5 | Acento Admin Global |
| `--teal` | #0f6e56 | Acento Admin Local |
| `--red` | #e63946 | Errores / críticos |

Tipografías:
- **Bebas Neue** — títulos.
- **Cormorant Garamond** — texto descriptivo.
- **DM Mono** — números, etiquetas de sistema, datos técnicos.

### 7.2 `app.js` — utilidades globales

| Función | Descripción |
|---|---|
| `session` | Constante con la sesión persistida en `localStorage`. Redirige a `login.html` si no existe. |
| `api(method, url, body)` | Wrapper de `fetch` que parsea JSON y lanza errores con mensaje. |
| `toast(msg, kind)` | Notificación esquina inferior derecha (verde por defecto, roja con `'err'`). |
| `openModal(id)` / `closeModal(id)` | Toggle de overlays. |
| `renderTopbar(activeKey)` | Inserta la barra superior con links según el rol activo. |
| `bindHoverAll()` | Activa el cursor reactivo en todos los elementos interactivos. |
| `logout()` | Llama `/api/logout`, limpia `localStorage` y redirige. |

### 7.3 `admUsu.html` — el panel

Un solo HTML con 3 `<div class="view">` (uno por rol). El conmutador `sw(role)`:

1. Aplica reglas de acceso (`access[session.role]`).
2. Quita `.on` de todas las views y la pone sólo a la activa.
3. Llama `cargarCliente()`, `cargarAdminGlobal()` o `cargarAdminLocal()` según corresponda.

Los admins ven un **`.viewpill`** debajo del topbar para conmutar manualmente.

### 7.4 Flujo de compra del cliente

```
GET /api/sucursales        → llena selector
GET /api/productos         → renderiza grid de dulcería
GET /api/funciones?…       → cartelera + funciones por película

[user click horario]
GET /api/funciones/:id/asientos → mapa con flag ocupado

[user selecciona asientos + dulcería]
POST /api/ventas { id_funcion, asientos[], productos[] }
   ↳ server abre transacción
   ↳ valida cada asiento (no ocupado)
   ↳ inserta N filas en `ventas`
   ↳ inserta detalle_venta + UPDATE productos
   ↳ commit
   ↳ devuelve { ventas: [ids] }

[front muestra comprobante digital, recarga asientos y stock]
```

---

## 8. Rendimiento y escalabilidad

- **Pool de conexiones SQL**: una sola instancia compartida (`pool` global). Evita el costo de abrir conexiones por request.
- **Bulk insert (RF6)**: la programación masiva inserta una por una dentro de una transacción. Para volúmenes grandes (>500 funciones) considerar `sql.Table` + `bulk()` del driver `mssql`.
- **Reportes**: las consultas comparativas usan subselects correlacionados. Para datasets grandes, considerar índices en `funciones(fecha, id_sala)` y `ventas(id_funcion)`.

### 8.1 Índices recomendados (no aplicados por defecto)

```sql
CREATE INDEX IX_funciones_fecha_sala ON funciones(fecha, id_sala);
CREATE INDEX IX_ventas_id_funcion    ON ventas(id_funcion);
CREATE INDEX IX_ventas_id_asiento    ON ventas(id_asiento);
```

---

## 9. Cumplimiento del documento

| Requisito | Implementación |
|---|---|
| RF1 — Selección de sucursal por cliente | `admUsu.html` vista cliente + selector de sucursal. |
| RF2 — Mapa gráfico de asientos en tiempo real | `GET /api/funciones/:id/asientos` + render reactivo. |
| RF3 — Comprobante digital tras compra | Bloque `.ticket` en panel cliente con folio, sucursal, asientos y total. |
| RF4 — CRUD de sucursales | `sucursales.html` + endpoints POST/PUT/DELETE con guard de FK. |
| RF5 — Inventario centralizado | `productos.html` con stock por producto + alertas en panel AG. |
| RF6 — Programación masiva | `funciones.html` modal masivo + `POST /api/funciones/masivo`. |
| RF7 — Reportes comparativos | `reportes.html` con barras CSS + top películas/productos. |
| RNF1 — Escalabilidad | Modelo relacional con FKs; sin lógica de negocio acoplada al esquema. |
| RNF2 — Seguridad por niveles | `requireRole(...)` + bcrypt + sesiones HttpOnly. |
| RNF3 — Responsivo | CSS Grid con `auto-fill` + media queries implícitas en `clamp()`. |
| RNF4 — Atomicidad de ventas | `sql.Transaction` en `POST /api/ventas`. |

---

## 10. Mantenimiento y extensión

### 10.1 Agregar un nuevo endpoint

1. En `server.js`, define la ruta con el middleware adecuado (`requireAuth` o `requireRole(...)`).
2. Usa siempre `pool.request().input(...)` — nunca interpolar strings.
3. Maneja errores con `try/catch` y devuelve `res.status(500).json({ error: err.message })`.

### 10.2 Agregar una página al front

1. Copia `peliculas.html` como plantilla.
2. Cambia `<title>`, `phead`, tabla, modal y nombre de funciones.
3. Llama `renderTopbar('miClave')` y agrega la entrada en `app.js → renderTopbar()`.
4. Si la página requiere un rol específico, agrega el guard `if (session.role !== 'ag') ...`.

### 10.3 Migrar a otro motor de BD

El driver `mssql` es específico de SQL Server. Para migrar a PostgreSQL/MySQL:
1. Reemplaza `require('mssql')` por `pg` o `mysql2`.
2. Cambia la sintaxis de parámetros (`@param` → `$1` o `?`).
3. Reemplaza `IDENTITY(1,1)` por `SERIAL` / `AUTO_INCREMENT`.
4. Reemplaza `GETDATE()` por `NOW()`.
5. Revisa `OUTPUT INSERTED.*` (T-SQL) → `RETURNING *` (Postgres) o consultar `LAST_INSERT_ID()` (MySQL).

---

## 11. Variables de entorno (sugerido)

Hoy las credenciales viven en `server.js`. Para producción se recomienda:

```js
const dbConfig = {
  user:     process.env.DB_USER     || 'proyectodba_user',
  password: process.env.DB_PASSWORD || 'ProDba2026?',
  server:   process.env.DB_SERVER   || 'localhost',
  port:     Number(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME     || 'LumiereCine',
  ...
};
```

Y mover la `secret` de la sesión también a `process.env.SESSION_SECRET`.

---

## 12. Contactos y créditos

- **Equipo:** Aura Systems
- **Materia:** Bases de Datos Avanzadas
- **Versión:** 1.0
- **Fecha:** Mayo 2026
