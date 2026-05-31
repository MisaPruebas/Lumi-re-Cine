import { useEffect, useState } from 'react';
import { get, post, put, del } from '../lib/api';
import { useToast } from '../lib/toast';
import LumiereModal from '../components/LumiereModal';

const ESTADO_CLS = { 'Activa':'bgn', 'Mantenimiento':'bam', 'Inactiva':'brd' };

export default function Sucursales() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre:'', direccion:'', estado:'Activa' });

  const cargar = async () => {
    try { setData(await get('/api/sucursales')); }
    catch (e) { toast.err(e.message); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirNueva = () => {
    setEditing(null);
    setForm({ nombre:'', direccion:'', estado:'Activa' });
    setShow(true);
  };
  const abrirEditar = (s) => {
    setEditing(s.id_sucursal);
    setForm({ nombre:s.nombre, direccion:s.direccion || '', estado:s.estado || 'Activa' });
    setShow(true);
  };
  const guardar = async () => {
    if (!form.nombre.trim()) return toast.err('Nombre obligatorio');
    try {
      if (editing) await put('/api/sucursales/' + editing, form);
      else await post('/api/sucursales', form);
      setShow(false);
      toast.ok(editing ? 'Actualizada' : 'Creada');
      cargar();
    } catch (e) { toast.err(e.message); }
  };
  const eliminar = async (s) => {
    if (s.salas > 0 || s.usuarios > 0) return toast.err(`Tiene ${s.salas} sala(s) y ${s.usuarios} usuario(s) asociados.`);
    if (!confirm(`¿Eliminar "${s.nombre}"?`)) return;
    try { await del('/api/sucursales/' + s.id_sucursal); toast.ok('Eliminada'); cargar(); }
    catch (e) { toast.err(e.message); }
  };

  return (<>
    <div className="phead">
      <div className="plabel bc">Admin global · Cadena de cines</div>
      <div className="ptitle">Sucursales</div>
      <div className="psub">Alta, edición y baja de sucursales</div>
    </div>
    <section>
      <div className="row" style={{ marginBottom: 22 }}>
        <div className="stitle" style={{ marginBottom: 0 }}>Cadena</div>
        <div className="spacer" />
        <button className="btn bb" onClick={abrirNueva}>+ Nueva sucursal</button>
      </div>
      {data.length === 0
        ? <div className="empty">No hay sucursales registradas todavía.</div>
        : <table>
            <thead><tr>
              <th>Nombre</th><th>Dirección</th><th>Estado</th>
              <th style={{ textAlign:'center' }}>Salas</th>
              <th style={{ textAlign:'center' }}>Usuarios</th>
              <th style={{ width:160 }}>Acciones</th>
            </tr></thead>
            <tbody>
              {data.map(s => (
                <tr key={s.id_sucursal}>
                  <td>{s.nombre}</td>
                  <td className="tdmono">{s.direccion || '—'}</td>
                  <td><span className={'badge ' + (ESTADO_CLS[s.estado] || 'bam')}>{s.estado}</span></td>
                  <td className="tdmono" style={{ textAlign:'center' }}>{s.salas}</td>
                  <td className="tdmono" style={{ textAlign:'center' }}>{s.usuarios}</td>
                  <td><div className="acts">
                    <button className="btn bo bsm" onClick={() => abrirEditar(s)}>Editar</button>
                    <button className="btn br bsm" onClick={() => eliminar(s)}>Eliminar</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>}
    </section>

    <LumiereModal show={show} onHide={() => setShow(false)}
      title={editing ? 'Editar sucursal' : 'Nueva sucursal'}
      footer={<>
        <button className="btn bo" onClick={() => setShow(false)}>Cancelar</button>
        <button className="btn bg" onClick={guardar}>Guardar</button>
      </>}>
      <div className="frow f1">
        <div className="fg"><label>Nombre</label>
          <input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})} placeholder="Ej. Lumière Centro" /></div>
      </div>
      <div className="frow f1">
        <div className="fg"><label>Dirección</label>
          <input value={form.direccion} onChange={e => setForm({...form, direccion:e.target.value})} placeholder="Av. principal #123" /></div>
      </div>
      <div className="frow f1">
        <div className="fg"><label>Estado</label>
          <select value={form.estado} onChange={e => setForm({...form, estado:e.target.value})}>
            <option>Activa</option><option>Mantenimiento</option><option>Inactiva</option>
          </select></div>
      </div>
    </LumiereModal>
  </>);
}
