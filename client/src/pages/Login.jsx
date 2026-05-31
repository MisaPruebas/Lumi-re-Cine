import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../lib/api';
import { useSession } from '../lib/session';
import './Login.css';
import googleLogo from 'C:/Users/X1/Desktop/DAW/cineReact/client/dist/assets/google-icon.png';

export default function Login() {
  const nav = useNavigate();
  const { user, login } = useSession();

  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('c');
  const [showPwd, setShowPwd] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', password2: '', sucursal: '', remember: false
  });

  useEffect(() => {
    if (user) nav('/panel', { replace: true });
  }, [user, nav]);

  useEffect(() => {
    get('/api/sucursales/publicas')
      .then(setSucursales)
      .catch(() => setSucursales([]));
  }, []);

  const onChange = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: v }));
  };

  const submit = async () => {
    setErr('');
    const { name, email, password, password2, sucursal } = form;

    if (mode === 'register') {
      if (!name || !email || !password || !password2) return setErr('Por favor completa todos los campos.');
      if (password.length < 6) return setErr('La contraseña debe tener al menos 6 caracteres.');
      if (password !== password2) return setErr('Las contraseñas no coinciden.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('Ingresa un correo electrónico válido.');
    } else {
      if (!email || !password) return setErr('Por favor completa todos los campos.');
    }
    if (role === 'al' && !sucursal) return setErr('Selecciona una sucursal.');

    setLoading(true);
    try {
      const url = mode === 'register' ? '/api/register' : '/api/login';
      const body = mode === 'register'
        ? { name, email, password, role, sucursal: role === 'al' ? sucursal : '' }
        : { email, password, role, sucursal: role === 'al' ? sucursal : '' };
      const u = await post(url, body);
      login(u);
      setSuccess(u.role);
      setTimeout(() => nav('/panel', { replace: true }), 1400);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter') submit(); };

  const submitBtnClass = role === 'c' ? 'ac-btn' : role === 'ag' ? 'ag-btn' : 'al-btn';
  const sucLabels = { c: 'Cliente', ag: 'Admin Global', al: 'Admin Local' };

  return (
    <div className="login-wrap" onKeyDown={onKey}>
      <div className="cin-panel">
        <div className="cin-bg" />
        <div className="cin-grid" />
        <div className="cin-vline" />
        <div className="cin-vline" />
        <div className="cin-glow" />

        <div className="now-badge">
          <div className="nbdot" />
          <span className="nbtxt">Sistema activo · 2026</span>
        </div>

        <div className="feat-tiles">
          <div className="feat-tile">
            <div className="ft-label">Sucursales</div>
            <div className="ft-val gv">5</div>
            <div className="ft-sub">en operación</div>
          </div>
          <div className="feat-tile">
            <div className="ft-label">Boletos hoy</div>
            <div className="ft-val bv">1,248</div>
            <div className="ft-sub">▲ 14% vs ayer</div>
          </div>
          <div className="feat-tile">
            <div className="ft-label">Ingreso del día</div>
            <div className="ft-val tv">$184k</div>
            <div className="ft-sub">MXN · todas las suc.</div>
          </div>
        </div>

        <div className="cin-copy">
          <div className="cin-eyebrow">Bienvenido a</div>
          <div className="cin-title">
            LUMIÈRE<br />Cinema
            <em>Tu experiencia cinematográfica</em>
          </div>
          <div className="cin-divider" />
          <p className="cin-desc">Inicia sesión o regístrate para disfrutar de la cartelera, comprar boletos o gestionar el sistema administrativo.</p>
          <div className="cin-roles">
            <div className="cin-role"><div className="crole-dot g" />Cliente</div>
            <div className="cin-role"><div className="crole-dot b" />Admin Global</div>
            <div className="cin-role"><div className="crole-dot t" />Admin Local</div>
          </div>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-topbar">
          <div className="form-logo">LUMIÈRE<span>.</span></div>
        </div>

        <div className="form-body">
          <div className="form-eyebrow">Acceso al sistema</div>

          <div className="mode-tabs">
            <button className={'mode-tab' + (mode === 'login' ? ' on' : '')} onClick={() => { setMode('login'); setErr(''); }}>Iniciar sesión</button>
            <button className={'mode-tab' + (mode === 'register' ? ' on' : '')} onClick={() => { setMode('register'); setErr(''); }}>Registrarse</button>
          </div>

          <div className="form-title">{mode === 'register' ? 'Crear cuenta' : 'Bienvenido de vuelta'}</div>
          <p className="form-subtitle">{mode === 'register' ? 'Completa tus datos para registrarte' : 'Ingresa tus credenciales para continuar'}</p>

          <div className="role-sel">
            <div className={'ropt ac' + (role === 'c' ? ' sel-ac' : '')} onClick={() => setRole('c')}>
              <div className="ropt-dot" />
              <div className="ropt-check" />
              <span className="ropt-name">Cliente</span>
              <span className="ropt-desc">Ver cartelera</span>
            </div>
            <div className={'ropt ag' + (role === 'ag' ? ' sel-ag' : '')} onClick={() => setRole('ag')}>
              <div className="ropt-dot" />
              <div className="ropt-check" />
              <span className="ropt-name">Admin G.</span>
              <span className="ropt-desc">Todas las suc.</span>
            </div>
            <div className={'ropt al' + (role === 'al' ? ' sel-al' : '')} onClick={() => setRole('al')}>
              <div className="ropt-dot" />
              <div className="ropt-check" />
              <span className="ropt-name">Admin L.</span>
              <span className="ropt-desc">Una sucursal</span>
            </div>
          </div>

          {role === 'al' && (
            <div className="sucursal-wrap vis">
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Sucursal asignada</label>
                <div className="fsel-wrap">
                  <select className="fselect" value={form.sucursal} onChange={onChange('sucursal')}>
                    <option value="">— Selecciona tu sucursal —</option>
                    {sucursales.map(s => <option key={s.id_sucursal} value={s.nombre}>{s.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {err && <div className="err-msg vis">{err}</div>}

          {mode === 'register' && (
            <div className="fg">
              <label>Nombre completo</label>
              <input className="finput" type="text" value={form.name} onChange={onChange('name')} placeholder="Tu nombre completo" autoComplete="off" />
            </div>
          )}

          <div className="fg">
            <label>Correo electrónico</label>
            <input className="finput" type="email" value={form.email} onChange={onChange('email')} placeholder="correo@ejemplo.com" autoComplete="off" />
          </div>

          <div className="fg">
            <label>Contraseña</label>
            <div className="pwd-wrap">
              <input className="finput" type={showPwd ? 'text' : 'password'} value={form.password} onChange={onChange('password')} placeholder="••••••••" />
              <button type="button" className="pwd-toggle" tabIndex={-1} onClick={() => setShowPwd(s => !s)}>{showPwd ? 'Ocultar' : 'Mostrar'}</button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="fg">
              <label>Confirmar contraseña</label>
              <input className="finput" type="password" value={form.password2} onChange={onChange('password2')} placeholder="••••••••" />
            </div>
          )}

          {mode === 'login' && (
            <div className="form-opts">
              <label className="remember">
                <input type="checkbox" className="chk" checked={form.remember} onChange={onChange('remember')} />
                Recordar sesión
              </label>
              <button type="button" className="forgot">¿Olvidaste tu contraseña?</button>
            </div>
          )}

          <div className="submit-wrap">
            <button className={'btn-submit ' + submitBtnClass + (loading ? ' loading' : '')} onClick={submit} disabled={loading}>
              <span>{mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}</span>
            </button>
          </div>

          {/* ──  BOTÓN DE INICIO DE SESIÓN CON GOOGLE (Requisito 8) ── */}
          {role === 'c' && (
            <div className="google-auth-wrap">
            <div className="form-divider-text"> 
            <div className="fd-line" />
            <span>ó</span>
            <div className="fd-line" />
            </div>
    
<a href="http://localhost:3000/api/auth/google" className="btn-google">
  <img 
    src={googleLogo}   
    alt="Google" 
    className="google-icon"
  />
  {mode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'}
</a>
  </div>
  
)}
          <div className="mode-link">
            {mode === 'login'
              ? <>¿No tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); }}>Regístrate aquí</a></>
              : <>¿Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Inicia sesión</a></>}
          </div>
        </div>

        <div className="form-footer">
          <p>© 2026 Lumière Cine</p>
          <p>Rol: {sucLabels[role]}</p>
        </div>
      </div>

      {success && (
        <div className="success-overlay on">
          <div className={'suc-icon ' + (success === 'c' ? 'ac' : success)}>{ {c:'✦', ag:'AG', al:'AL'}[success] }</div>
          <div className="success-msg">{ {c:'Cliente', ag:'Admin Global', al:'Admin Local'}[success] } · Acceso concedido</div>
          <div className="suc-bar" />
        </div>
      )}
    </div>
  );
}