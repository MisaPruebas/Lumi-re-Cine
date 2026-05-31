import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../lib/api';
import { useToast } from '../lib/toast';
import { useCart } from '../lib/cart';

const STRIP_ITEMS = [
  { gold: true, text: '★ Ahora en cartelera' },
  { text: 'Sala Dolby Atmos' },
  { text: 'IMAX disponible' },
  { gold: true, text: 'Nuevos estrenos cada viernes' },
  { text: 'Sala 4DX · Butacas premium' },
  { text: 'Estacionamiento gratuito' },
];

export default function Cartelera() {
  const toast = useToast();
  const nav = useNavigate();
  const { cart, setFuncionYAsientos, setProductos } = useCart();

  const [sucursales, setSucursales] = useState([]);
  const [productosCat, setProductosCat] = useState([]);
  const [filtroSuc, setFiltroSuc] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().slice(0,10));
  const [funciones, setFunciones] = useState([]);

  const [funcSel, setFuncSel] = useState(null);
  const [asientos, setAsientos] = useState([]);
  const [seleccion, setSeleccion] = useState(new Set());
  const [carritoProd, setCarritoProd] = useState({});

  const asientosRef = useRef(null);
  const carteleraRef = useRef(null);
  const funcionesRef = useRef(null);

  useEffect(() => { (async () => {
    try {
      const [suc, prods] = await Promise.all([get('/api/sucursales'), get('/api/productos')]);
      setSucursales(suc);
      setProductosCat(prods);
      if (suc[0] && !filtroSuc) setFiltroSuc(String(suc[0].id_sucursal));
    } catch (e) { toast.err(e.message); }
  })(); }, []);

  const cargar = async () => {
    if (!filtroSuc) return;
    try {
      const params = new URLSearchParams();
      params.set('id_sucursal', filtroSuc);
      if (filtroFecha) params.set('fecha', filtroFecha);
      const data = await get('/api/funciones?' + params.toString());
      setFunciones(data.filter(f => f.estado === 'Activa'));
    } catch (e) { toast.err(e.message); }
  };
  useEffect(() => { cargar(); }, [filtroSuc, filtroFecha]);

  const peliculas = useMemo(() => {
    const m = new Map();
    for (const f of funciones) {
      if (!m.has(f.id_pelicula)) m.set(f.id_pelicula, {
        id_pelicula: f.id_pelicula, nombre: f.pelicula,
        duracion: f.duracion, clasificacion: f.clasificacion, funciones: []
      });
      m.get(f.id_pelicula).funciones.push(f);
    }
    return Array.from(m.values());
  }, [funciones]);

  const estreno = peliculas[0];
  const funcionesEstreno = estreno ? funciones.filter(f => f.id_pelicula === estreno.id_pelicula) : [];

  const elegirFuncion = async (f) => {
    setFuncSel(f);
    setSeleccion(new Set());
    try {
      const data = await get('/api/funciones/' + f.id_funcion + '/asientos');
      setAsientos(data);
      setTimeout(() => asientosRef.current?.scrollIntoView({ behavior:'smooth' }), 80);
    } catch (e) { toast.err(e.message); }
  };

  const toggleAsiento = (a) => {
    if (a.ocupado) return;
    const s = new Set(seleccion);
    s.has(a.id_asiento) ? s.delete(a.id_asiento) : s.add(a.id_asiento);
    setSeleccion(s);
  };

  const filas = asientos.reduce((acc, a) => { (acc[a.fila] = acc[a.fila] || []).push(a); return acc; }, {});

  const addProd = (id, delta) => {
    const p = productosCat.find(x => x.id_producto === id);
    if (!p) return;
    const q = (carritoProd[id] || 0) + delta;
    if (q < 0) return;
    if (q > p.unidades) return toast.err('Stock insuficiente');
    setCarritoProd(c => {
      const n = { ...c };
      if (q === 0) delete n[id]; else n[id] = q;
      return n;
    });
  };

  const totales = useMemo(() => {
    let bol = 0;
    if (funcSel) {
      for (const id of seleccion) {
        const a = asientos.find(x => x.id_asiento === id);
        if (a) bol += Number(a.tipo === 'VIP' ? funcSel.precio_vip : funcSel.precio);
      }
    }
    let dul = 0;
    for (const [pid, cant] of Object.entries(carritoProd)) {
      const p = productosCat.find(x => x.id_producto === Number(pid));
      if (p) dul += Number(p.precio) * cant;
    }
    return { boletos: bol, dulceria: dul, total: bol + dul };
  }, [seleccion, asientos, funcSel, carritoProd, productosCat]);

  const irAPagar = () => {
    if (!funcSel) return toast.err('Elige una función');
    if (seleccion.size === 0) return toast.err('Selecciona al menos un asiento');
    const seleccionados = Array.from(seleccion).map(id => {
      const a = asientos.find(x => x.id_asiento === id);
      return {
        id_asiento: a.id_asiento, fila: a.fila, numero: a.numero, tipo: a.tipo,
        precio: Number(a.tipo === 'VIP' ? funcSel.precio_vip : funcSel.precio)
      };
    });
    setFuncionYAsientos({
      id_funcion: funcSel.id_funcion,
      pelicula: funcSel.pelicula,
      fecha: (funcSel.fecha+'').slice(0,10),
      horario: (funcSel.horario+'').slice(0,5),
      sucursal: funcSel.sucursal,
      sala: funcSel.sala,
      sala_tipo: funcSel.sala_tipo,
      precio: funcSel.precio, precio_vip: funcSel.precio_vip
    }, seleccionados);
    const prods = Object.entries(carritoProd).map(([pid, cant]) => {
      const p = productosCat.find(x => x.id_producto === Number(pid));
      return { id_producto: p.id_producto, nombre: p.nombre, precio: Number(p.precio), cantidad: cant };
    });
    setProductos(prods);
    nav('/carrito');
  };

  return (<>
    {/* HERO */}
    <div className="hero">
      <div className="hposter" /><div className="hbg" />
      <div className="hkick">Estreno destacado</div>
      <h1 className="htitle">{estreno ? estreno.nombre : 'Sin estrenos hoy'}</h1>
      <p className="hsub">{estreno
        ? `Hoy en cartelera · ${peliculas.length} título${peliculas.length!==1?'s':''} disponible${peliculas.length!==1?'s':''}`
        : 'Selecciona otra fecha o sucursal'}</p>
      {estreno && <div className="hmeta">
        <div className="mi"><span className="ml">Duración</span><span className="mv">{estreno.duracion || '—'}</span></div>
        <div className="mi"><span className="ml">Clasificación</span><span className="mv">{estreno.clasificacion || '—'}</span></div>
        <div className="mi"><span className="ml">Funciones hoy</span><span className="mv">{funcionesEstreno.length}</span></div>
      </div>}
      <div className="hacts" style={{ marginTop: 28, display:'flex', gap:14 }}>
        <button className="btn bg" onClick={() => carteleraRef.current?.scrollIntoView({ behavior:'smooth' })}>Ver cartelera</button>
        <button className="playbtn"><span className="playico" />Ver tráiler</button>
      </div>
    </div>

    {/* FILMSTRIP */}
    <div className="filmstrip"><div className="fsi">
      {[...STRIP_ITEMS, ...STRIP_ITEMS].map((it, i) => (
        <div key={i} className={'fsi-item' + (it.gold ? ' gc' : '')}>{it.text}</div>
      ))}
    </div></div>

    {/* CARTELERA */}
    <section ref={carteleraRef}>
      <div className="stitle">Cartelera</div>
      <div className="sucsel">
        <label>Sucursal</label>
        <select value={filtroSuc} onChange={e => setFiltroSuc(e.target.value)}>
          {sucursales.map(s => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
        </select>
        <label>Fecha</label>
        <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
        {cart.asientos.length > 0 && (
          <button className="btn bg bsm" style={{ marginLeft:'auto' }} onClick={() => nav('/carrito')}>
            Ver carrito ({cart.asientos.length})
          </button>
        )}
      </div>

      {peliculas.length === 0
        ? <div className="empty">Sin películas en esta sucursal y fecha.</div>
        : <div className="mgrid">
            {peliculas.map((p, i) => (
              <div key={p.id_pelicula} className={'mc col' + ((i % 4) + 1)}
                   onClick={() => funcionesRef.current?.scrollIntoView({ behavior:'smooth' })}>
                <div className="mcbg" /><div className="mov" />
                <div className="minfo">
                  <div className="mgenre">{p.clasificacion || '—'}</div>
                  <div className="mtitle">{p.nombre}</div>
                  <div className="mmeta"><span className="mdur tdmono" style={{ fontSize:10, color:'var(--muted)' }}>{p.duracion || ''}</span></div>
                </div>
                <div className="mhov"><button className="mbuy">Ver funciones</button></div>
              </div>
            ))}
          </div>}
    </section>

    {/* FUNCIONES DISPONIBLES */}
    <section ref={funcionesRef} className="fnsec">
      <div className="stitle">Funciones disponibles</div>
      {peliculas.length === 0
        ? <div className="empty">Sin funciones programadas.</div>
        : peliculas.map(p => (
            <div key={p.id_pelicula} className="strow">
              <div>
                <div className="stmov">{p.nombre}</div>
                <div className="stsub">{(p.clasificacion || '—') + ' · ' + (p.duracion || '')}</div>
              </div>
              <div className="slots">
                {p.funciones.map(f => (
                  <div key={f.id_funcion}
                    className={'slot' + (funcSel?.id_funcion === f.id_funcion ? ' sel' : '')}
                    onClick={() => elegirFuncion(f)}>
                    {(f.horario+'').slice(0,5)} · {f.sala}
                  </div>
                ))}
              </div>
              <div className="sthall">{p.funciones[0].sala_tipo || ''}</div>
            </div>
          ))}
    </section>

    {/* ASIENTOS (inline) */}
    <section ref={asientosRef}>
      <div className="stitle">Selecciona tus asientos</div>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:9, letterSpacing:2, color:'var(--muted)',
                    textTransform:'uppercase', marginBottom:32 }}>
        {funcSel
          ? `${funcSel.pelicula} — ${(funcSel.horario+'').slice(0,5)} · ${funcSel.sala} ${funcSel.sala_tipo || ''} · ${funcSel.sucursal}`
          : 'Selecciona una función para ver el mapa de asientos.'}
      </div>

      {funcSel && (asientos.length === 0
        ? <div className="empty">Sala sin asientos configurados.</div>
        : <>
            <div className="scrarea"><div className="scrlabel">— Pantalla —</div></div>
            <div className="sgrid">
              {Object.keys(filas).sort().map(f => (
                <div key={f} className="srow">
                  <div className="srlabel">{f}</div>
                  {filas[f].sort((a,b) => a.numero - b.numero).map(a => {
                    const sel = seleccion.has(a.id_asiento);
                    const cls = 'seat' + (a.tipo === 'VIP' ? ' vip' : '') + (a.ocupado ? ' occ' : '') + (sel ? ' sel' : '');
                    return <div key={a.id_asiento} className={cls} onClick={() => toggleAsiento(a)}
                                title={a.fila + a.numero + (a.tipo === 'VIP' ? ' VIP' : '') + (a.ocupado ? ' (ocupado)':'')} />;
                  })}
                  <div className="srlabel">{f}</div>
                </div>
              ))}
            </div>
            <div className="slegend">
              <div className="sleg"><div className="sleg-dot" />Disponible</div>
              <div className="sleg"><div className="sleg-dot sel" />Seleccionado</div>
              <div className="sleg"><div className="sleg-dot occ" />Ocupado</div>
              <div className="sleg"><div className="sleg-dot vip" />VIP</div>
            </div>

            <div className="stitle" style={{ marginTop:48 }}>Dulcería (opcional)</div>
            <div className="dulgrid">
              {productosCat.filter(p => p.unidades > 0).map(p => (
                <div key={p.id_producto} className="dulc">
                  <div className="dulc-name">{p.nombre}</div>
                  <div className="dulc-price">${parseFloat(p.precio).toFixed(2)}</div>
                  <div className="dulc-ctrls">
                    <button className="dulc-btn" onClick={() => addProd(p.id_producto, -1)}>−</button>
                    <span className="dulc-q">{carritoProd[p.id_producto] || 0}</span>
                    <button className="dulc-btn" onClick={() => addProd(p.id_producto, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ssum">
              <div className="ssumtitle">Resumen de compra</div>
              <div className="scnt">{seleccion.size}<span>boleto{seleccion.size !== 1 ? 's' : ''}</span></div>
              <div className="stotal">Total: <strong>${totales.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
              <button className="btn bg" style={{ width:'100%' }} onClick={irAPagar} disabled={seleccion.size === 0}>
                Ir a pagar
              </button>
            </div>
          </>)}
    </section>
  </>);
}
