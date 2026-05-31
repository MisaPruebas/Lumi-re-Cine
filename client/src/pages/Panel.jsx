import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { get } from '../lib/api';
import { useSession } from '../lib/session';
import { useToast } from '../lib/toast';

const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtHora  = (t) => (t || '').toString().slice(0, 5);

export default function Panel() {
  const { user } = useSession();
  if (!user) return null;
  if (user.role === 'c')  return <Navigate to="/ventas" replace />;
  if (user.role === 'ag') return <PanelGlobal user={user} />;
  if (user.role === 'al') return <PanelLocal  user={user} />;
  return null;
}

// ════════════════════════════════════════════════════════════
// ADMIN GLOBAL
// ════════════════════════════════════════════════════════════
function PanelGlobal({ user }) {
  const toast = useToast();
  const [resumen, setResumen] = useState(null);
  const [sucs, setSucs] = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(() => { (async () => {
    try {
      const [r, s, p] = await Promise.all([
        get('/api/reportes/global'),
        get('/api/sucursales/resumen'),
        get('/api/productos')
      ]);
      setResumen(r); setSucs(s); setProductos(p);
    } catch (e) { toast.err(e.message); }
  })(); }, []);

  const estadoStock = (p) => {
    const ratio = p.minimo > 0 ? p.unidades / p.minimo : (p.unidades > 0 ? 2 : 0);
    if (ratio < 1)  return { txt:'Crítico', cls:'brd', color:'var(--red)' };
    if (ratio < 2)  return { txt:'Bajo',    cls:'bam', color:'var(--gold-dim)' };
    return            { txt:'Óptimo',  cls:'bgn', color:'#0f6e56' };
  };

  return (<>
    <div className="phead">
      <div className="plabel bc">Admin global · Panel administrativo</div>
      <h1 className="ptitle">Sucursales & Inventarios</h1>
      <p className="psub">Control centralizado de todas las sucursales</p>
    </div>

    <section>
      <div className="stitle">Resumen general</div>
      <div className="cards c4">
        <div className="card"><div className="clabel">Sucursales activas</div>
          <div className="cval bv">{resumen?.sucursales_activas ?? '…'}</div>
          <div className="csub">de {resumen?.sucursales_total ?? '—'} totales</div></div>
        <div className="card"><div className="clabel">Boletos vendidos hoy</div>
          <div className="cval">{resumen?.boletos_hoy ?? '…'}</div>
          <div className="csub">cadena completa</div></div>
        <div className="card"><div className="clabel">Ingreso del día</div>
          <div className="cval gv">{resumen ? fmtMoney(resumen.ingreso_hoy) : '…'}</div>
          <div className="csub">MXN · todas las sucursales</div></div>
        <div className="card"><div className="clabel">Alertas de stock</div>
          <div className="cval rv">{resumen?.alertas_stock ?? '…'}</div>
          <div className="csub">productos bajo mínimo</div></div>
      </div>
    </section>

    <section>
      <div className="stitle">Sucursales</div>
      {sucs.length === 0
        ? <div className="empty">Sin sucursales registradas.</div>
        : <div className="cards c3">
            {sucs.map(s => {
              const cls = s.estado === 'Activa' ? 'bgn' : (s.estado === 'Mantenimiento' ? 'bam' : 'brd');
              const ocup = s.capacidad > 0 ? Math.round((s.boletos_hoy / s.capacidad) * 100) : 0;
              return (
                <div key={s.id_sucursal} className="scrd">
                  <div className="scrdhd">
                    <div className="scrdname">{s.nombre}</div>
                    <span className={'badge ' + cls}>{s.estado}</span>
                  </div>
                  <div className="scrdbody">
                    <div className="scrdstat"><span className="scrdlbl">Salas</span><span className="scrdval">{s.salas}</span></div>
                    <div className="scrdstat"><span className="scrdlbl">Capacidad</span><span className="scrdval">{s.capacidad} asientos</span></div>
                    <div className="scrdstat"><span className="scrdlbl">Funciones hoy</span><span className="scrdval">{s.funciones_hoy}</span></div>
                    <div className="scrdstat"><span className="scrdlbl">Boletos hoy</span>
                      <span className="scrdval" style={{ color:'#5dcaa5' }}>{s.boletos_hoy} ({ocup}%)</span></div>
                  </div>
                </div>
              );
            })}
          </div>}
    </section>

    <section style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
      <div className="stitle">Control de inventarios</div>
      <div style={{ border:'1px solid var(--border)' }}>
        <div className="skrow hdr">
          <span>Producto</span><span>Unidades</span><span>Stock</span><span>Mín.</span><span>Acción</span>
        </div>
        {productos.length === 0
          ? <div className="empty">Cargando inventario…</div>
          : productos.map(p => {
              const e = estadoStock(p);
              const pct = e.cls === 'brd'
                ? (p.unidades / Math.max(p.minimo, 1)) * 50
                : Math.min(100, (p.unidades / Math.max(p.minimo, 1)) * 50);
              return (
                <div key={p.id_producto} className="skrow">
                  <div className="skname">{p.nombre}<small>{p.sku || '—'}</small></div>
                  <div className="sknum">{Number(p.unidades).toLocaleString('es-MX')}</div>
                  <div>
                    <div style={{ marginBottom: 4 }}><span className={'badge ' + e.cls}>{e.txt}</span></div>
                    <div className="skbarw"><div className="skbar" style={{ width: Math.min(100, pct) + '%', background: e.color }} /></div>
                  </div>
                  <div className="sknum">{p.minimo}</div>
                  <div><a href="/productos" className={'btn ' + (e.cls === 'brd' ? 'br' : (e.cls === 'bam' ? 'bg' : 'bo')) + ' bsm'}
                          style={{ textDecoration:'none' }}>Reabastecer</a></div>
                </div>
              );
            })}
      </div>
    </section>
  </>);
}

