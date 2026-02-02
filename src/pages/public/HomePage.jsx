import { Link } from 'react-router-dom'
import { Calendar, Users, Trophy, ArrowRight, TrendingUp, ClipboardList, MapPin, Award } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getProximosJuegos, getUltimosResultados } from '../../services/juegos.service'
import { calcularPosiciones, getLideres } from '../../services/estadisticas.service'
import { getTorneoActivo } from '../../services/torneos.service'
import { getTorneosConInscripcionAbierta } from '../../services/inscripciones.service'
import { formatDate, formatTime } from '../../utils/formatters'

export default function HomePage() {
  const [proximosJuegos, setProximosJuegos] = useState([])
  const [ultimosResultados, setUltimosResultados] = useState([])
  const [posiciones, setPosiciones] = useState([])
  const [lideres, setLideres] = useState([])
  const [torneosAbiertos, setTorneosAbiertos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener torneo activo para filtrar posiciones y lideres
        const torneoActivo = await getTorneoActivo()
        const torneoId = torneoActivo?.id || null

        const [juegos, resultados, tabla, lideresData, torneosInsc] = await Promise.all([
          getProximosJuegos(3),
          getUltimosResultados(3),
          torneoId ? calcularPosiciones(torneoId) : Promise.resolve([]),
          torneoId ? getLideres('ppj', 5, torneoId) : Promise.resolve([]),
          getTorneosConInscripcionAbierta(),
        ])
        setProximosJuegos(juegos)
        setUltimosResultados(resultados)
        setPosiciones(tabla.slice(0, 5))
        setLideres(lideresData)
        setTorneosAbiertos(torneosInsc)
      } catch (error) {
        console.error('Error loading home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] bg-repeat"></div>
        </div>
        <div className="relative px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl font-display text-white mb-4">
            LIGA DE BASQUETBOL
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mb-8">
            Sigue todos los partidos, estadísticas y resultados de la temporada actual.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/calendario" className="btn-primary">
              <Calendar size={20} />
              Ver calendario
            </Link>
            <Link to="/posiciones" className="btn bg-white/10 text-white hover:bg-white/20">
              <Trophy size={20} />
              Tabla de posiciones
            </Link>
          </div>
        </div>
      </section>

      {/* Torneos con inscripcion abierta */}
      {torneosAbiertos.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              <ClipboardList className="inline mr-2 text-yellow-500" size={22} />
              Inscripciones Abiertas
            </h2>
            <Link to="/inscripcion" className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm font-medium">
              Ver todas <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {torneosAbiertos.map(torneo => (
              <Link
                key={torneo.id}
                to={`/inscripcion/${torneo.id}`}
                className="card-hover p-5 border-l-4 border-yellow-400"
              >
                <h3 className="font-bold text-gray-900 mb-1">{torneo.nombre}</h3>
                {torneo.temporada?.nombre && (
                  <p className="text-xs text-gray-400 mb-2">{torneo.temporada.nombre}</p>
                )}
                {torneo.descripcion && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{torneo.descripcion}</p>
                )}
                {(torneo.premio_1er_lugar || torneo.premio_2do_lugar || torneo.premio_3er_lugar) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {torneo.premio_1er_lugar && (
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                        <Award size={12} /> 1ro: {torneo.premio_1er_lugar}
                      </span>
                    )}
                    {torneo.premio_2do_lugar && (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        2do: {torneo.premio_2do_lugar}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  {torneo.lugar && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {torneo.lugar}
                    </span>
                  )}
                  <span className="text-yellow-600 font-medium">
                    Cierra: {formatDate(torneo.fecha_inscripcion_fin, 'dd/MM/yyyy')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Próximos juegos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Próximos Juegos</h2>
            <Link to="/calendario" className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm font-medium">
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>

          {proximosJuegos.length > 0 ? (
            <div className="space-y-4">
              {proximosJuegos.map((juego) => (
                <Link
                  key={juego.id}
                  to={`/juegos/${juego.id}`}
                  className="card-hover overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      juego.torneo_id
                        ? juego.fase_juego === 'playoff' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {juego.torneo_id
                        ? juego.fase_juego === 'playoff' ? 'Playoff' : 'Temporada Regular'
                        : 'Amistoso'}
                    </span>
                    {juego.temporada_nombre && (
                      <span className="text-[10px] text-gray-400">{juego.temporada_nombre}</span>
                    )}
                  </div>
                  <div className="p-4 flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-gray-500">{formatDate(juego.fecha, 'EEE')}</p>
                      <p className="font-bold">{formatDate(juego.fecha, 'dd/MM')}</p>
                      <p className="text-sm text-gray-500">{formatTime(juego.fecha)}</p>
                    </div>
                    <div className="flex-1 grid grid-cols-3 items-center gap-2">
                      <div className="flex flex-col items-end gap-1">
                        <TeamAvatar logo={juego.local_logo} color={juego.local_color} name={juego.local_corto || juego.local_nombre} size="sm" />
                        <p className="font-semibold text-sm">{juego.local_nombre}</p>
                      </div>
                      <div className="text-center">
                        <span className="badge-gray">VS</span>
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <TeamAvatar logo={juego.visitante_logo} color={juego.visitante_color} name={juego.visitante_corto || juego.visitante_nombre} size="sm" />
                        <p className="font-semibold text-sm">{juego.visitante_nombre}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-500">
              No hay juegos programados
            </div>
          )}

          {/* Últimos resultados */}
          <div className="flex justify-between items-center mt-8">
            <h2 className="text-xl font-bold text-gray-900">Últimos Resultados</h2>
          </div>

          {ultimosResultados.length > 0 ? (
            <div className="space-y-4">
              {ultimosResultados.map((juego) => (
                <Link
                  key={juego.id}
                  to={`/juegos/${juego.id}`}
                  className="card-hover overflow-hidden flex flex-col"
                >
                  <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      juego.torneo_id
                        ? juego.fase_juego === 'playoff' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {juego.torneo_id
                        ? juego.fase_juego === 'playoff' ? 'Playoff' : 'Temporada Regular'
                        : 'Amistoso'}
                    </span>
                    {juego.temporada_nombre && (
                      <span className="text-[10px] text-gray-400">{juego.temporada_nombre}</span>
                    )}
                  </div>
                  <div className="p-4 flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-gray-500">{formatDate(juego.fecha, 'dd/MM')}</p>
                      <span className="badge-success text-xs">Final</span>
                    </div>
                    <div className="flex-1 grid grid-cols-3 items-center gap-2">
                      <div className="flex flex-col items-end gap-1">
                        <TeamAvatar logo={juego.local_logo} color={juego.local_color} name={juego.local_corto || juego.local_nombre} size="sm" />
                        <p className={`font-semibold text-sm ${juego.puntos_local > juego.puntos_visitante ? 'text-green-600' : ''}`}>
                          {juego.local_nombre}
                        </p>
                      </div>
                      <div className="text-center">
                        <span className="font-display text-2xl">
                          {juego.puntos_local} - {juego.puntos_visitante}
                        </span>
                      </div>
                      <div className="flex flex-col items-start gap-1">
                        <TeamAvatar logo={juego.visitante_logo} color={juego.visitante_color} name={juego.visitante_corto || juego.visitante_nombre} size="sm" />
                        <p className={`font-semibold text-sm ${juego.puntos_visitante > juego.puntos_local ? 'text-green-600' : ''}`}>
                          {juego.visitante_nombre}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-500">
              No hay resultados disponibles
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tabla de posiciones mini */}
          <div className="card">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Posiciones</h3>
              <Link to="/posiciones" className="text-primary-500 text-sm">
                Ver completa
              </Link>
            </div>
            <div className="p-4">
              {posiciones.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="text-left font-medium pb-2">#</th>
                      <th className="text-left font-medium pb-2">Equipo</th>
                      <th className="text-center font-medium pb-2">G</th>
                      <th className="text-center font-medium pb-2">P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posiciones.map((equipo, index) => (
                      <tr key={equipo.equipo_id} className="border-t border-gray-50">
                        <td className="py-2 font-bold text-gray-400">{index + 1}</td>
                        <td className="py-2">
                          <Link
                            to={`/equipos/${equipo.equipo_id}`}
                            className="flex items-center gap-2 font-medium hover:text-primary-500"
                          >
                            <TeamAvatar logo={equipo.equipo_logo} color={equipo.equipo_color} name={equipo.equipo_corto || equipo.equipo_nombre} size="xs" />
                            {equipo.equipo_corto || equipo.equipo_nombre}
                          </Link>
                        </td>
                        <td className="py-2 text-center text-green-600">{equipo.ganados}</td>
                        <td className="py-2 text-center text-red-500">{equipo.perdidos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin datos</p>
              )}
            </div>
          </div>

          {/* Líderes */}
          <div className="card">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">
                <TrendingUp className="inline mr-2" size={18} />
                Líderes en Puntos
              </h3>
              <Link to="/estadisticas" className="text-primary-500 text-sm">
                Ver más
              </Link>
            </div>
            <div className="p-4">
              {lideres.length > 0 ? (
                <div className="space-y-3">
                  {lideres.map((jugador, index) => (
                    <Link
                      key={jugador.jugador_id}
                      to={`/jugadores/${jugador.jugador_id}`}
                      className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                        {jugador.nombre?.charAt(0)}{jugador.apellido?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {jugador.nombre} {jugador.apellido}
                        </p>
                        <p className="text-xs text-gray-500">{jugador.equipo_nombre}</p>
                      </div>
                      <span className="font-bold text-primary-500">{jugador.ppj}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Sin datos</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamAvatar({ logo, color, name, size = 'sm' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-10 h-10 text-sm',
  }
  const cls = sizes[size] || sizes.sm

  if (logo) {
    return <img src={logo} alt={name} className={`${cls} rounded-full object-cover`} />
  }
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center text-white font-bold`}
      style={{ backgroundColor: color || '#6B7280' }}
    >
      {(name || '').charAt(0)}
    </div>
  )
}
