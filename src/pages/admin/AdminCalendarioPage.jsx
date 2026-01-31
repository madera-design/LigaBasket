import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Calendar, MapPin, Trash2, Eye, ClipboardEdit, Filter, CalendarClock } from 'lucide-react'
import { getJuegos, createJuego, deleteJuego, updateJuego } from '../../services/juegos.service'
import { getEquipos } from '../../services/equipos.service'
import { getTorneos } from '../../services/torneos.service'
import { ESTADOS_JUEGO } from '../../utils/constants'
import { formatDate, formatTime } from '../../utils/formatters'
import ConfirmModal from '../../components/ConfirmModal'
import { notifyGameCreated, notifyGameRescheduled } from '../../services/notificaciones.service'
import toast from 'react-hot-toast'

export default function AdminCalendarioPage() {
  const [juegos, setJuegos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    equipo_local_id: '',
    equipo_visitante_id: '',
    fecha: '',
    hora: '',
    lugar: '',
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [rescheduleJuego, setRescheduleJuego] = useState(null)
  const [rescheduleData, setRescheduleData] = useState({ fecha: '', hora: '', lugar: '' })

  // Filtros
  const [filterTorneo, setFilterTorneo] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterEquipo, setFilterEquipo] = useState('')
  const [filterJornada, setFilterJornada] = useState('')

  const hasFilters = filterTorneo || filterEstado || filterEquipo || filterJornada

  // Cargar equipos y torneos una sola vez
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [equiposResult, torneosResult] = await Promise.allSettled([
          getEquipos(),
          getTorneos()
        ])
        if (equiposResult.status === 'fulfilled') setEquipos(equiposResult.value)
        if (torneosResult.status === 'fulfilled') setTorneos(torneosResult.value)
      } catch {
        toast.error('Error al cargar datos')
      }
    }
    loadInitial()
  }, [])

  // Cargar juegos cuando cambien los filtros
  useEffect(() => {
    fetchJuegos()
  }, [filterTorneo, filterEstado, filterEquipo, filterJornada])

  const fetchJuegos = async () => {
    setLoading(true)
    try {
      const filters = { ascending: true }
      if (filterTorneo) filters.torneoId = filterTorneo
      if (filterEstado) filters.estado = filterEstado
      if (filterEquipo) filters.equipoId = filterEquipo
      if (filterJornada) filters.jornada = parseInt(filterJornada)

      const data = await getJuegos(filters)
      setJuegos(data)
    } catch {
      toast.error('Error al cargar juegos')
    } finally {
      setLoading(false)
    }
  }

  // Extraer jornadas unicas de los juegos cargados
  const jornadasDisponibles = useMemo(() => {
    const jornadas = [...new Set(juegos.map(j => j.jornada).filter(Boolean))]
    return jornadas.sort((a, b) => a - b)
  }, [juegos])

  const clearFilters = () => {
    setFilterTorneo('')
    setFilterEstado('')
    setFilterEquipo('')
    setFilterJornada('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.equipo_local_id || !formData.equipo_visitante_id || !formData.fecha) {
      toast.error('Equipos y fecha son requeridos')
      return
    }
    if (formData.equipo_local_id === formData.equipo_visitante_id) {
      toast.error('Los equipos deben ser diferentes')
      return
    }

    setSaving(true)
    try {
      const fechaHora = formData.hora
        ? `${formData.fecha}T${formData.hora}:00`
        : `${formData.fecha}T18:00:00`

      const nuevoJuego = await createJuego({
        equipo_local_id: formData.equipo_local_id,
        equipo_visitante_id: formData.equipo_visitante_id,
        fecha: fechaHora,
        lugar: formData.lugar || null,
        estado: 'programado',
      })
      toast.success('Juego programado')
      notifyGameCreated(nuevoJuego.id).catch(err => console.error('Error notificacion:', err))
      setShowModal(false)
      setFormData({ equipo_local_id: '', equipo_visitante_id: '', fecha: '', hora: '', lugar: '' })
      fetchJuegos()
    } catch (error) {
      toast.error(error.message || 'Error al crear juego')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteJuego(confirmDelete.id)
      toast.success('Juego eliminado')
      setConfirmDelete(null)
      fetchJuegos()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const openReschedule = (juego) => {
    const fechaObj = new Date(juego.fecha)
    const fecha = fechaObj.toISOString().split('T')[0]
    const hora = fechaObj.toTimeString().slice(0, 5)
    setRescheduleData({ fecha, hora, lugar: juego.lugar || '' })
    setRescheduleJuego(juego)
  }

  const handleReschedule = async (e) => {
    e.preventDefault()
    if (!rescheduleData.fecha) {
      toast.error('La fecha es requerida')
      return
    }
    setSaving(true)
    try {
      const fechaHora = rescheduleData.hora
        ? `${rescheduleData.fecha}T${rescheduleData.hora}:00`
        : `${rescheduleData.fecha}T18:00:00`

      await updateJuego(rescheduleJuego.id, {
        fecha: fechaHora,
        lugar: rescheduleData.lugar || null,
      })
      toast.success('Juego reprogramado')
      notifyGameRescheduled(rescheduleJuego.id).catch(err => console.error('Error notificacion:', err))
      setRescheduleJuego(null)
      fetchJuegos()
    } catch (error) {
      toast.error(error.message || 'Error al reprogramar')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const config = ESTADOS_JUEGO.find(e => e.value === estado)
    const colors = {
      gray: 'badge-gray',
      yellow: 'badge-warning',
      green: 'badge-success',
      orange: 'badge-warning',
      red: 'badge-danger',
    }
    return <span className={colors[config?.color] || 'badge-gray'}>{config?.label || estado}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500">Programa y gestiona los juegos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} />
          Nuevo Juego
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filtros</span>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 ml-auto">
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={filterTorneo}
            onChange={(e) => { setFilterTorneo(e.target.value); setFilterJornada('') }}
            className="select text-sm"
          >
            <option value="">Todos los torneos</option>
            {torneos.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="select text-sm"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_JUEGO.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>

          <select
            value={filterEquipo}
            onChange={(e) => setFilterEquipo(e.target.value)}
            className="select text-sm"
          >
            <option value="">Todos los equipos</option>
            {equipos.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>

          <select
            value={filterJornada}
            onChange={(e) => setFilterJornada(e.target.value)}
            className="select text-sm"
          >
            <option value="">Todas las jornadas</option>
            {jornadasDisponibles.map(j => (
              <option key={j} value={j}>Jornada {j}</option>
            ))}
          </select>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {loading ? 'Cargando...' : `${juegos.length} juego${juegos.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
      ) : (
        <div className="space-y-3">
          {juegos.length > 0 ? (
            juegos.map((juego) => {
              const esFinalizado = juego.estado === 'finalizado'
              const esProgramado = juego.estado === 'programado'
              const localGana = esFinalizado && juego.puntos_local > juego.puntos_visitante
              const visitanteGana = esFinalizado && juego.puntos_visitante > juego.puntos_local

              return (
                <div key={juego.id} className="card overflow-hidden">
                  {/* Top bar: fecha, estado, lugar, acciones */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        juego.torneo_id
                          ? juego.fase_juego === 'playoff' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {juego.torneo_id
                          ? juego.fase_juego === 'playoff' ? 'Playoff' : juego.fase_juego === 'vuelta' ? 'Vuelta' : 'Ida'
                          : 'Amistoso'}
                      </span>
                      {juego.jornada && (
                        <span className="text-xs text-gray-400">J{juego.jornada}</span>
                      )}
                      {juego.temporada_nombre && (
                        <span className="text-xs text-gray-400">{juego.temporada_nombre}</span>
                      )}
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600 font-medium">{formatDate(juego.fecha, 'EEE dd MMM')}</span>
                      <span className="text-gray-400">|</span>
                      <span className="font-bold text-gray-800">{formatTime(juego.fecha)}</span>
                      {juego.lugar && (
                        <>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-500 flex items-center gap-1">
                            <MapPin size={13} />
                            {juego.lugar}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getEstadoBadge(juego.estado)}
                      <Link to={`/admin/juegos/${juego.id}`} className="btn-secondary btn-sm flex items-center gap-1">
                        {esProgramado ? <><ClipboardEdit size={14} /> Registrar</> : <><Eye size={14} /> Ver</>}
                      </Link>
                      {esProgramado && (
                        <>
                          <button onClick={() => openReschedule(juego)} className="btn-ghost btn-sm text-blue-500 hover:bg-blue-50" title="Reprogramar">
                            <CalendarClock size={15} />
                          </button>
                          <button onClick={() => setConfirmDelete(juego)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Eliminar">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Matchup */}
                  <div className="px-4 py-4">
                    <div className="grid grid-cols-3 items-center gap-2">
                      {/* Local */}
                      <div className="flex items-center gap-3">
                        <TeamLogo logo={juego.local_logo} color={juego.local_color} name={juego.local_corto || juego.local_nombre} />
                        <div>
                          <p className={`font-bold text-sm ${localGana ? 'text-green-600' : ''}`}>{juego.local_nombre}</p>
                          <p className="text-xs text-gray-400">Local</p>
                        </div>
                      </div>

                      {/* Score / VS */}
                      <div className="text-center">
                        {esFinalizado ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-display text-3xl ${localGana ? 'text-green-600' : 'text-gray-800'}`}>{juego.puntos_local}</span>
                            <span className="text-gray-300 text-xl">-</span>
                            <span className={`font-display text-3xl ${visitanteGana ? 'text-green-600' : 'text-gray-800'}`}>{juego.puntos_visitante}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-bold text-lg">VS</span>
                        )}
                      </div>

                      {/* Visitante */}
                      <div className="flex items-center gap-3 justify-end">
                        <div className="text-right">
                          <p className={`font-bold text-sm ${visitanteGana ? 'text-green-600' : ''}`}>{juego.visitante_nombre}</p>
                          <p className="text-xs text-gray-400">Visitante</p>
                        </div>
                        <TeamLogo logo={juego.visitante_logo} color={juego.visitante_color} name={juego.visitante_corto || juego.visitante_nombre} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="card p-8 text-center text-gray-500">
              <Calendar className="mx-auto mb-2 text-gray-300" size={48} />
              <p>{hasFilters ? 'No hay juegos con los filtros seleccionados' : 'No hay juegos programados'}</p>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar juego"
        message="¿Estas seguro de eliminar este juego? Esta accion no se puede deshacer."
        confirmText="Eliminar"
      />

      {/* Modal Reprogramar */}
      {rescheduleJuego && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setRescheduleJuego(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Reprogramar Juego</h2>
                <button onClick={() => setRescheduleJuego(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <span className="font-semibold">{rescheduleJuego.local_nombre}</span>
                {' vs '}
                <span className="font-semibold">{rescheduleJuego.visitante_nombre}</span>
              </div>
              <form onSubmit={handleReschedule} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nueva Fecha *</label>
                    <input type="date" value={rescheduleData.fecha} onChange={(e) => setRescheduleData({ ...rescheduleData, fecha: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Nueva Hora</label>
                    <input type="time" value={rescheduleData.hora} onChange={(e) => setRescheduleData({ ...rescheduleData, hora: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Lugar</label>
                  <input type="text" value={rescheduleData.lugar} onChange={(e) => setRescheduleData({ ...rescheduleData, lugar: e.target.value })} className="input" placeholder="Gimnasio Municipal" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setRescheduleJuego(null)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Reprogramar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Programar Juego</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Equipo Local *</label>
                  <select value={formData.equipo_local_id} onChange={(e) => setFormData({ ...formData, equipo_local_id: e.target.value })} className="select">
                    <option value="">Seleccionar equipo</option>
                    {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Equipo Visitante *</label>
                  <select value={formData.equipo_visitante_id} onChange={(e) => setFormData({ ...formData, equipo_visitante_id: e.target.value })} className="select">
                    <option value="">Seleccionar equipo</option>
                    {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Fecha *</label>
                    <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Hora</label>
                    <input type="time" value={formData.hora} onChange={(e) => setFormData({ ...formData, hora: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Lugar</label>
                  <input type="text" value={formData.lugar} onChange={(e) => setFormData({ ...formData, lugar: e.target.value })} className="input" placeholder="Gimnasio Municipal" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Programar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TeamLogo({ logo, color, name }) {
  if (logo) {
    return <img src={logo} alt={name} className="w-10 h-10 object-contain" />
  }
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
      style={{ backgroundColor: color || '#6B7280' }}
    >
      {(name || '').substring(0, 3).toUpperCase()}
    </div>
  )
}
