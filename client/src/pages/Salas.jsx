import { useEffect, useState } from 'react';
import { get, post, put, del } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSession } from '../lib/session';
import LumiereModal from '../components/LumiereModal';

const TIPOS = ['Estándar','IMAX','4DX','Dolby Atmos','Premium','3D'];

export default function Salas() {
  const toast = useToast();
  const { user } = useSession();
  const [sucursales, setSucursales] = useState([]);
  const [filtroSuc, setFiltroSuc] = useState('');
  const [salas, setSalas] = useState([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id_sucursal:'', nombre:'', tipo:'Estándar', capacidad:180 });

  const [asientosShow, setAsientosShow] = useState(false);
  const [salaSel, setSalaSel] = useState(null);
  const [asientos, setAsientos] = useState([]);
  const [genForm, setGenForm] = useState({ filas:10, columnas:14, vip:'I,J' });

  useEffect(() => { (async () => {
    try {
      const suc = await get('/api/sucursales');
      setSucursales(suc);
      if (user.role === 'al' && user.sucursal) {
        const m = suc.find(s => s.nombre === user.sucursal);
        if (m) setFiltroSuc(String(m.id_sucursal));
      }
    } catch (e) { toast.err(e.message); }
  })(); }, []);

  const cargar = async () => {
    try {
      const url = '/api/salas' + (filtroSuc ? '?id_sucursal=' + filtroSuc : '');
      setSalas(await get(url));
    } catch (e) { toast.err(e.message); }
  };
  useEffect(() => { cargar(); }, [filtroSuc]);

  const abrirNueva = () => {
    setEditing(null);
    setForm({ id_sucursal: filtroSuc || (sucursales[0]?.id_sucursal || ''), nombre:'', tipo:'Estándar', capacidad:180 });
    setShow(true);
  };
  const abrirEditar = (s) => {
    setEditing(s.id_sala);
    setForm({ id_sucursal:s.id_sucursal, nombre:s.nombre, tipo:s.tipo || 'Estándar', capacidad:s.capacidad });
    setShow(true);
  };
  const guardar = async () => {
    if (!form.nombre.trim()) return toast.err('Nombre obligatorio');
    const body = { ...form, id_sucursal: parseInt(form.id_sucursal), capacidad: parseInt(form.capacidad) };
    try {
      if (editing) await put('/api/salas/' + editing, body);
      else await post('/api/salas', body);
      setShow(false); toast.ok(editing ? 'Actualizada' : 'Creada'); cargar();
    } catch (e) { toast.err(e.message); }
  };
  const eliminar = async (s) => {
    if (!confirm(`¿Eliminar "${s.nombre}"?`)) return;
    try { await del('/api/salas/' + s.id_sala); toast.ok('Eliminada'); cargar(); setSalaSel(null); }
    catch (e) { toast.err(e.message); }
  };

  const verAsientos = async (s) => {
    setSalaSel(s);
    try { setAsientos(await get('/api/salas/' + s.id_sala + '/asientos')); }
    catch (e) { toast.err(e.message); }
  };
  const generar = async () => {
    const filasVip = genForm.vip.split(',').map(s => s.trim()).filter(Boolean);
    try {
      await post('/api/salas/' + salaSel.id_sala + '/asientos', {
        filas: parseInt(genForm.filas), columnas: parseInt(genForm.columnas), filasVip
      });
      setAsientosShow(false);
      toast.ok('Asientos generados');
      verAsientos(salaSel);
    } catch (e) { toast.err(e.message); }
  };

  const filasAgrupadas = asientos.reduce((acc, a) => {
    (acc[a.fila] = acc[a.fila] || []).push(a);
    return acc;
  }, {});

  return (<>
    <div className="phead">
      <div className="plabel">Gestión · Salas y asientos</div>
      <div className="ptitle">Salas</div>
      <div className="psub">Configura las salas de proyección y sus distribuciones</div>
    </div>
    <section>
      <div className="row" style={{ marginBottom: 22, flexWrap:'wrap', gap: 10 }}>
        <div className="stitle" style={{ marginBottom: 0 }}>Filtrar</div>
        <div className="spacer" />
        <select style={{ width: 240 }} value={filtroSuc} onChange={e => setFiltroSuc(e.target.value)} disabled={user.role === 'al'}>
          <option value="">Todas las sucursales</option>
          {sucursales.map(s => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
        </select>
        <button className="btn bg" onClick={abrirNueva}>+ Nueva sala</button>
      </div>
      {salas.length === 0
        ? <div className="empty">No hay salas registradas.</div>
        : <table>
            <thead><tr><th>Sucursal</th><th>Nombre</th><th>Tipo</th><th>Capacidad</th><th style={{ width:240 }}>Acciones</th></tr></thead>
            <tbody>
              {salas.map(s => (
                <tr key={s.id_sala}>
                  <td className="tdmono">{s.sucursal}</td>
                  <td>{s.nombre}</td>
                  <td><span className="badge btl">{s.tipo || '—'}</span></td>
                  <td className="tdmono">{s.capacidad} asientos</td>
                  <td><div className="acts">
                    <button className="btn bo bsm" onClick={() => verAsientos(s)}>Asientos</button>
                    <button className="btn bo bsm" onClick={() => abrirEditar(s)}>Editar</button>
                    <button className="btn br bsm" onClick={() => eliminar(s)}>Eliminar</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>}
    </section>

    {salaSel && <section>
      <div className="stitle">Distribución — {salaSel.sucursal} · {salaSel.nombre} ({salaSel.tipo})</div>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', padding:24, overflowX:'auto' }}>
        <div style={{ textAlign:'center', padding:14, fontFamily:'DM Mono,monospace', fontSize:10, letterSpacing:4, color:'var(--gold-dim)', textTransform:'uppercase', borderBottom:'1px solid var(--gold-dim)', marginBottom:14 }}>— Pantalla —</div>
        {asientos.length === 0
          ? <div className="empty" style={{ padding:30 }}>
              Sin distribución. <button className="btn bg bsm" onClick={() => setAsientosShow(true)}>Generar</button>
            </div>
          : <>{Object.keys(filasAgrupadas).sort().map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <div style={{ width:24, fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)', textAlign:'center' }}>{f}</div>
                {filasAgrupadas[f].sort((a,b) => a.numero - b.numero).map(a => (
                  <div key={a.id_asiento} style={{
                    width:22, height:22, border:'1px solid ' + (a.tipo === 'VIP' ? 'var(--gold)' : 'var(--border)'),
                    background:'#0a0a0a', fontSize:8, display:'flex', alignItems:'center', justifyContent:'center',
                    color: a.tipo === 'VIP' ? 'var(--gold)' : 'var(--muted)',
                    fontFamily:'DM Mono,monospace'
                  }}>{a.numero}</div>
                ))}
              </div>
            ))}
            <div style={{ marginTop:18, textAlign:'center' }}>
              <button className="btn bo bsm" onClick={() => setAsientosShow(true)}>Regenerar distribución</button>
            </div></>}
      </div>
    </section>}

    <LumiereModal show={show} onHide={() => setShow(false)}
      title={editing ? 'Editar sala' : 'Nueva sala'}
      footer={<>
        <button className="btn bo" onClick={() => setShow(false)}>Cancelar</button>
        <button className="btn bg" onClick={guardar}>Guardar</button>
      </>}>
      <div className="frow">
        <div className="fg"><label>Sucursal</label>
          <select value={form.id_sucursal} onChange={e => setForm({...form, id_sucursal:e.target.value})} disabled={user.role === 'al'}>
            {sucursales.map(s => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
          </select></div>
        <div className="fg"><label>Nombre</label>
          <input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})} placeholder="Sala 1" /></div>
      </div>
      <div className="frow">
        <div className="fg"><label>Tipo</label>
          <select value={form.tipo} onChange={e => setForm({...form, tipo:e.target.value})}>
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div className="fg"><label>Capacidad</label>
          <input type="number" value={form.capacidad} onChange={e => setForm({...form, capacidad:e.target.value})} /></div>
      </div>
    </LumiereModal>

    <LumiereModal show={asientosShow} onHide={() => setAsientosShow(false)}
      title="Generar asientos"
      footer={<>
        <button className="btn bo" onClick={() => setAsientosShow(false)}>Cancelar</button>
        <button className="btn bg" onClick={generar}>Generar</button>
      </>}>
      <p style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)', letterSpacing:1, marginBottom:16 }}>
        Esto eliminará la distribución existente.
      </p>
      <div className="frow">
        <div className="fg"><label>Filas</label>
          <input type="number" min="1" max="26" value={genForm.filas} onChange={e => setGenForm({...genForm, filas:e.target.value})} /></div>
        <div className="fg"><label>Asientos por fila</label>
          <input type="number" min="1" max="30" value={genForm.columnas} onChange={e => setGenForm({...genForm, columnas:e.target.value})} /></div>
      </div>
      <div className="frow f1">
        <div className="fg"><label>Filas VIP (ej: I,J)</label>
          <input value={genForm.vip} onChange={e => setGenForm({...genForm, vip:e.target.value})} /></div>
      </div>
    </LumiereModal>
  </>);
}
