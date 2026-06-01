// ===============================================
// LUMIÈRE CINE — API Express + MySQL (mysql2)
// Compatible con XAMPP y MySQL Standalone
// ===============================================
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const BCRYPT_ROUNDS = 10;
const isBcryptHash = s => typeof s === 'string' && /^\$2[aby]\$\d{2}\$/.test(s);

const app = express();
app.use(express.json());

// CORS para Vite dev server (puerto 5173). En producción mismo origen.
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));

app.use(session({
  secret: 'lumiere-cine-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' }
}));

  app.use(passport.initialize());
  app.use(passport.session());

  // Serialización de Passport (requerida para mantener la sesión activa)
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

// Servir build de Vite si existe (producción)
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// ── CONFIGURACIÓN GLOBAL DE NODEMAILER (Brevo Real - Requisito 7) ──
let mailer = null;
try {
  const nodemailer = require('nodemailer');
  if (process.env.SMTP_HOST) {
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465' ? true : false, // true para 465, false para 587
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      },
      tls: {
        rejectUnauthorized: false // Evita bloqueos por firewalls locales
      }
    });
    console.log('Nodemailer configurado globalmente con Brevo (Correos Reales).');
  } else {
    console.log('SMTP no configurado — los correos se imprimirán en consola.');
  }
} catch (_) { 
  console.log('nodemailer no instalado.'); 
}

async function sendVentaEmail(user, info) {
  const correoDestino = user.email || user.email_usuario;
  const nombreUsuario = user.name || user.nombre || 'Cliente';

  const subject = `🍿 LUMIÈRE — ¡Confirmación de compra! Boletos #${info.ventas[0]}`;

  // Diseño HTML Premium alineado a la estética oscura de LUMIÈRE
  const htmlContent = `
    <div style="background-color: #0d0b06; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; max-width: 550px; margin: 0 auto; border: 2px solid #c9a84c; border-radius: 8px;">
      
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #c9a84c; font-size: 28px; letter-spacing: 4px; margin: 0; font-weight: bold;">LUMIÈRE</h1>
        <p style="color: #a0a0a0; font-size: 12px; font-style: italic; margin: 5px 0 0 0;">Tu experiencia cinematográfica</p>
      </div>

      <hr style="border: none; border-top: 1px solid #c9a84c; margin-bottom: 20px;" />

      <p style="font-size: 16px; line-height: 1.5; color: #e0e0e0;">
        Hola <strong style="color: #c9a84c;">${nombreUsuario}</strong>, ¡el proyector está listo! Tu pago ha sido procesado con éxito y tus asientos han quedado reservados.
      </p>

      <div style="background-color: #17140c; border-left: 4px solid #c9a84c; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <h3 style="color: #c9a84c; margin-top: 0; margin-bottom: 12px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Detalle de tus Boletos</h3>
        
        <table style="width: 100%; color: #e0e0e0; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #a0a0a0;">Cantidad de asientos:</td>
            <td style="padding: 5px 0; text-align: right; font-weight: bold;">${info.asientos} boleto(s)</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #a0a0a0;">Comprobante(s):</td>
            <td style="padding: 5px 0; text-align: right; font-family: monospace; color: #c9a84c;">#${info.ventas.join(', #')}</td>
          </tr>
          <tr style="border-top: 1px dashed #333;">
            <td style="padding: 10px 0 0 0; color: #c9a84c; font-size: 16px; font-weight: bold;">Total Pagado:</td>
            <td style="padding: 10px 0 0 0; text-align: right; color: #c9a84c; font-size: 16px; font-weight: bold;">$${info.total.toFixed(2)} MXN</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #a0a0a0; line-height: 1.4; text-align: center; margin-top: 25px;">
        Presenta los números de comprobante en la taquilla digital de la sucursal o desde tu apartado "Mis Compras" en nuestra plataforma para obtener tus accesos físicos.
      </p>

      <hr style="border: none; border-top: 1px solid #222; margin-top: 25px; margin-bottom: 15px;" />

      <p style="font-size: 11px; color: #666; text-align: center; margin: 0;">
        © 2026 Lumière Cine · Proyecto de Desarrollo de Aplicaciones Web (DAW).<br/>
        Este es un correo electrónico automático generado con fines académicos.
      </p>
    </div>
  `;

  if (!mailer) {
    console.log('── EMAIL (simulado) ──\nA:', correoDestino, '\nAsunto:', subject);
    return;
  }

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || 'noreply@lumiere.mx',
      to: correoDestino, 
      subject, 
      html: htmlContent // Mandamos el diseño HTML en lugar de texto plano
    });
    console.log(`=> ¡Correo REAL enviado con éxito vía Brevo! Destinatario: ${correoDestino}`);
  } catch (emailError) {
    console.error('❌ Error crítico en el transporte de Brevo:', emailError.message);
  }
}

