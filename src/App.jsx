import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login           from './pages/Login';
import Registro        from './pages/Registro';
import PanelEstudiante from './pages/PanelEstudiante';
import PanelAdmin      from './pages/PanelAdmin';
import GestionUsuarios from './pages/GestionUsuarios';
import Tablets         from './pages/Tablets';

function RutaProtegida({ children, rolRequerido }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div style={{padding:32,color:'#6b6456'}}>Cargando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (rolRequerido && usuario.rol !== rolRequerido) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"        element={<Navigate to="/login" replace />} />
      <Route path="/login"   element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/tablets" element={<Tablets />} />
      <Route path="/estudiante" element={
        <RutaProtegida rolRequerido="estudiante"><PanelEstudiante /></RutaProtegida>
      } />
      <Route path="/admin" element={
        <RutaProtegida rolRequerido="admin"><PanelAdmin /></RutaProtegida>
      } />
      <Route path="/admin/usuarios" element={
        <RutaProtegida rolRequerido="admin"><GestionUsuarios /></RutaProtegida>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
