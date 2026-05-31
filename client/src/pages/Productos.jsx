import { useEffect, useState } from 'react';
import { get, post, put, del } from '../lib/api';
import { useToast } from '../lib/toast';
import LumiereModal from '../components/LumiereModal';

function estadoStock(p) {
  if (p.unidades <= p.minimo * 0.4) return { txt:'Crítico', cls:'brd', color:'var(--red)', pct: Math.max(5, Math.round(p.unidades / Math.max(p.minimo,1) * 40)) };
  if (p.unidades < p.minimo)        return { txt:'Bajo',    cls:'bam', color:'var(--gold-dim)', pct: Math.round(p.unidades / Math.max(p.minimo,1) * 60) };
  return                                    { txt:'Óptimo', cls:'bgn', color:'var(--teal)', pct: Math.min(100, Math.round(p.unidades / Math.max(p.minimo*2,1) * 100)) };
}

export default function Productos() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);
  const [stockShow, setStockShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);
  const [delta, setDelta] = useState(100);
  const [form, setForm] = useState({ nombre:'', sku:'', precio:0, unidades:0, minimo:0 });

  const cargar = async () => { try { setData(await get('/api/productos')); } catch (e) { toast.err(e.message); } };
  useEffect(() => { cargar(); }, []);

  const kpis = (() => {
    const criticos = data.filter(p => p.unidades <= p.minimo * 0.4).length;
    const bajos    = data.filter(p => p.unidades > p.minimo * 0.4 && p.unidades < p.minimo).length;
    const valor    = data.reduce((s, p) => s + Number(p.precio || 0) * (p.unidades || 0), 0);
    return { total: data.length, criticos, bajos, valor };
  })();

  const abrirNuevo = () => { setEditing(null); setForm({ nombre:'', sku:'', precio:0, unidades:0, minimo:0 }); setShow(true); };
  const abrirEditar = (p) => { setEditing(p.id_producto); setForm({ nombre:p.nombre, sku:p.sku||'', precio:p.precio||0, unidades:p.unidades||0, minimo:p.minimo||0 }); setShow(true); };
  const guardar = async () => {
    if (!form.nombre.trim()) return toast.err('Nombre obligatorio');
    const body = { ...form, precio: parseFloat(form.precio), unidades: parseInt(form.unidades), minimo: parseInt(form.minimo) };
    try {
      if (editing) await put('/api/productos/' + editing, body);
      else await post('/api/productos', body);
      setShow(false); toast.ok(editing ? 'Actualizado' : 'Creado'); cargar();
    } catch (e) { toast.err(e.message); }
  };
  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try { await del('/api/productos/' + p.id_producto); toast.ok('Eliminado'); cargar(); }
    catch (e) { toast.err(e.message); }
  };
  const abrirStock = (p) => { setStockTarget(p); setDelta(100); setStockShow(true); };
  const aplicarStock = async () => {
    try { await post('/api/productos/' + stockTarget.id_producto + '/stock', { delta: parseInt(delta) }); setStockShow(false); toast.ok('Stock actualizado'); cargar(); }
    catch (e) { toast.err(e.message); }
  };

  return (<>
    <div className="phead">
      <div className="plabel">Inventario · Dulcería</div>
      <div className="ptitle">Productos</div>
      <div className="psub">Control de stock, precios y reabastecimientos</div>
    </div>
    <section>
      <div className="cards c4">
        <div className="card"><div className="clabel">SKUs activos</div><div className="cval bv">{kpis.total}</div><div className="csub">productos</div></div>
        <div className="card"><div className="clabel">Stock crítico</div><div className="cval rv">{kpis.criticos}</div><div className="csub">requieren reabasto</div></div>
        <div className="card"><div className="clabel">Stock bajo</div><div className="cval gv">{kpis.bajos}</div><div className="csub">por debajo del mínimo</div></div>
        <div className="card"><div className="clabel">Valor inventario</div><div className="cval gv">${kpis.valor.toLocaleString('es-MX',{maximumFractionDigits:0})}</div><div className="csub">MXN</div></div>
      </div>
    </section>
    <section>
      <div className="row" style={{ marginBottom: 22 }}>
        <div className="stitle" style={{ marginBottom: 0 }}>Catálogo</div>
        <div className="spacer" />
        <button className="btn bg" onClick={abrirNuevo}>+ Nuevo producto</button>
      </div>
      {data.length === 0
        ? <div className="empty">No hay productos.</div>
        : <table>
            <thead><tr><th>Producto</th><th>SKU</th><th>Precio</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th style={{ width:240 }}>Acciones</th></tr></thead>
            <tbody>
              {data.map(p => {
                const e = estadoStock(p);
                return <tr key={p.id_producto}>
                  <td>{p.nombre}</td>
                  <td className="tdmono">{p.sku || '—'}</td>
                  <td className="tdmono">${parseFloat(p.precio || 0).toFixed(2)}</td>
                  <td className="tdmono">{p.unidades}
                    <div style={{ background:'#111', height:5, borderRadius:2, overflow:'hidden', width:140, marginTop:5 }}>
                      <div style={{ height:'100%', borderRadius:2, width: e.pct + '%', background: e.color }} />
                    </div>
                  </td>
                  <td className="tdmono">{p.minimo}</td>
                  <td><span className={'badge ' + e.cls}>{e.txt}</span></td>
                  <td><div className="acts">
                    <button className="btn bt bsm" onClick={() => abrirStock(p)}>Reabastecer</button>
                    <button className="btn bo bsm" onClick={() => abrirEditar(p)}>Editar</button>
                    <button className="btn br bsm" onClick={() => eliminar(p)}>×</button>
                  </div></td>
                </tr>;
              })}
            </tbody>
          </table>}
    </section>

    <LumiereModal show={show} onHide={() => setShow(false)}
      title={editing ? 'Editar producto' : 'Nuevo producto'}
      footer={<>
        <button className="btn bo" onClick={() => setShow(false)}>Cancelar</button>
        <button className="btn bg" onClick={guardar}>Guardar</button>
      </>}>
      <div className="frow">
        <div className="fg"><label>Nombre</label>
          <input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})} /></div>
        <div className="fg"><label>SKU</label>
          <input value={form.sku} onChange={e => setForm({...form, sku:e.target.value})} /></div>
      </div>
      <div className="frow">
        <div className="fg"><label>Precio (MXN)</label>
          <input type="number" step="0.01" value={form.precio} onChange={e => setForm({...form, precio:e.target.value})} /></div>
        <div className="fg"><label>Unidades</label>
          <input type="number" value={form.unidades} onChange={e => setForm({...form, unidades:e.target.value})} /></div>
      </div>
      <div className="frow f1">
        <div className="fg"><label>Stock mínimo</label>
          <input type="number" value={form.minimo} onChange={e => setForm({...form, minimo:e.target.value})} /></div>
      </div>
    </LumiereModal>

    <LumiereModal show={stockShow} onHide={() => setStockShow(false)}
      title={`Ajustar stock — ${stockTarget?.nombre || ''}`}
      footer={<>
        <button className="btn bo" onClick={() => setStockShow(false)}>Cancelar</button>
        <button className="btn bg" onClick={aplicarStock}>Aplicar</button>
      </>}>
      <div className="frow f1">
        <div className="fg"><label>Cantidad (negativo para descontar)</label>
          <input type="number" value={delta} onChange={e => setDelta(e.target.value)} /></div>
      </div>
    </LumiereModal>
  </>);
}
