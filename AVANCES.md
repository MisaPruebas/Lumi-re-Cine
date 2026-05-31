# Avances — Proyecto Cine React (LUMIÈRE)

**Entregable objetivo:** 2026-06-01
**Estado actual:** 8 de 10 requisitos cubiertos. Solo faltan **email real (SMTP)** y **OAuth Google/Facebook**, además del **hosting**.

---

## 🟢 Estado de requisitos

| # | Requisito | Estado | Notas |
|---|-----------|--------|-------|
| 1 | CRUD usuario y admin | ✅ | Sucursales, Películas, Productos, Salas, Funciones, Usuarios |
| 2 | Sesión en todas las listas | ✅ | Vía `lib/session.jsx` (Context) + cookies httpOnly |
| 3 | Framework React | ✅ | Vite + React 18 + react-router-dom |
| 4 | Bootstrap + responsive | ✅ | react-bootstrap + media queries en `lumiere.css` y `Login.css` (1100/960/640/380) |
| 5 | Carrito de compra + vista de pago | ✅ | `CartContext` (lib/cart.jsx) persistido en localStorage |
| 6 | Pagos por la app web | ✅ | Pago simulado client-side (form de tarjeta + comprobante). Schema soporta Stripe real más adelante |
| 7 | Notificación de pago por email | 🟡 | Backend listo (`nodemailer` en server.js:668). Falta SMTP en `.env` y probar |
| 8 | Login Google/Facebook | ❌ | Schema lista (`usuarios.proveedor_oauth/proveedor_id`). Falta implementar |
| 9 | App en hosting | ❌ | |
| 10 | Datos desde MySQL | ✅ | MySQL 8.0 standalone (no XAMPP) |

---

## 📜 Bitácora de sesiones

### Sesión 2026-05-19/20 — Migración inicial
- Copia de `proyectoCineWeb` → `cineReact`. Stack: **Vite + React + react-bootstrap + Express + MySQL**.
- BD migrada SQL Server → MySQL. `database_mysql.sql` + `seed_data_mysql.sql` con SP para generar asientos y funciones.
- Backend (`server.js`): migrado `mssql` → `mysql2/promise`, CORS para `:5173`, sesiones, bcrypt, transacciones, programación masiva, reportes, todos los CRUDs.
- Endpoint de email con nodemailer (modo simulación a consola sin SMTP).
- Frontend: `react-router-dom` con rutas protegidas, `lib/session.jsx` (Context), `lib/api.js` (fetch helper), `lib/toast.jsx`.
- Páginas: Login + Registro, Panel básico, Sucursales, Películas, Productos, Salas, Funciones (todos CRUD).

### Sesión 2026-05-23 — Sesión grande
1. **Fix encoding UTF-8** en seed import (importar vía `cmd /c < file`, no PowerShell pipe — ver sección de gotchas).
2. **Cartelera (cliente)** — `pages/Cartelera.jsx`. Single-page con hero (estreno destacado), filmstrip animado, grid de pósters con clases `.mc.col1..col4`, funciones disponibles como chips horarios, mapa de asientos inline (no modal), dulcería con `.dulgrid/.dulc`, resumen con `.ssum`, botón "Ir a pagar".
3. **CartContext** — `lib/cart.jsx` con persistencia en `localStorage` (key `lumiere_cart`). API: `setFuncionYAsientos`, `addProducto/subProducto/removeProducto`, `setProductos`, `clear`, `totales`.
4. **Carrito + Checkout** — `pages/Carrito.jsx`. Form de pago simulado (titular, número, exp MM/AA, CVV) → POST `/api/ventas` → pantalla de comprobante usando clase `.ticket`.
5. **LumiereModal** — `components/LumiereModal.jsx`. Modal reusable con overlay oscuro `.moverlay` + caja `.modal` Lumière + título Bebas Neue + footer `.macts`. **Reemplazó react-bootstrap `<Modal>` en TODOS los CRUDs** (Sucursales, Películas, Productos, Salas, Funciones — 7 modales).
   - ⚠️ **Gotcha resuelto**: Bootstrap también define `.modal` y peleaba. Solución: aumentar especificidad a `.moverlay .modal` en lumiere.css.
6. **Reportes** — `pages/Reportes.jsx` (solo admin global). Filtros desde/hasta con presets 7d/30d, 4 KPIs, barchart dorado de ingreso por sucursal, barchart teal de boletos, tabla detalle por sucursal, top 5 películas y productos.
7. **VentasAdmin** — `pages/VentasAdmin.jsx`. KPIs + tabla filtrable de historial con estado de pago.
8. **AdmUsu** — `pages/AdmUsu.jsx`. KPIs + búsqueda por nombre/email + filtro por rol.
9. **VentasDispatcher** en `App.jsx` — `/ventas` despacha por rol: cliente → `Cartelera`, admin → `VentasAdmin`.
10. **Panel.jsx rehecho** — dashboards por rol:
    - **Cliente** → redirige a `/ventas` (cartelera).
    - **Admin Global** → "SUCURSALES & INVENTARIOS" con resumen general, cards de sucursales con ocupación %, control de inventarios con barras de stock y badges.
    - **Admin Local** → "GESTIÓN DE CARTELERA" con reportes del día, funciones programadas de hoy, estado de salas.
