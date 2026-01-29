import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { getJugadores, createJugador, updateJugador, deleteJugador } from '../../services/jugadores.service'
import { getEquipos } from '../../services/equipos.service'
import { POSICIONES } from '../../utils/constants'
import { formatFullName } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function AdminJugadoresPage() {
  const [jugadores, setJugadores] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEquipo, setFilterEquipo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingJugador, setEditingJugador] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    numero: '',
    posicion: '',
    equipo_id: '',
    altura: '',
    peso: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [jugadoresData, equiposData] = await Promise.all([
        getJugadores({ activo: undefined }),
        getEquipos()
      ])
      setJugadores(jugadoresData)
      setEquipos(equiposData)
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (jugador = null) => {
    if (jugador) {
      setEditingJugador(jugador)
      setFormData({
        nombre: jugador.nombre,
        apellido: jugador.apellido,
        numero: jugador.numero,
        posicion: jugador.posicion || '',
        equipo_id: jugador.equipo_id || '',
        altura: jugador.altura || '',
        peso: jugador.peso || '',
      })
    } else {
      setEditingJugador(null)
      setFormData({
        nombre: '',
        apellido: '',
        numero: '',
        posicion: '',
        equipo_id: '',
        altura: '',
        peso: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingJugador(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.numero) {
      toast.error('Nombre, apellido y número son requeridos')
      return
    }

    setSaving(true)
    try {
      const data = {
        ...formData,
        numero: parseInt(formData.numero),
        altura: formData.altura ? parseFloat(formData.altura) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        equipo_id: formData.equipo_id || null,
      }

      if (editingJugador) {
        await updateJugador(editingJugador.id, data)
        toast.success('Jugador actualizado')
      } else {
        await createJugador(data)
        toast.success('Jugador creado')
      }
      handleCloseModal()
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (jugador) => {
    if (!confirm(`¿Eliminar a "${formatFullName(jugador.nombre, jugador.apellido)}"?`)) return
    try {
      await deleteJugador(jugador.id)
      toast.success('Jugador eliminado')
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const filteredJugadores = jugadores.filter(j => {
    const matchSearch = `${j.nombre} ${j.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchEquipo = !filterEquipo || j.equipo_id === filterEquipo
    return matchSearch && matchEquipo
  })

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jugadores</h1>
          <p className="text-gray-500">Gestiona los jugadores de la liga</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <Plus size={20} />
          Nuevo Jugador
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Buscar jugadores..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        <select value={filterEquipo} onChange={(e) => setFilterEquipo(e.target.value)} className="select w-full sm:w-48">
          <option value="">Todos los equipos</option>
          {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>Equipo</th>
                <th>Posición</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredJugadores.map((jugador) => (
                <tr key={jugador.id}>
                  <td><span className="font-bold text-lg">{jugador.numero}</span></td>
                  <td><span className="font-medium">{formatFullName(jugador.nombre, jugador.apellido)}</span></td>
                  <td>{jugador.equipo?.nombre || <span className="text-gray-400">Sin equipo</span>}</td>
                  <td>{jugador.posicion ? <span className="badge-primary">{jugador.posicion}</span> : '-'}</td>
                  <td><span className={jugador.activo ? 'badge-success' : 'badge-gray'}>{jugador.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(jugador)} className="btn-ghost btn-sm"><Pencil size={16} /></button>
                      <button onClick={() => handleDelete(jugador)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredJugadores.length === 0 && <div className="p-8 text-center text-gray-500">No se encontraron jugadores</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingJugador ? 'Editar Jugador' : 'Nuevo Jugador'}</h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nombre *</label>
                    <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Apellido *</label>
                    <input type="text" value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Número *</label>
                    <input type="number" min="0" max="99" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Posición</label>
                    <select value={formData.posicion} onChange={(e) => setFormData({ ...formData, posicion: e.target.value })} className="select">
                      <option value="">Seleccionar</option>
                      {POSICIONES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Equipo</label>
                  <select value={formData.equipo_id} onChange={(e) => setFormData({ ...formData, equipo_id: e.target.value })} className="select">
                    <option value="">Sin equipo</option>
                    {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Altura (m)</label>
                    <input type="number" step="0.01" min="1.50" max="2.50" value={formData.altura} onChange={(e) => setFormData({ ...formData, altura: e.target.value })} className="input" placeholder="1.85" />
                  </div>
                  <div>
                    <label className="label">Peso (kg)</label>
                    <input type="number" min="50" max="200" value={formData.peso} onChange={(e) => setFormData({ ...formData, peso: e.target.value })} className="input" placeholder="80" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : editingJugador ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
