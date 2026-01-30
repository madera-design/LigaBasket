import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trophy, Calendar, Users, X, ChevronRight, ChevronLeft, Clock, MapPin, Check } from 'lucide-react'
import { getEquipos } from '../../services/equipos.service'
import {
  createTemporada,
  createTorneo,
  addTorneoEquipos,
  getTorneos,
  deleteTorneo,
  getTorneoGameStats,
} from '../../services/torneos.service'
import { createJuegosBulk } from '../../services/torneos.service'
import {
  generateDoubleRoundRobin,
  assignDatesAndSlots,
  calculateTournamentStats,
} from '../../utils/tournamentScheduler'
import { DIAS_SEMANA, FASES_TORNEO } from '../../utils/constants'
import ConfirmModal from '../../components/ConfirmModal'
import toast from 'react-hot-toast'

const WIZARD_STEPS = [
  { label: 'Info Basica', icon: Trophy },
  { label: 'Horarios', icon: Clock },
  { label: 'Equipos', icon: Users },
  { label: 'Confirmar', icon: Check },
]

export default function AdminTorneoPage() {
  const [torneos, setTorneos] = useState([])
  const [torneoStats, setTorneoStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    fetchTorneos()
  }, [])

  const fetchTorneos = async () => {
    try {
      const data = await getTorneos()
      setTorneos(data)
      // Fetch stats for each torneo
      const stats = {}
      await Promise.all(
        data.map(async (t) => {
          try {
            stats[t.id] = await getTorneoGameStats(t.id)
          } catch {
            stats[t.id] = { total: 0, finalizados: 0 }
          }
        })
      )
      setTorneoStats(stats)
    } catch (error) {
      toast.error('Error al cargar torneos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTorneo = async () => {
    if (!confirmDelete) return
    try {
      await deleteTorneo(confirmDelete.id)
      toast.success('Torneo eliminado')
      setConfirmDelete(null)
      fetchTorneos()
    } catch (error) {
      toast.error('Error al eliminar torneo')
    }
  }

  const handleWizardComplete = () => {
    setShowWizard(false)
    fetchTorneos()
  }

  const getFaseBadge = (fase) => {
    const config = FASES_TORNEO.find(f => f.value === fase) || FASES_TORNEO[0]
    const colorMap = {
      gray: 'bg-gray-100 text-gray-600',
      blue: 'bg-blue-100 text-blue-700',
      orange: 'bg-orange-100 text-orange-700',
      green: 'bg-green-100 text-green-700',
    }
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorMap[config.color] || colorMap.gray}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torneos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion de torneos y calendarios</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nuevo Torneo
        </button>
      </div>

      {/* Torneo Cards */}
      {torneos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {torneos.map(torneo => {
            const stats = torneoStats[torneo.id] || {}
            const progress = stats.total > 0 ? Math.round((stats.finalizados / stats.total) * 100) : 0
            return (
              <div key={torneo.id} className="card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{torneo.nombre}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {torneo.temporada?.nombre || 'Sin temporada'}
                      </p>
                    </div>
                    {getFaseBadge(torneo.fase)}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(torneo.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {torneo.lugar && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {torneo.lugar}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{stats.finalizados || 0} / {stats.total || 0} juegos</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/torneos/${torneo.id}`}
                      className="flex-1 text-center text-sm font-medium text-primary-600 hover:text-primary-700 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Ver detalle
                    </Link>
                    <button
                      onClick={() => setConfirmDelete(torneo)}
                      className="text-sm text-red-500 hover:text-red-600 py-2 px-3 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-bold text-gray-900 mb-1">No hay torneos</h3>
          <p className="text-gray-500 text-sm">Crea tu primer torneo para generar el calendario automaticamente</p>
          <button onClick={() => setShowWizard(true)} className="btn-primary mt-4">
            <Plus size={18} className="inline mr-1" />
            Crear Torneo
          </button>
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <TorneoWizard
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
        />
      )}

      {/* Confirm delete */}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteTorneo}
        title="Eliminar torneo"
        message={`¿Estas seguro de eliminar "${confirmDelete?.nombre}"? Se eliminaran todos los juegos asociados.`}
      />
    </div>
  )
}

function TorneoWizard({ onClose, onComplete }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [equiposDisponibles, setEquiposDisponibles] = useState([])
  const [loadingEquipos, setLoadingEquipos] = useState(true)

  // Step 1 - Info
  const [nombre, setNombre] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [lugar, setLugar] = useState('')

  // Step 2 - Horarios
  const [diasJuego, setDiasJuego] = useState([])
  const [horarios, setHorarios] = useState(['20:00'])
  const [nuevoHorario, setNuevoHorario] = useState('21:00')

  // Step 3 - Equipos
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([])

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const data = await getEquipos(true)
        setEquiposDisponibles(data)
      } catch {
        toast.error('Error al cargar equipos')
      } finally {
        setLoadingEquipos(false)
      }
    }
    fetchEquipos()
  }, [])

  const canNext = () => {
    if (step === 0) return nombre.trim() && fechaInicio
    if (step === 1) return diasJuego.length > 0 && horarios.length > 0
    if (step === 2) return equiposSeleccionados.length >= 3
    return true
  }

  const toggleDia = (value) => {
    setDiasJuego(prev =>
      prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value].sort((a, b) => a - b)
    )
  }

  const addHorario = () => {
    if (nuevoHorario && !horarios.includes(nuevoHorario)) {
      setHorarios(prev => [...prev, nuevoHorario].sort())
    }
  }

  const removeHorario = (h) => {
    setHorarios(prev => prev.filter(x => x !== h))
  }

  const toggleEquipo = (id) => {
    setEquiposSeleccionados(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const previewStats = step === 3
    ? calculateTournamentStats(equiposSeleccionados.length, diasJuego, horarios, fechaInicio)
    : null

  const handleGenerate = async () => {
    setSaving(true)
    try {
      // 1. Crear temporada
      const temporada = await createTemporada({
        nombre: nombre,
        fecha_inicio: fechaInicio,
        activa: true,
      })

      // 2. Crear torneo
      const torneo = await createTorneo({
        temporada_id: temporada.id,
        nombre,
        fecha_inicio: fechaInicio,
        dias_juego: diasJuego,
        horarios: horarios,
        lugar: lugar || null,
        fase: 'regular',
      })

      // 3. Vincular equipos
      await addTorneoEquipos(torneo.id, equiposSeleccionados)

      // 4. Generar calendario
      const { allRounds } = generateDoubleRoundRobin(equiposSeleccionados)
      const games = assignDatesAndSlots(allRounds, {
        startDate: fechaInicio,
        gameDays: diasJuego,
        timeSlots: horarios,
        lugar: lugar || null,
        temporadaId: temporada.id,
        torneoId: torneo.id,
      })

      // 5. Insertar juegos
      await createJuegosBulk(games)

      toast.success(`Torneo creado con ${games.length} juegos`)
      onComplete()
    } catch (error) {
      console.error(error)
      toast.error('Error al generar torneo: ' + (error.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Nuevo Torneo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((s, i) => {
              const Icon = s.icon
              const isActive = i === step
              const isCompleted = i < step
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isActive ? 'bg-primary-500 text-white' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${
                    isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                  {i < WIZARD_STEPS.length - 1 && (
                    <ChevronRight size={16} className="text-gray-300 mx-1" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <StepInfo
              nombre={nombre} setNombre={setNombre}
              fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
              lugar={lugar} setLugar={setLugar}
            />
          )}
          {step === 1 && (
            <StepHorarios
              diasJuego={diasJuego} toggleDia={toggleDia}
              horarios={horarios} addHorario={addHorario} removeHorario={removeHorario}
              nuevoHorario={nuevoHorario} setNuevoHorario={setNuevoHorario}
            />
          )}
          {step === 2 && (
            <StepEquipos
              equipos={equiposDisponibles}
              loading={loadingEquipos}
              seleccionados={equiposSeleccionados}
              toggle={toggleEquipo}
            />
          )}
          {step === 3 && (
            <StepPreview
              nombre={nombre}
              fechaInicio={fechaInicio}
              lugar={lugar}
              diasJuego={diasJuego}
              horarios={horarios}
              equipos={equiposDisponibles.filter(e => equiposSeleccionados.includes(e.id))}
              stats={previewStats}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            disabled={saving}
          >
            <ChevronLeft size={18} />
            {step > 0 ? 'Anterior' : 'Cancelar'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="btn-primary flex items-center gap-1"
            >
              Siguiente
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="spinner w-4 h-4 border-white border-t-transparent"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Trophy size={18} />
                  Generar Calendario
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepInfo({ nombre, setNombre, fechaInicio, setFechaInicio, lugar, setLugar }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del torneo *</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Torneo Apertura 2025"
          className="input"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio *</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Lugar (opcional)</label>
        <input
          type="text"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
          placeholder="Ej: Gimnasio Municipal"
          className="input"
        />
      </div>
    </div>
  )
}

function StepHorarios({ diasJuego, toggleDia, horarios, addHorario, removeHorario, nuevoHorario, setNuevoHorario }) {
  return (
    <div className="space-y-6">
      {/* Dias de juego */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dias de juego *</label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {DIAS_SEMANA.map(dia => (
            <button
              key={dia.value}
              type="button"
              onClick={() => toggleDia(dia.value)}
              className={`py-2.5 px-2 rounded-lg text-sm font-medium text-center transition-colors ${
                diasJuego.includes(dia.value)
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dia.abbr}
            </button>
          ))}
        </div>
      </div>

      {/* Horarios */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Horarios de juego *</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {horarios.map(h => (
            <span key={h} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-medium">
              <Clock size={14} />
              {h}
              <button onClick={() => removeHorario(h)} className="ml-1 text-primary-400 hover:text-primary-600">
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="time"
            value={nuevoHorario}
            onChange={(e) => setNuevoHorario(e.target.value)}
            className="input flex-1"
          />
          <button
            type="button"
            onClick={addHorario}
            className="btn-primary px-4"
          >
            <Plus size={18} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Cada horario es un slot de juego. Si tienes 2 horarios, se juegan 2 partidos por dia de juego.
        </p>
      </div>
    </div>
  )
}

function StepEquipos({ equipos, loading, seleccionados, toggle }) {
  if (loading) {
    return <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">Selecciona equipos (minimo 3)</label>
        <span className={`text-sm font-bold ${seleccionados.length >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
          {seleccionados.length} seleccionados
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
        {equipos.map(equipo => {
          const selected = seleccionados.includes(equipo.id)
          return (
            <button
              key={equipo.id}
              type="button"
              onClick={() => toggle(equipo.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {equipo.logo_url ? (
                <img src={equipo.logo_url} alt={equipo.nombre} className="w-10 h-10 rounded-full object-contain" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: equipo.color_primario || '#6B7280' }}
                >
                  {(equipo.nombre_corto || equipo.nombre || '').substring(0, 3).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{equipo.nombre}</p>
                <p className="text-xs text-gray-500">{equipo.nombre_corto}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
              }`}>
                {selected && <Check size={12} className="text-white" />}
              </div>
            </button>
          )
        })}
      </div>
      {equipos.length === 0 && (
        <p className="text-center text-gray-400 py-8">No hay equipos activos</p>
      )}
    </div>
  )
}

function StepPreview({ nombre, fechaInicio, lugar, diasJuego, horarios, equipos, stats }) {
  const diasLabels = diasJuego.map(d => DIAS_SEMANA.find(dia => dia.value === d)?.abbr).join(', ')

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-1">{nombre}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span>Inicio: {new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          {lugar && <span>Lugar: {lugar}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats?.totalGames || 0}</p>
          <p className="text-xs text-blue-600 font-medium">Juegos totales</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats?.totalRounds || 0}</p>
          <p className="text-xs text-green-600 font-medium">Jornadas</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-700">{stats?.estimatedWeeks || 0}</p>
          <p className="text-xs text-orange-600 font-medium">Semanas aprox.</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">
            {stats?.estimatedEndDate
              ? new Date(stats.estimatedEndDate + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
              : '-'}
          </p>
          <p className="text-xs text-purple-600 font-medium">Fecha estimada fin</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuracion</h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm text-gray-600">
          <p><span className="font-medium">Dias:</span> {diasLabels}</p>
          <p><span className="font-medium">Horarios:</span> {horarios.join(', ')}</p>
          <p><span className="font-medium">Slots por dia:</span> {horarios.length} juego{horarios.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Equipos ({equipos.length})</h4>
        <div className="flex flex-wrap gap-2">
          {equipos.map(eq => (
            <span
              key={eq.id}
              className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-sm"
            >
              {eq.logo_url ? (
                <img src={eq.logo_url} alt="" className="w-5 h-5 rounded-full object-contain" />
              ) : (
                <span
                  className="w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: eq.color_primario || '#6B7280' }}
                >
                  {(eq.nombre_corto || '').substring(0, 2).toUpperCase()}
                </span>
              )}
              {eq.nombre_corto || eq.nombre}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          Al confirmar se creara la temporada, el torneo y se generaran <strong>{stats?.totalGames || 0} juegos</strong> automaticamente en el calendario.
        </p>
      </div>
    </div>
  )
}
