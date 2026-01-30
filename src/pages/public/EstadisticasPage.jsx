import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { getLideresTotales } from '../../services/estadisticas.service'
import toast from 'react-hot-toast'

const INITIAL_SHOW = 10
const EXPAND_SHOW = 25

const CATEGORIAS = [
  { key: 'puntos', label: 'Puntos', columnLabel: 'PUNTOS' },
  { key: 'triples_convertidos', label: 'Tiros de 3 puntos', columnLabel: 'CANTIDAD' },
  { key: 'asistencias', label: 'Asistencias', columnLabel: 'CANTIDAD' },
  { key: 'bloqueos', label: 'Tapones', columnLabel: 'CANTIDAD' },
  { key: 'robos', label: 'Robos', columnLabel: 'CANTIDAD' },
  { key: 'rebotes', label: 'Rebotes', columnLabel: 'CANTIDAD' },
]

export default function EstadisticasPage() {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.all(
          CATEGORIAS.map(cat => getLideresTotales(cat.key, EXPAND_SHOW))
        )
        const newData = {}
        CATEGORIAS.forEach((cat, i) => {
          newData[cat.key] = results[i]
        })
        setData(newData)
      } catch (error) {
        toast.error('Error al cargar estadisticas')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
      <div className="bg-gray-800 rounded-2xl p-6">
        <h1 className="font-display text-2xl text-white">Estadisticas del Torneo</h1>
        <p className="text-gray-400 text-sm mt-1">Lideres y estadisticas generales por jugador</p>
      </div>

      {/* Mejor Jugador - Proximamente */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900">Mejores jugadores</h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          <p className="text-lg font-medium">Proximamente</p>
          <p className="text-sm mt-1">El sistema de evaluacion de jugadores estara disponible pronto</p>
        </div>
      </div>

      {/* Categorias de estadisticas */}
      {CATEGORIAS.map(cat => (
        <LeaderSection
          key={cat.key}
          label={cat.label}
          columnLabel={cat.columnLabel}
          jugadores={data[cat.key] || []}
        />
      ))}
    </div>
  )
}

function LeaderSection({ label, columnLabel, jugadores }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? jugadores : jugadores.slice(0, INITIAL_SHOW)

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">{label}</h2>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500 uppercase font-medium">JUGADORES</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Total</span>
          <span className="ml-auto text-xs text-gray-500 uppercase font-medium">{columnLabel}</span>
        </div>
      </div>

      {shown.length > 0 ? (
        <div>
          <div className="divide-y divide-gray-50">
            {shown.map((jugador, index) => (
              <Link
                key={jugador.jugador_id}
                to={`/jugadores/${jugador.jugador_id}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className={`w-7 text-center font-bold text-sm ${
                  index === 0 ? 'text-yellow-600' :
                  index === 1 ? 'text-gray-500' :
                  index === 2 ? 'text-orange-600' :
                  'text-gray-400'
                }`}>
                  {index + 1}
                </span>

                {jugador.foto_url ? (
                  <img src={jugador.foto_url} alt={jugador.nombre} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
                    {jugador.nombre?.charAt(0)}{jugador.apellido?.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {jugador.apellido} {jugador.nombre}
                  </p>
                  <p className="text-xs text-gray-500">{jugador.equipo_nombre}</p>
                </div>

                <span className="font-bold text-lg text-gray-900 tabular-nums">{jugador.total}</span>
              </Link>
            ))}
          </div>

          {jugadores.length > INITIAL_SHOW && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-3 flex items-center justify-center gap-1 text-sm text-gray-500 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">
          Aun no hay datos
        </div>
      )}
    </div>
  )
}
