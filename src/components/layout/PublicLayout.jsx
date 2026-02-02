import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { 
  Home, 
  Calendar, 
  Users, 
  Trophy, 
  BarChart2, 
  Menu, 
  X,
  LogIn,
  ClipboardList
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const navLinks = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/calendario', label: 'Calendario', icon: Calendar },
  { path: '/equipos', label: 'Equipos', icon: Users },
  { path: '/posiciones', label: 'Posiciones', icon: Trophy },
  { path: '/estadisticas', label: 'Estadísticas', icon: BarChart2 },
  { path: '/inscripcion', label: 'Inscripción', icon: ClipboardList },
]

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAdmin } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏀</span>
              </div>
              <span className="font-display text-2xl text-gray-900 hidden sm:block">
                LIGA BASQUETBOL
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="font-medium">{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Admin/Login Button */}
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="btn-primary btn-sm hidden md:flex"
                >
                  Panel Admin
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn-ghost btn-sm hidden md:flex"
                >
                  <LogIn size={18} />
                  <span>Admin</span>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100">
            <nav className="px-4 py-2 space-y-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </NavLink>
              ))}
              <Link
                to={isAdmin ? '/admin' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-600 bg-primary-50"
              >
                <LogIn size={20} />
                <span className="font-medium">
                  {isAdmin ? 'Panel Admin' : 'Iniciar sesión'}
                </span>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏀</span>
              <span className="font-display text-white text-xl">LIGA BASQUETBOL</span>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} Madera Design
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
