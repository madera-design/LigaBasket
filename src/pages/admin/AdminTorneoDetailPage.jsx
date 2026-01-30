import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Trophy, Swords, Play, Check, Clock, MapPin,
} from 'lucide-react'
import {
  getTorneoById,
  getTorneoEquipos,
  updateTorneo,
  getTorneoGameStats,
  createSeriesPlayoff,
  getSeriesPlayoff,
  updateSeriePlayoff,
} from '../../services/torneos.service'
import { createJuegosBulk } from '../../services/torneos.service'
import { getJuegos } from '../../services/juegos.service'
import { calcularPosiciones } from '../../services/estadisticas.service'
import {
  calculatePlayoffQualifiers,
  generatePlayoffBracket,
  generatePlayoffGames,
} from '../../utils/tournamentScheduler'
import { FASES_TORNEO } from '../../utils/constants'
import ConfirmModal from '../../components/ConfirmModal'
import toast from 'react-hot-toast'

const TABS = [
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
  const [activeTab, setActiveTab] = useState('calendario')

  useEffect(() => {
    fetchTorneo()
  }, [id])

  const fetchTorneo = async () => {
    try {
      const [torneoData, equiposData, statsData] = await Promise.all([
        getTorneoById(id),
        getTorneoEquipos(id),
        getTorneoGameStats(id),
      ])
      setTorneo(torneoData)
      setEquipos(equiposData)
      setStats(statsData)
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
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-green-100 text-green-700',
  }
  const progress = stats.total > 0 ? Math.round((stats.finalizados / stats.total) * 100) : 0

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
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
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
          </div>
          {/* Progress */}
          <div className="mt-3 max-w-md">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{stats.finalizados || 0} / {stats.total || 0} juegos completados</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {TABS.map(tab => {
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

      {/* Tab Content */}
      {activeTab === 'calendario' && <TabCalendario torneoId={id} />}
      {activeTab === 'posiciones' && <TabPosiciones torneoId={id} />}
      {activeTab === 'playoffs' && (
        <TabPlayoffs
          torneo={torneo}
          equipos={equipos}
          stats={stats}
          onRefresh={fetchTorneo}
        />
      )}
    </div>
  )
}

function TabCalendario({ torneoId }) {
  const [juegos, setJuegos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroFase, setFiltroFase] = useState('todos')

  useEffect(() => {
    const fetchJuegos = async () => {
      try {
        const data = await getJuegos({ torneoId, ascending: true })
        setJuegos(data)
      } catch (error) {
        toast.error('Error al cargar juegos')
      } finally {
        setLoading(false)
      }
    }
    fetchJuegos()
  }, [torneoId])

  if (loading) return <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>

  const juegosFiltrados = juegos.filter(j => {
    if (filtroFase === 'todos') return true
    return j.fase_juego === filtroFase
  })

  // Group by jornada
  const jornadas = {}
  juegosFiltrados.forEach(j => {
    const key = j.fase_juego === 'playoff' ? `Playoff` : `Jornada ${j.jornada || '?'}`
    if (!jornadas[key]) jornadas[key] = []
    jornadas[key].push(j)
  })

  return (
    <div className="space-y-4">
      {/* Filtros */}
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

      {/* Jornadas */}
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
      {/* Fecha */}
      <div className="w-20 text-xs text-gray-500 text-center shrink-0">
        <p>{new Date(juego.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
        <p>{new Date(juego.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      {/* Local */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <span className={`text-sm font-medium ${localGana ? 'text-green-600' : ''}`}>
          {juego.local_corto || juego.local_nombre}
        </span>
        {juego.local_logo ? (
          <img src={juego.local_logo} alt="" className="w-7 h-7 rounded-full object-contain shrink-0" />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ backgroundColor: juego.local_color || '#6B7280' }}
          >
            {(juego.local_corto || '').substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="w-20 text-center">
        {esFinalizado || juego.estado === 'en_curso' ? (
          <span className={`font-bold tabular-nums ${estadoColors[juego.estado] || ''}`}>
            {juego.puntos_local} - {juego.puntos_visitante}
          </span>
        ) : (
          <span className="text-xs text-gray-400">vs</span>
        )}
      </div>

      {/* Visitante */}
      <div className="flex-1 flex items-center gap-2">
        {juego.visitante_logo ? (
          <img src={juego.visitante_logo} alt="" className="w-7 h-7 rounded-full object-contain shrink-0" />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ backgroundColor: juego.visitante_color || '#6B7280' }}
          >
            {(juego.visitante_corto || '').substring(0, 2).toUpperCase()}
          </div>
        )}
        <span className={`text-sm font-medium ${visitanteGana ? 'text-green-600' : ''}`}>
          {juego.visitante_corto || juego.visitante_nombre}
        </span>
      </div>

      {/* Estado badge */}
      <div className="w-20 text-right">
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

function TabPosiciones({ torneoId }) {
  const [tabla, setTabla] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosiciones = async () => {
      try {
        const data = await calcularPosiciones(torneoId)
        setTabla(data)
      } catch (error) {
        toast.error('Error al calcular posiciones')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchPosiciones()
  }, [torneoId])

  if (loading) return <div className="flex justify-center py-8"><div className="spinner w-8 h-8"></div></div>

  if (tabla.length === 0) {
    return <div className="card p-8 text-center text-gray-400">No hay juegos finalizados para calcular posiciones</div>
  }

  return (
    <div className="card overflow-hidden">
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
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: row.equipo_color || '#6B7280' }}
                      >
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

function TabPlayoffs({ torneo, equipos, stats, onRefresh }) {
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
      // 1. Calcular posiciones del torneo
      const standings = await calcularPosiciones(torneo.id)
      if (standings.length < 2) {
        toast.error('Se necesitan al menos 2 equipos con juegos finalizados')
        return
      }

      const totalTeams = equipos.length
      const { qualified } = calculatePlayoffQualifiers(standings, totalTeams)

      if (qualified.length < 2) {
        toast.error('No hay suficientes equipos clasificados')
        return
      }

      // 2. Generar bracket
      const bracket = generatePlayoffBracket(qualified)

      // 3. Crear series en BD
      const seriesRows = bracket.map(s => ({
        torneo_id: torneo.id,
        ronda: 1,
        numero_serie: s.serieNumber,
        equipo_superior_id: s.superior.equipo_id,
        equipo_inferior_id: s.inferior.equipo_id,
        estado: 'pendiente',
      }))
      const createdSeries = await createSeriesPlayoff(seriesRows)

      // 4. Generar juegos de playoff
      // Find the latest game date to start playoffs after
      const juegos = await getJuegos({ torneoId: torneo.id, ascending: false })
      const lastGameDate = juegos.length > 0 ? juegos[0].fecha : torneo.fecha_inicio
      const playoffStart = new Date(lastGameDate)
      playoffStart.setDate(playoffStart.getDate() + 1)
      const startDateStr = playoffStart.toISOString().split('T')[0]

      // Build series with equipo_id format for the algorithm
      const bracketForGames = bracket.map(s => ({
        ...s,
        superior: { equipo_id: s.superior.equipo_id },
        inferior: { equipo_id: s.inferior.equipo_id },
      }))

      const { games } = generatePlayoffGames(bracketForGames, {
        startDate: startDateStr,
        gameDays: torneo.dias_juego,
        timeSlots: torneo.horarios,
        lugar: torneo.lugar,
        temporadaId: torneo.temporada_id,
        torneoId: torneo.id,
      })

      // Assign serie_id to games
      const gamesWithSerie = games.map(g => {
        const serie = createdSeries.find(s => s.numero_serie === g._serieNumber)
        const { _serieNumber, ...rest } = g
        return { ...rest, serie_id: serie?.id || null }
      })

      await createJuegosBulk(gamesWithSerie)

      // 5. Update torneo phase
      await updateTorneo(torneo.id, { fase: 'playoffs' })

      toast.success(`Playoffs generados: ${bracket.length} series, ${gamesWithSerie.length} juegos`)
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

  // No playoffs yet
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
          <button
            onClick={() => setShowConfirmStart(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Play size={18} />
            Iniciar Playoffs
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

  // Show bracket
  const rondas = {}
  series.forEach(s => {
    const key = `Ronda ${s.ronda}`
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
        {/* Superior team */}
        <div className={`flex items-center justify-between ${serie.ganador_id === serie.equipo_superior_id ? 'font-bold' : ''}`}>
          <div className="flex items-center gap-2">
            {serie.equipo_superior?.logo_url ? (
              <img src={serie.equipo_superior.logo_url} alt="" className="w-8 h-8 rounded-full object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: serie.equipo_superior?.color_primario || '#6B7280' }}
              >
                {(serie.equipo_superior?.nombre_corto || '').substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-900">{serie.equipo_superior?.nombre_corto || serie.equipo_superior?.nombre || 'TBD'}</span>
          </div>
          <span className="text-lg font-bold tabular-nums text-gray-900">{serie.victorias_superior}</span>
        </div>

        {/* Inferior team */}
        <div className={`flex items-center justify-between ${serie.ganador_id === serie.equipo_inferior_id ? 'font-bold' : ''}`}>
          <div className="flex items-center gap-2">
            {serie.equipo_inferior?.logo_url ? (
              <img src={serie.equipo_inferior.logo_url} alt="" className="w-8 h-8 rounded-full object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: serie.equipo_inferior?.color_primario || '#6B7280' }}
              >
                {(serie.equipo_inferior?.nombre_corto || '').substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-900">{serie.equipo_inferior?.nombre_corto || serie.equipo_inferior?.nombre || 'TBD'}</span>
          </div>
          <span className="text-lg font-bold tabular-nums text-gray-900">{serie.victorias_inferior}</span>
        </div>

        {/* Winner indicator */}
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
