import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { getEquipos, createEquipo, updateEquipo, deleteEquipo } from '../../services/equipos.service'
import toast from 'react-hot-toast'

export default function AdminEquiposPage() {
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEquipo, setEditingEquipo] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    nombre_corto: '',
    color_primario: '#f97316',
    color_secundario: '#ffffff',
    entrenador: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEquipos()
  }, [])

  const fetchEquipos = async () => {
    try {
      const data = await getEquipos(false)
      setEquipos(data)
    } catch (error) {
      toast.error('Error al cargar equipos')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (equipo = null) => {
    if (equipo) {
      setEditingEquipo(equipo)
      setFormData({
        nombre: equipo.nombre,
        nombre_corto: equipo.nombre_corto || '',
        color_primario: equipo.color_primario || '#f97316',
        color_secundario: equipo.color_secundario || '#ffffff',
        entrenador: equipo.entrenador || '',
      })
    } else {
      setEditingEquipo(null)
      setFormData({
        nombre: '',
        nombre_corto: '',
        color_primario: '#f97316',
        color_secundario: '#ffffff',
        entrenador: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEquipo(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      if (editingEquipo) {
        await updateEquipo(editingEquipo.id, formData)
        toast.success('Equipo actualizado')
      } else {
        await createEquipo(formData)
        toast.success('Equipo creado')
      }
      handleCloseModal()
      fetchEquipos()
    } catch (error) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (equipo) => {
    if (!confirm(`¿Eliminar el equipo "${equipo.nombre}"?`)) return

    try {
      await deleteEquipo(equipo.id)
      toast.success('Equipo eliminado')
      fetchEquipos()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const filteredEquipos = equipos.filter(e =>
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
          <p className="text-gray-500">Gestiona los equipos de la liga</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <Plus size={20} />
          Nuevo Equipo
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar equipos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Abreviatura</th>
                <th>Entrenador</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipos.map((equipo) => (
                <tr key={equipo.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: equipo.color_primario }}
                      >
                        {equipo.nombre_corto?.charAt(0) || equipo.nombre.charAt(0)}
                      </div>
                      <span className="font-medium">{equipo.nombre}</span>
                    </div>
                  </td>
                  <td>{equipo.nombre_corto || '-'}</td>
                  <td>{equipo.entrenador || '-'}</td>
                  <td>
                    <span className={equipo.activo ? 'badge-success' : 'badge-gray'}>
                      {equipo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(equipo)} className="btn-ghost btn-sm">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(equipo)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEquipos.length === 0 && (
          <div className="p-8 text-center text-gray-500">No se encontraron equipos</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingEquipo ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nombre *</label>
                  <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="input" placeholder="Ej: Tigres" />
                </div>
                <div>
                  <label className="label">Abreviatura</label>
                  <input type="text" value={formData.nombre_corto} onChange={(e) => setFormData({ ...formData, nombre_corto: e.target.value.toUpperCase().slice(0, 4) })} className="input" placeholder="Ej: TIG" maxLength={4} />
                </div>
                <div>
                  <label className="label">Entrenador</label>
                  <input type="text" value={formData.entrenador} onChange={(e) => setFormData({ ...formData, entrenador: e.target.value })} className="input" placeholder="Nombre del entrenador" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Color Primario</label>
                    <div className="flex gap-2">
                      <input type="color" value={formData.color_primario} onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })} className="w-12 h-10 rounded cursor-pointer" />
                      <input type="text" value={formData.color_primario} onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })} className="input flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Color Secundario</label>
                    <div className="flex gap-2">
                      <input type="color" value={formData.color_secundario} onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })} className="w-12 h-10 rounded cursor-pointer" />
                      <input type="text" value={formData.color_secundario} onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })} className="input flex-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Vista previa:</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: formData.color_primario, color: formData.color_secundario }}>
                      {formData.nombre_corto?.charAt(0) || formData.nombre?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold">{formData.nombre || 'Nombre del equipo'}</p>
                      <p className="text-sm text-gray-500">{formData.nombre_corto || 'ABC'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : editingEquipo ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
