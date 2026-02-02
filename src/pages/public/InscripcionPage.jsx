import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Trophy, MapPin, Calendar, FileText, Users, Plus, Trash2, CheckCircle, Award, Clock, Upload, Image, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { getTorneosConInscripcionAbierta, getTorneoParaInscripcion, createInscripcion, uploadInscripcionLogo, uploadInscripcionJugadorFoto } from '../../services/inscripciones.service'
import { POSICIONES } from '../../utils/constants'
import { isValidEmail, isValidPhone, validateInscripcionJugadores } from '../../utils/validators'
import toast from 'react-hot-toast'

const emptyPlayer = () => ({
  nombre: '', apellido: '', numero: '', posicion: 'Base',
  altura: '', peso: '', foto_file: null, foto_preview: null,
})

export default function InscripcionPage() {
  const { torneoId } = useParams()

  if (torneoId) {
    return <InscripcionForm torneoId={torneoId} />
  }
  return <TorneosAbiertos />
}

function TorneosAbiertos() {
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getTorneosConInscripcionAbierta()
        setTorneos(data)
      } catch {
        toast.error('Error al cargar torneos')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inscripciones</h1>
        <p className="text-gray-500">Registra tu equipo en los torneos con inscripcion abierta</p>
      </div>

      {torneos.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {torneos.map(torneo => (
            <div key={torneo.id} className="card overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{torneo.nombre}</h3>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                    Inscripciones abiertas
                  </span>
                </div>

                {torneo.descripcion && (
                  <p className="text-sm text-gray-600 mb-4">{torneo.descripcion}</p>
                )}

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Inicio del torneo: {new Date(torneo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  {torneo.lugar && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{torneo.lugar}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>Inscripciones hasta: <strong>{new Date(torneo.fecha_inscripcion_fin + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                  </div>
                </div>

                {(torneo.premio_1er_lugar || torneo.premio_2do_lugar || torneo.premio_3er_lugar) && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <Award size={12} /> Premiacion
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {torneo.premio_1er_lugar && (
                        <div className="bg-yellow-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-yellow-600">1er</p>
                          <p className="text-xs font-bold text-yellow-800">{torneo.premio_1er_lugar}</p>
                        </div>
                      )}
                      {torneo.premio_2do_lugar && (
                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-gray-500">2do</p>
                          <p className="text-xs font-bold text-gray-700">{torneo.premio_2do_lugar}</p>
                        </div>
                      )}
                      {torneo.premio_3er_lugar && (
                        <div className="bg-orange-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-orange-500">3er</p>
                          <p className="text-xs font-bold text-orange-700">{torneo.premio_3er_lugar}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {torneo.reglamento_url && (
                  <a href={torneo.reglamento_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-4">
                    <FileText size={14} /> Descargar reglamento
                  </a>
                )}

                <Link
                  to={`/inscripcion/${torneo.id}`}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  <Users size={18} />
                  Inscribir equipo
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-bold text-gray-900 mb-1">No hay inscripciones abiertas</h3>
          <p className="text-gray-500 text-sm">Vuelve pronto para ver torneos disponibles</p>
        </div>
      )}
    </div>
  )
}

function InscripcionForm({ torneoId }) {
  const [torneo, setTorneo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(0) // 0: equipo, 1: delegado, 2: jugadores

  const [formData, setFormData] = useState({
    nombre_equipo: '',
    nombre_corto: '',
    color_primario: '#f97316',
    color_secundario: '#ffffff',
    delegado_nombre: '',
    delegado_email: '',
    delegado_telefono: '',
  })

  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const logoInputRef = useRef(null)

  const [jugadores, setJugadores] = useState([
    emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer(),
  ])
  const fotoInputRefs = useRef({})

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getTorneoParaInscripcion(torneoId)
        setTorneo(data)
      } catch {
        toast.error('Torneo no encontrado')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [torneoId])

  const isRegistrationOpen = () => {
    if (!torneo?.fecha_inscripcion_inicio || !torneo?.fecha_inscripcion_fin) return false
    const today = new Date().toISOString().split('T')[0]
    return today >= torneo.fecha_inscripcion_inicio && today <= torneo.fecha_inscripcion_fin
  }

  // --- Logo handlers ---
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imagenes'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe superar 2MB'); return }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  // --- Player handlers ---
  const updatePlayer = (index, field, value) => {
    setJugadores(prev => prev.map((j, i) => i === index ? { ...j, [field]: value } : j))
  }

  const addPlayer = () => {
    if (jugadores.length < 12) {
      setJugadores(prev => [...prev, emptyPlayer()])
    }
  }

  const removePlayer = (index) => {
    if (jugadores.length > 5) {
      setJugadores(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handlePlayerFoto = (index, e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imagenes'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe superar 2MB'); return }

    const reader = new FileReader()
    reader.onload = (ev) => {
      updatePlayer(index, 'foto_file', file)
      updatePlayer(index, 'foto_preview', ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const removePlayerFoto = (index) => {
    updatePlayer(index, 'foto_file', null)
    updatePlayer(index, 'foto_preview', null)
  }

  // --- Step validation ---
  const validateStep = (s) => {
    if (s === 0) {
      if (!formData.nombre_equipo.trim()) { toast.error('El nombre del equipo es requerido'); return false }
      return true
    }
    if (s === 1) {
      if (!formData.delegado_nombre.trim()) { toast.error('El nombre del delegado es requerido'); return false }
      if (!formData.delegado_email.trim() || !isValidEmail(formData.delegado_email)) { toast.error('Un email valido es requerido'); return false }
      if (formData.delegado_telefono && !isValidPhone(formData.delegado_telefono)) { toast.error('Telefono invalido'); return false }
      return true
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault()

    const jugadoresData = jugadores.map(j => ({
      nombre: j.nombre,
      apellido: j.apellido,
      numero: Number(j.numero),
      posicion: j.posicion,
      altura: j.altura ? parseFloat(j.altura) : null,
      peso: j.peso ? parseFloat(j.peso) : null,
    }))

    const { valid, errors } = validateInscripcionJugadores(jugadoresData)
    if (!valid) {
      toast.error(errors[0])
      return
    }

    setSaving(true)
    try {
      // 1. Crear inscripcion
      const inscripcion = await createInscripcion({
        torneo_id: torneoId,
        nombre_equipo: formData.nombre_equipo.trim(),
        nombre_corto: formData.nombre_corto.trim().toUpperCase() || null,
        color_primario: formData.color_primario,
        color_secundario: formData.color_secundario,
        delegado_nombre: formData.delegado_nombre.trim(),
        delegado_email: formData.delegado_email.trim(),
        delegado_telefono: formData.delegado_telefono.trim() || null,
        jugadores: jugadoresData,
        estado: 'pendiente',
      })

      // 2. Subir logo si existe
      let logoUrl = null
      if (logoFile) {
        try {
          logoUrl = await uploadInscripcionLogo(inscripcion.id, logoFile)
          await updateInscripcionLogo(inscripcion.id, logoUrl)
        } catch (err) {
          console.error('Error subiendo logo:', err)
        }
      }

      // 3. Subir fotos de jugadores
      const updatedJugadores = [...jugadoresData]
      for (let i = 0; i < jugadores.length; i++) {
        if (jugadores[i].foto_file) {
          try {
            const fotoUrl = await uploadInscripcionJugadorFoto(inscripcion.id, i, jugadores[i].foto_file)
            updatedJugadores[i] = { ...updatedJugadores[i], foto_url: fotoUrl }
          } catch (err) {
            console.error(`Error subiendo foto jugador ${i}:`, err)
          }
        }
      }

      // 4. Actualizar inscripcion con URLs de fotos
      if (jugadores.some(j => j.foto_file)) {
        await updateInscripcionJugadores(inscripcion.id, updatedJugadores)
      }

      setSubmitted(true)
    } catch (error) {
      toast.error('Error al enviar inscripcion: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
  }

  if (!torneo) {
    return (
      <div className="card p-12 text-center">
        <h3 className="font-bold text-gray-900 mb-2">Torneo no encontrado</h3>
        <Link to="/inscripcion" className="text-primary-600 hover:underline">Volver a inscripciones</Link>
      </div>
    )
  }

  if (!isRegistrationOpen()) {
    return (
      <div className="card p-12 text-center">
        <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="font-bold text-gray-900 mb-2">Las inscripciones para este torneo ya cerraron</h3>
        <p className="text-gray-500 text-sm mb-4">
          {torneo.fecha_inscripcion_fin && `El periodo de inscripcion finalizo el ${new Date(torneo.fecha_inscripcion_fin + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        </p>
        <Link to="/inscripcion" className="text-primary-600 hover:underline">Volver a inscripciones</Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="card p-12 text-center">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Inscripcion enviada</h3>
        <p className="text-gray-500 mb-6">
          Tu equipo <strong>{formData.nombre_equipo}</strong> ha sido registrado. El administrador revisara tu solicitud y recibiras una notificacion en <strong>{formData.delegado_email}</strong>.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/inscripcion" className="btn-secondary">Ver mas torneos</Link>
          <Link to="/" className="btn-primary">Ir al inicio</Link>
        </div>
      </div>
    )
  }

  const STEPS = ['Equipo', 'Delegado', 'Jugadores']

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Torneo info header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">{torneo.nombre}</h1>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
            Inscripciones abiertas
          </span>
        </div>
        {torneo.descripcion && <p className="text-sm text-gray-600 mb-3">{torneo.descripcion}</p>}

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Calendar size={14} />Inicio: {new Date(torneo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</span>
          {torneo.lugar && <span className="flex items-center gap-1"><MapPin size={14} />{torneo.lugar}</span>}
          <span className="flex items-center gap-1"><Clock size={14} />Cierre: {new Date(torneo.fecha_inscripcion_fin + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</span>
        </div>

        {(torneo.premio_1er_lugar || torneo.premio_2do_lugar || torneo.premio_3er_lugar) && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {torneo.premio_1er_lugar && (
              <div className="bg-yellow-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-yellow-600 font-medium">1er lugar</p>
                <p className="text-sm font-bold text-yellow-800">{torneo.premio_1er_lugar}</p>
              </div>
            )}
            {torneo.premio_2do_lugar && (
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 font-medium">2do lugar</p>
                <p className="text-sm font-bold text-gray-700">{torneo.premio_2do_lugar}</p>
              </div>
            )}
            {torneo.premio_3er_lugar && (
              <div className="bg-orange-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-orange-500 font-medium">3er lugar</p>
                <p className="text-sm font-bold text-orange-700">{torneo.premio_3er_lugar}</p>
              </div>
            )}
          </div>
        )}

        {torneo.reglamento_url && (
          <a href={torneo.reglamento_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <FileText size={14} /> Descargar reglamento
          </a>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              i === step ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' :
              i < step ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step ? 'bg-primary-500 text-white' :
                i < step ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'
              }`}>{i < step ? '✓' : i + 1}</span>
              {label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={16} className="text-gray-300 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6">
        {/* Step 0: Equipo */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Datos del equipo</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre del equipo *</label>
                <input type="text" value={formData.nombre_equipo}
                  onChange={(e) => setFormData({ ...formData, nombre_equipo: e.target.value })}
                  className="input" placeholder="Ej: Los Guerreros" />
              </div>
              <div>
                <label className="label">Abreviatura (max 4)</label>
                <input type="text" value={formData.nombre_corto} maxLength={4}
                  onChange={(e) => setFormData({ ...formData, nombre_corto: e.target.value.toUpperCase() })}
                  className="input" placeholder="Ej: GUER" />
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="label">Logo del equipo</label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img src={logoPreview} alt="Logo preview" className="w-16 h-16 rounded-lg object-cover border" />
                    <button type="button" onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                    <Image size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="btn-secondary btn-sm">
                    <Upload size={16} />
                    {logoPreview ? 'Cambiar' : 'Subir logo'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG. Max 2MB</p>
                </div>
              </div>
            </div>

            {/* Colors */}
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

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Vista previa:</p>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: formData.color_primario, color: formData.color_secundario }}>
                    {formData.nombre_corto?.charAt(0) || formData.nombre_equipo?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <p className="font-bold">{formData.nombre_equipo || 'Nombre del equipo'}</p>
                  <p className="text-sm text-gray-500">{formData.nombre_corto || 'ABCD'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Link to="/inscripcion" className="btn-secondary">Cancelar</Link>
              <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-1">
                Siguiente <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Delegado */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Datos del delegado</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nombre completo *</label>
                <input type="text" value={formData.delegado_nombre}
                  onChange={(e) => setFormData({ ...formData, delegado_nombre: e.target.value })}
                  className="input" placeholder="Nombre completo del delegado" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={formData.delegado_email}
                  onChange={(e) => setFormData({ ...formData, delegado_email: e.target.value })}
                  className="input" placeholder="correo@ejemplo.com" />
                {formData.delegado_email && !isValidEmail(formData.delegado_email) && (
                  <p className="text-xs text-red-500 mt-1">Email no valido</p>
                )}
              </div>
              <div>
                <label className="label">Telefono</label>
                <input type="tel" value={formData.delegado_telefono}
                  onChange={(e) => setFormData({ ...formData, delegado_telefono: e.target.value })}
                  className="input" placeholder="(opcional)" />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-1">
                <ChevronLeft size={18} /> Anterior
              </button>
              <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-1">
                Siguiente <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Jugadores */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Jugadores ({jugadores.length})</h2>
              <span className="text-xs text-gray-400">Min 5, Max 12</span>
            </div>

            <div className="space-y-4">
              {jugadores.map((jugador, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-gray-500">Jugador {index + 1}</span>
                    <div className="flex-1" />
                    {jugadores.length > 5 && (
                      <button type="button" onClick={() => removePlayer(index)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {/* Foto */}
                    <div className="shrink-0">
                      {jugador.foto_preview ? (
                        <div className="relative">
                          <img src={jugador.foto_preview} alt="" className="w-14 h-14 rounded-full object-cover border" />
                          <button type="button" onClick={() => removePlayerFoto(index)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <button type="button"
                          onClick={() => fotoInputRefs.current[index]?.click()}
                          className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-400 transition-colors"
                          title="Subir foto"
                        >
                          <Image size={18} />
                        </button>
                      )}
                      <input
                        ref={(el) => fotoInputRefs.current[index] = el}
                        type="file" accept="image/*"
                        onChange={(e) => handlePlayerFoto(index, e)}
                        className="hidden"
                      />
                    </div>

                    {/* Fields */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input type="text" placeholder="Nombre *" value={jugador.nombre}
                        onChange={(e) => updatePlayer(index, 'nombre', e.target.value)}
                        className="input text-sm" />
                      <input type="text" placeholder="Apellido *" value={jugador.apellido}
                        onChange={(e) => updatePlayer(index, 'apellido', e.target.value)}
                        className="input text-sm" />
                      <input type="number" placeholder="#" min={0} max={99} value={jugador.numero}
                        onChange={(e) => updatePlayer(index, 'numero', e.target.value)}
                        className="input text-sm text-center" />
                      <select value={jugador.posicion}
                        onChange={(e) => updatePlayer(index, 'posicion', e.target.value)}
                        className="select text-sm">
                        {POSICIONES.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      <input type="number" step="0.01" min="1.50" max="2.50" placeholder="Altura (m)"
                        value={jugador.altura}
                        onChange={(e) => updatePlayer(index, 'altura', e.target.value)}
                        className="input text-sm" />
                      <input type="number" min="50" max="200" placeholder="Peso (kg)"
                        value={jugador.peso}
                        onChange={(e) => updatePlayer(index, 'peso', e.target.value)}
                        className="input text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {jugadores.length < 12 && (
              <button type="button" onClick={addPlayer}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
                <Plus size={16} /> Agregar jugador
              </button>
            )}

            <div className="flex justify-between pt-4 border-t">
              <button type="button" onClick={prevStep} className="btn-secondary flex items-center gap-1">
                <ChevronLeft size={18} /> Anterior
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Enviando...' : 'Enviar inscripcion'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

// Helper to update logo_url on inscripcion
async function updateInscripcionLogo(inscripcionId, logoUrl) {
  const { supabase } = await import('../../config/supabase')
  await supabase.from('inscripciones').update({ logo_url: logoUrl }).eq('id', inscripcionId)
}

// Helper to update jugadores JSONB with foto URLs
async function updateInscripcionJugadores(inscripcionId, jugadores) {
  const { supabase } = await import('../../config/supabase')
  await supabase.from('inscripciones').update({ jugadores }).eq('id', inscripcionId)
}
