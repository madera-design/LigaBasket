import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layouts
import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/layout/AdminLayout'

// Páginas públicas
import HomePage from './pages/public/HomePage'
import CalendarioPage from './pages/public/CalendarioPage'
import EquiposPage from './pages/public/EquiposPage'
import EquipoDetailPage from './pages/public/EquipoDetailPage'
import JugadorDetailPage from './pages/public/JugadorDetailPage'
import JuegoDetailPage from './pages/public/JuegoDetailPage'
import TablaPosicionesPage from './pages/public/TablaPosicionesPage'
import EstadisticasPage from './pages/public/EstadisticasPage'

// Páginas admin
import DashboardPage from './pages/admin/DashboardPage'
import AdminEquiposPage from './pages/admin/AdminEquiposPage'
import AdminJugadoresPage from './pages/admin/AdminJugadoresPage'
import AdminCalendarioPage from './pages/admin/AdminCalendarioPage'
import AdminJuegoPage from './pages/admin/AdminJuegoPage'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Componente de ruta protegida
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/calendario" element={<CalendarioPage />} />
        <Route path="/equipos" element={<EquiposPage />} />
        <Route path="/equipos/:id" element={<EquipoDetailPage />} />
        <Route path="/jugadores/:id" element={<JugadorDetailPage />} />
        <Route path="/juegos/:id" element={<JuegoDetailPage />} />
        <Route path="/posiciones" element={<TablaPosicionesPage />} />
        <Route path="/estadisticas" element={<EstadisticasPage />} />
      </Route>

      {/* Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas admin (protegidas) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="equipos" element={<AdminEquiposPage />} />
        <Route path="jugadores" element={<AdminJugadoresPage />} />
        <Route path="calendario" element={<AdminCalendarioPage />} />
        <Route path="juegos/:id" element={<AdminJuegoPage />} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300">404</h1>
              <p className="text-gray-500 mt-2">Página no encontrada</p>
              <a href="/" className="btn-primary mt-4 inline-block">
                Volver al inicio
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  )
}

export default App
