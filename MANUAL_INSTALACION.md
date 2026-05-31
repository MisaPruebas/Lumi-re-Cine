# Manual de Instalación — LUMIÈRE Cine

Sistema de gestión integral para complejos cinematográficos.
Desarrollado por **Aura Systems** sobre Node.js + Express + SQL Server.

---

## 1. Requisitos previos

| Componente | Versión recomendada | Notas |
|---|---|---|
| Windows | 10 / 11 | También funciona en macOS / Linux con SQL Server en contenedor. |
| Node.js | 18.x o superior | Incluye `npm`. Descarga: https://nodejs.org |
| SQL Server | 2019 / 2022 / 2025 | Edición Express, Developer o superior. |
| SQL Server Management Studio (SSMS) | 19+ | Para ejecutar los scripts `.sql`. |
| Navegador moderno | Chrome 110+, Edge, Firefox | Se requiere soporte de Fetch y CSS Grid. |

> **Puerto TCP 1433** debe estar habilitado en SQL Server (`SQL Server Configuration Manager → Network Configuration → TCP/IP → habilitar`).

---

## 2. Estructura del proyecto

```
proyectoCineWeb/
├── server.js              # Servidor Express + endpoints API
├── package.json           # Dependencias Node
├── database.sql           # Esquema de la base de datos
├── seed_data.sql          # Datos de prueba (películas, salas, funciones, productos)
├── login.html             # Pantalla de acceso
├── admUsu.html            # Panel principal (Cliente / AG / AL)
├── sucursales.html        # CRUD sucursales (AG)
├── peliculas.html         # CRUD películas (AG)
├── salas.html             # CRUD salas
├── funciones.html         # Programación de funciones + masiva
├── productos.html         # Inventario de dulcería
├── ventas.html            # Compra (cliente) e historial (admins)
├── reportes.html          # Reporte comparativo de ventas (AG)
├── app.css                # Estilos compartidos
├── app.js                 # Lógica común (sesión, API, topbar, helpers)
└── node_modules/          # Dependencias instaladas
```

---

## 3. Instalación paso a paso

### 3.1 Crear la base de datos

1. Abre **SSMS** y conéctate a tu instancia local de SQL Server (autenticación de Windows o SQL).
2. Abre el archivo `database.sql` y ejecútalo (**F5**).
   Esto crea la base `LumiereCine`, las 9 tablas y carga los 3 usuarios de prueba.
3. Abre el archivo `seed_data.sql` y ejecútalo.
   Esto carga 6 películas, 13 salas (~1 820 asientos), ~80 funciones para los próximos 5 días, 13 productos y 3 usuarios extra.

### 3.2 Crear el usuario SQL para la aplicación

El servidor se conecta con un usuario SQL llamado `proyectodba_user`. Crea ese login y dale permisos sobre `LumiereCine`:

```sql
USE master;
GO
CREATE LOGIN proyectodba_user WITH PASSWORD = 'ProDba2026?', CHECK_POLICY = OFF;
GO
USE LumiereCine;
GO
CREATE USER proyectodba_user FOR LOGIN proyectodba_user;
ALTER ROLE db_owner ADD MEMBER proyectodba_user;
GO
```

> Si prefieres usar otro usuario o autenticación de Windows, edita el bloque `dbConfig` en `server.js`.

### 3.3 Habilitar autenticación SQL

En SSMS: clic derecho sobre la instancia → **Properties → Security → SQL Server and Windows Authentication mode**. Reinicia el servicio "SQL Server (MSSQLSERVER)" desde *Servicios de Windows*.

### 3.4 Instalar dependencias Node

Desde una terminal **PowerShell** o **CMD** en la carpeta del proyecto:

```powershell
cd C:\Users\benlo\Documents\aplicacionesWeb\proyectoCineWeb
npm install
```

Esto instala `express`, `express-session`, `mssql` y `bcryptjs`.

### 3.5 Verificar la configuración del servidor

Abre `server.js` y revisa el bloque `dbConfig` (líneas ~19-29):

```js
const dbConfig = {
  user: 'proyectodba_user',
  password: 'ProDba2026?',
  server: 'localhost',
  port: 1433,
  database: 'LumiereCine',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};
```

Cambia `user`, `password`, `server` o `port` según tu entorno.

### 3.6 Iniciar el servidor

```powershell
npm start
```

Salida esperada:

```
Servidor LUMIÈRE corriendo en http://localhost:3000
Conectado a SQL Server — LumiereCine
```

### 3.7 Abrir la aplicación

Navega a: **http://localhost:3000**

Te redirigirá a `login.html`.

---

## 4. Credenciales de prueba

| Rol | Email | Contraseña | Sucursal |
|---|---|---|---|
| Admin Global | `admin@lumiere.mx` | `Admin123` | — |
| Admin Local | `local@lumiere.mx` | `Local123` | Lumière Centro |
| Cliente | `cliente@lumiere.mx` | `Cliente123` | — |

> Las contraseñas están en texto plano sólo en el seed. En el primer login se rehashean automáticamente con bcrypt.

---

## 5. Solución de problemas

| Problema | Causa probable | Solución |
|---|---|---|
| `Error de conexión a BD: Login failed` | Usuario o contraseña inválidos | Revisa la sección 3.2 y reinicia el servicio SQL. |
| `Error de conexión a BD: connect ECONNREFUSED` | TCP/IP deshabilitado o servicio detenido | Habilita TCP/IP en *Configuration Manager* y reinicia el servicio. |
| El navegador queda en blanco | El servidor no inició | Verifica la consola: si dice "EADDRINUSE: 3000", cierra el proceso anterior o cambia el `PORT` en `server.js`. |
| El selector de sucursales del login está vacío | `seed_data.sql` no se ejecutó o `database.sql` no se cargó | Vuelve a ejecutar ambos archivos en SSMS. |
| `Cannot find module 'bcryptjs'` | Faltó `npm install` | Corre `npm install` en la carpeta del proyecto. |
| Botones invisibles, sin cursor | Bloqueador de scripts o caché vieja | Recarga con **Ctrl+F5** o limpia caché del navegador. |

---

## 6. Detener / reiniciar el servidor

- **Detener**: en la terminal donde corre `npm start`, presiona `Ctrl+C`.
- **Reiniciar tras cambios** en `server.js`: detén y vuelve a correr `npm start`.
- Cambios sólo en HTML/CSS/JS del front: **no requieren reiniciar**, sólo recargar el navegador.

---

## 7. Restablecer datos

Si quieres volver al estado limpio de prueba:

```sql
USE master;
GO
DROP DATABASE LumiereCine;
GO
```

Luego vuelve a ejecutar `database.sql` + `seed_data.sql`.
