# Guía de Configuración: MySQL Standalone (Sin XAMPP)

Esta guía documenta los pasos realizados para migrar la base de datos de XAMPP a una instalación independiente de MySQL Server.

## 1. Localización de MySQL
Dado que `mysql` no estaba en las variables de entorno (PATH), se utilizó la ruta directa del ejecutable:
`C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`

## 2. Importación de la Base de Datos
Para evitar errores de rutas con espacios o caracteres especiales, se utilizó el monitor de MySQL:

1. **Entrar al monitor:**
   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
   ```
2. **Ejecutar scripts de importación (dentro de mysql>):**
   ```sql
   -- Importar esquema (Tablas)
   source C:/Users/benlo/Documents/aplicacionesWeb/cineReact/database_mysql.sql;

   -- Importar datos de prueba (Seed)
   source C:/Users/benlo/Documents/aplicacionesWeb/cineReact/seed_data_mysql.sql;
   ```

## 3. Configuración del Servidor (Node.js)
Se modificó el archivo `server.js` para incluir las credenciales de la nueva instalación:

- **Archivo:** `C:\Users\benlo\Documents\aplicacionesWeb\cineReact\server.js`
- **Línea:** ~36 (bloque `dbConfig`)
- **Cambio:** Se actualizó el campo `password` con la contraseña definida durante la instalación de MySQL Server.

```javascript
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'TU_CONTRASEÑA_AQUÍ', // Contraseña actualizada
  database: 'LumiereCine',
  ...
};
```

## 4. Comandos para Iniciar el Proyecto

### Backend (Terminal 1)
```powershell
cd C:\Users\benlo\Documents\aplicacionesWeb\cineReact
npm install
npm start
```

### Frontend (Terminal 2)
```powershell
cd C:\Users\benlo\Documents\aplicacionesWeb\cineReact\client
npm install
npm run dev
```

---
*Nota: Para futuros cambios en la base de datos, siempre usar `/` en lugar de `\` al usar el comando `source` dentro de MySQL.*
