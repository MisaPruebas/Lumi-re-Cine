import { Navigate } from 'react-router-dom';
import { useSession } from '../lib/session';

export default function Protected({ roles, children }) {
  const { user, loaded } = useSession();
  if (!loaded) return <div className="empty">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/panel" replace />;
  return children;
}
