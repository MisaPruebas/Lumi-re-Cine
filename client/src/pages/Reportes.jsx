import { useEffect, useState } from 'react';
import { get } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSession } from '../lib/session';

const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum   = (n) => Number(n || 0).toLocaleString('es-MX');
const isoHoy   = () => new Date().toISOString().slice(0, 10);
const isoMinus = (d) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0, 10); };

const ESTADO_CLS = { 'Activa':'bgn', 'Mantenimiento':'bam', 'Inactiva':'brd' };

export default function Reportes() {
  const toast = useToast();
  const { user } = useSession();

  const [desde, setDesde] = useState(isoMinus(6));
  const [hasta, setHasta] = useState(isoHoy());
  const [data, setData] = useState(null);

  const cargar = async (d = desde, h = hasta) => {
    if (!d || !h) return toast.err('Define un rango');
    if (d > h)    return toast.err('La fecha "desde" no puede ser mayor que "hasta"');
    try {
      setData(await get(`/api/reportes/comparativo?desde=${d}&hasta=${h}`));
    } catch (e) { toast.err(e.message); }
  };

  useEffect(() => { cargar(); }, []);

  const presetRango = (dias) => {
    const d = isoMinus(dias - 1), h = isoHoy();
    setDesde(d); setHasta(h);
    cargar(d, h);
  };

  if (user.role !== 'ag') {
    return <div className="empty" style={{ padding: 120 }}>Esta sección requiere rol de Admin Global.</div>;
  }

  const sucursales = (data?.sucursales || []).map(s => ({
    ...s,
    ingreso_total: Number(s.ingreso_boletos) + Number(s.ingreso_dulceria)
  }));
  const totBol  = sucursales.reduce((a, s) => a + Number(s.boletos), 0);
  const totBolI = sucursales.reduce((a, s) => a + Number(s.ingreso_boletos), 0);
  const totDul  = sucursales.reduce((a, s) => a + Number(s.ingreso_dulceria), 0);
  const maxIng  = Math.max(1, ...sucursales.map(s => s.ingreso_total));
  const maxBol  = Math.max(1, ...sucursales.map(s => Number(s.boletos)));

  return (<>
    <div className="phead">
      <div className="plabel bc">Admin global · Análisis comparativo</div>
      <h1 className="ptitle">Reportes</h1>
      <p className="psub">Ventas, ingresos y rendimiento entre sucursales de la cadena</p>
    </div>

    <section>
      <div className="row" style={{ marginBottom: 22, flexWrap:'wrap', gap:10 }}>
        <div className="stitle" style={{ marginBottom: 0 }}>Rango de análisis</div>
        <div className="spacer" />
        <label style={{ width:'auto' }}>Desde</label>
        <input type="date" style={{ width: 160 }} value={desde} onChange={e => setDesde(e.target.value)} />
        <label style={{ width:'auto' }}>Hasta</label>
        <input type="date" style={{ width: 160 }} value={hasta} onChange={e => setHasta(e.target.value)} />
        <button className="btn bo bsm" onClick={() => presetRango(7)}>7 días</button>
        <button className="btn bo bsm" onClick={() => presetRango(30)}>30 días</button>
        <button className="btn bb" onClick={() => cargar()}>Generar</button>
      </div>

      <div className="cards c4">
        <div className="card"><div className="clabel">Boletos vendidos</div>
          <div className="cval bv">{data ? fmtNum(totBol) : '…'}</div>
          <div className="csub">en el período</div></div>
        <div className="card"><div className="clabel">Ingreso por boletos</div>
          <div className="cval gv">{data ? fmtMoney(totBolI) : '…'}</div>
          <div className="csub">MXN</div></div>
        <div className="card"><div className="clabel">Ingreso por dulcería</div>
          <div className="cval tv">{data ? fmtMoney(totDul) : '…'}</div>
          <div className="csub">MXN</div></div>
        <div className="card"><div className="clabel">Ingreso total</div>
          <div className="cval">{data ? fmtMoney(totBolI + totDul) : '…'}</div>
          <div className="csub">MXN · cadena completa</div></div>
      </div>
    </section>

    <section style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
      <div className="stitle">Ingreso total por sucursal</div>
      <div className="barchart">
        {!data ? <div className="empty">Generando reporte…</div>
          : sucursales.length === 0 ? <div className="empty">Sin datos.</div>
          : sucursales.map(s => {
              const pct = (s.ingreso_total / maxIng) * 100;
              return (
                <div key={s.id_sucursal} className="brow">
                  <div className="blbl">{s.nombre}</div>
                  <div className="btrack"><div className="bfill gold" style={{ width: pct + '%' }}>
                    {pct > 14 ? fmtMoney(s.ingreso_total) : ''}
                  </div></div>
                  <div className="bval">{fmtMoney(s.ingreso_total)}</div>
                </div>
              );
            })}
      </div>
    </section>

    <section>
      <div className="stitle">Boletos vendidos por sucursal</div>
      <div className="barchart">
        {sucursales.map(s => {
          const pct = (Number(s.boletos) / maxBol) * 100;
          return (
            <div key={s.id_sucursal} className="brow">
              <div className="blbl">{s.nombre}</div>
              <div className="btrack"><div className="bfill teal" style={{ width: pct + '%' }}>
                {pct > 14 ? fmtNum(s.boletos) + ' boletos' : ''}
              </div></div>
              <div className="bval">{fmtNum(s.boletos)}</div>
            </div>
          );
        })}
      </div>
    </section>

    <section style={{ background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
      <div className="stitle">Detalle por sucursal</div>
      <table>
        <thead><tr>
          <th>Sucursal</th>
          <th>Estado</th>
          <th style={{ textAlign:'right' }}>Funciones</th>
          <th style={{ textAlign:'right' }}>Boletos</th>
          <th style={{ textAlign:'right' }}>Ingreso boletos</th>
          <th style={{ textAlign:'right' }}>Ingreso dulcería</th>
          <th style={{ textAlign:'right' }}>Ingreso total</th>
          <th style={{ textAlign:'right' }}>Ticket promedio</th>
        </tr></thead>
        <tbody>
          {!data
            ? <tr><td colSpan={8} className="empty">Cargando…</td></tr>
            : sucursales.length === 0
              ? <tr><td colSpan={8} className="empty">Sin sucursales registradas.</td></tr>
              : sucursales.map(s => {
                  const ticket = Number(s.boletos) > 0 ? Number(s.ingreso_boletos) / Number(s.boletos) : 0;
                  return (
                    <tr key={s.id_sucursal}>
                      <td>{s.nombre}</td>
                      <td><span className={'badge ' + (ESTADO_CLS[s.estado] || 'bam')}>{s.estado}</span></td>
                      <td className="tdmono" style={{ textAlign:'right' }}>{fmtNum(s.funciones)}</td>
                      <td className="tdmono" style={{ textAlign:'right' }}>{fmtNum(s.boletos)}</td>
                      <td className="tdmono" style={{ textAlign:'right' }}>{fmtMoney(s.ingreso_boletos)}</td>
                      <td className="tdmono" style={{ textAlign:'right' }}>{fmtMoney(s.ingreso_dulceria)}</td>
                      <td className="tdmono" style={{ textAlign:'right', color:'var(--gold)' }}>{fmtMoney(s.ingreso_total)}</td>
                      <td className="tdmono" style={{ textAlign:'right' }}>{fmtMoney(ticket)}</td>
                    </tr>
                  );
                })}
        </tbody>
      </table>
    </section>

    <section>
      <div className="cards c2" style={{ gap: 32 }}>
        <div>
          <div className="stitle">Top 5 películas</div>
          <div className="toplist" style={{ border:'1px solid var(--border)' }}>
            <div className="trow hdr">
              <span style={{ textAlign:'center' }}>#</span>
              <span>Película</span>
              <span style={{ textAlign:'right' }}>Boletos</span>
              <span style={{ textAlign:'right' }}>Ingreso</span>
            </div>
            {!data ? <div className="empty">…</div>
              : (data.top_peliculas || []).length === 0
                ? <div className="empty">Sin ventas en el período.</div>
                : data.top_peliculas.map((p, i) => (
                    <div key={p.id_pelicula || i} className="trow">
                      <div className="rank">{i + 1}</div>
                      <div className="tname">{p.nombre}<small>{p.categoria || '—'}</small></div>
                      <div className="tnum">{fmtNum(p.boletos)}</div>
                      <div className="tnum gv">{fmtMoney(p.ingreso)}</div>
                    </div>
                  ))}
          </div>
        </div>
        <div>
          <div className="stitle">Top 5 productos</div>
          <div className="toplist" style={{ border:'1px solid var(--border)' }}>
            <div className="trow hdr">
              <span style={{ textAlign:'center' }}>#</span>
              <span>Producto</span>
              <span style={{ textAlign:'right' }}>Unidades</span>
              <span style={{ textAlign:'right' }}>Ingreso</span>
            </div>
            {!data ? <div className="empty">…</div>
              : (data.top_productos || []).length === 0
                ? <div className="empty">Sin ventas en el período.</div>
                : data.top_productos.map((p, i) => (
                    <div key={p.id_producto || i} className="trow">
                      <div className="rank">{i + 1}</div>
                      <div className="tname">{p.nombre}<small>{p.sku || ''}</small></div>
                      <div className="tnum">{fmtNum(p.unidades)}</div>
                      <div className="tnum gv">{fmtMoney(p.ingreso)}</div>
                    </div>
                  ))}
          </div>
        </div>
      </div>
    </section>
  </>);
}
