import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../lib/session';

const LINKS = {
  c:  [
    { to:'/panel', label:'Panel' },
    { to:'/ventas', label:'Comprar boletos' },
    { to:'/carrito', label:'Carrito' },
    { to:'/mis-compras', label:'Mis compras' }
  ],
  ag: [
    { to:'/panel', label:'Panel' },
    { to:'/sucursales', label:'Sucursales' },
    { to:'/peliculas', label:'Películas' },
    { to:'/salas', label:'Salas' },
    { to:'/funciones', label:'Funciones' },
    { to:'/productos', label:'Productos' },
    { to:'/ventas', label:'Ventas' },
    { to:'/reportes', label:'Reportes' },
    { to:'/usuarios', label:'Usuarios' }
  ],
  al: [
    { to:'/panel', label:'Panel' },
    { to:'/salas', label:'Salas' },
    { to:'/funciones', label:'Funciones' },
    { to:'/productos', label:'Productos' },
    { to:'/ventas', label:'Ventas' }
  ]
};

const SCROLL_STEP = 200;

export default function Topbar() {
  const { user, logout } = useSession();
  const nav = useNavigate();
  const scrollerRef = useRef(null);
  const wrapRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft < max - 1);
  };

  useEffect(() => {
    if (!user) return;
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    window.addEventListener('resize', updateArrows);
    // Scrollea hasta el link activo para que sea visible al cargar
    const active = el.querySelector('.navlink.on');
    if (active) {
      const offset = active.offsetLeft - (el.clientWidth - active.clientWidth) / 2;
      el.scrollTo({ left: Math.max(0, offset), behavior: 'auto' });
    }
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
      ro.disconnect();
    };
  }, [user]);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * SCROLL_STEP, behavior: 'smooth' });
  };

  // Rueda vertical → scroll horizontal cuando el cursor está sobre los links
  const onWheel = (e) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollBy({ left: e.deltaY, behavior: 'auto' });
    }
  };

  if (!user) return null;
  const links = LINKS[user.role] || [];

  return (
    <div className="role-bar">
      <NavLink to="/panel" className="role-logo">LUMIÈRE<span>.</span></NavLink>

      <button type="button" className="navarrow" onClick={() => scrollBy(-1)} disabled={!canLeft} aria-label="Anterior">‹</button>

      <div
        ref={wrapRef}
        className={'navwrap' + (canLeft ? ' has-left' : '') + (canRight ? ' has-right' : '')}
      >
        <div className="navlinks" ref={scrollerRef} onWheel={onWheel}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => 'navlink' + (isActive ? ' on' : '')}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </div>

      <button type="button" className="navarrow" onClick={() => scrollBy(1)} disabled={!canRight} aria-label="Siguiente">›</button>

      <div className="userbox">
        <span className="uname">{user.name}{user.sucursal ? ' · ' + user.sucursal : ''}</span>
        <button className="btn bo bsm" onClick={async () => { await logout(); nav('/login'); }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