11. **MisCompras** — `pages/MisCompras.jsx`. Historial del cliente. Agrupa boletos por compra (`id_funcion + minuto de fecha_venta`). Cada compra se muestra como ticket `.ticket` con folio, película, sucursal, sala, función, asientos, productos de dulcería, pago, TOTAL dorado.
12. **🐛 Fix: ventas no aparecían en reportes** — los queries de `/api/reportes/*` y `/api/ventas` filtraban por `f.fecha` (fecha de función). Cambié a `DATE(v.fecha_venta)` para que compras de hoy se vean en reportes de hoy aunque la función sea futura.
13. **Server.js**: `/api/ventas` ahora devuelve también `id_funcion`, `asiento_tipo`, `sala_tipo`, `metodo_pago` (necesarios para MisCompras).
14. **🐛 Fix: botón Pagar no funcionaba** — validación Luhn era muy estricta y el toast de error tenía `z-index 1000` debajo del overlay de noise (`z-index 9000`). Soluciones: validación a 13-19 dígitos (sin Luhn) y toast a `z-index 10000`.
15. **Topbar scrolleable** — `Topbar.jsx` ahora envuelve los links en `.navwrap` con flechas `‹›`, fades a los bordes, scroll horizontal con rueda del ratón, auto-scroll al link activo al cargar.
16. **Responsive (req 4)** — media queries en `lumiere.css` (1100/960/640/380) y `Login.css` (1024/900/640/380):
    - Cards `.c4/.c3/.c2` se reducen progresivamente a 1 columna.
    - Tablas con `display:block; overflow-x:auto; white-space:nowrap` para scroll horizontal en móvil.
    - Modales casi pantalla completa, `.frow` a 1 columna.
    - Login: cin-panel decorativo se **oculta ≤900px**, form ocupa toda la pantalla.
    - Topbar compacta (48px), `.uname` oculto en móvil.
17. **LAN access** — `vite.config.js` con `host: true`. Móvil en misma WiFi abre la URL `Network` que imprime Vite (`http://192.168.X.X:5173`).

---

## 📌 Pendiente

