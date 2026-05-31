# Cómo correr LUMIÈRE — versión React + MySQL

## 1. Importar la base de datos en XAMPP
1. Inicia **XAMPP** y arranca **MySQL** (Apache no es necesario).
2. Abre `http://localhost/phpmyadmin`.
3. Click en pestaña **Importar** → selecciona `database_mysql.sql` → **Continuar**.
4. Click otra vez en **Importar** → selecciona `seed_data_mysql.sql` → **Continuar**.

Si tu MySQL tiene contraseña para `root`, editá `server.js` línea ~36 (`password: ''`).

## 2. Instalar dependencias

Desde la carpeta `cineReact/`:
```bash
npm install
```

Y dentro de `cineReact/client/`:
```bash
cd client
npm install
```

## 3. Correr en desarrollo

Necesitás **dos terminales**:

**Terminal 1 — backend (Express + MySQL):**
```bash
cd C:\Users\benlo\Documents\aplicacionesWeb\cineReact
npm start
```
Verás: `Servidor LUMIÈRE corriendo en http://localhost:3000`

**Terminal 2 — frontend (Vite + React):**
```bash
cd C:\Users\benlo\Documents\aplicacionesWeb\cineReact\client
npm run dev
```
Verás: `Local: http://localhost:5173/`

Abre `http://localhost:5173` en el navegador. Vite hace **proxy** automático de `/api/*` al backend.

## 4. Usuarios de prueba

| Rol           | Email                | Contraseña   |
|---------------|----------------------|--------------|
| Admin Global  | admin@lumiere.mx     | Admin123     |
| Admin Local   | local@lumiere.mx     | Local123     | (sucursal: Lumière Centro)
| Cliente       | cliente@lumiere.mx   | Cliente123   |

## 5. Para producción (hosting — requisito 9)

Dentro de `client/`:
```bash
npm run build
```
Esto genera `client/dist/`. El backend ya está configurado para servirlo en el mismo puerto 3000. Sólo necesitás levantar `npm start` y se sirve todo desde un único proceso.

## Estado actual de la migración

✅ Vite + React + react-bootstrap configurado  
✅ MySQL schema y seed convertidos desde SQL Server  
✅ server.js totalmente migrado a mysql2  
✅ Login + registro (con elección de rol y sucursal) en React  
✅ Topbar/navegación dinámica por rol  
✅ Panel inicial  
✅ Endpoint de notificación por email (nodemailer — opcional con SMTP env vars)  
✅ Schema soporta `estado_pago`, `metodo_pago`, `proveedor_oauth` para próximos pasos

🔜 Próximos turnos (cada uno migra una pantalla):
- Sucursales, Películas, Salas, Funciones, Productos, Reportes (CRUD admin)
- Cartelera + selección asientos + carrito + checkout (cliente)
- Pago integrado (Stripe/MercadoPago) y emails con SMTP real
- Login con Google/Facebook (OAuth)
