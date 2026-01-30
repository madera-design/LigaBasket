import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getJuegos } from '../../services/juegos.service'
import toast from 'react-hot-toast'

const ESTADOS_CONFIG = {
  programado: { label: 'Programado', bg: 'bg-gray-100 text-gray-600' },
  en_curso: { label: 'En Vivo', bg: 'bg-green-500 text-white' },
  finalizado: { label: 'Finalizado', bg: 'bg-gray-800 text-white' },
  suspendido: { label: 'Suspendido', bg: 'bg-yellow-500 text-white' },
  cancelado: { label: 'Cancelado', bg: 'bg-red-500 text-white' },
}

export default function CalendarioPage() {
  const [juegos, setJuegos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getJuegos({ ascending: true })
        setJuegos(data)
      } catch (error) {
        toast.error('Error al cargar calendario')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const juegosFiltrados = juegos.filter(j => {
    if (filtro === 'todos') return true
    if (filtro === 'finalizados') return j.estado === 'finalizado'
    if (filtro === 'proximos') return j.estado === 'programado' || j.estado === 'en_curso'
    return true
  })

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-white">Juegos</h1>
        <div className="flex gap-2">
          {[
            { value: 'todos', label: 'Todos' },
            { value: 'proximos', label: 'Proximos' },
            { value: 'finalizados', label: 'Finalizados' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === f.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game cards */}
      {juegosFiltrados.length > 0 ? (
        <div className="space-y-4">
          {juegosFiltrados.map(juego => (
            <GameCard key={juego.id} juego={juego} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-500">
          No hay juegos para mostrar
        </div>
      )}
    </div>
  )
}

function GameCard({ juego }) {
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

  const faseLabel = juego.torneo_id
    ? juego.fase_juego === 'playoff' ? 'Playoff' : juego.fase_juego === 'vuelta' ? 'Vuelta' : 'Temporada Regular'
    : 'Amistoso'

  return (
    <Link to={`/juegos/${juego.id}`} className="card overflow-hidden block hover:shadow-lg transition-shadow">
      {/* Tipo de partido */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
          juego.torneo_id
            ? juego.fase_juego === 'playoff' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
            : 'bg-gray-200 text-gray-500'
        }`}>
          {faseLabel}
        </span>
        {juego.temporada_nombre && (
          <span className="text-xs text-gray-400">{juego.temporada_nombre}</span>
        )}
      </div>
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

        {/* Lugar */}
        {juego.lugar && (
          <p className="text-center text-xs text-gray-400 mt-3">{juego.lugar}</p>
        )}

        {/* Fecha para juegos finalizados/en curso */}
        {(esFinalizado || esEnCurso) && (
          <p className="text-center text-xs text-gray-400 mt-1">
            {formatFecha(juego.fecha)} - {formatHora(juego.fecha)}
          </p>
        )}
      </div>
    </Link>
  )
}
