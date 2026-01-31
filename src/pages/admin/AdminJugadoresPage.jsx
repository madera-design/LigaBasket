import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, X, Upload, Image, Power } from 'lucide-react'
import { getJugadores, createJugador, updateJugador, deleteJugador, uploadJugadorFoto } from '../../services/jugadores.service'
import { getEquipos } from '../../services/equipos.service'
import { POSICIONES } from '../../utils/constants'
import { formatFullName } from '../../utils/formatters'
import ConfirmModal from '../../components/ConfirmModal'
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
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const fileInputRef = useRef(null)

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
        altura: jugador.altura_cm ? (jugador.altura_cm / 100).toFixed(2) : '',
        peso: jugador.peso_kg || '',
      })
      setFotoPreview(jugador.foto_url || null)
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
      setFotoPreview(null)
    }
    setFotoFile(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingJugador(null)
    setFotoFile(null)
    setFotoPreview(null)
  }

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imagenes')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar 2MB')
      return
    }
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setFotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveFoto = () => {
    setFotoFile(null)
    setFotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.numero) {
      toast.error('Nombre, apellido y número son requeridos')
      return
    }

    // Validar nombre y apellido duplicado en el mismo equipo
    if (formData.equipo_id) {
      const duplicado = jugadores.find(
        j => j.equipo_id === formData.equipo_id
          && j.nombre.toLowerCase() === formData.nombre.trim().toLowerCase()
          && j.apellido.toLowerCase() === formData.apellido.trim().toLowerCase()
          && (!editingJugador || j.id !== editingJugador.id)
      )
      if (duplicado) {
        toast.error(`Ya existe un jugador llamado "${formData.nombre.trim()} ${formData.apellido.trim()}" en este equipo`)
        return
      }
    }

    // Validar maximo 12 jugadores activos por equipo al crear
    if (!editingJugador && formData.equipo_id) {
      const activosDelEquipo = jugadores.filter(
        j => j.equipo_id === formData.equipo_id && j.activo
      )
      if (activosDelEquipo.length >= 12) {
        toast.error('El equipo ya tiene 12 jugadores activos (maximo permitido)')
        return
      }
    }

    // Validar al editar si se cambia de equipo
    if (editingJugador && formData.equipo_id && formData.equipo_id !== editingJugador.equipo_id) {
      const activosDelEquipo = jugadores.filter(
        j => j.equipo_id === formData.equipo_id && j.activo && j.id !== editingJugador.id
      )
      if (activosDelEquipo.length >= 12) {
        toast.error('El equipo destino ya tiene 12 jugadores activos (maximo permitido)')
        return
      }
    }

    setSaving(true)
    try {
      const { altura, peso, ...rest } = formData
      const data = {
        ...rest,
        numero: parseInt(formData.numero),
        altura_cm: altura ? Math.round(parseFloat(altura) * 100) : null,
        peso_kg: peso ? parseFloat(peso) : null,
        equipo_id: formData.equipo_id || null,
      }

      let jugadorId

      if (editingJugador) {
        await updateJugador(editingJugador.id, data)
        jugadorId = editingJugador.id

        if (!fotoPreview && editingJugador.foto_url) {
          await updateJugador(jugadorId, { foto_url: null })
        }
      } else {
        const nuevoJugador = await createJugador(data)
        jugadorId = nuevoJugador.id
      }

      if (fotoFile && jugadorId) {
        await uploadJugadorFoto(jugadorId, fotoFile)
      }

      toast.success(editingJugador ? 'Jugador actualizado' : 'Jugador creado')
      handleCloseModal()
      fetchData()
    } catch (error) {
      if (error.code === '23505') {
        toast.error('El numero de jugador ya esta en uso en este equipo')
      } else {
        toast.error(error.message || 'Error al guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteJugador(confirmDelete.id)
      toast.success('Jugador eliminado')
      setConfirmDelete(null)
      fetchData()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleToggleStatus = async (jugador) => {
    // Si se va a activar, validar maximo 12 activos por equipo
    if (!jugador.activo && jugador.equipo_id) {
      const activosDelEquipo = jugadores.filter(
        j => j.equipo_id === jugador.equipo_id && j.activo && j.id !== jugador.id
      )
      if (activosDelEquipo.length >= 12) {
        toast.error('El equipo ya tiene 12 jugadores activos (maximo permitido)')
        return
      }
    }

    try {
      await updateJugador(jugador.id, { activo: !jugador.activo })
      toast.success(jugador.activo ? 'Jugador dado de baja' : 'Jugador activado')
      fetchData()
    } catch (error) {
      toast.error('Error al cambiar estatus')
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
        <div className="table-container max-h-[70vh] overflow-y-auto">
          <table className="table">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="w-18">#</th>
                <th>Jugador</th>
                <th>Equipo</th>
                <th className="w-18">Posición</th>
                <th className="w-18">Estado</th>
                <th className="w-28 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredJugadores.map((jugador) => (
                <tr key={jugador.id}>
                  <td><span className="font-bold text-lg">{jugador.numero}</span></td>
                  <td>
                    <div className="flex items-center gap-3">
                      {jugador.foto_url ? (
                        <img src={jugador.foto_url} alt={jugador.nombre} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                          {jugador.nombre?.charAt(0)}{jugador.apellido?.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium">{formatFullName(jugador.nombre, jugador.apellido)}</span>
                    </div>
                  </td>
                  <td>{jugador.equipo?.nombre || <span className="text-gray-400">Sin equipo</span>}</td>
                  <td>{jugador.posicion ? <span className="badge-primary">{jugador.posicion}</span> : '-'}</td>
                  <td><span className={jugador.activo ? 'badge-success' : 'badge-gray'}>{jugador.activo ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleToggleStatus(jugador)} className={`btn-ghost btn-sm ${jugador.activo ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`} title={jugador.activo ? 'Dar de baja' : 'Activar'}>
                        <Power size={16} />
                      </button>
                      <button onClick={() => handleOpenModal(jugador)} className="btn-ghost btn-sm"><Pencil size={16} /></button>
                      <button onClick={() => setConfirmDelete(jugador)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredJugadores.length === 0 && <div className="p-8 text-center text-gray-500">No se encontraron jugadores</div>}
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar jugador"
        message={`¿Estas seguro de eliminar a "${confirmDelete ? formatFullName(confirmDelete.nombre, confirmDelete.apellido) : ''}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
      />

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
                {/* Foto */}
                <div>
                  <label className="label">Foto del jugador</label>
                  <div className="flex items-center gap-4">
                    {fotoPreview ? (
                      <div className="relative">
                        <img src={fotoPreview} alt="Foto preview" className="w-16 h-16 rounded-full object-cover border" />
                        <button
                          type="button"
                          onClick={handleRemoveFoto}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <Image size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary btn-sm"
                      >
                        <Upload size={16} />
                        {fotoPreview ? 'Cambiar' : 'Subir foto'}
                      </button>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG. Max 2MB</p>
                    </div>
                  </div>
                </div>

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
