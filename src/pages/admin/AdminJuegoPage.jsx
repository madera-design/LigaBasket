import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import { getJuegoWithStats, finalizarJuego } from '../../services/juegos.service'
import { getJugadoresByEquipo } from '../../services/jugadores.service'
import { saveEstadisticasMultiple } from '../../services/estadisticas.service'
import { formatDate, formatTime, formatFullName } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function AdminJuegoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [juego, setJuego] = useState(null)
  const [jugadoresLocal, setJugadoresLocal] = useState([])
  const [jugadoresVisitante, setJugadoresVisitante] = useState([])
  const [statsLocal, setStatsLocal] = useState({})
  const [statsVisitante, setStatsVisitante] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const juegoData = await getJuegoWithStats(id)
      setJuego(juegoData)

      const [localPlayers, visitPlayers] = await Promise.all([
        getJugadoresByEquipo(juegoData.equipo_local_id),
        getJugadoresByEquipo(juegoData.equipo_visitante_id)
      ])
      setJugadoresLocal(localPlayers)
      setJugadoresVisitante(visitPlayers)

      // Inicializar stats existentes o vacías
      const existingStats = juegoData.estadisticas || []
      const localStats = {}
      const visitStats = {}

      localPlayers.forEach(j => {
        const existing = existingStats.find(s => s.jugador_id === j.id)
        localStats[j.id] = existing || createEmptyStats(j.id, juegoData.equipo_local_id)
      })
      visitPlayers.forEach(j => {
        const existing = existingStats.find(s => s.jugador_id === j.id)
        visitStats[j.id] = existing || createEmptyStats(j.id, juegoData.equipo_visitante_id)
      })

      setStatsLocal(localStats)
      setStatsVisitante(visitStats)
    } catch (error) {
      toast.error('Error al cargar juego')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const createEmptyStats = (jugadorId, equipoId) => ({
    jugador_id: jugadorId,
    equipo_id: equipoId,
    juego_id: id,
    puntos: 0,
    asistencias: 0,
    rebotes_ofensivos: 0,
    rebotes_defensivos: 0,
    robos: 0,
    bloqueos: 0,
    perdidas: 0,
    faltas_personales: 0,
    tiros_campo_intentados: 0,
    tiros_campo_convertidos: 0,
    triples_intentados: 0,
    triples_convertidos: 0,
    tiros_libres_intentados: 0,
    tiros_libres_convertidos: 0,
    minutos_jugados: 0,
  })

  const updateStat = (jugadorId, field, value, isLocal) => {
    const setter = isLocal ? setStatsLocal : setStatsVisitante
    setter(prev => ({
      ...prev,
      [jugadorId]: {
        ...prev[jugadorId],
        [field]: parseInt(value) || 0
      }
    }))
  }

  const calculateTeamPoints = (stats) => {
    return Object.values(stats).reduce((sum, s) => sum + (s.puntos || 0), 0)
  }

  const handleSave = async (finalizar = false) => {
    setSaving(true)
    try {
      const allStats = [
        ...Object.values(statsLocal),
        ...Object.values(statsVisitante)
      ]

      await saveEstadisticasMultiple(allStats)

      if (finalizar) {
        const puntosLocal = calculateTeamPoints(statsLocal)
        const puntosVisitante = calculateTeamPoints(statsVisitante)
        await finalizarJuego(id, puntosLocal, puntosVisitante)
        toast.success('Juego finalizado')
        navigate('/admin/calendario')
      } else {
        toast.success('Estadísticas guardadas')
        fetchData()
      }
    } catch (error) {
      toast.error('Error al guardar')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
  }

  if (!juego) {
    return <div className="text-center py-12 text-gray-500">Juego no encontrado</div>
  }

  const puntosLocal = calculateTeamPoints(statsLocal)
  const puntosVisitante = calculateTeamPoints(statsVisitante)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/calendario')} className="btn-ghost btn-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registrar Estadísticas</h1>
          <p className="text-gray-500">{formatDate(juego.fecha)} - {formatTime(juego.fecha)}</p>
        </div>
      </div>

      {/* Marcador */}
      <div className="card p-6">
        <div className="grid grid-cols-3 items-center text-center">
          <div>
            <p className="font-bold text-lg">{juego.equipo_local_nombre}</p>
            <p className="text-xs text-gray-500">Local</p>
          </div>
          <div>
            <p className="font-display text-5xl">{puntosLocal} - {puntosVisitante}</p>
            <span className={`badge mt-2 ${juego.estado === 'finalizado' ? 'badge-success' : 'badge-warning'}`}>
              {juego.estado === 'finalizado' ? 'Finalizado' : 'En registro'}
            </span>
          </div>
          <div>
            <p className="font-bold text-lg">{juego.equipo_visitante_nombre}</p>
            <p className="text-xs text-gray-500">Visitante</p>
          </div>
        </div>
      </div>

      {/* Stats Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        <StatsTable
          title={juego.equipo_local_nombre}
          jugadores={jugadoresLocal}
          stats={statsLocal}
          onUpdate={(jId, field, val) => updateStat(jId, field, val, true)}
          disabled={juego.estado === 'finalizado'}
        />
        <StatsTable
          title={juego.equipo_visitante_nombre}
          jugadores={jugadoresVisitante}
          stats={statsVisitante}
          onUpdate={(jId, field, val) => updateStat(jId, field, val, false)}
          disabled={juego.estado === 'finalizado'}
        />
      </div>

      {/* Actions */}
      {juego.estado !== 'finalizado' && (
        <div className="flex justify-end gap-4">
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary">
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary">
            <CheckCircle size={20} />
            Finalizar Juego
          </button>
        </div>
      )}
    </div>
  )
}

function StatsTable({ title, jugadores, stats, onUpdate, disabled }) {
  const fields = [
    { key: 'puntos', label: 'PTS', width: 'w-16' },
    { key: 'asistencias', label: 'AST', width: 'w-14' },
    { key: 'rebotes_defensivos', label: 'REB', width: 'w-14' },
    { key: 'robos', label: 'ROB', width: 'w-14' },
    { key: 'bloqueos', label: 'BLK', width: 'w-14' },
    { key: 'faltas_personales', label: 'FLS', width: 'w-14' },
  ]

  return (
    <div className="card overflow-hidden">
      <div className="p-4 bg-gray-50 border-b font-bold">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Jugador</th>
              {fields.map(f => (
                <th key={f.key} className="px-2 py-2 text-center">{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jugadores.map(j => (
              <tr key={j.id} className="border-t">
                <td className="px-3 py-2 font-bold">{j.numero}</td>
                <td className="px-3 py-2 truncate max-w-[120px]">{formatFullName(j.nombre, j.apellido)}</td>
                {fields.map(f => (
                  <td key={f.key} className="px-1 py-1">
                    <input
                      type="number"
                      min="0"
                      value={stats[j.id]?.[f.key] || 0}
                      onChange={(e) => onUpdate(j.id, f.key, e.target.value)}
                      disabled={disabled}
                      className={`${f.width} px-2 py-1 text-center border rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