// ════════════════════════════════════════════════════════════
// ADMIN LOCAL
// ════════════════════════════════════════════════════════════
function PanelLocal({ user }) {
  const toast = useToast();
  const [reportes, setReportes] = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [salas, setSalas] = useState([]);

  useEffect(() => { (async () => {
    try {
      const sucs = await get('/api/sucursales');
      const m = sucs.find(s => s.nombre === user.sucursal) || sucs[0];
      if (!m) return;
      const fecha = new Date().toISOString().slice(0, 10);
      const [r, f, s] = await Promise.all([
        get('/api/reportes/sucursal/' + m.id_sucursal),
        get('/api/funciones?id_sucursal=' + m.id_sucursal + '&fecha=' + fecha),
        get('/api/salas?id_sucursal=' + m.id_sucursal)
      ]);
      setReportes(r); setFunciones(f); setSalas(s);
    } catch (e) { toast.err(e.message); }
  })(); }, []);

  return (<>
    <div className="phead">
      <div className="plabel tc">Admin local{user.sucursal ? ' · ' + user.sucursal : ''}</div>
      <h1 className="ptitle">Gestión de Cartelera</h1>
      <p className="psub">Funciones, reportes y configuración de sala</p>
    </div>

    <section>
      <div className="stitle">Reportes del día</div>
      <div className="cards c4">
        <div className="rcard"><div className="rcardtitle">Boletos vendidos</div>
          <div className="rval tv">{reportes?.boletos_hoy ?? '…'}</div>
          <div className="rchg up">Hoy</div></div>
        <div className="rcard"><div className="rcardtitle">Ingreso total</div>
          <div className="rval gv">{reportes ? fmtMoney(reportes.ingreso_hoy) : '…'}</div>
          <div className="rchg up">MXN</div></div>
        <div className="rcard"><div className="rcardtitle">Funciones del día</div>
          <div className="rval">{reportes?.funciones_hoy ?? '…'}</div>
          <div className="rchg" style={{ color:'var(--muted)' }}>programadas</div></div>
        <div className="rcard"><div className="rcardtitle">Funciones canceladas</div>
          <div className="rval" style={{ color: reportes?.funciones_canceladas > 0 ? 'var(--red)' : 'var(--muted)' }}>
            {reportes?.funciones_canceladas ?? '…'}</div>
          <div className="rchg" style={{ color:'var(--muted)' }}>
            {reportes?.funciones_canceladas > 0 ? 'incidencias' : 'sin incidencias'}</div></div>
      </div>
    </section>

    <section style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
      <div className="row" style={{ marginBottom: 22 }}>
        <div className="stitle" style={{ marginBottom: 0, flex: 1 }}>Funciones programadas — hoy</div>
        <a href="/funciones" className="btn bt" style={{ textDecoration:'none' }}>+ Nueva función</a>
      </div>
      <div style={{ border:'1px solid var(--border)' }}>
        <div className="fnrow hdr">
          <span>Película</span>
          <span style={{ textAlign:'center' }}>Hora</span>
          <span style={{ textAlign:'center' }}>Sala</span>
          <span style={{ textAlign:'center' }}>Precio</span>
          <span style={{ textAlign:'center' }}>VIP</span>
          <span style={{ textAlign:'center' }}>Estado</span>
        </div>
        {funciones.length === 0
          ? <div className="empty">Sin funciones programadas hoy.</div>
          : funciones.map(f => {
              const estCls = f.estado === 'Activa' ? 'bgn' : (f.estado === 'Cancelada' ? 'brd' : 'bam');
              return (
                <div key={f.id_funcion} className="fnrow">
                  <div className="fntitle">{f.pelicula}<small>{(f.duracion || '') + ' · ' + (f.clasificacion || '—')}</small></div>
                  <div className="fncol">{fmtHora(f.horario)}</div>
                  <div className="fncol">{f.sala} {f.sala_tipo || ''}</div>
                  <div className="fncol">{fmtMoney(f.precio)}</div>
                  <div className="fncol">{fmtMoney(f.precio_vip)}</div>
                  <div className="fncol"><span className={'badge ' + estCls}>{f.estado || 'Activa'}</span></div>
                </div>
              );
            })}
      </div>
    </section>

    <section>
      <div className="stitle">Estado de salas</div>
      {salas.length === 0
        ? <div className="empty">Sin salas en esta sucursal.</div>
        : <div className="cards c4">
            {salas.map(s => {
              const fnSala = funciones.filter(f => f.id_sala === s.id_sala);
              const proxima = fnSala[0];
              return (
                <div key={s.id_sala} className="card" style={{ borderColor:'var(--teal)' }}>
                  <div className="clabel">{s.nombre}</div>
                  <div className="cval tv" style={{ fontSize: 22 }}>{s.tipo || '—'}</div>
                  <div style={{ margin:'10px 0 6px' }}>
                    <span className={'badge ' + (proxima ? 'bgn' : 'bbl')}>{proxima ? 'Programada' : 'Disponible'}</span>
                  </div>
                  <div className="csub">{proxima ? proxima.pelicula + ' · ' + fmtHora(proxima.horario) : 'Sin función asignada'}</div>
                </div>
              );
            })}
          </div>}
    </section>
  </>);
}
