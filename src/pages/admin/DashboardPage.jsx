import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  UserPlus, 
  Calendar, 
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react'
import { getEquipos } from '../../services/equipos.service'
import { getJugadores } from '../../services/jugadores.service'
import { getJuegos, getProximosJuegos } from '../../services/juegos.service'
import { formatDate, formatTime } from '../../utils/formatters'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    equipos: 0,
    jugadores: 0,
    juegosJugados: 0,
    juegosProgramados: 0,
  })
  const [proximosJuegos, setProximosJuegos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equipos, jugadores, juegosFinalizados, juegosProgramados, proximos] = await Promise.all([
          getEquipos(),
          getJugadores(),
          getJuegos({ estado: 'finalizado' }),
          getJuegos({ estado: 'programado' }),
          getProximosJuegos(5),
        ])

        setStats({
          equipos: equipos.length,
          jugadores: jugadores.length,
          juegosJugados: juegosFinalizados.length,
          juegosProgramados: juegosProgramados.length,
        })
        setProximosJuegos(proximos)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    { label: 'Equipos', value: stats.equipos, icon: Users, color: 'bg-blue-500', link: '/admin/equipos' },
    { label: 'Jugadores', value: stats.jugadores, icon: UserPlus, color: 'bg-green-500', link: '/admin/jugadores' },
    { label: 'Juegos Jugados', value: stats.juegosJugados, icon: TrendingUp, color: 'bg-purple-500', link: '/admin/calendario' },
    { label: 'Próximos Juegos', value: stats.juegosProgramados, icon: Calendar, color: 'bg-orange-500', link: '/admin/calendario' },
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Bienvenido al panel de administración</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/equipos" className="btn-secondary btn-sm">
            <Plus size={18} />
            Nuevo Equipo
          </Link>
          <Link to="/admin/calendario" className="btn-primary btn-sm">
            <Plus size={18} />
            Nuevo Juego
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="card-hover p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Próximos juegos */}
        <div className="card">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Próximos Juegos</h2>
            <Link 
              to="/admin/calendario" 
              className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm"
            >
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {proximosJuegos.length > 0 ? (
              proximosJuegos.map((juego) => (
                <Link
                  key={juego.id}
                  to={`/admin/juegos/${juego.id}`}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50"
                >
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs text-gray-500">{formatDate(juego.fecha, 'dd/MM')}</p>
                    <p className="text-sm font-medium">{formatTime(juego.fecha)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {juego.local_corto || juego.local_nombre} vs {juego.visitante_corto || juego.visitante_nombre}
                    </p>
                    <p className="text-sm text-gray-500">{juego.lugar || 'Por definir'}</p>
                  </div>
                  <span className="badge-gray">Programado</span>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No hay juegos programados
              </div>
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/admin/equipos"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
            >
              <Users className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="font-medium">Gestionar Equipos</p>
            </Link>
            <Link
              to="/admin/jugadores"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
            >
              <UserPlus className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="font-medium">Gestionar Jugadores</p>
            </Link>
            <Link
              to="/admin/calendario"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
            >
              <Calendar className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="font-medium">Programar Juegos</p>
            </Link>
            <Link
              to="/"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
            >
              <TrendingUp className="mx-auto mb-2 text-gray-400" size={32} />
              <p className="font-medium">Ver Estadísticas</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
