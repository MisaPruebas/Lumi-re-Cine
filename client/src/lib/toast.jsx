import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, kind = 'ok') => {
    const id = Date.now() + Math.random();
    setItems(s => [...s, { id, msg, kind }]);
    setTimeout(() => setItems(s => s.filter(x => x.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={{ ok: m => push(m, 'ok'), err: m => push(m, 'err') }}>
      {children}
      <div style={{ position:'fixed', bottom:30, right:30, zIndex:10000, display:'flex', flexDirection:'column', gap:8 }}>
        {items.map(t => (
          <div key={t.id} className={'toast on' + (t.kind === 'err' ? ' err' : '')} style={{ position:'static' }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
