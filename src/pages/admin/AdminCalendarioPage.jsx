import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, X, Calendar, MapPin } from 'lucide-react'
import { getJuegos, createJuego, deleteJuego } from '../../services/juegos.service'
import { getEquipos } from '../../services/equipos.service'
import { ESTADOS_JUEGO } from '../../utils/constants'
import { formatDate, formatTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function AdminCalendarioPage() {
  const [juegos, setJuegos] = useState([])
  const [equipos, setEquipos] = useState([])
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [juegosData, equiposData] = await Promise.all([
        getJuegos({ ascending: true }),
        getEquipos()
      ])
      setJuegos(juegosData)
      setEquipos(equiposData)
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
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

      await createJuego({
        equipo_local_id: formData.equipo_local_id,
        equipo_visitante_id: formData.equipo_visitante_id,
        fecha: fechaHora,
        lugar: formData.lugar || null,
        estado: 'programado',
      })
      toast.success('Juego programado')
      setShowModal(false)
      setFormData({ equipo_local_id: '', equipo_visitante_id: '', fecha: '', hora: '', lugar: '' })
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Error al crear juego')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (juego) => {
    if (!confirm('¿Eliminar este juego?')) return
    try {
      await deleteJuego(juego.id)
      toast.success('Juego eliminado')
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar')
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

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
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

      <div className="space-y-4">
        {juegos.length > 0 ? (
          juegos.map((juego) => (
            <div key={juego.id} className="card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-center sm:text-left min-w-[100px]">
                  <p className="text-sm text-gray-500">{formatDate(juego.fecha, 'EEE dd MMM')}</p>
                  <p className="font-bold">{formatTime(juego.fecha)}</p>
                  {getEstadoBadge(juego.estado)}
                </div>
                
                <div className="flex-1 grid grid-cols-3 items-center gap-2 text-center">
                  <div>
                    <p className="font-bold">{juego.equipo_local_corto || juego.equipo_local_nombre}</p>
                    <p className="text-xs text-gray-500">Local</p>
                  </div>
                  <div>
                    {juego.estado === 'finalizado' ? (
                      <span className="font-display text-2xl">{juego.puntos_local} - {juego.puntos_visitante}</span>
                    ) : (
                      <span className="text-gray-400">VS</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{juego.equipo_visitante_corto || juego.equipo_visitante_nombre}</p>
                    <p className="text-xs text-gray-500">Visitante</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {juego.lugar && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={14} />
                      {juego.lugar}
                    </span>
                  )}
                  <Link to={`/admin/juegos/${juego.id}`} className="btn-secondary btn-sm">
                    {juego.estado === 'programado' ? 'Registrar' : 'Ver'}
                  </Link>
                  {juego.estado === 'programado' && (
                    <button onClick={() => handleDelete(juego)} className="btn-ghost btn-sm text-red-500">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center text-gray-500">
            <Calendar className="mx-auto mb-2 text-gray-300" size={48} />
            <p>No hay juegos programados</p>
          </div>
        )}
      </div>

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