// ── ESTRATEGIA PASSPORT GOOGLE (Requisito 8) ──
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const name = profile.displayName || 'Usuario Google';

      if (!email) {
        return done(new Error('Google no proporcionó un correo electrónico.'), null);
      }

      // 1. Buscar si el usuario ya existe por su correo electrónico
      const [rows] = await pool.execute(
        'SELECT u.id_usuario, u.nombre, u.email, u.rol, s.nombre AS sucursal FROM usuarios u LEFT JOIN sucursales s ON u.id_sucursal = s.id_sucursal WHERE u.email = ?',
        [email]
      );

      let sessionUser = null;

      if (rows.length > 0) {
        // El usuario ya existe, usamos sus datos de la base de datos
        const user = rows[0];
        // Actualizamos su último acceso
        await pool.execute('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?', [user.id_usuario]);
        
        sessionUser = {
          id: user.id_usuario,
          name: user.nombre,
          email: user.email,
          role: user.rol,
          sucursal: user.sucursal || ''
        };
      } else {
        // 2. El usuario no existe, lo registramos automáticamente como Cliente ('c')
        // Ponemos una contraseña aleatoria bryptizada ya que no la usará (entrará siempre por Google)
        const fakePassword = await require('bcryptjs').hash(Math.random().toString(36), 10);
        
        const [ins] = await pool.execute(
          `INSERT INTO usuarios (nombre, email, contrasena, rol, id_sucursal, ultimo_acceso, estado)
           VALUES (?, ?, ?, 'c', NULL, NOW(), 'Activo')`,
          [name, email, fakePassword]
        );

        sessionUser = {
          id: ins.insertId,
          name: name,
          email: email,
          role: 'c',
          sucursal: ''
        };
      }

      return done(null, sessionUser);
    } catch (err) {
      console.error('Error en la estrategia de Google:', err.message);
      return done(err, null);
    }
  }
));

// ── Configuración MySQL ──
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'LumiereCine',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  charset: 'utf8mb4'
};

let pool;
(async () => {
  try {
    pool = mysql.createPool(dbConfig);
    const c = await pool.getConnection();
    await c.ping();
    c.release();
    console.log('Conectado a MySQL — LumiereCine');
  } catch (err) {
    console.error('Error de conexión a MySQL:', err.message);
    console.error('Verifica que tu servidor MySQL esté corriendo y que la BD LumiereCine exista.');
  }
})();

const q = (sql, params = []) => pool.execute(sql, params);

// ── RUTAS DE AUTENTICACIÓN GOOGLE (Requisito 8) ──

// Iniciar el proceso y redirigir a Google
app.get('/api/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'], 
  prompt: 'select_account' // <── ESTO OBLIGA A GOOGLE A MOSTRAR LA PANTALLA SIEMPRE
}));

// Callback de retorno de Google
app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=oauth_failed' }),
  (req, res) => {
    // Cuando Passport termina con éxito, guarda los datos en req.user.
    // Lo asignamos a tu estructura de sesión express-session tradicional:
    req.session.user = req.user;
    
    // Redirigimos al Frontend (puedes cambiarlo a '/' si ya estás en producción)
    res.redirect('http://localhost:5173/'); 
  }
);

