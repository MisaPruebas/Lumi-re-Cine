# Manual de Usuario — LUMIÈRE Cine

Guía de uso del sistema para los tres tipos de usuario:
**Cliente**, **Administrador Local** y **Administrador Global**.

---

## 1. Acceso al sistema

### 1.1 Pantalla de inicio de sesión

1. Abre el navegador en la dirección que te haya dado tu administrador (ej. `http://localhost:3000`).
2. Verás la pantalla de **LUMIÈRE — Acceso al Sistema**, dividida en dos paneles:
   - Izquierda: panel cinematográfico con métricas en tiempo real.
   - Derecha: formulario de acceso.

### 1.2 Iniciar sesión

1. Selecciona la pestaña **Iniciar sesión**.
2. Elige tu rol haciendo clic en una de las tres tarjetas:
   - **Cliente** (acento dorado): para comprar boletos y ver cartelera.
   - **Admin G.** (acento azul): para gestionar la cadena completa.
   - **Admin L.** (acento teal): para gestionar una sucursal específica.
3. Si elegiste **Admin Local**, aparece un campo extra **"Sucursal asignada"** — selecciona la sucursal a la que perteneces.
4. Ingresa correo y contraseña.
5. Click en **Iniciar sesión**.

> Si las credenciales son correctas, una pantalla de transición confirma el acceso y te lleva al panel principal.

### 1.3 Crear una cuenta nueva (clientes)

1. En el formulario, click en la pestaña **Registrarse**.
2. Completa: nombre, correo, contraseña (mínimo 6 caracteres) y confirmación.
3. Mantén el rol en **Cliente** (recomendado para registros públicos).
4. Click en **Crear cuenta**.

### 1.4 Cerrar sesión

En cualquier página, esquina superior derecha → botón **Cerrar sesión**.

---

## 2. Navegación

Una vez dentro, todas las páginas comparten una **barra superior** con:
- Logo "LUMIÈRE."
- Enlaces al panel y a las secciones permitidas para tu rol.
- Tu nombre y el botón **Cerrar sesión**.

Los admins ven además un **pill de "Ver como"** debajo de la barra (Cliente / Admin Global / Admin Local) que les permite cambiar de vista del panel sin cerrar sesión — útil para probar el flujo del cliente.

---

## 3. Vista Cliente

### 3.1 Cartelera

1. En el **Panel**, ves un *hero* con el estreno destacado.
2. Selecciona tu **sucursal** y la **fecha** que prefieras.
3. La sección "Cartelera" muestra todas las películas con función ese día.
4. Más abajo, **"Funciones disponibles"** lista los horarios de cada película.

### 3.2 Comprar boletos

1. Click en uno de los **horarios** de la película deseada.
2. La página te lleva al mapa de asientos: la pantalla está arriba; las filas A-J abajo.
3. Click en los asientos disponibles (cuadros con borde gris); los seleccionados se marcan en dorado. Las filas **I y J son VIP** (más anchos, marcan en rojo).
4. Asientos en gris oscuro están **ocupados**.

### 3.3 Agregar dulcería (opcional)

Justo debajo del mapa de asientos, la sección **"Dulcería"** lista los productos disponibles. Usa los botones `+` y `−` para definir cantidades. Los precios se suman al total automáticamente.

### 3.4 Confirmar compra

1. Revisa el bloque **"Resumen de compra"**: cantidad de boletos y total.
2. Click en **Confirmar compra**.
3. Si todo sale bien, debajo aparece el **comprobante digital** con folio único, película, sucursal, sala, fecha, hora, asientos comprados, dulcería y total.
4. El stock de productos y los asientos se actualizan al instante.

### 3.5 Mensajes posibles

| Mensaje | Significado |
|---|---|
| "Elige una función primero" | No has clickeado ningún horario. |
| "Selecciona al menos un asiento" | El total de asientos seleccionados es cero. |
| "Stock insuficiente" | Pediste más unidades de un producto que las disponibles. |
| "Asiento ya vendido" | Otro cliente compró ese asiento mientras tú elegías. Refresca la página. |

---

## 4. Vista Administrador Local

Pensada para el gerente de una sucursal específica.

### 4.1 Panel

Al entrar verás:
- **Reportes del día**: boletos vendidos, ingreso total, funciones programadas y canceladas.
- **Funciones programadas — hoy**: todas las funciones del día con película, hora, sala, precios y estado.
- **Estado de salas**: una tarjeta por sala con su próxima función.

### 4.2 Crear una nueva función

Desde el panel:
1. Click en **+ Nueva función**.
2. Llena el modal: película, sala, fecha, hora, precio general y precio VIP.
3. Click en **Guardar función**.

