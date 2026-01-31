import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarPlus,
  Trophy,
  LogOut,
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Mail
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const adminLinks = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/admin/equipos', label: 'Equipos', icon: Users },
  { path: '/admin/jugadores', label: 'Jugadores', icon: UserPlus },
  { path: '/admin/calendario', label: 'Calendario', icon: CalendarPlus },
  { path: '/admin/torneos', label: 'Torneos', icon: Trophy },
  /*{ path: '/admin/notificaciones', label: 'Notificaciones', icon: Mail },*/
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Sesion cerrada')
      navigate('/')
    } catch (error) {
      toast.error('Error al cerrar sesion')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar para desktop */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        <div className="flex flex-col flex-1 bg-gray-900">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏀</span>
              {!collapsed && <span className="font-display text-white text-xl">ADMIN</span>}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
              title={collapsed ? 'Expandir menu' : 'Contraer menu'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {adminLinks.map(({ path, label, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={20} />
                {!collapsed && <span className="font-medium">{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-800">
            {!collapsed && (
              <div className="flex items-center gap-3 px-4 py-2 text-gray-300">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="flex justify-center py-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-300">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="mt-2 space-y-1">
              <Link
                to="/"
                title={collapsed ? 'Ver sitio' : undefined}
                className={`flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors ${
                  collapsed ? 'justify-center px-0' : ''
                }`}
              >
                <Home size={18} />
                {!collapsed && <span className="text-sm">Ver sitio</span>}
              </Link>
              <button
                onClick={handleLogout}
                title={collapsed ? 'Cerrar sesion' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-gray-800 transition-colors ${
                  collapsed ? 'justify-center px-0' : ''
                }`}
              >
                <LogOut size={18} />
                {!collapsed && <span className="text-sm">Cerrar sesion</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="relative flex flex-col w-64 bg-gray-900">
            <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏀</span>
                <span className="font-display text-white text-xl">ADMIN</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {adminLinks.map(({ path, label, icon: Icon, end }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span className="font-medium">{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 rounded-lg hover:bg-gray-800"
              >
                <LogOut size={18} />
                <span className="text-sm">Cerrar sesion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top bar mobile */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center h-16 px-4 bg-white shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xl">🏀</span>
            <span className="font-display text-lg">ADMIN</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
