import { createContext, useContext, useEffect, useState } from 'react';
import { get, post } from './api';

const SessionCtx = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lumiere_session') || 'null'); }
    catch { return null; }
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    get('/api/session')
      .then(u => { setUser(u); localStorage.setItem('lumiere_session', JSON.stringify(u)); })
      .catch(() => { setUser(null); localStorage.removeItem('lumiere_session'); })
      .finally(() => setLoaded(true));
  }, []);

  const login = (u) => {
    setUser(u);
    localStorage.setItem('lumiere_session', JSON.stringify(u));
  };
  const logout = async () => {
    try { await post('/api/logout', {}); } catch (_) {}
    setUser(null);
    localStorage.removeItem('lumiere_session');
  };

  return (
    <SessionCtx.Provider value={{ user, loaded, login, logout }}>
      {children}
    </SessionCtx.Provider>
  );
}

export const useSession = () => useContext(SessionCtx);
