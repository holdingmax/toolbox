import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import LoginPage from '../pages/LoginPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import CambioPasswordObligatorioPage from '../pages/CambioPasswordObligatorioPage'
import DashboardPage from '../pages/DashboardPage'
import NivelPage from '../pages/NivelPage'
import ConfiguracionPage from '../pages/ConfiguracionPage'
import UsuariosPage from '../pages/admin/UsuariosPage'
import NivelesPage from '../pages/admin/NivelesPage'
import HerramientasPage from '../pages/admin/HerramientasPage'
import PermisosPage from '../pages/admin/PermisosPage'
import HistorialPage from '../pages/admin/HistorialPage'
import MiHistorialPage from '../pages/MiHistorialPage'

function RootRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  if (usuario?.rol.nombre !== 'Administrador') {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/cambiar-password-obligatorio" element={<CambioPasswordObligatorioPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/historial" element={<MiHistorialPage />} />
          <Route path="/nivel/:id" element={<NivelPage />} />
          <Route
            path="/admin/usuarios"
            element={
              <AdminRoute>
                <UsuariosPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/niveles"
            element={
              <AdminRoute>
                <NivelesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/herramientas"
            element={
              <AdminRoute>
                <HerramientasPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/permisos"
            element={
              <AdminRoute>
                <PermisosPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/historial"
            element={
              <AdminRoute>
                <HistorialPage />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
