import { useEffect, useMemo, useState } from 'react';
import { get } from '../lib/api';
import { useToast } from '../lib/toast';

const ROL_BADGE = {
  c:  ['Cliente',      'bgn'],
  ag: ['Admin Global', 'bbl'],
  al: ['Admin Local',  'btl']
};

export default function AdmUsu() {
  const toast = useToast();
  const [data, setData] = useState([]);
  const [filtroRol, setFiltroRol] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { (async () => {
    try { setData(await get('/api/usuarios')); }
    catch (e) { toast.err(e.message); }
  })(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return data.filter(u =>
      (!filtroRol || u.rol === filtroRol) &&
      (!q || (u.nombre || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
    );
  }, [data, filtroRol, busqueda]);

  const kpis = {
    total:    data.length,
    clientes: data.filter(u => u.rol === 'c').length,
    admins:   data.filter(u => u.rol === 'ag' || u.rol === 'al').length,
    activos:  data.filter(u => u.estado === 'Activo').length
  };

  return (<>
    <div className="phead">
      <div className="plabel bc">Admin global · Cuentas del sistema</div>
      <h1 className="ptitle">Usuarios</h1>
      <p className="psub">Catálogo de cuentas registradas en LUMIÈRE</p>
    </div>

    <section>
      <div className="cards c4">
        <div className="card"><div className="clabel">Cuentas totales</div>
          <div className="cval bv">{kpis.total}</div>
          <div className="csub">registradas</div></div>
        <div className="card"><div className="clabel">Clientes</div>
          <div className="cval gv">{kpis.clientes}</div>
          <div className="csub">cuentas de público</div></div>
        <div className="card"><div className="clabel">Administradores</div>
          <div className="cval tv">{kpis.admins}</div>
          <div className="csub">global y local</div></div>
        <div className="card"><div className="clabel">Activos</div>
          <div className="cval">{kpis.activos}</div>
          <div className="csub">con sesión válida</div></div>
      </div>
    </section>

    <section>
      <div className="row" style={{ marginBottom: 22, flexWrap:'wrap', gap:10 }}>
        <div className="stitle" style={{ marginBottom: 0 }}>Cuentas</div>
        <div className="spacer" />
        <input style={{ width: 240 }} placeholder="Buscar por nombre o email..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select style={{ width: 180 }} value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="c">Cliente</option>
          <option value="ag">Admin Global</option>
          <option value="al">Admin Local</option>
        </select>
        <button className="btn bo bsm" onClick={() => { setBusqueda(''); setFiltroRol(''); }}>Limpiar</button>
      </div>

      {filtrados.length === 0
        ? <div className="empty">Sin usuarios para los filtros seleccionados.</div>
        : <table>
            <thead><tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Sucursal</th>
              <th>Último acceso</th>
              <th>Estado</th>
            </tr></thead>
            <tbody>
              {filtrados.map(u => {
                const [rolTxt, rolCls] = ROL_BADGE[u.rol] || ['—', 'bgn'];
                const estCls = u.estado === 'Activo' ? 'bgn' : 'bam';
                const acc = u.ultimo_acceso
                  ? new Date(u.ultimo_acceso).toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' })
                  : '—';
                return (
                  <tr key={u.id_usuario}>
                    <td>{u.nombre}
                      <div className="csub">{u.email}</div></td>
                    <td><span className={'badge ' + rolCls}>{rolTxt}</span></td>
                    <td className="tdmono">{u.sucursal || '—'}</td>
                    <td className="tdmono">{acc}</td>
                    <td><span className={'badge ' + estCls}>{u.estado}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>}
    </section>
  </>);
}
