import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Trophy, Swords, Play, Check, Clock, MapPin,
  ClipboardList, X, Eye, CheckCircle, XCircle, Pencil, FileText, Award, UserPlus, AlertTriangle, Tag,
} from 'lucide-react'
import {
  getTorneoById,
  getTorneoEquipos,
  updateTorneo,
  getTorneoGameStats,
  createSeriesPlayoff,
  getSeriesPlayoff,
  updateSeriePlayoff,
  addTorneoEquipos,
  materializeInscripciones,
  materializeSingleInscripcion,
  regenerateCalendar,
} from '../../services/torneos.service'
import { createJuegosBulk } from '../../services/torneos.service'
import { getJuegos } from '../../services/juegos.service'
import { getInscripcionesByTorneo, updateInscripcion } from '../../services/inscripciones.service'
import { calcularPosiciones } from '../../services/estadisticas.service'
import {
  calculatePlayoffQualifiers,
  generatePlayoffBracket,
  generatePlayoffGames,
  generateDoubleRoundRobin,
  assignDatesAndSlots,
} from '../../utils/tournamentScheduler'
import { generateMultiCategoryCalendar } from '../../utils/tournamentScheduler'
import { FASES_TORNEO, ESTADOS_INSCRIPCION } from '../../utils/constants'
import { getCategoriasByTorneo } from '../../services/categorias.service'
import ConfirmModal from '../../components/ConfirmModal'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { key: 'calendario', label: 'Calendario', icon: Calendar },
  { key: 'posiciones', label: 'Posiciones', icon: Trophy },
  { key: 'playoffs', label: 'Playoffs', icon: Swords },
]

