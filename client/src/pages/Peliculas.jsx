import { useEffect, useState } from 'react';
import { get, post, put, del } from '../lib/api';
import { useToast } from '../lib/toast';
import LumiereModal from '../components/LumiereModal';

const CATEGORIAS = ['Acción','Aventura','Comedia','Drama','Terror','Sci-Fi','Romance','Animación','Documental','Thriller'];
const CLASIF = ['AA','A','B','B15','C','D'];

export default function Peliculas() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre:'', categoria:'Drama', clasificacion:'B', duracion:'' });

  const cargar = async () => { try { setData(await get('/api/peliculas')); } catch (e) { toast.err(e.message); } };
  useEffect(() => { cargar(); }, []);

  const abrirNueva = () => { setEditing(null); setForm({ nombre:'', categoria:'Drama', clasificacion:'B', duracion:'' }); setShow(true); };
  const abrirEditar = (p) => {
    setEditing(p.id_pelicula);
    setForm({ nombre:p.nombre, categoria:p.categoria||'Drama', clasificacion:p.clasificacion||'B', duracion:p.duracion||'' });
    setShow(true);
  };
  const guardar = async () => {
    if (!form.nombre.trim()) return toast.err('Nombre obligatorio');
    try {
      if (editing) await put('/api/peliculas/' + editing, form);
      else await post('/api/peliculas', form);
      setShow(false); toast.ok(editing ? 'Actualizada' : 'Creada'); cargar();
    } catch (e) { toast.err(e.message); }
  };
  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try { await del('/api/peliculas/' + p.id_pelicula); toast.ok('Eliminada'); cargar(); }
    catch (e) { toast.err(e.message); }
  };

  return (<>
    <div className="phead">
      <div className="plabel">Admin global · Catálogo</div>
      <div className="ptitle">Películas</div>
      <div className="psub">Alta, edición y baja del catálogo cinematográfico</div>
    </div>
    <section>
      <div className="row" style={{ marginBottom: 22 }}>
        <div className="stitle" style={{ marginBottom: 0 }}>Catálogo</div>
        <div className="spacer" />
        <button className="btn bg" onClick={abrirNueva}>+ Nueva película</button>
      </div>
      {data.length === 0
        ? <div className="empty">No hay películas registradas.</div>
        : <table>
            <thead><tr><th>Nombre</th><th>Categoría</th><th>Clasificación</th><th>Duración</th><th style={{ width:160 }}>Acciones</th></tr></thead>
            <tbody>
              {data.map(p => (
                <tr key={p.id_pelicula}>
                  <td>{p.nombre}</td>
                  <td><span className="badge bbl">{p.categoria || '—'}</span></td>
                  <td className="tdmono">{p.clasificacion || '—'}</td>
                  <td className="tdmono">{p.duracion || '—'}</td>
                  <td><div className="acts">
                    <button className="btn bo bsm" onClick={() => abrirEditar(p)}>Editar</button>
                    <button className="btn br bsm" onClick={() => eliminar(p)}>Eliminar</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>}
    </section>

    <LumiereModal show={show} onHide={() => setShow(false)}
      title={editing ? 'Editar película' : 'Nueva película'}
      footer={<>
        <button className="btn bo" onClick={() => setShow(false)}>Cancelar</button>
        <button className="btn bg" onClick={guardar}>Guardar</button>
      </>}>
      <div className="frow f1">
        <div className="fg"><label>Nombre</label>
          <input value={form.nombre} onChange={e => setForm({...form, nombre:e.target.value})} placeholder="Título" /></div>
      </div>
      <div className="frow">
        <div className="fg"><label>Categoría</label>
          <select value={form.categoria} onChange={e => setForm({...form, categoria:e.target.value})}>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div className="fg"><label>Clasificación</label>
          <select value={form.clasificacion} onChange={e => setForm({...form, clasificacion:e.target.value})}>
            {CLASIF.map(c => <option key={c}>{c}</option>)}
          </select></div>
      </div>
      <div className="frow f1">
        <div className="fg"><label>Duración</label>
          <input value={form.duracion} onChange={e => setForm({...form, duracion:e.target.value})} placeholder="1h 45min" /></div>
      </div>
    </LumiereModal>
  </>);
}
