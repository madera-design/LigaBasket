import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { getJuegoWithStats, updateJuego } from '../../services/juegos.service'
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
        getJugadoresByEquipo(juegoData.local_id),
        getJugadoresByEquipo(juegoData.visitante_id)
      ])
      setJugadoresLocal(localPlayers)
      setJugadoresVisitante(visitPlayers)

      // Inicializar stats existentes o vacías
      const existingStats = juegoData.estadisticas || []
      const localStats = {}
      const visitStats = {}

      localPlayers.forEach(j => {
        const existing = existingStats.find(s => s.jugador_id === j.id)
        localStats[j.id] = existing || createEmptyStats(j.id, juegoData.local_id)
      })
      visitPlayers.forEach(j => {
        const existing = existingStats.find(s => s.jugador_id === j.id)
        visitStats[j.id] = existing || createEmptyStats(j.id, juegoData.visitante_id)
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
    faltas: 0,
    tiros_campo_intentados: 0,
    tiros_campo_convertidos: 0,
    triples_intentados: 0,
    triples_convertidos: 0,
    tiros_libres_intentados: 0,
    tiros_libres_convertidos: 0,
    minutos: 0,
    segundos: 0,
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const allStats = [
        ...Object.values(statsLocal),
        ...Object.values(statsVisitante)
      ]

      await saveEstadisticasMultiple(allStats)

      // Actualizar marcador del juego
      const puntosLocal = calculateTeamPoints(statsLocal)
      const puntosVisitante = calculateTeamPoints(statsVisitante)
      await updateJuego(id, {
        puntos_local: puntosLocal,
        puntos_visitante: puntosVisitante,
        estado: 'finalizado',
      })

      toast.success('Juego guardado')
      navigate('/admin/calendario')
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
          <div className="flex flex-col items-center gap-2">
            {juego.local_logo ? (
              <img src={juego.local_logo} alt={juego.local_nombre} className="w-16 h-16 object-contain" />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: juego.local_color || '#6B7280' }}
              >
                {(juego.local_corto || juego.local_nombre || '').substring(0, 3).toUpperCase()}
              </div>
            )}
            <p className="font-bold text-lg">{juego.local_nombre}</p>
            <p className="text-xs text-gray-500">Local</p>
          </div>
          <div>
            <p className="font-display text-5xl">{puntosLocal} - {puntosVisitante}</p>
            <span className={`badge mt-2 ${juego.estado === 'finalizado' ? 'badge-success' : 'badge-warning'}`}>
              {juego.estado === 'finalizado' ? 'Finalizado' : 'En registro'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            {juego.visitante_logo ? (
              <img src={juego.visitante_logo} alt={juego.visitante_nombre} className="w-16 h-16 object-contain" />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: juego.visitante_color || '#6B7280' }}
              >
                {(juego.visitante_corto || juego.visitante_nombre || '').substring(0, 3).toUpperCase()}
              </div>
            )}
            <p className="font-bold text-lg">{juego.visitante_nombre}</p>
            <p className="text-xs text-gray-500">Visitante</p>
          </div>
        </div>
      </div>

      {/* Stats Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        <StatsTable
          title={juego.local_nombre}
          logo={juego.local_logo}
          color={juego.local_color}
          corto={juego.local_corto}
          jugadores={jugadoresLocal}
          stats={statsLocal}
          onUpdate={(jId, field, val) => updateStat(jId, field, val, true)}
          disabled={juego.estado === 'finalizado'}
        />
        <StatsTable
          title={juego.visitante_nombre}
          logo={juego.visitante_logo}
          color={juego.visitante_color}
          corto={juego.visitante_corto}
          jugadores={jugadoresVisitante}
          stats={statsVisitante}
          onUpdate={(jId, field, val) => updateStat(jId, field, val, false)}
          disabled={juego.estado === 'finalizado'}
        />
      </div>

      {/* Actions */}
      {juego.estado !== 'finalizado' && (
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}

function StatsTable({ title, logo, color, corto, jugadores, stats, onUpdate, disabled }) {
  const fields = [
    { key: 'puntos', label: 'PTS', width: 'w-16' },
    { key: 'asistencias', label: 'AST', width: 'w-14' },
    { key: 'rebotes_defensivos', label: 'REB', width: 'w-14' },
    { key: 'robos', label: 'ROB', width: 'w-14' },
    { key: 'bloqueos', label: 'BLK', width: 'w-14' },
    { key: 'faltas', label: 'FLS', width: 'w-14' },
  ]

  return (
    <div className="card overflow-hidden">
      <div className="p-4 bg-gray-50 border-b font-bold flex items-center gap-3">
        {logo ? (
          <img src={logo} alt={title} className="w-8 h-8 object-contain" />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: color || '#6B7280' }}
          >
            {(corto || title || '').charAt(0)}
          </div>
        )}
        {title}
      </div>
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
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2 max-w-[150px]">
                    {j.foto_url ? (
                      <img src={j.foto_url} alt={j.nombre} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                        {j.nombre?.charAt(0)}{j.apellido?.charAt(0)}
                      </div>
                    )}
                    <span className="truncate">{formatFullName(j.nombre, j.apellido)}</span>
                  </div>
                </td>
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