### 4.3 Programar funciones por lote

(Sólo desde la página **Funciones**, accesible desde la barra superior.)

1. Click en **+ Programación masiva**.
2. Llena el modal:
   - **Película** a programar.
   - **Salas**: marca varias (sólo verás las de tu sucursal).
   - **Rango de fechas** (desde / hasta).
   - **Horarios**: escribe una hora, presiona Enter o `+`. Repite para agregar varios. Para quitar uno, click en la "✕".
   - **Precios** general y VIP (aplicados a todas).
3. El **preview** te dice cuántas funciones se crearán: `salas × días × horarios`.
4. Click en **Programar**. Las combinaciones que ya existían se omiten automáticamente.

### 4.4 Otras secciones

Desde la barra superior tienes acceso a:
- **Salas** — alta/edición de salas y configuración de asientos.
- **Funciones** — listado completo, edición y baja.
- **Productos** — inventario de dulcería y reabastecimiento.
- **Ventas** — historial de transacciones.

---

## 5. Vista Administrador Global

Pensada para el responsable de la cadena completa.

### 5.1 Panel

Muestra el resumen de toda la cadena:
- **Resumen general**: sucursales activas, boletos del día, ingreso total, alertas de stock.
- **Sucursales**: una tarjeta por sucursal con número de salas, capacidad, funciones del día y boletos vendidos hoy.
- **Control de inventarios**: tabla con todos los productos, barra de progreso por nivel (verde óptimo, dorado bajo, rojo crítico) y botón **Reabastecer**.
- **Usuarios del sistema**: lista de usuarios con su rol, sucursal, último acceso y estado.

### 5.2 Reabastecer un producto

1. En la tabla de inventarios, click en **Reabastecer** del producto deseado.
2. Ingresa la cantidad de unidades a agregar.
3. El stock se actualiza al instante.

### 5.3 Gestionar sucursales

Desde la barra superior → **Sucursales**:
- Lista todas las sucursales con su dirección, estado, conteo de salas y usuarios.
- **+ Nueva sucursal** abre un modal con nombre, dirección y estado (Activa / Mantenimiento / Inactiva).
- **Editar** modifica los mismos campos.
- **Eliminar** sólo funciona si la sucursal no tiene salas ni usuarios asociados; si los tiene, el sistema te lo indicará.

### 5.4 Catálogo de películas

Desde la barra superior → **Películas**: alta, edición y baja del catálogo. Cada película tiene nombre, categoría/género, clasificación y duración.

### 5.5 Reportes comparativos

Desde la barra superior → **Reportes**:

1. Ajusta el **rango de fechas** (presets de 7 y 30 días disponibles).
2. Click en **Generar**.
3. Verás:
   - **4 KPIs** del período: boletos, ingreso de boletos, ingreso de dulcería, ingreso total.
   - **Gráfica de ingreso total por sucursal** (barras horizontales doradas).
   - **Gráfica de boletos vendidos por sucursal** (barras teal).
   - **Tabla detallada** con funciones, boletos, ingresos desglosados, total y ticket promedio por sucursal.
   - **Top 5 películas** del período (boletos e ingreso).
   - **Top 5 productos** de dulcería (unidades e ingreso).

### 5.6 Otras secciones

- **Salas** — vista completa de todas las salas de la cadena.
- **Funciones** — programación individual y masiva (RF6).
- **Productos** — alta/edición del catálogo de dulcería.
- **Ventas** — historial de toda la cadena, filtrable por sucursal y fecha.

---

## 6. Tips de uso

- El sistema usa un **cursor personalizado** (punto dorado + anillo) que reacciona al pasar sobre elementos clickeables. Si al inicio se ve raro, da click una vez para activarlo.
- Los **toasts** (notificaciones esquina inferior derecha) confirman las acciones (verde) o reportan errores (rojo).
- Para **probar la perspectiva del cliente** sin cerrar sesión, los admins pueden usar el pill **"Ver como Cliente"** debajo de la barra superior del panel.
- Las páginas son **responsive**: en pantallas chicas, las tarjetas se reorganizan automáticamente.

---

## 7. Glosario

| Término | Definición |
|---|---|
| **Cartelera** | Conjunto de películas con función disponible en una fecha y sucursal. |
| **Función** | Proyección programada: combinación de película, sala, fecha y horario. |
| **Asiento VIP** | Butaca premium en filas I y J — más anchas y con precio diferenciado. |
| **Stock crítico** | Producto con unidades por debajo de su mínimo definido. |
| **Ticket promedio** | Ingreso total / boletos vendidos en el período. |
| **Sucursal** | Cada cine de la cadena Lumière. |
