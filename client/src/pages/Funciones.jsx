import { useEffect, useState } from 'react';
import { get, post, put, del } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSession } from '../lib/session';
import LumiereModal from '../components/LumiereModal';

const ESTADO_CLS = { 'Activa':'bgn', 'Cancelada':'brd', 'Llena':'bam' };

export default function Funciones() {
  const toast = useToast();
  const { user } = useSession();
  const [peliculas, setPeliculas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [salas, setSalas] = useState([]);
  const [filtroSuc, setFiltroSuc] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [data, setData] = useState([]);

  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id_pelicula:'', id_sala:'', fecha:'', horario:'18:00', precio:130, precio_vip:180, estado:'Activa' });

  const [masivoShow, setMasivoShow] = useState(false);
  const [mForm, setMForm] = useState({ id_pelicula:'', fecha_desde:'', fecha_hasta:'', precio:130, precio_vip:180 });
  const [mSalas, setMSalas] = useState(new Set());
  const [mHorarios, setMHorarios] = useState([]);
  const [mHorarioIn, setMHorarioIn] = useState('');

  // Carga inicial
  useEffect(() => { (async () => {
    try {
      const [pels, sucs] = await Promise.all([ get('/api/peliculas'), get('/api/sucursales') ]);
      setPeliculas(pels);
      setSucursales(sucs);
      if (user.role === 'al' && user.sucursal) {
        const m = sucs.find(s => s.nombre === user.sucursal);
        if (m) setFiltroSuc(String(m.id_sucursal));
      }
    } catch (e) { toast.err(e.message); }
  })(); }, []);

  // Salas del modal de función (filtradas por sucursal)
  useEffect(() => { (async () => {
    try {
      const url = '/api/salas' + (filtroSuc ? '?id_sucursal=' + filtroSuc : '');
      setSalas(await get(url));
    } catch (e) { toast.err(e.message); }
  })(); }, [filtroSuc]);

  const cargar = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroSuc) params.set('id_sucursal', filtroSuc);
      if (filtroFecha) params.set('fecha', filtroFecha);
      setData(await get('/api/funciones?' + params.toString()));
    } catch (e) { toast.err(e.message); }
  };
  useEffect(() => { cargar(); }, [filtroSuc, filtroFecha]);

  const abrirNueva = () => {
    setEditing(null);
    setForm({
      id_pelicula: peliculas[0]?.id_pelicula || '',
      id_sala: salas[0]?.id_sala || '',
      fecha: new Date().toISOString().slice(0,10),
      horario:'18:00', precio:130, precio_vip:180, estado:'Activa'
    });
    setShow(true);
  };
  const abrirEditar = (f) => {
    setEditing(f.id_funcion);
    setForm({
      id_pelicula:f.id_pelicula, id_sala:f.id_sala,
      fecha:(f.fecha+'').slice(0,10), horario:(f.horario+'').slice(0,5),
      precio:f.precio, precio_vip:f.precio_vip, estado:f.estado || 'Activa'
    });
    setShow(true);
  };
  const guardar = async () => {
    const body = {
      id_pelicula: parseInt(form.id_pelicula),
      id_sala: parseInt(form.id_sala),
      fecha: form.fecha,
      horario: form.horario,
      precio: parseFloat(form.precio),
      precio_vip: parseFloat(form.precio_vip),
      estado: form.estado
    };
    if (!body.fecha || !body.horario) return toast.err('Fecha y hora obligatorias');
    try {
      if (editing) await put('/api/funciones/' + editing, body);
      else await post('/api/funciones', body);
      setShow(false); toast.ok(editing ? 'Actualizada' : 'Creada'); cargar();
    } catch (e) { toast.err(e.message); }
  };
  const eliminar = async (f) => {
    if (!confirm(`¿Eliminar la función de "${f.pelicula}" del ${(f.fecha+'').slice(0,10)}?`)) return;
    try { await del('/api/funciones/' + f.id_funcion); toast.ok('Eliminada'); cargar(); }
    catch (e) { toast.err(e.message); }
  };

  // Masivo
  const abrirMasivo = () => {
    setMSalas(new Set());
    setMHorarios([]);
    setMHorarioIn('');
    const hoy = new Date().toISOString().slice(0,10);
    const ennext = new Date(); ennext.setDate(ennext.getDate() + 6);
    setMForm({
      id_pelicula: peliculas[0]?.id_pelicula || '',
      fecha_desde: hoy, fecha_hasta: ennext.toISOString().slice(0,10),
      precio:130, precio_vip:180
    });
    setMasivoShow(true);
  };
  const toggleSala = (id) => {
    const ns = new Set(mSalas);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    setMSalas(ns);
  };
  const toggleGrupo = (lista) => {
    const allOn = lista.every(s => mSalas.has(s.id_sala));
    const ns = new Set(mSalas);
    lista.forEach(s => allOn ? ns.delete(s.id_sala) : ns.add(s.id_sala));
    setMSalas(ns);
  };
  const agregarHorario = () => {
    if (!mHorarioIn) return;
    if (!mHorarios.includes(mHorarioIn)) setMHorarios([...mHorarios, mHorarioIn].sort());
    setMHorarioIn('');
  };
  const previewCount = (() => {
    const salasN = mSalas.size;
    let dias = 0;
    if (mForm.fecha_desde && mForm.fecha_hasta) {
      const d1 = new Date(mForm.fecha_desde), d2 = new Date(mForm.fecha_hasta);
      if (d2 >= d1) dias = Math.round((d2 - d1) / 86400000) + 1;
    }
    return { salasN, dias, horariosN: mHorarios.length, total: salasN * dias * mHorarios.length };
  })();
  const guardarMasivo = async () => {
    if (mSalas.size === 0) return toast.err('Selecciona al menos una sala');
    if (mHorarios.length === 0) return toast.err('Agrega al menos un horario');
    try {
      const r = await post('/api/funciones/masivo', {
        id_pelicula: Number(mForm.id_pelicula),
        id_salas: [...mSalas],
        fecha_desde: mForm.fecha_desde, fecha_hasta: mForm.fecha_hasta,
        horarios: mHorarios,
        precio: Number(mForm.precio), precio_vip: Number(mForm.precio_vip),
        estado: 'Activa'
      });
      setMasivoShow(false);
      toast.ok(`${r.insertadas} creada(s)${r.omitidas ? ` · ${r.omitidas} omitida(s)` : ''}`);
      cargar();
    } catch (e) { toast.err(e.message); }
  };

  const salasPorSucursal = salas.reduce((acc, s) => { (acc[s.sucursal] = acc[s.sucursal] || []).push(s); return acc; }, {});

  return (<>
    <div className="phead">
      <div className="plabel">Programación · Funciones</div>
      <div className="ptitle">Funciones</div>
      <div className="psub">Programa horarios, salas y precios</div>
    </div>
    <section>
      <div className="row" style={{ marginBottom: 22, flexWrap:'wrap', gap:10 }}>
        <div className="stitle" style={{ marginBottom: 0 }}>Programación</div>
        <div className="spacer" />
        <select style={{ width: 200 }} value={filtroSuc} onChange={e => setFiltroSuc(e.target.value)} disabled={user.role === 'al'}>
          <option value="">Todas las sucursales</option>
          {sucursales.map(s => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
        </select>
        <input type="date" style={{ width: 160 }} value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
        <button className="btn bo bsm" onClick={() => setFiltroFecha('')}>Limpiar fecha</button>
        <button className="btn bb" onClick={abrirMasivo}>+ Masivo</button>
        <button className="btn bg" onClick={abrirNueva}>+ Nueva</button>
      </div>
      {data.length === 0
        ? <div className="empty">Sin funciones para los filtros seleccionados.</div>
        : <table>
            <thead><tr><th>Película</th><th>Sucursal · Sala</th><th>Fecha</th><th>Hora</th><th>Precio</th><th>VIP</th><th>Estado</th><th style={{ width:160 }}>Acciones</th></tr></thead>
            <tbody>
              {data.map(f => (
                <tr key={f.id_funcion}>
                  <td>{f.pelicula}<br/><span className="tdmono">{f.duracion || ''} · {f.clasificacion || ''}</span></td>
                  <td className="tdmono">{f.sucursal} · {f.sala} ({f.sala_tipo})</td>
                  <td className="tdmono">{(f.fecha+'').slice(0,10)}</td>
                  <td className="tdmono">{(f.horario+'').slice(0,5)}</td>
                  <td className="tdmono">${parseFloat(f.precio || 0).toFixed(2)}</td>
                  <td className="tdmono">${parseFloat(f.precio_vip || 0).toFixed(2)}</td>
                  <td><span className={'badge ' + (ESTADO_CLS[f.estado] || 'bam')}>{f.estado}</span></td>
                  <td><div className="acts">
                    <button className="btn bo bsm" onClick={() => abrirEditar(f)}>Editar</button>
                    <button className="btn br bsm" onClick={() => eliminar(f)}>Eliminar</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>}
    </section>

    {/* Modal función simple */}
    <LumiereModal show={show} onHide={() => setShow(false)}
      title={editing ? 'Editar función' : 'Nueva función'}
      footer={<>
        <button className="btn bo" onClick={() => setShow(false)}>Cancelar</button>
        <button className="btn bg" onClick={guardar}>Guardar</button>
      </>}>
      <div className="frow">
        <div className="fg"><label>Película</label>
          <select value={form.id_pelicula} onChange={e => setForm({...form, id_pelicula:e.target.value})}>
            {peliculas.map(p => <option key={p.id_pelicula} value={p.id_pelicula}>{p.nombre}</option>)}
          </select></div>
        <div className="fg"><label>Sala</label>
          <select value={form.id_sala} onChange={e => setForm({...form, id_sala:e.target.value})}>
            {salas.map(s => <option key={s.id_sala} value={s.id_sala}>{s.sucursal} — {s.nombre} ({s.tipo})</option>)}
          </select></div>
      </div>
      <div className="frow">
        <div className="fg"><label>Fecha</label>
          <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha:e.target.value})} /></div>
        <div className="fg"><label>Hora</label>
          <input type="time" value={form.horario} onChange={e => setForm({...form, horario:e.target.value})} /></div>
      </div>
      <div className="frow">
        <div className="fg"><label>Precio general (MXN)</label>
          <input type="number" step="0.01" value={form.precio} onChange={e => setForm({...form, precio:e.target.value})} /></div>
        <div className="fg"><label>Precio VIP (MXN)</label>
          <input type="number" step="0.01" value={form.precio_vip} onChange={e => setForm({...form, precio_vip:e.target.value})} /></div>
      </div>
      <div className="frow f1">
        <div className="fg"><label>Estado</label>
          <select value={form.estado} onChange={e => setForm({...form, estado:e.target.value})}>
            <option>Activa</option><option>Cancelada</option><option>Llena</option>
          </select></div>
      </div>
    </LumiereModal>

    {/* Modal masivo */}
    <LumiereModal show={masivoShow} onHide={() => setMasivoShow(false)} title="Programación masiva" width={720}
      footer={<>
        <button className="btn bo" onClick={() => setMasivoShow(false)}>Cancelar</button>
        <button className="btn bg" onClick={guardarMasivo}>Programar</button>
      </>}>
      <p style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)', marginBottom:16, letterSpacing:1 }}>
        Programa la misma película en múltiples salas, días y horarios. Las duplicadas se omiten.
      </p>
      <div className="frow f1">
        <div className="fg"><label>Película</label>
          <select value={mForm.id_pelicula} onChange={e => setMForm({...mForm, id_pelicula:e.target.value})}>
            {peliculas.map(p => <option key={p.id_pelicula} value={p.id_pelicula}>{p.nombre}</option>)}
          </select></div>
      </div>
      <div className="frow f1">
        <div className="fg"><label>Salas</label>
          <div className="chklist">
            {Object.keys(salasPorSucursal).length === 0
              ? <div className="empty" style={{ padding:18 }}>Sin salas disponibles.</div>
              : Object.entries(salasPorSucursal).map(([suc, list]) => (
                  <div key={suc}>
                    <div className="chklist-group">
                      {suc}
                      <small style={{ float:'right' }}>
                        <a href="#" onClick={e => { e.preventDefault(); toggleGrupo(list); }} style={{ color:'var(--muted)', textDecoration:'underline' }}>marcar todas</a>
                      </small>
                    </div>
                    {list.map(s => (
                      <label key={s.id_sala} className="chklist-item">
                        <input type="checkbox" checked={mSalas.has(s.id_sala)} onChange={() => toggleSala(s.id_sala)} />
                        {s.nombre}<small>{s.tipo}</small>
                      </label>
                    ))}
                  </div>
                ))}
          </div></div>
      </div>
      <div className="frow">
        <div className="fg"><label>Desde</label>
          <input type="date" value={mForm.fecha_desde} onChange={e => setMForm({...mForm, fecha_desde:e.target.value})} /></div>
        <div className="fg"><label>Hasta</label>
          <input type="date" value={mForm.fecha_hasta} onChange={e => setMForm({...mForm, fecha_hasta:e.target.value})} /></div>
      </div>
      <div className="frow f1">
        <div className="fg"><label>Horarios</label>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <input type="time" style={{ width:140 }} value={mHorarioIn}
              onChange={e => setMHorarioIn(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarHorario(); } }} />
            <button className="btn bo bsm" type="button" onClick={agregarHorario}>+ Añadir</button>
          </div>
          <div className="chiprow">
            {mHorarios.length === 0
              ? <small style={{ color:'var(--muted)', fontFamily:'DM Mono,monospace', fontSize:10 }}>Aún sin horarios</small>
              : mHorarios.map(h => (
                  <span key={h} className="chip">{h}
                    <span className="x" onClick={() => setMHorarios(mHorarios.filter(x => x !== h))}>✕</span>
                  </span>
                ))}
          </div></div>
      </div>
      <div className="frow">
        <div className="fg"><label>Precio general (MXN)</label>
          <input type="number" step="0.01" value={mForm.precio} onChange={e => setMForm({...mForm, precio:e.target.value})} /></div>
        <div className="fg"><label>Precio VIP (MXN)</label>
          <input type="number" step="0.01" value={mForm.precio_vip} onChange={e => setMForm({...mForm, precio_vip:e.target.value})} /></div>
      </div>
      <div style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--muted)', padding:'10px 14px', border:'1px dashed var(--border)', background:'#0a0a0a', marginTop:8 }}>
        → {previewCount.salasN} sala(s) × {previewCount.dias} día(s) × {previewCount.horariosN} horario(s) = {previewCount.total} función(es)
      </div>
    </LumiereModal>
  </>);
}