// ── LOGIN ──
app.post('/api/login', async (req, res) => {
  const { email, password, role, sucursal } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Faltan datos para iniciar sesión.' });
  try {
    const [rows] = await q(`
      SELECT u.id_usuario, u.nombre, u.email, u.rol, u.contrasena, s.nombre AS sucursal
      FROM usuarios u
      LEFT JOIN sucursales s ON u.id_sucursal = s.id_sucursal
      WHERE u.email = ? AND u.rol = ?
    `, [email, role]);

    if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas o el rol no coincide.' });

    const user = rows[0];
    const stored = user.contrasena;
    let valid = false, needsUpgrade = false;
    if (isBcryptHash(stored)) {
      valid = await bcrypt.compare(password, stored);
    } else {
      valid = stored === password;
      needsUpgrade = valid;
    }
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas o el rol no coincide.' });
    if (role === 'al' && user.sucursal !== sucursal) return res.status(401).json({ error: 'Sucursal incorrecta para este usuario.' });

    if (needsUpgrade) {
      const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await q('UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?', [hash, user.id_usuario]);
    }
    await q('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?', [user.id_usuario]);

    req.session.user = {
      id: user.id_usuario, name: user.nombre, email: user.email,
      role: user.rol, sucursal: user.sucursal || ''
    };
    res.json(req.session.user);
  } catch (err) {
    console.error('Error en login:', err.message);
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

// ── REGISTER ──
app.post('/api/register', async (req, res) => {
  const { name, email, password, role, sucursal } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Faltan datos para el registro.' });
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  try {
    const [exists] = await q('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(400).json({ error: 'Este correo ya está registrado.' });

    let sucursalId = null, sucursalName = '';
    if (role === 'al' && sucursal) {
      const [sr] = await q('SELECT id_sucursal, nombre FROM sucursales WHERE nombre = ?', [sucursal]);
      if (sr.length > 0) { sucursalId = sr[0].id_sucursal; sucursalName = sr[0].nombre; }
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const [ins] = await q(
      `INSERT INTO usuarios (nombre, email, contrasena, rol, id_sucursal, ultimo_acceso, estado)
       VALUES (?, ?, ?, ?, ?, NOW(), 'Activo')`,
      [name, email, hash, role, sucursalId]
    );

    req.session.user = { id: ins.insertId, name, email, role, sucursal: sucursalName };
    res.json(req.session.user);
  } catch (err) {
    console.error('Error en registro:', err.message);
    res.status(500).json({ error: 'Error del servidor.' });
  }
});

app.get('/api/session', (req, res) => {
  if (req.session.user) res.json(req.session.user);
  else res.status(401).json({ error: 'No hay sesión activa.' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

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

// ═════════════════ SUCURSALES ═════════════════
app.get('/api/sucursales/publicas', async (req, res) => {
  try {
    const [r] = await q(`SELECT id_sucursal, nombre, estado FROM sucursales WHERE estado = 'Activa' ORDER BY nombre`);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/sucursales', requireAuth, async (req, res) => {
  try {
    const [r] = await q(`
      SELECT su.id_sucursal, su.nombre, su.direccion, su.estado,
             (SELECT COUNT(*) FROM salas s     WHERE s.id_sucursal = su.id_sucursal) AS salas,
             (SELECT COUNT(*) FROM usuarios u  WHERE u.id_sucursal = su.id_sucursal) AS usuarios
      FROM sucursales su ORDER BY su.nombre`);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sucursales', requireRole('ag'), async (req, res) => {
  const { nombre, direccion, estado } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  try {
    const [ins] = await q(`INSERT INTO sucursales (nombre, direccion, estado) VALUES (?, ?, ?)`,
      [nombre.trim(), direccion || null, estado || 'Activa']);
    const [r] = await q('SELECT * FROM sucursales WHERE id_sucursal = ?', [ins.insertId]);
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/sucursales/:id', requireRole('ag'), async (req, res) => {
  const { nombre, direccion, estado } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
  try {
    await q(`UPDATE sucursales SET nombre=?, direccion=?, estado=? WHERE id_sucursal=?`,
      [nombre.trim(), direccion || null, estado || 'Activa', req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/sucursales/:id', requireRole('ag'), async (req, res) => {
  try {
    const [dep] = await q(`
      SELECT (SELECT COUNT(*) FROM salas    WHERE id_sucursal=?) AS salas,
             (SELECT COUNT(*) FROM usuarios WHERE id_sucursal=?) AS usuarios`,
      [req.params.id, req.params.id]);
    const { salas, usuarios } = dep[0];
    if (salas > 0 || usuarios > 0) {
      return res.status(400).json({ error: `No se puede eliminar: tiene ${salas} sala(s) y ${usuarios} usuario(s) asociados.` });
    }
    await q('DELETE FROM sucursales WHERE id_sucursal=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═════════════════ PELÍCULAS ═════════════════
app.get('/api/peliculas', requireAuth, async (req, res) => {
  try { const [r] = await q('SELECT * FROM peliculas ORDER BY nombre'); res.json(r); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/peliculas', requireRole('ag'), async (req, res) => {
  const { nombre, categoria, clasificacion, duracion } = req.body;
  try {
    const [ins] = await q(`INSERT INTO peliculas (nombre, categoria, clasificacion, duracion) VALUES (?, ?, ?, ?)`,
      [nombre, categoria, clasificacion, duracion]);
    const [r] = await q('SELECT * FROM peliculas WHERE id_pelicula = ?', [ins.insertId]);
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/peliculas/:id', requireRole('ag'), async (req, res) => {
  const { nombre, categoria, clasificacion, duracion } = req.body;
  try {
    await q(`UPDATE peliculas SET nombre=?, categoria=?, clasificacion=?, duracion=? WHERE id_pelicula=?`,
      [nombre, categoria, clasificacion, duracion, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/peliculas/:id', requireRole('ag'), async (req, res) => {
  try { await q('DELETE FROM peliculas WHERE id_pelicula=?', [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ═════════════════ SALAS ═════════════════
app.get('/api/salas', requireAuth, async (req, res) => {
  try {
    const { id_sucursal } = req.query;
    let sql = `SELECT s.*, su.nombre AS sucursal
               FROM salas s JOIN sucursales su ON s.id_sucursal = su.id_sucursal`;
    const params = [];
    if (id_sucursal) { sql += ' WHERE s.id_sucursal = ?'; params.push(id_sucursal); }
    sql += ' ORDER BY su.nombre, s.nombre';
    const [r] = await q(sql, params);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/salas', requireRole('ag', 'al'), async (req, res) => {
  const { id_sucursal, nombre, tipo, capacidad } = req.body;
  try {
    const [ins] = await q(`INSERT INTO salas (id_sucursal, nombre, tipo, capacidad) VALUES (?, ?, ?, ?)`,
      [id_sucursal, nombre, tipo, capacidad]);
    const [r] = await q('SELECT * FROM salas WHERE id_sala = ?', [ins.insertId]);
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/salas/:id', requireRole('ag', 'al'), async (req, res) => {
  const { nombre, tipo, capacidad } = req.body;
  try {
    await q(`UPDATE salas SET nombre=?, tipo=?, capacidad=? WHERE id_sala=?`,
      [nombre, tipo, capacidad, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/salas/:id', requireRole('ag', 'al'), async (req, res) => {
  try { await q('DELETE FROM salas WHERE id_sala=?', [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/salas/:id/asientos', requireAuth, async (req, res) => {
  try {
    const [r] = await q('SELECT * FROM asientos WHERE id_sala=? ORDER BY fila, numero', [req.params.id]);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/salas/:id/asientos', requireRole('ag', 'al'), async (req, res) => {
  const { filas, columnas, filasVip } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM asientos WHERE id_sala=?', [req.params.id]);
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const vipSet = new Set((filasVip || []).map(f => f.toUpperCase()));
    for (let f = 0; f < filas; f++) {
      const fila = letras[f];
      for (let n = 1; n <= columnas; n++) {
        const tipo = vipSet.has(fila) ? 'VIP' : 'Normal';
        await conn.execute('INSERT INTO asientos (id_sala, fila, numero, tipo) VALUES (?, ?, ?, ?)',
          [req.params.id, fila, n, tipo]);
      }
    }
    await conn.commit();
    res.json({ ok: true, total: filas * columnas });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

// ── PROGRAMACIÓN DE FUNCIONES ──
app.get('/api/funciones', requireAuth, async (req, res) => {
  try {
    const { id_sucursal, fecha } = req.query;
    let sql = `SELECT f.*, p.nombre AS pelicula, p.duracion, p.clasificacion,
                      s.nombre AS sala, s.tipo AS sala_tipo, s.id_sucursal,
                      su.nombre AS sucursal
               FROM funciones f
               JOIN peliculas p ON f.id_pelicula = p.id_pelicula
               JOIN salas s     ON f.id_sala = s.id_sala
               JOIN sucursales su ON s.id_sucursal = su.id_sucursal
               WHERE 1=1`;
    const params = [];
    if (id_sucursal) { sql += ' AND s.id_sucursal=?'; params.push(id_sucursal); }
    if (fecha)       { sql += ' AND f.fecha=?';       params.push(fecha); }
    sql += ' ORDER BY f.fecha, f.horario';
    const [r] = await q(sql, params);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/funciones/masivo', requireRole('ag', 'al'), async (req, res) => {
  const { id_pelicula, id_salas, fecha_desde, fecha_hasta, horarios, precio, precio_vip, estado } = req.body;
  if (!id_pelicula || !Array.isArray(id_salas) || id_salas.length === 0
      || !fecha_desde || !fecha_hasta || !Array.isArray(horarios) || horarios.length === 0) {
    return res.status(400).json({ error: 'Faltan datos: película, salas, rango y horarios.' });
  }
  const desde = new Date(fecha_desde);
  const hasta = new Date(fecha_hasta);
  if (isNaN(desde) || isNaN(hasta) || desde > hasta) return res.status(400).json({ error: 'Rango de fechas inválido.' });

  if (req.session.user.role === 'al') {
    const [check] = await q(
      `SELECT s.id_sala FROM salas s JOIN sucursales su ON s.id_sucursal = su.id_sucursal WHERE su.nombre = ?`,
      [req.session.user.sucursal]
    );
    const allowed = new Set(check.map(r => r.id_sala));
    for (const id of id_salas) {
      if (!allowed.has(id)) return res.status(403).json({ error: 'No puedes programar en salas de otra sucursal.' });
    }
  }

  const fechas = [];
  for (let d = new Date(desde); d <= hasta; d.setUTCDate(d.getUTCDate() + 1)) {
    fechas.push(d.toISOString().slice(0, 10));
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let insertadas = 0, omitidas = 0;
    for (const id_sala of id_salas) {
      for (const fecha of fechas) {
        for (const horario of horarios) {
          const [dup] = await conn.execute(
            `SELECT 1 FROM funciones WHERE id_sala=? AND fecha=? AND horario=?`,
            [id_sala, fecha, horario]);
          if (dup.length > 0) { omitidas++; continue; }
          await conn.execute(
            `INSERT INTO funciones (id_pelicula, id_sala, fecha, horario, precio, precio_vip, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_pelicula, id_sala, fecha, horario, precio || 130, precio_vip || 180, estado || 'Activa']);
          insertadas++;
        }
      }
    }
    await conn.commit();
    res.json({ ok: true, insertadas, omitidas, salas: id_salas.length, fechas: fechas.length, horarios: horarios.length });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

app.post('/api/funciones', requireRole('ag', 'al'), async (req, res) => {
  const { id_pelicula, id_sala, fecha, horario, precio, precio_vip } = req.body;
  try {
    const [ins] = await q(
      `INSERT INTO funciones (id_pelicula, id_sala, fecha, horario, precio, precio_vip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_pelicula, id_sala, fecha, horario, precio, precio_vip]);
    const [r] = await q('SELECT * FROM funciones WHERE id_funcion = ?', [ins.insertId]);
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/funciones/:id', requireRole('ag', 'al'), async (req, res) => {
  const { id_pelicula, id_sala, fecha, horario, precio, precio_vip, estado } = req.body;
  try {
    await q(
      `UPDATE funciones SET id_pelicula=?, id_sala=?, fecha=?, horario=?, precio=?, precio_vip=?, estado=?
       WHERE id_funcion=?`,
      [id_pelicula, id_sala, fecha, horario, precio, precio_vip, estado || 'Activa', req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/funciones/:id', requireRole('ag', 'al'), async (req, res) => {
  try { await q('DELETE FROM funciones WHERE id_funcion=?', [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/funciones/:id/asientos', requireAuth, async (req, res) => {
  try {
    const [r] = await q(`
      SELECT a.id_asiento, a.fila, a.numero, a.tipo,
             CASE WHEN v.id_venta IS NULL THEN 0 ELSE 1 END AS ocupado
      FROM funciones f
      JOIN asientos a ON a.id_sala = f.id_sala
      LEFT JOIN ventas v ON v.id_asiento = a.id_asiento AND v.id_funcion = f.id_funcion
      WHERE f.id_funcion = ?
      ORDER BY a.fila, a.numero
    `, [req.params.id]);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═════════════════ PRODUCTOS (DULCERÍA) ═════════════════
app.get('/api/productos', requireAuth, async (req, res) => {
  try { const [r] = await q('SELECT * FROM productos ORDER BY nombre'); res.json(r); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/productos', requireRole('ag', 'al'), async (req, res) => {
  const { nombre, sku, precio, unidades, minimo } = req.body;
  try {
    const [ins] = await q(
      `INSERT INTO productos (nombre, sku, precio, unidades, minimo) VALUES (?, ?, ?, ?, ?)`,
      [nombre, sku, precio, unidades || 0, minimo || 0]);
    const [r] = await q('SELECT * FROM productos WHERE id_producto = ?', [ins.insertId]);
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/productos/:id', requireRole('ag', 'al'), async (req, res) => {
  const { nombre, sku, precio, unidades, minimo } = req.body;
  try {
    await q(
      `UPDATE productos SET nombre=?, sku=?, precio=?, unidades=?, minimo=? WHERE id_producto=?`,
      [nombre, sku, precio, unidades, minimo, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/productos/:id', requireRole('ag', 'al'), async (req, res) => {
  try { await q('DELETE FROM productos WHERE id_producto=?', [req.params.id]); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/productos/:id/stock', requireRole('ag', 'al'), async (req, res) => {
  const { delta } = req.body;
  try {
    await q('UPDATE productos SET unidades = unidades + ? WHERE id_producto=?', [delta, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═════════════════ PROCESAMIENTO DE VENTAS ═════════════════
app.get('/api/ventas', requireAuth, async (req, res) => {
  try {
    const { id_sucursal, fecha } = req.query;
    const role = req.session.user.role;
    let sql = `SELECT v.id_venta, v.id_funcion, v.fecha_venta, v.precio, v.estado_pago, v.metodo_pago,
                      u.nombre AS usuario, u.email,
                      p.nombre AS pelicula, f.fecha, f.horario,
                      s.nombre AS sala, s.tipo AS sala_tipo, su.nombre AS sucursal,
                      a.fila, a.numero, a.tipo AS asiento_tipo
               FROM ventas v
               JOIN usuarios u  ON v.id_usuario = u.id_usuario
               JOIN funciones f ON v.id_funcion = f.id_funcion
               JOIN peliculas p ON f.id_pelicula = p.id_pelicula
               JOIN salas s     ON f.id_sala = s.id_sala
               JOIN sucursales su ON s.id_sucursal = su.id_sucursal
               JOIN asientos a  ON v.id_asiento = a.id_asiento
               WHERE 1=1`;
    const params = [];
    if (role === 'c')    { sql += ' AND v.id_usuario=?';  params.push(req.session.user.id); }
    if (id_sucursal)     { sql += ' AND s.id_sucursal=?'; params.push(id_sucursal); }
    if (fecha)           { sql += ' AND DATE(v.fecha_venta)=?'; params.push(fecha); }
    sql += ' ORDER BY v.fecha_venta DESC';
    const [r] = await q(sql, params);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ventas', requireAuth, async (req, res) => {
  const { id_funcion, asientos, productos, metodo_pago } = req.body;
  if (!Array.isArray(asientos) || asientos.length === 0) {
    return res.status(400).json({ error: 'Debes seleccionar al menos un asiento.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [fr] = await conn.execute('SELECT precio, precio_vip FROM funciones WHERE id_funcion=?', [id_funcion]);
    if (fr.length === 0) throw new Error('Función no encontrada.');
    const { precio, precio_vip } = fr[0];

    const ventasCreadas = [];
    let totalBoletos = 0;
    for (const id_asiento of asientos) {
      const [ar] = await conn.execute('SELECT tipo FROM asientos WHERE id_asiento=?', [id_asiento]);
      if (ar.length === 0) throw new Error('Asiento no encontrado: ' + id_asiento);
      const [ocup] = await conn.execute(
        'SELECT 1 FROM ventas WHERE id_funcion=? AND id_asiento=?',
        [id_funcion, id_asiento]);
      if (ocup.length > 0) throw new Error('Asiento ya vendido: ' + id_asiento);

      const p = ar[0].tipo === 'VIP' ? precio_vip : precio;
      const [ins] = await conn.execute(
        `INSERT INTO ventas (id_usuario, id_funcion, id_asiento, precio, estado_pago, metodo_pago)
         VALUES (?, ?, ?, ?, 'pagado', ?)`,
        [req.session.user.id, id_funcion, id_asiento, p, metodo_pago || 'tarjeta']);
      ventasCreadas.push(ins.insertId);
      totalBoletos += Number(p);
    }

    const idVentaPrincipal = ventasCreadas[0];
    let totalProductos = 0;
    if (Array.isArray(productos)) {
      for (const item of productos) {
        const [pr] = await conn.execute('SELECT precio, unidades, nombre FROM productos WHERE id_producto=?', [item.id_producto]);
        if (pr.length === 0) throw new Error('Producto no encontrado.');
        if (pr[0].unidades < item.cantidad) throw new Error('Stock insuficiente: ' + pr[0].nombre);
        await conn.execute(
          `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio) VALUES (?, ?, ?, ?)`,
          [idVentaPrincipal, item.id_producto, item.cantidad, pr[0].precio]);
        await conn.execute('UPDATE productos SET unidades = unidades - ? WHERE id_producto=?',
          [item.cantidad, item.id_producto]);
        totalProductos += Number(pr[0].precio) * item.cantidad;
      }
    }
    await conn.commit();

    // Disparar correo asíncrono llamando a la función global corregida
    sendVentaEmail(req.session.user, {
      ventas: ventasCreadas,
      total: totalBoletos + totalProductos,
      id_funcion, 
      asientos: asientos.length
    }).catch(e => console.error('Email error catch:', e.message));

    res.json({ ok: true, ventas: ventasCreadas, total: totalBoletos + totalProductos });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally { conn.release(); }
});

app.get('/api/ventas/:id/detalle', requireAuth, async (req, res) => {
  try {
    const [r] = await q(`
      SELECT d.cantidad, d.precio, p.nombre, p.sku
      FROM detalle_venta d JOIN productos p ON d.id_producto = p.id_producto
      WHERE d.id_venta=?`, [req.params.id]);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═════════════════ PANEL DE USUARIOS ═════════════════
app.get('/api/usuarios', requireRole('ag'), async (req, res) => {
  try {
    const [r] = await q(`
      SELECT u.id_usuario, u.nombre, u.email, u.rol, u.estado, u.ultimo_acceso, s.nombre AS sucursal
      FROM usuarios u LEFT JOIN sucursales s ON u.id_sucursal = s.id_sucursal
      ORDER BY u.ultimo_acceso DESC`);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═════════════════ REPORTES ESTADÍSTICOS ═════════════════
app.get('/api/reportes/global', requireRole('ag'), async (req, res) => {
  try {
    const [r] = await q(`
      SELECT
        (SELECT COUNT(*) FROM sucursales WHERE estado = 'Activa') AS sucursales_activas,
        (SELECT COUNT(*) FROM sucursales) AS sucursales_total,
        (SELECT COUNT(*) FROM ventas v WHERE DATE(v.fecha_venta) = CURDATE()) AS boletos_hoy,
        (SELECT IFNULL(SUM(v.precio), 0) FROM ventas v WHERE DATE(v.fecha_venta) = CURDATE()) AS ingreso_hoy,
        (SELECT COUNT(*) FROM productos WHERE unidades < minimo) AS alertas_stock`);
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reportes/sucursal/:id', requireRole('ag', 'al'), async (req, res) => {
  try {
    const id = req.params.id;
    const [r] = await q(`
      SELECT
        (SELECT COUNT(*) FROM ventas v JOIN funciones f ON v.id_funcion = f.id_funcion JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = ? AND DATE(v.fecha_venta) = CURDATE()) AS boletos_hoy,
        (SELECT IFNULL(SUM(v.precio), 0) FROM ventas v JOIN funciones f ON v.id_funcion = f.id_funcion JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = ? AND DATE(v.fecha_venta) = CURDATE()) AS ingreso_hoy,
        (SELECT COUNT(*) FROM funciones f JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = ? AND f.fecha = CURDATE()) AS funciones_hoy,
        (SELECT COUNT(*) FROM funciones f JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = ? AND f.fecha = CURDATE() AND f.estado = 'Cancelada') AS funciones_canceladas`,
      [id, id, id, id]);
    res.json(r[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reportes/comparativo', requireRole('ag'), async (req, res) => {
  const desde = req.query.desde || new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const hasta = req.query.hasta || new Date().toISOString().slice(0, 10);
  try {
    const [sucs] = await q(`
      SELECT su.id_sucursal, su.nombre, su.estado,
        (SELECT COUNT(*) FROM ventas v JOIN funciones f ON v.id_funcion = f.id_funcion JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = su.id_sucursal AND DATE(v.fecha_venta) BETWEEN ? AND ?) AS boletos,
        (SELECT IFNULL(SUM(v.precio),0) FROM ventas v JOIN funciones f ON v.id_funcion = f.id_funcion JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = su.id_sucursal AND DATE(v.fecha_venta) BETWEEN ? AND ?) AS ingreso_boletos,
        (SELECT IFNULL(SUM(d.cantidad * d.precio),0) FROM detalle_venta d JOIN ventas v ON d.id_venta = v.id_venta
           JOIN funciones f ON v.id_funcion = f.id_funcion JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = su.id_sucursal AND DATE(v.fecha_venta) BETWEEN ? AND ?) AS ingreso_dulceria,
        (SELECT COUNT(*) FROM funciones f JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = su.id_sucursal AND f.fecha BETWEEN ? AND ?) AS funciones,
        (SELECT IFNULL(SUM(s.capacidad),0) FROM salas s WHERE s.id_sala = su.id_sucursal) AS capacidad_sala_total
      FROM sucursales su ORDER BY su.nombre`,
      [desde, hasta, desde, hasta, desde, hasta, desde, hasta]);

    const [peliculas] = await q(`
      SELECT p.id_pelicula, p.nombre, p.categoria,
             COUNT(*) AS boletos, IFNULL(SUM(v.precio),0) AS ingreso
      FROM ventas v JOIN funciones f ON v.id_funcion = f.id_funcion
        JOIN peliculas p ON f.id_pelicula = p.id_pelicula
      WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
      GROUP BY p.id_pelicula, p.nombre, p.categoria
      ORDER BY boletos DESC LIMIT 5`, [desde, hasta]);

    const [productos] = await q(`
      SELECT p.id_producto, p.nombre, p.sku,
             SUM(d.cantidad) AS unidades, IFNULL(SUM(d.cantidad * d.precio),0) AS ingreso
      FROM detalle_venta d JOIN ventas v ON d.id_venta = v.id_venta
        JOIN productos p ON d.id_producto = p.id_producto
      WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
      GROUP BY p.id_producto, p.nombre, p.sku
      ORDER BY unidades DESC LIMIT 5`, [desde, hasta]);

    res.json({ desde, hasta, sucursales: sucs, top_peliculas: peliculas, top_productos: productos });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/sucursales/resumen', requireRole('ag'), async (req, res) => {
  try {
    const [r] = await q(`
      SELECT su.id_sucursal, su.nombre, su.estado,
        (SELECT COUNT(*) FROM salas s WHERE s.id_sucursal = su.id_sucursal) AS salas,
        (SELECT IFNULL(SUM(s.capacidad), 0) FROM salas s WHERE s.id_sucursal = su.id_sucursal) AS capacidad,
        (SELECT COUNT(*) FROM funciones f JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = su.id_sucursal AND f.fecha = CURDATE()) AS funciones_hoy,
        (SELECT COUNT(*) FROM ventas v JOIN funciones f ON v.id_funcion = f.id_funcion JOIN salas s ON f.id_sala = s.id_sala
          WHERE s.id_sucursal = su.id_sucursal AND f.fecha = CURDATE()) AS boletos_hoy
      FROM sucursales su ORDER BY su.nombre`);
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SPA Fallback para React Router ──
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'), err => {
    if (err) res.status(404).send('Frontend no compilado. Corre `npm run build` dentro de client/.');
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor LUMIÈRE corriendo en http://localhost:${PORT}`));