export default function AdminTorneoDetailPage() {
  const { id } = useParams()
  const [torneo, setTorneo] = useState(null)
  const [equipos, setEquipos] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [selectedCategoriaId, setSelectedCategoriaId] = useState(null)

  useEffect(() => {
    fetchTorneo()
  }, [id])

  const fetchTorneo = async () => {
    try {
      const [torneoData, equiposData, statsData, categoriasData] = await Promise.all([
        getTorneoById(id),
        getTorneoEquipos(id),
        getTorneoGameStats(id),
        getCategoriasByTorneo(id),
      ])
      setTorneo(torneoData)
      setEquipos(equiposData)
      setStats(statsData)
      setCategorias(categoriasData || [])
      if (!activeTab) {
        setActiveTab(torneoData.fase === 'inscripcion' ? 'inscripciones' : 'calendario')
      }
    } catch (error) {
      toast.error('Error al cargar torneo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
  }

  if (!torneo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Torneo no encontrado</p>
        <Link to="/admin/torneos" className="text-primary-600 hover:underline text-sm mt-2 inline-block">Volver</Link>
      </div>
    )
  }

  const faseConfig = FASES_TORNEO.find(f => f.value === torneo.fase) || FASES_TORNEO[0]
  const colorMap = {
    gray: 'bg-gray-100 text-gray-600',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-green-100 text-green-700',
  }
  const progress = stats.total > 0 ? Math.round((stats.finalizados / stats.total) * 100) : 0

  // Filter tabs based on phase
  const visibleTabs = TABS.filter(tab => {
    if (tab.key === 'inscripciones') return torneo.fase === 'inscripcion' || torneo.fecha_inscripcion_inicio
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/torneos" className="mt-1 p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{torneo.nombre}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorMap[faseConfig.color]}`}>
              {faseConfig.label}
            </span>
          </div>

          {torneo.descripcion && (
            <p className="text-sm text-gray-600 mt-1">{torneo.descripcion}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(torneo.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {torneo.lugar && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {torneo.lugar}
              </span>
            )}
            <span>{equipos.length} equipos</span>
            {torneo.reglamento_url && (
              <a href={torneo.reglamento_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                <FileText size={14} /> Reglamento
              </a>
            )}
          </div>

          {/* Premios */}
          {(torneo.premio_1er_lugar || torneo.premio_2do_lugar || torneo.premio_3er_lugar) && (
            <div className="flex gap-3 mt-2">
              {torneo.premio_1er_lugar && (
                <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                  <Award size={12} /> 1ro: {torneo.premio_1er_lugar}
                </span>
              )}
              {torneo.premio_2do_lugar && (
                <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  2do: {torneo.premio_2do_lugar}
                </span>
              )}
              {torneo.premio_3er_lugar && (
                <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded">
                  3ro: {torneo.premio_3er_lugar}
                </span>
              )}
            </div>
          )}

          {/* Progress */}
          {torneo.fase !== 'inscripcion' && stats.total > 0 && (
            <div className="mt-3 max-w-md">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{stats.finalizados || 0} / {stats.total || 0} juegos completados</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Category selector */}
      {categorias.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={14} className="text-gray-400" />
            <button
              onClick={() => setSelectedCategoriaId(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategoriaId === null ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoriaId(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategoriaId === cat.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
          {/* Info de la categoria seleccionada */}
          {selectedCategoriaId && (() => {
            const cat = categorias.find(c => c.id === selectedCategoriaId)
            if (!cat) return null
            const infoParts = []
            if (cat.genero && cat.genero !== 'cualquiera') {
              if (cat.genero === 'varonil') infoParts.push('Solo hombres')
              if (cat.genero === 'femenil') infoParts.push('Solo mujeres')
              if (cat.genero === 'mixto') infoParts.push(`Mixto${cat.min_mujeres ? ` (min. ${cat.min_mujeres} mujeres)` : ''}`)
            }
            if (cat.anio_nacimiento_min && cat.anio_nacimiento_max) {
              infoParts.push(`Nacidos ${cat.anio_nacimiento_min}–${cat.anio_nacimiento_max}`)
            } else if (cat.anio_nacimiento_min) {
              infoParts.push(`Nacidos desde ${cat.anio_nacimiento_min}`)
            } else if (cat.anio_nacimiento_max) {
              infoParts.push(`Nacidos hasta ${cat.anio_nacimiento_max}`)
            }
            if (!infoParts.length && !cat.descripcion) return null
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800 flex flex-wrap items-center gap-x-4 gap-y-1">
                {cat.descripcion && <span>{cat.descripcion}</span>}
                {infoParts.map((part, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{part}</span>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'inscripciones' && (
        <TabInscripciones torneo={torneo} onRefresh={fetchTorneo} categorias={categorias} selectedCategoriaId={selectedCategoriaId} />
      )}
      {activeTab === 'calendario' && <TabCalendario torneoId={id} categorias={categorias} selectedCategoriaId={selectedCategoriaId} />}
      {activeTab === 'posiciones' && <TabPosiciones torneoId={id} categorias={categorias} selectedCategoriaId={selectedCategoriaId} />}
      {activeTab === 'playoffs' && (
        <TabPlayoffs
          torneo={torneo}
          equipos={equipos}
          stats={stats}
          onRefresh={fetchTorneo}
          categorias={categorias}
          selectedCategoriaId={selectedCategoriaId}
        />
      )}
    </div>
  )
}

// ================= TAB INSCRIPCIONES =================

function TabInscripciones({ torneo, onRefresh, categorias, selectedCategoriaId }) {
  const [inscripciones, setInscripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInsc, setSelectedInsc] = useState(null)
  const [editingDates, setEditingDates] = useState(false)
  const [fechaInscInicio, setFechaInscInicio] = useState(torneo.fecha_inscripcion_inicio || '')
  const [fechaInscFin, setFechaInscFin] = useState(torneo.fecha_inscripcion_fin || '')
  const [savingDates, setSavingDates] = useState(false)
  const [showConfirmStart, setShowConfirmStart] = useState(false)
  const [starting, setStarting] = useState(false)
  const [confirmAddInsc, setConfirmAddInsc] = useState(null)
  const [addingToTorneo, setAddingToTorneo] = useState(false)

  useEffect(() => {
    fetchInscripciones()
  }, [torneo.id])

  const fetchInscripciones = async () => {
    try {
      const data = await getInscripcionesByTorneo(torneo.id)
      setInscripciones(data)
    } catch {
      toast.error('Error al cargar inscripciones')
    } finally {
      setLoading(false)
    }
  }

  const pendientes = inscripciones.filter(i => i.estado === 'pendiente').length
  const aprobadas = inscripciones.filter(i => i.estado === 'aprobada').length
  const rechazadas = inscripciones.filter(i => i.estado === 'rechazada').length

  const handleUpdateEstado = async (id, estado) => {
    try {
      await updateInscripcion(id, { estado })
      toast.success(`Inscripcion ${estado}`)
      fetchInscripciones()
      if (selectedInsc?.id === id) {
        setSelectedInsc(prev => ({ ...prev, estado }))
      }
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const handleSaveDates = async () => {
    setSavingDates(true)
    try {
      await updateTorneo(torneo.id, {
        fecha_inscripcion_inicio: fechaInscInicio,
        fecha_inscripcion_fin: fechaInscFin,
      })
      toast.success('Fechas actualizadas')
      setEditingDates(false)
      onRefresh()
    } catch {
      toast.error('Error al guardar fechas')
    } finally {
      setSavingDates(false)
    }
  }

  const handleStartTorneo = async () => {
    setStarting(true)
    try {
      const equipoResults = await materializeInscripciones(torneo.id)

      // equipoResults is now [{id, categoriaId}, ...]
      await addTorneoEquipos(torneo.id, equipoResults)

      const hasCategorias = equipoResults.some(e => e.categoriaId)
      const config = {
        startDate: torneo.fecha_inicio,
        gameDays: torneo.dias_juego,
        timeSlots: torneo.horarios,
        lugar: torneo.lugar,
        temporadaId: torneo.temporada_id,
        torneoId: torneo.id,
      }

      let games
      if (hasCategorias) {
        const teamCategoryPairs = equipoResults.map(e => ({
          equipoId: e.id,
          categoriaId: e.categoriaId,
        }))
        games = generateMultiCategoryCalendar(teamCategoryPairs, config)
      } else {
        const ids = equipoResults.map(e => e.id)
        const { allRounds } = generateDoubleRoundRobin(ids)
        games = assignDatesAndSlots(allRounds, config)
      }

      await createJuegosBulk(games)
      await updateTorneo(torneo.id, { fase: 'regular' })

      toast.success(`Torneo iniciado: ${equipoResults.length} equipos, ${games.length} juegos generados`)
      setShowConfirmStart(false)
      onRefresh()
    } catch (error) {
      toast.error('Error: ' + (error.message || ''))
    } finally {
      setStarting(false)
    }
  }

  const handleAddToTorneo = async (inscripcionId) => {
    setAddingToTorneo(true)
    try {
      await materializeSingleInscripcion(inscripcionId)
      const result = await regenerateCalendar(torneo.id)
      toast.success(
        `Equipo agregado. ${result.preservedGames} juegos preservados, ${result.deletedGames} eliminados, ${result.newGames} nuevos generados`
      )
      setConfirmAddInsc(null)
      fetchInscripciones()
      onRefresh()
    } catch (error) {
      toast.error('Error: ' + (error.message || ''))
    } finally {
      setAddingToTorneo(false)
    }
  }

  if (loading) return <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>

  const getEstadoBadge = (estado) => {
    const config = ESTADOS_INSCRIPCION.find(e => e.value === estado)
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-700',
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[config?.color] || colors.yellow}`}>
        {config?.label || estado}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Fechas de inscripcion */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-700">Periodo de inscripcion</h3>
          {torneo.fase === 'inscripcion' && (
            <button onClick={() => setEditingDates(!editingDates)}
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              <Pencil size={12} /> {editingDates ? 'Cancelar' : 'Editar'}
            </button>
          )}
        </div>
        {editingDates ? (
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Inicio</label>
              <input type="date" value={fechaInscInicio} onChange={(e) => setFechaInscInicio(e.target.value)} className="input text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">Fin</label>
              <input type="date" value={fechaInscFin} onChange={(e) => setFechaInscFin(e.target.value)} className="input text-sm" />
            </div>
            <button onClick={handleSaveDates} disabled={savingDates} className="btn-primary btn-sm">
              {savingDates ? '...' : 'Guardar'}
            </button>
          </div>
        ) : (
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Desde: {torneo.fecha_inscripcion_inicio ? new Date(torneo.fecha_inscripcion_inicio + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No definida'}</span>
            <span>Hasta: {torneo.fecha_inscripcion_fin ? new Date(torneo.fecha_inscripcion_fin + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No definida'}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{inscripciones.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendientes}</p>
          <p className="text-xs text-gray-500">Pendientes</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{aprobadas}</p>
          <p className="text-xs text-gray-500">Aprobadas</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{rechazadas}</p>
          <p className="text-xs text-gray-500">Rechazadas</p>
        </div>
      </div>

      {/* Start tournament button */}
      {torneo.fase === 'inscripcion' && aprobadas >= 3 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-green-800">Listo para iniciar</p>
            <p className="text-sm text-green-600">{aprobadas} equipos aprobados. Se generara el calendario automaticamente.</p>
          </div>
          <button onClick={() => setShowConfirmStart(true)} className="btn-primary flex items-center gap-2">
            <Play size={18} /> Iniciar Torneo
          </button>
        </div>
      )}

      {torneo.fase === 'inscripcion' && aprobadas < 3 && inscripciones.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          Se necesitan al menos 3 equipos aprobados para iniciar el torneo. Actualmente hay {aprobadas} aprobados.
        </div>
      )}

      {/* Banner para agregar equipos mid-torneo */}
      {torneo.fase === 'regular' && inscripciones.some(i => i.estado === 'aprobada' && !i.equipo_id) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-blue-800">
                {inscripciones.filter(i => i.estado === 'aprobada' && !i.equipo_id).length} equipo(s) aprobado(s) pendiente(s) de agregar
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Usa el boton "Agregar al Torneo" en cada inscripcion para crear el equipo y regenerar el calendario. Los juegos ya finalizados no se veran afectados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {inscripciones.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3 text-left">Equipo</th>
                  <th className="px-4 py-3 text-left">Delegado</th>
                  {categorias.length > 0 && <th className="px-4 py-3 text-center">Categoria</th>}
                  <th className="px-4 py-3 text-center">Jugadores</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inscripciones.filter(i => !selectedCategoriaId || i.categoria_id === selectedCategoriaId).map(insc => (
                  <tr key={insc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{insc.nombre_equipo}</p>
                      {insc.nombre_corto && <p className="text-xs text-gray-400">{insc.nombre_corto}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{insc.delegado_nombre}</p>
                      <p className="text-xs text-gray-400">{insc.delegado_email}</p>
                    </td>
                    {categorias.length > 0 && (
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {categorias.find(c => c.id === insc.categoria_id)?.nombre || '-'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">{(insc.jugadores || []).length}</td>
                    <td className="px-4 py-3 text-center">{getEstadoBadge(insc.estado)}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {new Date(insc.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedInsc(insc)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Ver detalle">
                          <Eye size={14} />
                        </button>
                        {insc.estado !== 'aprobada' && (
                          <button onClick={() => handleUpdateEstado(insc.id, 'aprobada')}
                            className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Aprobar">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {insc.estado !== 'rechazada' && (
                          <button onClick={() => handleUpdateEstado(insc.id, 'rechazada')}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Rechazar">
                            <XCircle size={14} />
                          </button>
                        )}
                        {torneo.fase === 'regular' && insc.estado === 'aprobada' && !insc.equipo_id && (
                          <button onClick={() => setConfirmAddInsc(insc)}
                            disabled={addingToTorneo}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Agregar al Torneo">
                            <UserPlus size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-3 text-gray-300" />
          <p>No hay inscripciones aun</p>
          <p className="text-xs mt-1">Los equipos podran inscribirse desde la pagina publica</p>
        </div>
      )}

      {/* Detail modal */}
      {selectedInsc && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedInsc(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900">{selectedInsc.nombre_equipo}</h2>
                <button onClick={() => setSelectedInsc(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  {getEstadoBadge(selectedInsc.estado)}
                  {selectedInsc.nombre_corto && <span className="text-xs text-gray-400">({selectedInsc.nombre_corto})</span>}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Delegado:</span> {selectedInsc.delegado_nombre}</p>
                  <p><span className="font-medium">Email:</span> {selectedInsc.delegado_email}</p>
                  {selectedInsc.delegado_telefono && (
                    <p><span className="font-medium">Telefono:</span> {selectedInsc.delegado_telefono}</p>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-700 mb-2">Jugadores ({(selectedInsc.jugadores || []).length})</h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <th className="px-3 py-2 text-center">#</th>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-left">Apellido</th>
                      <th className="px-3 py-2 text-center">Pos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedInsc.jugadores || []).map((j, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-center font-bold text-gray-500">{j.numero}</td>
                        <td className="px-3 py-2 text-gray-900">{j.nombre}</td>
                        <td className="px-3 py-2 text-gray-700">{j.apellido}</td>
                        <td className="px-3 py-2 text-center text-xs text-gray-500">{j.posicion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t">
                {selectedInsc.estado !== 'aprobada' && (
                  <button
                    onClick={() => { handleUpdateEstado(selectedInsc.id, 'aprobada'); setSelectedInsc(null) }}
                    className="flex-1 btn-primary flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={16} /> Aprobar
                  </button>
                )}
                {selectedInsc.estado !== 'rechazada' && (
                  <button
                    onClick={() => { handleUpdateEstado(selectedInsc.id, 'rechazada'); setSelectedInsc(null) }}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 flex items-center justify-center gap-1"
                  >
                    <XCircle size={16} /> Rechazar
                  </button>
                )}
                <button onClick={() => setSelectedInsc(null)} className="btn-secondary flex-1">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirmStart}
        onClose={() => setShowConfirmStart(false)}
        onConfirm={handleStartTorneo}
        title="Iniciar Torneo"
        message={`Se crearan ${aprobadas} equipos con sus jugadores y se generara el calendario con todos los partidos. ¿Deseas continuar?`}
        confirmText={starting ? 'Iniciando...' : 'Iniciar'}
      />

      <ConfirmModal
        open={!!confirmAddInsc}
        onClose={() => setConfirmAddInsc(null)}
        onConfirm={() => handleAddToTorneo(confirmAddInsc?.id)}
        title="Agregar equipo al torneo"
        message={`Se creara el equipo "${confirmAddInsc?.nombre_equipo}" con sus jugadores y se regenerara el calendario. Los juegos no jugados se eliminaran y se generaran nuevos incluyendo al nuevo equipo. Los juegos finalizados no se veran afectados. ¿Deseas continuar?`}
        confirmText={addingToTorneo ? 'Agregando...' : 'Agregar'}
      />
    </div>
  )
}

// ================= TAB CALENDARIO =================

function TabCalendario({ torneoId, categorias, selectedCategoriaId }) {
  const [juegos, setJuegos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroFase, setFiltroFase] = useState('todos')

  useEffect(() => {
    const fetchJuegos = async () => {
      try {
        const filters = { torneoId, ascending: true }
        if (selectedCategoriaId) filters.categoriaId = selectedCategoriaId
        const data = await getJuegos(filters)
        setJuegos(data)
      } catch (error) {
        toast.error('Error al cargar juegos')
      } finally {
        setLoading(false)
      }
    }
    fetchJuegos()
  }, [torneoId, selectedCategoriaId])

  if (loading) return <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>

  const juegosFiltrados = juegos.filter(j => {
    if (filtroFase === 'todos') return true
    return j.fase_juego === filtroFase
  })

  const jornadas = {}
  juegosFiltrados.forEach(j => {
    const key = j.fase_juego === 'playoff' ? `Playoff` : `Jornada ${j.jornada || '?'}`
    if (!jornadas[key]) jornadas[key] = []
    jornadas[key].push(j)
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          { value: 'todos', label: 'Todos' },
          { value: 'ida', label: 'Ida' },
          { value: 'vuelta', label: 'Vuelta' },
          { value: 'playoff', label: 'Playoffs' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFiltroFase(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtroFase === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500 py-1.5">{juegosFiltrados.length} juegos</span>
      </div>

      {Object.entries(jornadas).map(([jornadaLabel, games]) => (
        <div key={jornadaLabel} className="card overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-700">{jornadaLabel}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {games.map(juego => (
              <GameRow key={juego.id} juego={juego} />
            ))}
          </div>
        </div>
      ))}

      {juegosFiltrados.length === 0 && (
        <div className="card p-8 text-center text-gray-400">No hay juegos para mostrar</div>
      )}
    </div>
  )
}

function GameRow({ juego }) {
  const estadoColors = {
    programado: 'text-gray-500',
    en_curso: 'text-green-600 font-bold',
    finalizado: 'text-gray-800',
    suspendido: 'text-yellow-600',
    cancelado: 'text-red-500 line-through',
  }

  const esFinalizado = juego.estado === 'finalizado'
  const localGana = esFinalizado && juego.puntos_local > juego.puntos_visitante
  const visitanteGana = esFinalizado && juego.puntos_visitante > juego.puntos_local

  return (
    <Link
      to={`/admin/juegos/${juego.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <div className="w-20 text-xs text-gray-500 text-center shrink-0">
        <p>{new Date(juego.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
        <p>{new Date(juego.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div className="flex-1 flex items-center justify-end gap-2">
        <span className={`text-sm font-medium ${localGana ? 'text-green-600' : ''}`}>
          {juego.local_corto || juego.local_nombre}
        </span>
        {juego.local_logo ? (
          <img src={juego.local_logo} alt="" className="w-7 h-7 rounded-full object-contain shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ backgroundColor: juego.local_color || '#6B7280' }}>
            {(juego.local_corto || '').substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="w-20 text-center">
        {esFinalizado || juego.estado === 'en_curso' ? (
          <span className={`font-bold tabular-nums ${estadoColors[juego.estado] || ''}`}>
            {juego.puntos_local} - {juego.puntos_visitante}
          </span>
        ) : (
          <span className="text-xs text-gray-400">vs</span>
        )}
      </div>

      <div className="flex-1 flex items-center gap-2">
        {juego.visitante_logo ? (
          <img src={juego.visitante_logo} alt="" className="w-7 h-7 rounded-full object-contain shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ backgroundColor: juego.visitante_color || '#6B7280' }}>
            {(juego.visitante_corto || '').substring(0, 2).toUpperCase()}
          </div>
        )}
        <span className={`text-sm font-medium ${visitanteGana ? 'text-green-600' : ''}`}>
          {juego.visitante_corto || juego.visitante_nombre}
        </span>
      </div>

      <div className="w-24 text-right">
        {juego.categoria_nombre && (
          <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mr-1">
            {juego.categoria_nombre}
          </span>
        )}
        {juego.estado !== 'finalizado' && (
          <span className={`text-[10px] font-medium ${estadoColors[juego.estado] || ''}`}>
            {juego.estado === 'programado' ? '' :
             juego.estado === 'en_curso' ? 'EN VIVO' :
             juego.estado.toUpperCase()}
          </span>
        )}
      </div>
    </Link>
  )
}

// ================= TAB POSICIONES =================

function TabPosiciones({ torneoId, categorias, selectedCategoriaId }) {
  const [tablaData, setTablaData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosiciones = async () => {
      setLoading(true)
      try {
        if (categorias.length > 0 && !selectedCategoriaId) {
          // Load standings for each category
          const result = {}
          await Promise.all(categorias.map(async (cat) => {
            result[cat.id] = await calcularPosiciones(torneoId, cat.id)
          }))
          setTablaData(result)
        } else {
          const data = await calcularPosiciones(torneoId, selectedCategoriaId)
          setTablaData({ _all: data })
        }
      } catch (error) {
        toast.error('Error al calcular posiciones')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchPosiciones()
  }, [torneoId, selectedCategoriaId, categorias])

  if (loading) return <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>

  const renderTable = (tabla, label) => {
    if (!tabla || tabla.length === 0) return null
    return (
      <div className="card overflow-hidden">
        {label && (
          <div className="px-4 py-2 bg-primary-50 border-b border-primary-100">
            <h4 className="text-sm font-bold text-primary-700">{label}</h4>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">Equipo</th>
                <th className="px-4 py-3 text-center">JJ</th>
                <th className="px-4 py-3 text-center">G</th>
                <th className="px-4 py-3 text-center">P</th>
                <th className="px-4 py-3 text-center">PF</th>
                <th className="px-4 py-3 text-center">PC</th>
                <th className="px-4 py-3 text-center">DIF</th>
                <th className="px-4 py-3 text-center font-bold">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tabla.map((row, i) => (
                <tr key={row.equipo_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.equipo_logo ? (
                        <img src={row.equipo_logo} alt="" className="w-7 h-7 rounded-full object-contain" />
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: row.equipo_color || '#6B7280' }}>
                          {(row.equipo_corto || '').substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{row.equipo_corto || row.equipo_nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.juegos}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{row.ganados}</td>
                  <td className="px-4 py-3 text-center text-red-500">{row.perdidos}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.puntos_favor}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{row.puntos_contra}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={row.diferencia > 0 ? 'text-green-600' : row.diferencia < 0 ? 'text-red-500' : 'text-gray-400'}>
                      {row.diferencia > 0 ? '+' : ''}{row.diferencia}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const allEmpty = Object.values(tablaData).every(t => !t || t.length === 0)
  if (allEmpty) {
    return <div className="card p-8 text-center text-gray-400">No hay juegos finalizados para calcular posiciones</div>
  }

  if (tablaData._all) {
    return renderTable(tablaData._all)
  }

  return (
    <div className="space-y-4">
      {categorias.map(cat => renderTable(tablaData[cat.id], cat.nombre))}
    </div>
  )
}

// ================= TAB PLAYOFFS =================

function TabPlayoffs({ torneo, equipos, stats, onRefresh, categorias, selectedCategoriaId }) {
  const [series, setSeries] = useState([])
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [showConfirmStart, setShowConfirmStart] = useState(false)
  const [generating, setGenerating] = useState(false)

  const canStartPlayoffs = torneo.fase === 'regular' && stats.regulares > 0 && stats.regularesFinalizados === stats.regulares

  useEffect(() => {
    fetchSeries()
  }, [torneo.id])

  const fetchSeries = async () => {
    try {
      const data = await getSeriesPlayoff(torneo.id)
      setSeries(data)
    } catch {
      // No series yet
    } finally {
      setLoadingSeries(false)
    }
  }

  const handleStartPlayoffs = async () => {
    setGenerating(true)
    try {
      const hasCategorias = categorias.length > 0
      const categoriasToProcess = hasCategorias ? categorias : [null]

      let totalSeries = 0
      let totalGamesCreated = 0

      // Get last game date for playoff start
      const juegos = await getJuegos({ torneoId: torneo.id, ascending: false })
      const lastGameDate = juegos.length > 0 ? juegos[0].fecha : torneo.fecha_inicio
      const playoffStart = new Date(lastGameDate)
      playoffStart.setDate(playoffStart.getDate() + 1)
      const startDateStr = playoffStart.toISOString().split('T')[0]

      for (const cat of categoriasToProcess) {
        const catId = cat?.id || null
        const standings = await calcularPosiciones(torneo.id, catId)
        if (standings.length < 2) continue

        const catEquipos = catId
          ? equipos.filter(e => e.categoria_id === catId)
          : equipos
        const totalTeams = catEquipos.length || standings.length
        const { qualified } = calculatePlayoffQualifiers(standings, totalTeams)

        if (qualified.length < 2) continue

        const bracket = generatePlayoffBracket(qualified)

        const seriesRows = bracket.map(s => ({
          torneo_id: torneo.id,
          ronda: 1,
          numero_serie: s.serieNumber,
          equipo_superior_id: s.superior.equipo_id,
          equipo_inferior_id: s.inferior.equipo_id,
          estado: 'pendiente',
          categoria_id: catId,
        }))
        const createdSeries = await createSeriesPlayoff(seriesRows)

        const bracketForGames = bracket.map(s => ({
          ...s,
          superior: { equipo_id: s.superior.equipo_id },
          inferior: { equipo_id: s.inferior.equipo_id },
          categoriaId: catId,
        }))

        const { games } = generatePlayoffGames(bracketForGames, {
          startDate: startDateStr,
          gameDays: torneo.dias_juego,
          timeSlots: torneo.horarios,
          lugar: torneo.lugar,
          temporadaId: torneo.temporada_id,
          torneoId: torneo.id,
        })

        const gamesWithSerie = games.map(g => {
          const serie = createdSeries.find(s => s.numero_serie === g._serieNumber)
          const { _serieNumber, ...rest } = g
          return { ...rest, serie_id: serie?.id || null }
        })

        await createJuegosBulk(gamesWithSerie)
        totalSeries += bracket.length
        totalGamesCreated += gamesWithSerie.length
      }

      if (totalSeries === 0) {
        toast.error('No hay suficientes equipos clasificados para playoffs')
        return
      }

      await updateTorneo(torneo.id, { fase: 'playoffs' })

      toast.success(`Playoffs generados: ${totalSeries} series, ${totalGamesCreated} juegos`)
      setShowConfirmStart(false)
      onRefresh()
      fetchSeries()
    } catch (error) {
      console.error(error)
      toast.error('Error al generar playoffs: ' + (error.message || ''))
    } finally {
      setGenerating(false)
    }
  }

  if (loadingSeries) return <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>

  if (series.length === 0 && torneo.fase !== 'playoffs') {
    return (
      <div className="card p-8 text-center">
        <Swords size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="font-bold text-gray-900 mb-1">Playoffs</h3>
        <p className="text-gray-500 text-sm mb-4">
          {canStartPlayoffs
            ? 'Todos los juegos de temporada regular han finalizado. Puedes iniciar los playoffs.'
            : `Se necesita completar todos los juegos regulares (${stats.regularesFinalizados || 0}/${stats.regulares || 0}) para iniciar playoffs.`
          }
        </p>
        {canStartPlayoffs && (
          <button onClick={() => setShowConfirmStart(true)} disabled={generating} className="btn-primary inline-flex items-center gap-2">
            <Play size={18} /> {generating ? 'Generando...' : 'Iniciar Playoffs'}
          </button>
        )}

        <ConfirmModal
          open={showConfirmStart}
          onClose={() => setShowConfirmStart(false)}
          onConfirm={handleStartPlayoffs}
          title="Iniciar Playoffs"
          message="Se generaran las series de playoffs y los juegos correspondientes basados en la tabla de posiciones actual. ¿Deseas continuar?"
        />
      </div>
    )
  }

  const filteredSeries = selectedCategoriaId
    ? series.filter(s => s.categoria_id === selectedCategoriaId)
    : series

  const rondas = {}
  filteredSeries.forEach(s => {
    const catLabel = categorias.length > 0 && s.categoria_id
      ? ` - ${categorias.find(c => c.id === s.categoria_id)?.nombre || ''}`
      : ''
    const key = `Ronda ${s.ronda}${catLabel}`
    if (!rondas[key]) rondas[key] = []
    rondas[key].push(s)
  })

  return (
    <div className="space-y-4">
      {Object.entries(rondas).map(([rondaLabel, seriesList]) => (
        <div key={rondaLabel}>
          <h3 className="text-sm font-bold text-gray-700 mb-3">{rondaLabel}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {seriesList.map(serie => (
              <SerieCard key={serie.id} serie={serie} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SerieCard({ serie }) {
  const estadoBadge = {
    pendiente: 'bg-gray-100 text-gray-500',
    en_curso: 'bg-green-100 text-green-700',
    finalizada: 'bg-gray-800 text-white',
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">Serie {serie.numero_serie}</span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${estadoBadge[serie.estado] || estadoBadge.pendiente}`}>
          {serie.estado === 'pendiente' ? 'Pendiente' : serie.estado === 'en_curso' ? 'En Curso' : 'Finalizada'}
        </span>
      </div>
      <div className="p-4 space-y-2">
        <div className={`flex items-center justify-between ${serie.ganador_id === serie.equipo_superior_id ? 'font-bold' : ''}`}>
          <div className="flex items-center gap-2">
            {serie.equipo_superior?.logo_url ? (
              <img src={serie.equipo_superior.logo_url} alt="" className="w-8 h-8 rounded-full object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: serie.equipo_superior?.color_primario || '#6B7280' }}>
                {(serie.equipo_superior?.nombre_corto || '').substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-900">{serie.equipo_superior?.nombre_corto || serie.equipo_superior?.nombre || 'TBD'}</span>
          </div>
          <span className="text-lg font-bold tabular-nums text-gray-900">{serie.victorias_superior}</span>
        </div>

        <div className={`flex items-center justify-between ${serie.ganador_id === serie.equipo_inferior_id ? 'font-bold' : ''}`}>
          <div className="flex items-center gap-2">
            {serie.equipo_inferior?.logo_url ? (
              <img src={serie.equipo_inferior.logo_url} alt="" className="w-8 h-8 rounded-full object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: serie.equipo_inferior?.color_primario || '#6B7280' }}>
                {(serie.equipo_inferior?.nombre_corto || '').substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-900">{serie.equipo_inferior?.nombre_corto || serie.equipo_inferior?.nombre || 'TBD'}</span>
          </div>
          <span className="text-lg font-bold tabular-nums text-gray-900">{serie.victorias_inferior}</span>
        </div>

        {serie.ganador && (
          <div className="pt-2 border-t border-gray-100 text-center">
            <span className="text-xs text-green-600 font-medium">
              Ganador: {serie.ganador.nombre_corto || serie.ganador.nombre}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
