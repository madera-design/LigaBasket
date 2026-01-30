import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, X, Upload, Image, Power, Users } from 'lucide-react'
import { getEquipos, createEquipo, updateEquipo, deleteEquipo, uploadEquipoLogo } from '../../services/equipos.service'
import { getJugadoresByEquipo } from '../../services/jugadores.service'
import { formatFullName } from '../../utils/formatters'
import ConfirmModal from '../../components/ConfirmModal'
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
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [rosterEquipo, setRosterEquipo] = useState(null)
  const [rosterJugadores, setRosterJugadores] = useState([])
  const [loadingRoster, setLoadingRoster] = useState(false)
  const fileInputRef = useRef(null)

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
      setLogoPreview(equipo.logo_url || null)
    } else {
      setEditingEquipo(null)
      setFormData({
        nombre: '',
        nombre_corto: '',
        color_primario: '#f97316',
        color_secundario: '#ffffff',
        entrenador: '',
      })
      setLogoPreview(null)
    }
    setLogoFile(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEquipo(null)
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleLogoChange = (e) => {
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

    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      let equipoId

      if (editingEquipo) {
        await updateEquipo(editingEquipo.id, formData)
        equipoId = editingEquipo.id

        // Si se quito el logo
        if (!logoPreview && editingEquipo.logo_url) {
          await updateEquipo(equipoId, { logo_url: null })
        }
      } else {
        const nuevoEquipo = await createEquipo(formData)
        equipoId = nuevoEquipo.id
      }

      // Subir logo si se selecciono uno
      if (logoFile && equipoId) {
        await uploadEquipoLogo(equipoId, logoFile)
      }

      toast.success(editingEquipo ? 'Equipo actualizado' : 'Equipo creado')
      handleCloseModal()
      fetchEquipos()
    } catch (error) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteEquipo(confirmDelete.id)
      toast.success('Equipo eliminado')
      setConfirmDelete(null)
      fetchEquipos()
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const handleViewRoster = async (equipo) => {
    setRosterEquipo(equipo)
    setLoadingRoster(true)
    try {
      const jugadores = await getJugadoresByEquipo(equipo.id)
      setRosterJugadores(jugadores)
    } catch (error) {
      toast.error('Error al cargar jugadores')
    } finally {
      setLoadingRoster(false)
    }
  }

  const handleCloseRoster = () => {
    setRosterEquipo(null)
    setRosterJugadores([])
  }

  const handleToggleStatus = async (equipo) => {
    try {
      await updateEquipo(equipo.id, { activo: !equipo.activo })
      toast.success(equipo.activo ? 'Equipo dado de baja' : 'Equipo activado')
      fetchEquipos()
    } catch (error) {
      toast.error('Error al cambiar estatus')
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
                <th className="w-15">Delegado</th>
                <th className="w-18">Estado</th>
                <th className="w-40 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipos.map((equipo) => (
                <tr key={equipo.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {equipo.logo_url ? (
                        <img src={equipo.logo_url} alt={equipo.nombre} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: equipo.color_primario }}
                        >
                          {equipo.nombre_corto?.charAt(0) || equipo.nombre.charAt(0)}
                        </div>
                      )}
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
                      <button onClick={() => handleViewRoster(equipo)} className="btn-ghost btn-sm text-blue-600 hover:bg-blue-50" title="Ver jugadores">
                        <Users size={16} />
                      </button>
                      <button onClick={() => handleToggleStatus(equipo)} className={`btn-ghost btn-sm ${equipo.activo ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`} title={equipo.activo ? 'Dar de baja' : 'Activar'}>
                        <Power size={16} />
                      </button>
                      <button onClick={() => handleOpenModal(equipo)} className="btn-ghost btn-sm">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setConfirmDelete(equipo)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50">
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

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar equipo"
        message={`¿Estas seguro de eliminar el equipo "${confirmDelete?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
      />

      {/* Modal Ver Jugadores */}
      {rosterEquipo && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseRoster} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  {rosterEquipo.logo_url ? (
                    <img src={rosterEquipo.logo_url} alt={rosterEquipo.nombre} className="w-10 h-10 object-contain" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: rosterEquipo.color_primario || '#6B7280' }}
                    >
                      {rosterEquipo.nombre_corto?.charAt(0) || rosterEquipo.nombre.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold">{rosterEquipo.nombre}</h2>
                    <p className="text-sm text-gray-500">Jugadores del equipo</p>
                  </div>
                </div>
                <button onClick={handleCloseRoster} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              {loadingRoster ? (
                <div className="flex justify-center py-8">
                  <div className="spinner w-6 h-6"></div>
                </div>
              ) : rosterJugadores.length > 0 ? (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {rosterJugadores.map(j => (
                    <div key={j.id} className="flex items-center gap-3 py-3">
                      <span className="w-8 text-center font-bold text-gray-500">{j.numero}</span>
                      {j.foto_url ? (
                        <img src={j.foto_url} alt={j.nombre} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                          {j.nombre?.charAt(0)}{j.apellido?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{formatFullName(j.nombre, j.apellido)}</p>
                        {j.posicion && <p className="text-xs text-gray-400">{j.posicion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <Users className="mx-auto mb-2" size={32} />
                  <p>No hay jugadores activos</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <button onClick={handleCloseRoster} className="btn-secondary w-full">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <label className="label">Delegado</label>
                  <input type="text" value={formData.entrenador} onChange={(e) => setFormData({ ...formData, entrenador: e.target.value })} className="input" placeholder="Nombre del Delegado" />
                </div>

                {/* Logo */}
                <div>
                  <label className="label">Logo del equipo</label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative">
                        <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-lg object-cover border" />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        <Image size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary btn-sm"
                      >
                        <Upload size={16} />
                        {logoPreview ? 'Cambiar' : 'Subir logo'}
                      </button>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG. Max 2MB</p>
                    </div>
                  </div>
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

                {/* Vista previa */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-2">Vista previa:</p>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: formData.color_primario, color: formData.color_secundario }}>
                        {formData.nombre_corto?.charAt(0) || formData.nombre?.charAt(0) || '?'}
                      </div>
                    )}
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
