import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Row, Col } from 'react-bootstrap';
import { post } from '../lib/api';
import { useToast } from '../lib/toast';
import { useCart } from '../lib/cart';

const formatCard = (v) => v.replace(/\D/g, '').slice(0,19).replace(/(.{4})/g, '$1 ').trim();
const formatExp = (v) => {
  const d = v.replace(/\D/g, '').slice(0,4);
  return d.length <= 2 ? d : d.slice(0,2) + '/' + d.slice(2);
};

export default function Carrito() {
  const toast = useToast();
  const nav = useNavigate();
  const { cart, clear, totales } = useCart();

  const [pago, setPago] = useState({ titular:'', numero:'', exp:'', cvv:'' });
  const [procesando, setProcesando] = useState(false);
  const [comprobante, setComprobante] = useState(null);

  const vacio = !cart.funcion || cart.asientos.length === 0;

  const validarPago = () => {
    if (!pago.titular.trim() || pago.titular.trim().length < 4) return 'Nombre del titular incompleto.';
    const digitos = pago.numero.replace(/\D/g, '');
    if (digitos.length < 13 || digitos.length > 19) return 'Número de tarjeta inválido (13–19 dígitos).';
    const m = pago.exp.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return 'Fecha de expiración con formato MM/AA.';
    const mes = parseInt(m[1], 10), anio = 2000 + parseInt(m[2], 10);
    if (mes < 1 || mes > 12) return 'Mes inválido.';
    const exp = new Date(anio, mes, 0, 23, 59, 59);
    if (exp < new Date()) return 'La tarjeta está vencida.';
    if (!/^\d{3,4}$/.test(pago.cvv)) return 'CVV inválido.';
    return null;
  };

  const pagar = async () => {
    const err = validarPago();
    if (err) return toast.err(err);
    setProcesando(true);
    try {
      await new Promise(r => setTimeout(r, 900));
      const r = await post('/api/ventas', {
        id_funcion: cart.funcion.id_funcion,
        asientos: cart.asientos.map(a => a.id_asiento),
        productos: cart.productos.map(p => ({ id_producto: p.id_producto, cantidad: p.cantidad })),
        metodo_pago: 'tarjeta'
      });
      setComprobante({
        ventas: r.ventas, total: r.total,
        funcion: cart.funcion, asientos: cart.asientos, productos: cart.productos,
        ultimos4: pago.numero.replace(/\D/g,'').slice(-4)
      });
      clear();
      setPago({ titular:'', numero:'', exp:'', cvv:'' });
    } catch (e) {
      toast.err(e.message);
    } finally { setProcesando(false); }
  };

  if (comprobante) {
    const detalleAsientos = comprobante.asientos.map(a => a.fila + a.numero + (a.tipo === 'VIP' ? ' (VIP)' : '')).join(', ');
    return (<>
      <div className="phead">
        <div className="plabel">Compra confirmada</div>
        <h1 className="ptitle">¡Gracias por tu compra!</h1>
        <p className="psub">Te enviamos los detalles a tu correo</p>
      </div>
      <section>
        <div className="ticket" style={{ maxWidth: 480, margin:'0 auto' }}>
          <h3>★ Comprobante digital</h3>
          <div className="trow"><span>Folio</span><span>#{comprobante.ventas[0]}</span></div>
          <div className="trow"><span>Película</span><span>{comprobante.funcion.pelicula}</span></div>
          <div className="trow"><span>Sucursal</span><span>{comprobante.funcion.sucursal}</span></div>
          <div className="trow"><span>Sala</span><span>{comprobante.funcion.sala} {comprobante.funcion.sala_tipo || ''}</span></div>
          <div className="trow"><span>Fecha · Hora</span><span>{comprobante.funcion.fecha} · {comprobante.funcion.horario}</span></div>
          <div className="trow"><span>Asientos</span><span>{detalleAsientos}</span></div>
          {comprobante.productos.map(p => (
            <div key={p.id_producto} className="trow"><span>{p.cantidad} × {p.nombre}</span><span>${(p.precio * p.cantidad).toFixed(2)}</span></div>
          ))}
          <div className="trow"><span>Pago</span><span>Tarjeta •••• {comprobante.ultimos4}</span></div>
          <div className="trow" style={{ marginTop:10, fontSize:14, color:'var(--gold)' }}>
            <span><strong>TOTAL</strong></span><span><strong>${Number(comprobante.total).toFixed(2)}</strong></span>
          </div>
        </div>
        <div style={{ marginTop:24, display:'flex', gap:10, justifyContent:'center' }}>
          <button className="btn bo bsm" onClick={() => nav('/panel')}>Ir al panel</button>
          <button className="btn bg bsm" onClick={() => { setComprobante(null); nav('/ventas'); }}>Comprar más</button>
        </div>
      </section>
    </>);
  }

  if (vacio) {
    return (<>
      <div className="phead">
        <div className="plabel">Carrito</div>
        <h1 className="ptitle">Tu carrito está vacío</h1>
        <p className="psub">Elige una función desde la cartelera</p>
      </div>
      <section>
        <div className="empty">
          Aún no has seleccionado asientos. <button className="btn bg bsm" onClick={() => nav('/ventas')}>Ir a cartelera</button>
        </div>
      </section>
    </>);
  }

  return (<>
    <div className="phead">
      <div className="plabel">Carrito · Checkout</div>
      <h1 className="ptitle">Pago seguro</h1>
      <p className="psub">Revisa tu compra y completa el pago con tarjeta</p>
    </div>
    <section>
      <Row>
        <Col lg={6}>
          <div className="ssum" style={{ maxWidth:'none', textAlign:'left' }}>
            <div className="ssumtitle">Resumen de tu compra</div>
            <div style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:26, letterSpacing:1, color:'var(--gold)' }}>
              {cart.funcion.pelicula}
            </div>
            <div className="tdmono" style={{ color:'var(--muted)', fontSize:11, letterSpacing:1, textTransform:'uppercase', marginTop:6, marginBottom:18 }}>
              {cart.funcion.sucursal} · {cart.funcion.sala} ({cart.funcion.sala_tipo}) · {cart.funcion.fecha} · {cart.funcion.horario}
            </div>

            <div className="stsub" style={{ marginTop:8 }}>Asientos</div>
            <div className="slots" style={{ marginTop:6 }}>
              {cart.asientos.map(a => (
                <span key={a.id_asiento} className="slot sel">
                  {a.fila}{a.numero}{a.tipo === 'VIP' ? ' VIP' : ''} · ${Number(a.precio).toFixed(0)}
                </span>
              ))}
            </div>

            {cart.productos.length > 0 && <>
              <div className="stsub" style={{ marginTop:18 }}>Dulcería</div>
              <div style={{ marginTop:6 }}>
                {cart.productos.map(p => (
                  <div key={p.id_producto} className="trow" style={{ padding:'4px 0', borderBottom:'1px dashed #1e1e1e', display:'flex', justifyContent:'space-between' }}>
                    <span>{p.cantidad} × {p.nombre}</span>
                    <span className="tdmono">${(p.precio * p.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>}

            <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
              <span className="tdmono" style={{ fontSize:11, color:'var(--muted)', letterSpacing:2, textTransform:'uppercase' }}>Total a pagar</span>
              <span style={{ fontFamily:'Bebas Neue,sans-serif', fontSize:36, color:'var(--gold)', letterSpacing:1 }}>
                ${totales.total.toLocaleString('es-MX', { minimumFractionDigits:2, maximumFractionDigits:2 })}
              </span>
            </div>

            <button className="btn bo bsm" style={{ marginTop:14, width:'100%' }} onClick={() => nav('/ventas')}>
              ← Volver a la cartelera
            </button>
          </div>
        </Col>

        <Col lg={6}>
          <div className="ssum" style={{ maxWidth:'none', textAlign:'left' }}>
            <div className="ssumtitle">Datos de la tarjeta</div>

            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:2, textTransform:'uppercase', fontFamily:'DM Mono,monospace' }}>Titular</Form.Label>
              <Form.Control value={pago.titular} onChange={e => setPago({...pago, titular:e.target.value.toUpperCase()})} placeholder="NOMBRE APELLIDO" />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:2, textTransform:'uppercase', fontFamily:'DM Mono,monospace' }}>Número de tarjeta</Form.Label>
              <Form.Control value={pago.numero} onChange={e => setPago({...pago, numero: formatCard(e.target.value)})} placeholder="4242 4242 4242 4242" inputMode="numeric" />
            </Form.Group>
            <Row className="mb-3">
              <Col><Form.Label style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:2, textTransform:'uppercase', fontFamily:'DM Mono,monospace' }}>Expiración</Form.Label>
                <Form.Control value={pago.exp} onChange={e => setPago({...pago, exp: formatExp(e.target.value)})} placeholder="MM/AA" inputMode="numeric" /></Col>
              <Col><Form.Label style={{ fontSize:11, color:'var(--gold-dim)', letterSpacing:2, textTransform:'uppercase', fontFamily:'DM Mono,monospace' }}>CVV</Form.Label>
                <Form.Control value={pago.cvv} onChange={e => setPago({...pago, cvv:e.target.value.replace(/\D/g,'').slice(0,4)})} placeholder="123" inputMode="numeric" /></Col>
            </Row>

            <button type="button" className="btn bg" style={{ width:'100%' }} onClick={pagar} disabled={procesando}>
              {procesando ? 'Procesando...' : `Pagar $${totales.total.toLocaleString('es-MX', { minimumFractionDigits:2, maximumFractionDigits:2 })}`}
            </button>
            <div style={{ marginTop:12, fontSize:10, color:'var(--muted)', fontFamily:'DM Mono,monospace', textAlign:'center', letterSpacing:1, textTransform:'uppercase' }}>
              Modo demo · prueba con 4242 4242 4242 4242
            </div>
          </div>
        </Col>
      </Row>
    </section>
  </>);
}
