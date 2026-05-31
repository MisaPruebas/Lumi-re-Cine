import { Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './lib/session';
import { ToastProvider } from './lib/toast';
import { CartProvider } from './lib/cart';
import Protected from './components/Protected';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Panel from './pages/Panel';
import Placeholder from './pages/Placeholder';
import Sucursales from './pages/Sucursales';
import Peliculas from './pages/Peliculas';
import Productos from './pages/Productos';
import Salas from './pages/Salas';
import Funciones from './pages/Funciones';
import Cartelera from './pages/Cartelera';
import Carrito from './pages/Carrito';
import Reportes from './pages/Reportes';
import VentasAdmin from './pages/VentasAdmin';
import AdmUsu from './pages/AdmUsu';
import MisCompras from './pages/MisCompras';
import { useSession } from './lib/session';

// ── CONFIGURACIÓN CRÍTICA DE AXIOS PARA SESIONES (Requisito 8) ──
import axios from 'axios';
axios.defaults.withCredentials = true; // Permite mandar/recibir cookies de sesión del backend (puerto 3000)
axios.defaults.baseURL = 'http://localhost:3000'; // Define la ruta base para tus peticiones

function VentasDispatcher() {
  const { user } = useSession();
  if (!user) return null;
  return user.role === 'c' ? <Cartelera /> : <VentasAdmin />;
}

function Shell({ children }) {
  return (<>
    <Topbar />
    {children}
  </>);
}

export default function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/panel" replace />} />

            <Route path="/panel" element={<Protected><Shell><Panel /></Shell></Protected>} />
            <Route path="/sucursales" element={<Protected roles={['ag']}><Shell><Sucursales /></Shell></Protected>} />
            <Route path="/peliculas"  element={<Protected roles={['ag']}><Shell><Peliculas /></Shell></Protected>} />
            <Route path="/salas"      element={<Protected roles={['ag','al']}><Shell><Salas /></Shell></Protected>} />
            <Route path="/funciones"  element={<Protected roles={['ag','al']}><Shell><Funciones /></Shell></Protected>} />
            <Route path="/productos"  element={<Protected roles={['ag','al']}><Shell><Productos /></Shell></Protected>} />
            <Route path="/ventas"     element={<Protected><Shell><VentasDispatcher /></Shell></Protected>} />
            <Route path="/carrito"    element={<Protected roles={['c']}><Shell><Carrito /></Shell></Protected>} />
            <Route path="/mis-compras" element={<Protected roles={['c']}><Shell><MisCompras /></Shell></Protected>} />
            <Route path="/reportes"   element={<Protected roles={['ag']}><Shell><Reportes /></Shell></Protected>} />
            <Route path="/usuarios"   element={<Protected roles={['ag']}><Shell><AdmUsu /></Shell></Protected>} />

            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Routes>
        </CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}