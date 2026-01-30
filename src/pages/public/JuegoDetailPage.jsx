import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getJuegoWithStats } from '../../services/juegos.service'
import toast from 'react-hot-toast'

const ESTADOS_CONFIG = {
  programado: { label: 'Programado', bg: 'bg-gray-100 text-gray-600' },
  en_curso: { label: 'En Vivo', bg: 'bg-green-500 text-white animate-pulse' },
  finalizado: { label: 'Finalizado', bg: 'bg-gray-800 text-white' },
  suspendido: { label: 'Suspendido', bg: 'bg-yellow-500 text-white' },
  cancelado: { label: 'Cancelado', bg: 'bg-red-500 text-white' },
}

export default function JuegoDetailPage() {
  const { id } = useParams()
  const [juego, setJuego] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getJuegoWithStats(id)
        setJuego(data)
      } catch (error) {
        toast.error('Error al cargar datos del juego')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
  }

  if (!juego) {
    return <div className="card p-8 text-center text-gray-500">Juego no encontrado</div>
  }

  const estado = ESTADOS_CONFIG[juego.estado] || ESTADOS_CONFIG.programado
  const esFinalizado = juego.estado === 'finalizado'
  const esEnCurso = juego.estado === 'en_curso'
  const localGana = esFinalizado && juego.puntos_local > juego.puntos_visitante
  const visitanteGana = esFinalizado && juego.puntos_visitante > juego.puntos_local

  const statsLocal = (juego.estadisticas || []).filter(s => s.equipo_id === juego.local_id)
  const statsVisitante = (juego.estadisticas || []).filter(s => s.equipo_id === juego.visitante_id)

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const d = new Date(fecha)
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatHora = (fecha) => {
    if (!fecha) return '-'
    const d = new Date(fecha)
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/calendario" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Volver al calendario
      </Link>

      {/* Scoreboard */}
      <div className="card overflow-hidden">
        {/* Tipo de partido */}
        <div className="px-6 py-2 bg-gray-900 flex items-center justify-between">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            juego.torneo_id
              ? juego.fase_juego === 'playoff' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'
              : 'bg-gray-700 text-gray-400'
          }`}>
            {juego.torneo_id
              ? juego.fase_juego === 'playoff' ? 'Playoff' : juego.fase_juego === 'vuelta' ? 'Vuelta' : 'Temporada Regular'
              : 'Amistoso'}
          </span>
          {juego.temporada_nombre && (
            <span className="text-xs text-gray-500">{juego.temporada_nombre}</span>
          )}
        </div>
        <div className="bg-gray-800 p-6 sm:p-8">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Local */}
            <Link to={`/equipos/${juego.local_id}`} className="flex flex-col items-center text-center gap-3 group">
              <TeamLogo logo={juego.local_logo} color={juego.local_color} name={juego.local_corto || juego.local_nombre} />
              <p className={`font-bold text-white group-hover:text-primary-300 transition-colors ${localGana ? 'text-green-400' : ''}`}>
                {juego.local_nombre}
              </p>
            </Link>

            {/* Score */}
            <div className="flex flex-col items-center gap-3">
              {esFinalizado || esEnCurso ? (
                <>
                  <div className="flex items-center gap-3 text-white">
                    <span className={`text-5xl font-display ${localGana ? 'text-green-400' : ''}`}>{juego.puntos_local}</span>
                    <span className="text-3xl text-gray-500">:</span>
                    <span className={`text-5xl font-display ${visitanteGana ? 'text-green-400' : ''}`}>{juego.puntos_visitante}</span>
                  </div>
                  <span className={`text-xs font-medium px-4 py-1.5 rounded-full ${estado.bg}`}>
                    {estado.label}
                  </span>
                </>
              ) : (
                <>
                  <p className="text-3xl font-display text-white">{formatHora(juego.fecha)}</p>
                  <span className={`text-xs font-medium px-4 py-1.5 rounded-full ${estado.bg}`}>
                    {estado.label}
                  </span>
                </>
              )}
            </div>

            {/* Visitante */}
            <Link to={`/equipos/${juego.visitante_id}`} className="flex flex-col items-center text-center gap-3 group">
              <TeamLogo logo={juego.visitante_logo} color={juego.visitante_color} name={juego.visitante_corto || juego.visitante_nombre} />
              <p className={`font-bold text-white group-hover:text-primary-300 transition-colors ${visitanteGana ? 'text-green-400' : ''}`}>
                {juego.visitante_nombre}
              </p>
            </Link>
          </div>

          {/* Info */}
          <div className="mt-6 text-center text-gray-400 text-sm space-y-1">
            <p>{formatFecha(juego.fecha)}</p>
            {juego.lugar && <p>{juego.lugar}</p>}
          </div>
        </div>
      </div>

      {/* Stats tables */}
      {(esFinalizado || esEnCurso) && (juego.estadisticas || []).length > 0 && (
        <div className="space-y-6">
          {/* Local stats */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <TeamLogoSmall logo={juego.local_logo} color={juego.local_color} name={juego.local_corto || juego.local_nombre} />
              <h3 className="font-bold text-gray-900">{juego.local_nombre}</h3>
              <span className="ml-auto font-display text-xl">{juego.puntos_local}</span>
            </div>
            <StatsTable stats={statsLocal} />
          </div>

          {/* Visitante stats */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <TeamLogoSmall logo={juego.visitante_logo} color={juego.visitante_color} name={juego.visitante_corto || juego.visitante_nombre} />
              <h3 className="font-bold text-gray-900">{juego.visitante_nombre}</h3>
              <span className="ml-auto font-display text-xl">{juego.puntos_visitante}</span>
            </div>
            <StatsTable stats={statsVisitante} />
          </div>
        </div>
      )}

      {(esFinalizado || esEnCurso) && (juego.estadisticas || []).length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          No hay estadisticas registradas para este juego
        </div>
      )}
    </div>
  )
}

function StatsTable({ stats }) {
  if (stats.length === 0) {
    return <div className="p-6 text-center text-gray-500 text-sm">Sin estadisticas</div>
  }

  const totals = stats.reduce((acc, s) => ({
    puntos: acc.puntos + (s.puntos || 0),
    tc_c: acc.tc_c + (s.tiros_campo_convertidos || 0),
    tc_i: acc.tc_i + (s.tiros_campo_intentados || 0),
    t3_c: acc.t3_c + (s.triples_convertidos || 0),
    t3_i: acc.t3_i + (s.triples_intentados || 0),
    tl_c: acc.tl_c + (s.tiros_libres_convertidos || 0),
    tl_i: acc.tl_i + (s.tiros_libres_intentados || 0),
    reb: acc.reb + (s.rebotes_ofensivos || 0) + (s.rebotes_defensivos || 0),
    ast: acc.ast + (s.asistencias || 0),
    stl: acc.stl + (s.robos || 0),
    blk: acc.blk + (s.bloqueos || 0),
    to: acc.to + (s.perdidas || 0),
    pf: acc.pf + (s.faltas || 0),
  }), { puntos: 0, tc_c: 0, tc_i: 0, t3_c: 0, t3_i: 0, tl_c: 0, tl_i: 0, reb: 0, ast: 0, stl: 0, blk: 0, to: 0, pf: 0 })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
            <th className="px-3 py-2 text-left">Jugador</th>
            <th className="px-2 py-2 text-center">PTS</th>
            <th className="px-2 py-2 text-center">TC</th>
            <th className="px-2 py-2 text-center">3P</th>
            <th className="px-2 py-2 text-center">TL</th>
            <th className="px-2 py-2 text-center">REB</th>
            <th className="px-2 py-2 text-center">AST</th>
            <th className="px-2 py-2 text-center">STL</th>
            <th className="px-2 py-2 text-center">BLK</th>
            <th className="px-2 py-2 text-center">TO</th>
            <th className="px-2 py-2 text-center">PF</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.id} className="border-t hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2">
                <Link to={`/jugadores/${s.jugador?.id || s.jugador_id}`} className="hover:text-primary-500">
                  <span className="font-medium">{s.jugador?.nombre} {s.jugador?.apellido}</span>
                  <span className="text-gray-400 text-xs ml-1">#{s.jugador?.numero}</span>
                </Link>
              </td>
              <td className="px-2 py-2 text-center font-bold">{s.puntos}</td>
              <td className="px-2 py-2 text-center">{s.tiros_campo_convertidos}/{s.tiros_campo_intentados}</td>
              <td className="px-2 py-2 text-center">{s.triples_convertidos}/{s.triples_intentados}</td>
              <td className="px-2 py-2 text-center">{s.tiros_libres_convertidos}/{s.tiros_libres_intentados}</td>
              <td className="px-2 py-2 text-center">{(s.rebotes_ofensivos || 0) + (s.rebotes_defensivos || 0)}</td>
              <td className="px-2 py-2 text-center">{s.asistencias}</td>
              <td className="px-2 py-2 text-center">{s.robos}</td>
              <td className="px-2 py-2 text-center">{s.bloqueos}</td>
              <td className="px-2 py-2 text-center">{s.perdidas}</td>
              <td className="px-2 py-2 text-center">{s.faltas}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
            <td className="px-3 py-2">TOTAL</td>
            <td className="px-2 py-2 text-center">{totals.puntos}</td>
            <td className="px-2 py-2 text-center">{totals.tc_c}/{totals.tc_i}</td>
            <td className="px-2 py-2 text-center">{totals.t3_c}/{totals.t3_i}</td>
            <td className="px-2 py-2 text-center">{totals.tl_c}/{totals.tl_i}</td>
            <td className="px-2 py-2 text-center">{totals.reb}</td>
            <td className="px-2 py-2 text-center">{totals.ast}</td>
            <td className="px-2 py-2 text-center">{totals.stl}</td>
            <td className="px-2 py-2 text-center">{totals.blk}</td>
            <td className="px-2 py-2 text-center">{totals.to}</td>
            <td className="px-2 py-2 text-center">{totals.pf}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function TeamLogo({ logo, color, name }) {
  if (logo) {
    return <img src={logo} alt={name} className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
  }
  return (
    <div
      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
      style={{ backgroundColor: color || '#6B7280' }}
    >
      {(name || '').substring(0, 3).toUpperCase()}
    </div>
  )
}

function TeamLogoSmall({ logo, color, name }) {
  if (logo) {
    return <img src={logo} alt={name} className="w-8 h-8 object-contain" />
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: color || '#6B7280' }}
    >
      {(name || '').charAt(0)}
    </div>
  )
}
