import { useEffect, useState } from 'react';
import { get } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSession } from '../lib/session';

const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 });

export default function VentasAdmin() {
  const toast = useToast();
  const { user } = useSession();
  const [sucursales, setSucursales] = useState([]);
  const [filtroSuc, setFiltroSuc] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => { (async () => {
    try {
      const sucs = await get('/api/sucursales');
      setSucursales(sucs);
      if (user.role === 'al' && user.sucursal) {
        const m = sucs.find(s => s.nombre === user.sucursal);
        if (m) setFiltroSuc(String(m.id_sucursal));
      }
    } catch (e) { toast.err(e.message); }
  })(); }, []);

  const cargar = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroSuc)   params.set('id_sucursal', filtroSuc);
      if (filtroFecha) params.set('fecha', filtroFecha);
      setData(await get('/api/ventas?' + params.toString()));
    } catch (e) { toast.err(e.message); }
  };
  useEffect(() => { cargar(); }, [filtroSuc, filtroFecha]);

  const total   = data.reduce((s, v) => s + Number(v.precio || 0), 0);
  const hoy     = new Date().toISOString().slice(0, 10);
  const hoyData = data.filter(v => (v.fecha_venta + '').slice(0, 10) === hoy);
  const prom    = data.length ? Math.round(total / data.length) : 0;

  return (<>
    <div className="phead">
      <div className="plabel">{user.role === 'ag' ? 'Admin global' : 'Admin local'} · Reporte de ventas</div>
      <h1 className="ptitle">Ventas</h1>
      <p className="psub">Historial de boletos vendidos y ingresos</p>
    </div>

    <section>
      <div className="row" style={{ marginBottom: 22, flexWrap:'wrap', gap:10 }}>
        <div className="stitle" style={{ marginBottom: 0 }}>Historial</div>
        <div className="spacer" />
        <select style={{ width: 220 }} value={filtroSuc} onChange={e => setFiltroSuc(e.target.value)} disabled={user.role === 'al'}>
          <option value="">Todas las sucursales</option>
          {sucursales.map(s => <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
        </select>
        <input type="date" style={{ width: 160 }} value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
        <button className="btn bo bsm" onClick={() => setFiltroFecha('')}>Limpiar</button>
      </div>

      <div className="cards c4">
        <div className="card"><div className="clabel">Boletos totales</div>
          <div className="cval bv">{data.length}</div>
          <div className="csub">en el periodo</div></div>
        <div className="card"><div className="clabel">Ingresos</div>
          <div className="cval gv">{fmtMoney(total)}</div>
          <div className="csub">MXN</div></div>
        <div className="card"><div className="clabel">Hoy</div>
          <div className="cval tv">{hoyData.length}</div>
          <div className="csub">boletos</div></div>
        <div className="card"><div className="clabel">Promedio boleto</div>
          <div className="cval">{fmtMoney(prom)}</div>
          <div className="csub">MXN</div></div>
      </div>
    </section>

    <section>
      {data.length === 0
        ? <div className="empty">Sin ventas para los filtros seleccionados.</div>
        : <table>
            <thead><tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Película</th>
              <th>Sucursal · Sala</th>
              <th>Función</th>
              <th>Asiento</th>
              <th style={{ textAlign:'right' }}>Total</th>
              <th>Estado</th>
            </tr></thead>
            <tbody>
              {data.map(v => {
                const fv = new Date(v.fecha_venta);
                const estCls = v.estado_pago === 'pagado' ? 'bgn' : (v.estado_pago === 'pendiente' ? 'bam' : 'brd');
                return (
                  <tr key={v.id_venta}>
                    <td className="tdmono">{fv.toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' })}</td>
                    <td>{v.usuario}<br/><span className="tdmono" style={{ fontSize:10, color:'var(--muted)' }}>{v.email}</span></td>
                    <td>{v.pelicula}</td>
                    <td className="tdmono">{v.sucursal} · {v.sala}</td>
                    <td className="tdmono">{(v.fecha + '').slice(0, 10)} {(v.horario + '').slice(0, 5)}</td>
                    <td className="tdmono">{v.fila}{v.numero}</td>
                    <td className="tdmono" style={{ textAlign:'right', color:'var(--gold)' }}>${Number(v.precio).toFixed(2)}</td>
                    <td><span className={'badge ' + estCls}>{v.estado_pago || '—'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>}
    </section>
  </>);
}
