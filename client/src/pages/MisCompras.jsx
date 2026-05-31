import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../lib/api';
import { useToast } from '../lib/toast';

const fmtMoney = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtHora  = (t) => (t || '').toString().slice(0, 5);
const fmtFecha = (f) => (f || '').toString().slice(0, 10);

// Agrupa ventas por compra: misma función + mismo minuto de fecha_venta.
// (En POST /api/ventas, todas las ventas del mismo carrito se insertan en transacción
//  con timestamps que caen en el mismo minuto.)
function agruparCompras(ventas) {
  const grupos = new Map();
  for (const v of ventas) {
    const ts = (v.fecha_venta + '').slice(0, 16); // YYYY-MM-DD HH:MM o YYYY-MM-DDTHH:MM
    const key = v.id_funcion + '__' + ts;
    if (!grupos.has(key)) {
      grupos.set(key, {
        key,
        fecha_venta: v.fecha_venta,
        id_funcion: v.id_funcion,
        pelicula: v.pelicula,
        sucursal: v.sucursal,
        sala: v.sala,
        sala_tipo: v.sala_tipo,
        fecha: v.fecha,
        horario: v.horario,
        metodo_pago: v.metodo_pago,
        estado_pago: v.estado_pago,
        asientos: [],
        ventaIds: []
      });
    }
    const g = grupos.get(key);
    g.asientos.push({
      id_venta: v.id_venta,
      fila: v.fila,
      numero: v.numero,
      tipo: v.asiento_tipo,
      precio: Number(v.precio || 0)
    });
    g.ventaIds.push(v.id_venta);
  }
  // Ordenar por fecha_venta DESC (más reciente primero)
  return [...grupos.values()].sort((a, b) =>
    String(b.fecha_venta).localeCompare(String(a.fecha_venta))
  );
}

export default function MisCompras() {
  const toast = useToast();
  const nav = useNavigate();

  const [ventas, setVentas] = useState([]);
  const [detalles, setDetalles] = useState({}); // { [ventaIdPrincipal]: [{cantidad, precio, nombre, sku}] }
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { (async () => {
    try {
      const data = await get('/api/ventas');
      setVentas(data);

      // Para cada grupo, traer el detalle de productos del id_venta más bajo (que es el "principal")
      const grupos = agruparCompras(data);
      const idsPrincipales = grupos.map(g => Math.min(...g.ventaIds));
      const detallesArr = await Promise.all(
        idsPrincipales.map(id =>
          get('/api/ventas/' + id + '/detalle').catch(() => [])
        )
      );
      const map = {};
      idsPrincipales.forEach((id, i) => { map[id] = detallesArr[i] || []; });
      setDetalles(map);
    } catch (e) {
      toast.err(e.message);
    } finally {
      setLoaded(true);
    }
  })(); }, []);

  const compras = useMemo(() => agruparCompras(ventas), [ventas]);

  const totales = useMemo(() => {
    let totalBol = 0, totalDul = 0, boletos = 0;
    for (const g of compras) {
      for (const a of g.asientos) { totalBol += a.precio; boletos++; }
      const idP = Math.min(...g.ventaIds);
      for (const d of (detalles[idP] || [])) {
        totalDul += Number(d.cantidad) * Number(d.precio);
      }
    }
    return { compras: compras.length, boletos, totalBol, totalDul, total: totalBol + totalDul };
  }, [compras, detalles]);

  return (<>
    <div className="phead">
      <div className="plabel">Mi cuenta · Historial</div>
      <h1 className="ptitle">Mis compras</h1>
      <p className="psub">Comprobantes de tus boletos y dulcería</p>
    </div>

    <section>
      <div className="cards c4">
        <div className="card"><div className="clabel">Compras</div>
          <div className="cval bv">{totales.compras}</div>
          <div className="csub">pedidos</div></div>
        <div className="card"><div className="clabel">Boletos</div>
          <div className="cval gv">{totales.boletos}</div>
          <div className="csub">en total</div></div>
        <div className="card"><div className="clabel">Total boletos</div>
          <div className="cval tv">{fmtMoney(totales.totalBol)}</div>
          <div className="csub">MXN</div></div>
        <div className="card"><div className="clabel">Total dulcería</div>
          <div className="cval">{fmtMoney(totales.totalDul)}</div>
          <div className="csub">MXN</div></div>
      </div>
    </section>

    <section>
      <div className="row" style={{ marginBottom: 22 }}>
        <div className="stitle" style={{ marginBottom: 0 }}>Comprobantes</div>
        <div className="spacer" />
        <button className="btn bg bsm" onClick={() => nav('/ventas')}>+ Nueva compra</button>
      </div>

      {!loaded
        ? <div className="empty">Cargando tus compras…</div>
        : compras.length === 0
          ? <div className="empty">
              Aún no tienes compras.
              <div style={{ marginTop: 14 }}>
                <button className="btn bg bsm" onClick={() => nav('/ventas')}>Ir a cartelera</button>
              </div>
            </div>
          : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(420px, 1fr))', gap: 24 }}>
              {compras.map(g => {
                const idP = Math.min(...g.ventaIds);
                const productos = detalles[idP] || [];
                const fv = new Date(g.fecha_venta);
                const subtotalBol = g.asientos.reduce((s, a) => s + a.precio, 0);
                const subtotalDul = productos.reduce((s, p) => s + Number(p.cantidad) * Number(p.precio), 0);
                const total = subtotalBol + subtotalDul;
                const estCls = g.estado_pago === 'pagado' ? 'bgn' : (g.estado_pago === 'pendiente' ? 'bam' : 'brd');
                return (
                  <div key={g.key} className="ticket">
                    <h3>★ Comprobante</h3>
                    <div className="trow"><span>Folio</span><span>#{idP}</span></div>
                    <div className="trow"><span>Comprado</span>
                      <span>{fv.toLocaleString('es-MX', { dateStyle:'short', timeStyle:'short' })}</span></div>
                    <div className="trow"><span>Película</span><span>{g.pelicula}</span></div>
                    <div className="trow"><span>Sucursal</span><span>{g.sucursal}</span></div>
                    <div className="trow"><span>Sala</span><span>{g.sala} {g.sala_tipo || ''}</span></div>
                    <div className="trow"><span>Función</span>
                      <span>{fmtFecha(g.fecha)} · {fmtHora(g.horario)}</span></div>
                    <div className="trow"><span>Asientos</span>
                      <span>{g.asientos.map(a => a.fila + a.numero + (a.tipo === 'VIP' ? '(VIP)' : '')).join(', ')}</span></div>
                    <div className="trow"><span>Subtotal boletos</span><span>{fmtMoney(subtotalBol)}</span></div>
                    {productos.length > 0 && <>
                      <div className="trow" style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:'var(--gold-dim)', letterSpacing:2, textTransform:'uppercase' }}>
                        <span>Dulcería</span><span></span>
                      </div>
                      {productos.map((p, i) => (
                        <div key={i} className="trow">
                          <span>{p.cantidad} × {p.nombre}</span>
                          <span>{fmtMoney(Number(p.precio) * Number(p.cantidad))}</span>
                        </div>
                      ))}
                    </>}
                    <div className="trow"><span>Pago</span>
                      <span>{(g.metodo_pago || 'tarjeta')} · <span className={'badge ' + estCls}>{g.estado_pago || 'pagado'}</span></span></div>
                    <div className="trow" style={{ marginTop:10, fontSize:14, color:'var(--gold)' }}>
                      <span><strong>TOTAL</strong></span>
                      <span><strong>{fmtMoney(total)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>}
    </section>
  </>);
}
