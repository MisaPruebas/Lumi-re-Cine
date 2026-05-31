import { createContext, useContext, useEffect, useState } from 'react';

const CartCtx = createContext(null);
const KEY = 'lumiere_cart';

const EMPTY = { funcion: null, asientos: [], productos: [] };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const c = JSON.parse(raw);
    return {
      funcion: c.funcion || null,
      asientos: Array.isArray(c.asientos) ? c.asientos : [],
      productos: Array.isArray(c.productos) ? c.productos : []
    };
  } catch { return EMPTY; }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(cart));
  }, [cart]);

  const setFuncionYAsientos = (funcion, asientos) => {
    setCart({ funcion, asientos, productos: [] });
  };

  const setProductos = (productos) => setCart(c => ({ ...c, productos }));

  const addProducto = (p) => setCart(c => {
    const ex = c.productos.find(x => x.id_producto === p.id_producto);
    if (ex) {
      return { ...c, productos: c.productos.map(x =>
        x.id_producto === p.id_producto ? { ...x, cantidad: x.cantidad + 1 } : x) };
    }
    return { ...c, productos: [...c.productos, { ...p, cantidad: 1 }] };
  });

  const subProducto = (id) => setCart(c => ({
    ...c,
    productos: c.productos
      .map(x => x.id_producto === id ? { ...x, cantidad: x.cantidad - 1 } : x)
      .filter(x => x.cantidad > 0)
  }));

  const removeProducto = (id) => setCart(c => ({
    ...c, productos: c.productos.filter(x => x.id_producto !== id)
  }));

  const clear = () => setCart(EMPTY);

  const totales = (() => {
    const boletos = cart.asientos.reduce((s, a) => s + Number(a.precio || 0), 0);
    const dulceria = cart.productos.reduce((s, p) => s + Number(p.precio || 0) * p.cantidad, 0);
    return { boletos, dulceria, total: boletos + dulceria, items: cart.asientos.length + cart.productos.reduce((s, p) => s + p.cantidad, 0) };
  })();

  return (
    <CartCtx.Provider value={{
      cart, setFuncionYAsientos, setProductos,
      addProducto, subProducto, removeProducto, clear, totales
    }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