### Req 7: Email real (~30 min)
Backend ya tiene nodemailer integrado en `server.js:666-700`. Solo falta crear un `.env` y configurar:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tucuenta@gmail.com
SMTP_PASS=app-password-de-16-caracteres
SMTP_FROM="LUMIÈRE Cine <tucuenta@gmail.com>"
```
- **Gmail**: crear App Password en https://myaccount.google.com/apppasswords (necesita 2FA activado).
- **Alternativa para testing**: Mailtrap (https://mailtrap.io/) — captura los correos sin enviarlos al destinatario real.
- Instalar `dotenv` si no está: `npm install dotenv` y al inicio de `server.js`: `require('dotenv').config();`
- Reiniciar backend; debes ver `Nodemailer configurado.` en consola.
- Probar: hacer una compra como cliente → debe llegar correo al email registrado.

### Req 8: Login Google/Facebook (~2-3 horas)
Schema lista: `usuarios.proveedor_oauth` (`'google'`/`'facebook'`) y `usuarios.proveedor_id`. **No hay endpoint de OAuth todavía**, hay que crearlo.

**Opción recomendada (más simple)**: `@react-oauth/google` en frontend + verificación con `google-auth-library` en backend.

Pasos:
1. Crear OAuth client en Google Cloud Console (https://console.cloud.google.com/apis/credentials):
   - Tipo: "Web application"
   - Authorized JavaScript origins: `http://localhost:5173`, `http://localhost:3000`
   - Authorized redirect URIs (no se usa con flujo de id_token, pero pónlo igual): `http://localhost:3000/api/oauth/google/callback`
   - Copia Client ID y Client Secret a `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
2. Instalar: `npm install @react-oauth/google google-auth-library` (frontend y backend).
3. Botón "Continuar con Google" en `Login.jsx` debajo de las pestañas Login/Registro.
4. Endpoint backend `/api/oauth/google` que recibe `{ credential }`, verifica con `google-auth-library`, busca/crea usuario por email (rol 'c' por defecto), crea sesión.
5. Frontend tras éxito → `login(u)` y `nav('/panel')`.

Para Facebook: similar con `react-facebook-login` + Graph API. Es opcional si solo piden "Google o Facebook".

### Req 9: Hosting (~3-4 horas)
**Opción recomendada**: [Railway](https://railway.app/) — soporta Node.js + MySQL en el mismo proyecto, gratis con tier inicial.

Pasos:
1. **Build de producción**: en `client/` correr `npm run build` → genera `client/dist/`.
2. **Servir estáticos desde Express**: en `server.js` agregar (si no está):
   ```js
   app.use(express.static(path.join(__dirname, 'client/dist')));
   app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));
   ```
   (El catch-all va al final, después de todos los `/api/*`.)
3. **MySQL en Railway**: provisionar un MySQL service, copiar la connection string al `.env` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
4. **Migrar schema y seed**: conectar con MySQL Workbench a la BD de Railway y ejecutar `database_mysql.sql` y `seed_data_mysql.sql` (¡con encoding utf8mb4!).
5. **Variables de entorno en Railway**: todas las del `.env` local (DB, SMTP, OAuth).
6. **Deploy**: push a un repo Git, conectar Railway al repo, configurar root directory y build command (`cd client && npm install && npm run build && cd .. && npm install`), start command (`node server.js`).
7. Alternativas: Render, Vercel (frontend) + Railway (backend), o un VPS con Docker.

### Mejoras opcionales (no requisitos)
- **VentasAdmin: expandir fila** para ver productos de dulcería (`/api/ventas/:id/detalle` ya existe).
- **Cursor dorado** del original (no urgente, estético).
- **Persistencia "Recordar sesión"** — el checkbox está pero no se usa.
- **Borrar `pages/Placeholder.jsx`** — ya no se usa, se puede limpiar.
- **OAuth callback redirect** tras login social.

---

## ⚙️ Cómo correr el proyecto

### Backend (puerto 3000)
```powershell
cd C:\Users\benlo\Documents\aplicacionesWeb\cineReact
npm install   # solo la primera vez
npm start
```

### Frontend (puerto 5173 con HMR)
```powershell
cd C:\Users\benlo\Documents\aplicacionesWeb\cineReact\client
npm install   # solo la primera vez
npm run dev
```

### MySQL
- Local: `localhost:3306`, usuario `root`, pass `12345`, BD `LumiereCine`.
- Si hay que recargar datos, usar **siempre** el método `cmd /c < file` (ver gotchas).

### Acceso desde móvil (LAN)
- Vite imprime al arrancar: `Network: http://192.168.X.X:5173/`.
- Móvil en la **misma WiFi** → abre esa URL.
- Si Windows pregunta por firewall, **permitir en redes privadas**.

---

## 🧑‍💻 Usuarios de prueba

| Rol | Email | Contraseña | Sucursal |
|---|---|---|---|
| Admin Global | admin@lumiere.mx | Admin123 | — |
| Admin Local  | local@lumiere.mx | Local123 | Lumière Centro |
| Cliente      | cliente@lumiere.mx | Cliente123 | — |

**Tarjeta para pago demo**: cualquier número de 13–19 dígitos, fecha MM/AA futura, CVV 3 dígitos. Ej.:
- Número: `4242 4242 4242 4242`
- Exp: `12/30`
- CVV: `123`

---

## 📁 Mapa de archivos

```
cineReact/
├── server.js                          # API Express + MySQL + nodemailer
├── package.json
├── database_mysql.sql                 # esquema BD
├── seed_data_mysql.sql                # datos de prueba (importar con cmd /c < file)
├── AVANCES.md                         # este archivo
├── COMO_CORRER.md                     # guía rápida de arranque
├── MANUAL_TECNICO.md / MANUAL_USUARIO.md / MANUAL_INSTALACION.md
└── client/
    ├── package.json
    ├── vite.config.js                 # proxy a :3000 + host:true para LAN
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                    # rutas + providers + VentasDispatcher
        ├── styles/lumiere.css         # estilos compartidos + media queries
        ├── lib/
        │   ├── api.js                 # fetch helper (credentials:include)
        │   ├── session.jsx            # auth context
        │   ├── toast.jsx              # notificaciones (z-index 10000)
        │   └── cart.jsx               # CartContext + localStorage     [NUEVO]
        ├── components/
        │   ├── Topbar.jsx             # scroll horizontal + flechas
        │   ├── Protected.jsx          # route guard
        │   └── LumiereModal.jsx       # modal reusable Lumière         [NUEVO]
        └── pages/
            ├── Login.jsx / Login.css  # con responsive media queries
            ├── Panel.jsx              # dashboards por rol             [REHECHO]
            ├── Sucursales.jsx         # CRUD (LumiereModal)
            ├── Peliculas.jsx          # CRUD (LumiereModal)
            ├── Productos.jsx          # CRUD + reabasto (LumiereModal)
            ├── Salas.jsx              # CRUD + visor asientos (LumiereModal)
            ├── Funciones.jsx          # CRUD + masivo (LumiereModal)
            ├── Cartelera.jsx          # vista cliente single-page      [NUEVO]
            ├── Carrito.jsx            # checkout + comprobante         [NUEVO]
            ├── MisCompras.jsx         # historial cliente              [NUEVO]
            ├── Reportes.jsx           # comparativo admin global       [NUEVO]
            ├── VentasAdmin.jsx        # historial admin                [NUEVO]
            ├── AdmUsu.jsx             # lista usuarios admin global    [NUEVO]
            └── Placeholder.jsx        # legacy, borrable
```

---

## ⚠️ Gotchas (problemas resueltos y notas que te ahorrarán tiempo)

### 1. Encoding UTF-8 al importar SQL
- **NUNCA** `Get-Content file.sql | mysql.exe` desde PowerShell — re-codifica los bytes y rompe acentos ("El Último" → "El ?ltimo").
- **SIEMPRE** redirección por `cmd /c`:
  ```powershell
  $mysql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
  $base  = "C:\Users\benlo\Documents\aplicacionesWeb\cineReact"
  cmd /c "`"$mysql`" -u root -p12345 --default-character-set=utf8mb4 -e `"DROP DATABASE IF EXISTS LumiereCine;`""
  cmd /c "`"$mysql`" -u root -p12345 --default-character-set=utf8mb4 < `"$base\database_mysql.sql`""
  cmd /c "`"$mysql`" -u root -p12345 --default-character-set=utf8mb4 < `"$base\seed_data_mysql.sql`""
  ```
- Verificar: `SELECT HEX(nombre) FROM peliculas WHERE nombre LIKE '%ltimo%'` debe dar bytes `C3 9A` para `Ú`.

### 2. Bootstrap `.modal` colisiona con `.modal` Lumière
- Bootstrap CSS define `.modal { display: none; position: fixed; ... }`.
- Lumière también usa `.modal`. La solución está aplicada: en `lumiere.css` la regla es `.moverlay .modal` (más específica) para ganar.
- **No definir** clases nuevas que se llamen solo `.modal`; o usa siempre con un padre como `.moverlay`.

### 3. z-index del proyecto
| Elemento | z-index |
|---|---|
| Toast notificaciones | **10000** |
| Cursor custom (no usado) | 9999 / 9998 |
| `body::before` noise overlay | **9000** |
| `success-overlay` (login) | 8000 |
| Modal overlay (.moverlay) | 500 |
| Topbar (.role-bar) | 200 |

Si un elemento nuevo tiene que estar por encima del noise, usar z-index ≥ 10000.

### 4. Reportes filtran por **fecha de venta**, no de función
Las consultas en `/api/reportes/global`, `/api/reportes/sucursal/:id`, `/api/reportes/comparativo` y el filtro de fecha en `/api/ventas` usan `DATE(v.fecha_venta) = ...`. Si necesitas reportes "ingresos para funciones de la próxima semana", agrega un filtro nuevo en lugar de cambiar este.

### 5. Cómo se guarda una compra
- POST `/api/ventas` con `{ id_funcion, asientos: [ids], productos: [{id_producto, cantidad}], metodo_pago }`.
- Backend hace una **transacción**: crea **N filas en `ventas`** (una por asiento) + N filas en `detalle_venta` para productos (asociados al `id_venta` más bajo del lote).
- `MisCompras.jsx` agrupa boletos por `id_funcion + minuto de fecha_venta` (sirve si hay 2 boletos de la misma función pero compras distintas separadas por minutos).

### 6. Pago simulado
- Validación lax a propósito: solo 13–19 dígitos, fecha futura, CVV 3-4 dígitos. **No** Luhn.
- Si meten Stripe real más adelante: restaurar Luhn o usar `<CardElement>` de Stripe directamente (que ya valida).

### 7. Topbar responsive
- Los links scrollean horizontalmente cuando no caben.
- Si agregan más enlaces, no hay que tocar nada — el scroll y las flechas reaccionan solas.
- `ResizeObserver` actualiza el estado al cambiar el viewport.

### 8. Build de producción aún no probado
- `cd client && npm run build` debería funcionar pero no se ha verificado.
- Verificar que `server.js` sirva `client/dist/` cuando se haga el deploy.

---

## 🛠 Para continuar la siguiente sesión (orden sugerido)

1. **Email real (req 7)** — ~30 min, lo más rápido y vistoso para defensa.
2. **OAuth Google (req 8)** — ~2-3 horas, el más vendedor visualmente.
3. **Hosting (req 9)** — ~3-4 horas, el último paso, con todo lo demás funcionando.
4. **Pulir**: borrar `Placeholder.jsx`, capturar screenshots para entrega, revisar `MANUAL_*`.

---

**Última actualización:** 2026-05-23 — sesión Cartelera/Carrito/Reportes/Panel/Responsive/MisCompras/Topbar.
