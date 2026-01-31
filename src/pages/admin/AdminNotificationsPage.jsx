import { useState, useEffect } from 'react'
import { Mail, CheckCircle, XCircle, Clock, Filter, RefreshCw } from 'lucide-react'
import { supabase } from '../../config/supabase'
import { formatDate, formatTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const NOTIFICATION_LABELS = {
  game_created: 'Juego Creado',
  game_rescheduled: 'Reprogramado',
  game_finalized: 'Finalizado',
  game_cancelled: 'Cancelado',
  game_suspended: 'Suspendido',
  reminder_24h: 'Recordatorio 24h',
  reminder_2h: 'Recordatorio 2h',
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEstado, setFilterEstado] = useState('')
  const [filterTipo, setFilterTipo] = useState('')

  useEffect(() => {
    fetchNotifications()
  }, [filterEstado, filterTipo])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('notifications_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filterEstado) {
        query = query.eq('estado', filterEstado)
      }
      if (filterTipo) {
        query = query.eq('tipo_notificacion', filterTipo)
      }

      const { data, error } = await query
      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      toast.error('Error al cargar notificaciones')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle size={14} />
            Enviado
          </span>
        )
      case 'fallido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle size={14} />
            Fallido
          </span>
        )
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock size={14} />
            Pendiente
          </span>
        )
      default:
        return <span className="text-xs text-gray-500">{estado}</span>
    }
  }

  const clearFilters = () => {
    setFilterEstado('')
    setFilterTipo('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-500">Historial de emails enviados</p>
        </div>
        <button onClick={fetchNotifications} className="btn-secondary">
          <RefreshCw size={20} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filtros</span>
          {(filterEstado || filterTipo) && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 ml-auto">
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="select text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="enviado">Enviado</option>
            <option value="fallido">Fallido</option>
            <option value="pendiente">Pendiente</option>
          </select>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="select text-sm"
          >
            <option value="">Todos los tipos</option>
            {Object.entries(NOTIFICATION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner w-8 h-8"></div>
          </div>
        ) : (
          <>
            <div className="table-container max-h-[70vh] overflow-y-auto">
              <table className="table">
                <thead className="sticky top-0 bg-white z-10">
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Asunto</th>
                    <th>Destinatarios</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif) => (
                    <tr key={notif.id}>
                      <td>
                        <div className="text-sm">
                          <div className="font-medium">{formatDate(notif.created_at)}</div>
                          <div className="text-gray-400 text-xs">{formatTime(notif.created_at)}</div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">
                          {NOTIFICATION_LABELS[notif.tipo_notificacion] || notif.tipo_notificacion}
                        </span>
                      </td>
                      <td>
                        <div className="max-w-xs">
                          <p className="text-sm truncate">{notif.mensaje_asunto}</p>
                          {notif.error_mensaje && (
                            <p className="text-xs text-red-500 mt-1 truncate" title={notif.error_mensaje}>
                              Error: {notif.error_mensaje}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(notif.destinatarios || []).map((email, idx) => (
                            <span key={idx} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {email}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{getEstadoBadge(notif.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {notifications.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Mail className="mx-auto mb-2 text-gray-300" size={48} />
                <p>No hay notificaciones registradas</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
