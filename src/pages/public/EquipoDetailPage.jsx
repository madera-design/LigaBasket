import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getEquipoWithRoster } from '../../services/equipos.service'
import { getJuegosByEquipo } from '../../services/juegos.service'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const ESTADOS_CONFIG = {
  programado: { label: 'Programado', bg: 'bg-gray-100 text-gray-600' },
  en_curso: { label: 'En Vivo', bg: 'bg-green-500 text-white' },
  finalizado: { label: 'Finalizado', bg: 'bg-gray-800 text-white' },
  suspendido: { label: 'Suspendido', bg: 'bg-yellow-500 text-white' },
  cancelado: { label: 'Cancelado', bg: 'bg-red-500 text-white' },
}

export default function EquipoDetailPage() {
  const { id } = useParams()
  const [equipo, setEquipo] = useState(null)
  const [juegos, setJuegos] = useState([])
  const [statsJugadores, setStatsJugadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('estadisticas')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equipoData, juegosData] = await Promise.all([
          getEquipoWithRoster(id),
          getJuegosByEquipo(id, 50),
        ])
        setEquipo(equipoData)
        setJuegos(juegosData)

        // Obtener estadísticas acumuladas de jugadores del equipo
        const { data: stats, error } = await supabase
          .from('estadisticas_jugador')
          .select(`
            jugador_id,
            puntos,
            triples_convertidos,
            tiros_campo_convertidos,
            asistencias,
            rebotes_ofensivos,
            rebotes_defensivos,
            bloqueos,
            robos,
            faltas,
            jugador:jugadores (
              id, nombre, apellido, numero, foto_url
            )
          `)
          .eq('equipo_id', id)

        if (!error && stats) {
          // Agrupar por jugador y sumar
          const jugadorMap = {}
          stats.forEach(s => {
            const jid = s.jugador_id
            if (!jugadorMap[jid]) {
              jugadorMap[jid] = {
                jugador_id: jid,
                nombre: s.jugador?.nombre || '',
                apellido: s.jugador?.apellido || '',
                numero: s.jugador?.numero || 0,
                foto_url: s.jugador?.foto_url || null,
                juegos: 0,
                puntos: 0,
                triples: 0,
                dobles: 0,
                asistencias: 0,
                rebotes: 0,
                bloqueos: 0,
                robos: 0,
                faltas: 0,
              }
            }
            const j = jugadorMap[jid]
            j.juegos++
            j.puntos += s.puntos || 0
            j.triples += s.triples_convertidos || 0
            j.dobles += (s.tiros_campo_convertidos || 0) - (s.triples_convertidos || 0)
            j.asistencias += s.asistencias || 0
            j.rebotes += (s.rebotes_ofensivos || 0) + (s.rebotes_defensivos || 0)
            j.bloqueos += s.bloqueos || 0
            j.robos += s.robos || 0
            j.faltas += s.faltas || 0
          })
          setStatsJugadores(Object.values(jugadorMap).sort((a, b) => b.puntos - a.puntos))
        }
      } catch (error) {
        toast.error('Error al cargar datos del equipo')
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

  if (!equipo) {
    return <div className="card p-8 text-center text-gray-500">Equipo no encontrado</div>
  }

  const juegosFinalizados = juegos.filter(j => j.estado === 'finalizado')
  const juegosProximos = juegos.filter(j => j.estado === 'programado' || j.estado === 'en_curso')

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/equipos" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Volver a equipos
      </Link>

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="bg-gray-800 p-6 sm:p-8">
          <div className="flex items-center gap-6">
            {equipo.logo_url ? (
              <img src={equipo.logo_url} alt={equipo.nombre} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20" />
            ) : (
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white/20"
                style={{ backgroundColor: equipo.color_primario || '#6B7280' }}
              >
                {equipo.nombre_corto || equipo.nombre.charAt(0)}
              </div>
            )}
            <div className="text-white">
              <h1 className="text-2xl sm:text-3xl font-display">{equipo.nombre}</h1>
              {equipo.nombre_corto && <p className="text-gray-400 text-sm">{equipo.nombre_corto}</p>}
              {equipo.entrenador && <p className="text-gray-300 mt-1">DT: {equipo.entrenador}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {[
          { value: 'estadisticas', label: 'Estadisticas' },
          { value: 'resultados', label: `Resultados (${juegosFinalizados.length})` },
          { value: 'proximos', label: `Proximos (${juegosProximos.length})` },
        ].map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.value
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'estadisticas' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-white text-xs uppercase">
                  <th className="px-3 py-3 text-left">Jugadores</th>
                  <th className="px-3 py-3 text-center">P</th>
                  <th className="px-3 py-3 text-center">J</th>
                  <th className="px-3 py-3 text-center">3PM</th>
                  <th className="px-3 py-3 text-center">2PM</th>
                  <th className="px-3 py-3 text-center">AST</th>
                  <th className="px-3 py-3 text-center">REB</th>
                  <th className="px-3 py-3 text-center">BLK</th>
                  <th className="px-3 py-3 text-center">STL</th>
                  <th className="px-3 py-3 text-center">PF</th>
                </tr>
              </thead>
              <tbody>
                {statsJugadores.length > 0 ? (
                  statsJugadores.map((j) => (
                    <tr key={j.jugador_id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-4">
                        <Link to={`/jugadores/${j.jugador_id}`} className="flex items-center gap-3 hover:text-primary-500">
                          {j.foto_url ? (
                            <img src={j.foto_url} alt={j.nombre} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                              {j.nombre?.charAt(0)}{j.apellido?.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium">{j.nombre} {j.apellido}</span>
                          <span className="text-gray-400 text-xs">{j.numero}</span>
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-center font-bold">{j.puntos}</td>
                      <td className="px-3 py-4 text-center">{j.juegos}</td>
                      <td className="px-3 py-4 text-center">{j.triples}</td>
                      <td className="px-3 py-4 text-center">{j.dobles}</td>
                      <td className="px-3 py-4 text-center">{j.asistencias}</td>
                      <td className="px-3 py-4 text-center">{j.rebotes}</td>
                      <td className="px-3 py-4 text-center">{j.bloqueos}</td>
                      <td className="px-3 py-4 text-center">{j.robos}</td>
                      <td className="px-3 py-4 text-center">{j.faltas}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                      No hay estadisticas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'resultados' && (
        <div className="space-y-4">
          {juegosFinalizados.length > 0 ? (
            juegosFinalizados.map(juego => (
              <GameCard key={juego.id} juego={juego} equipoId={id} />
            ))
          ) : (
            <div className="card p-8 text-center text-gray-500">No hay resultados disponibles</div>
          )}
        </div>
      )}

      {tab === 'proximos' && (
        <div className="space-y-4">
          {juegosProximos.length > 0 ? (
            juegosProximos.map(juego => (
              <GameCard key={juego.id} juego={juego} equipoId={id} />
            ))
          ) : (
            <div className="card p-8 text-center text-gray-500">No hay juegos proximos</div>
          )}
        </div>
      )}
    </div>
  )
}

function GameCard({ juego, equipoId }) {
  const estado = ESTADOS_CONFIG[juego.estado] || ESTADOS_CONFIG.programado
  const esFinalizado = juego.estado === 'finalizado'
  const esEnCurso = juego.estado === 'en_curso'
  const localGana = esFinalizado && juego.puntos_local > juego.puntos_visitante
  const visitanteGana = esFinalizado && juego.puntos_visitante > juego.puntos_local

  const formatFecha = (fecha) => {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  const formatHora = (fecha) => {
    const d = new Date(fecha)
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Local */}
          <div className="flex flex-col items-center text-center gap-2">
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
            <p className={`font-semibold text-sm ${localGana ? 'text-green-600' : ''}`}>
              {juego.local_nombre}
            </p>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-2">
            {esFinalizado || esEnCurso ? (
              <>
                <div className="flex items-center gap-2 text-3xl font-display">
                  <span className={localGana ? 'text-green-600' : ''}>{juego.puntos_local}</span>
                  <span className="text-gray-400">:</span>
                  <span className={visitanteGana ? 'text-green-600' : ''}>{juego.puntos_visitante}</span>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${estado.bg}`}>
                  {estado.label}
                </span>
              </>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-500">{formatFecha(juego.fecha)}</p>
                  <p className="text-2xl font-bold text-gray-800">{formatHora(juego.fecha)}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${estado.bg}`}>
                  {estado.label}
                </span>
              </>
            )}
          </div>

          {/* Visitante */}
          <div className="flex flex-col items-center text-center gap-2">
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
            <p className={`font-semibold text-sm ${visitanteGana ? 'text-green-600' : ''}`}>
              {juego.visitante_nombre}
            </p>
          </div>
        </div>

        {/* Fecha para finalizados/en curso */}
        {(esFinalizado || esEnCurso) && (
          <p className="text-center text-xs text-gray-400 mt-3">
            {formatFecha(juego.fecha)} - {formatHora(juego.fecha)}
          </p>
        )}

        {juego.lugar && (
          <p className="text-center text-xs text-gray-400 mt-1">{juego.lugar}</p>
        )}
      </div>
    </div>
  )
}
