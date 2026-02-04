import { Link } from 'react-router-dom'
import { Calendar, Users, Trophy, ArrowRight, TrendingUp, ClipboardList, MapPin, Award, Clock, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getProximosJuegos, getUltimosResultados } from '../../services/juegos.service'
import { calcularPosiciones, getLideres } from '../../services/estadisticas.service'
import { getTorneoActivo } from '../../services/torneos.service'
import { getCategoriasByTorneo } from '../../services/categorias.service'
import { getTorneosConInscripcionAbierta } from '../../services/inscripciones.service'
import { formatDate, formatTime } from '../../utils/formatters'

export default function HomePage() {
  const [proximosJuegos, setProximosJuegos] = useState([])
  const [ultimosResultados, setUltimosResultados] = useState([])
  const [posicionesPorCategoria, setPosicionesPorCategoria] = useState([])
  const [lideresPorCategoria, setLideresPorCategoria] = useState([])
  const [torneosAbiertos, setTorneosAbiertos] = useState([])
  const [torneoActivo, setTorneoActivo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [catTab, setCatTab] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activo = await getTorneoActivo()
        setTorneoActivo(activo)
        const torneoId = activo?.id || null

        const [juegos, resultados, torneosInsc] = await Promise.all([
          getProximosJuegos(3),
          getUltimosResultados(3),
          getTorneosConInscripcionAbierta(),
        ])
        setProximosJuegos(juegos)
        setUltimosResultados(resultados)

        // Cargar categorias de cada torneo abierto
        const torneosConCats = await Promise.all(
          torneosInsc.map(async t => {
            const cats = await getCategoriasByTorneo(t.id)
            return { ...t, categorias: cats || [] }
          })
        )
        setTorneosAbiertos(torneosConCats)

        // Cargar posiciones y lideres por categoria
        if (torneoId) {
          const cats = await getCategoriasByTorneo(torneoId)
          if (cats && cats.length > 0) {
            const posData = []
            const lidData = []
            for (const cat of cats) {
              const [tabla, lids] = await Promise.all([
                calcularPosiciones(torneoId, cat.id),
                getLideres('ppj', 5, torneoId),
              ])
              posData.push({ categoria: cat.nombre, equipos: tabla.slice(0, 5) })
              lidData.push({ categoria: cat.nombre, jugadores: lids })
            }
            setPosicionesPorCategoria(posData)
            setLideresPorCategoria(lidData)
          } else {
            const [tabla, lids] = await Promise.all([
              calcularPosiciones(torneoId),
              getLideres('ppj', 5, torneoId),
            ])
            setPosicionesPorCategoria([{ categoria: null, equipos: tabla.slice(0, 5) }])
            setLideresPorCategoria([{ categoria: null, jugadores: lids }])
          }
        }
      } catch (error) {
        console.error('Error loading home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar categorias con datos para no mostrar vacias
  const posConDatos = posicionesPorCategoria.filter(g => g.equipos.length > 0)
  const lidConDatos = lideresPorCategoria.filter(g => g.jugadores.length > 0)
  const haySidebar = posConDatos.length > 0 || lidConDatos.length > 0

  // Categorias unicas para tabs del sidebar
  const categoriasUnicas = [...new Set([
    ...posConDatos.map(g => g.categoria),
    ...lidConDatos.map(g => g.categoria),
  ])]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner w-10 h-10"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero con info del torneo activo */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-primary-500 blur-3xl"></div>
          <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-yellow-500 blur-3xl"></div>
        </div>
        <div className="relative px-8 py-12 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-display text-white mb-3">
                LIGA DE BASQUETBOL
              </h1>
              {torneoActivo ? (
                <div className="space-y-2">
                  <p className="text-primary-300 font-medium">{torneoActivo.nombre}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                    {torneoActivo.lugar && (
                      <span className="flex items-center gap-1"><MapPin size={14} /> {torneoActivo.lugar}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {formatDate(torneoActivo.fecha_inicio, 'dd/MM/yyyy')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      torneoActivo.fase === 'regular' ? 'bg-green-500/20 text-green-300' :
                      torneoActivo.fase === 'playoff' ? 'bg-orange-500/20 text-orange-300' :
                      torneoActivo.fase === 'inscripcion' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {torneoActivo.fase === 'regular' ? 'Temporada Regular' :
                       torneoActivo.fase === 'playoff' ? 'Playoffs' :
                       torneoActivo.fase === 'inscripcion' ? 'Inscripciones' :
                       torneoActivo.fase}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-lg max-w-xl">
                  Sigue todos los partidos, estadísticas y resultados.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/calendario" className="btn-primary">
                <Calendar size={18} />
                Calendario
              </Link>
              <Link to="/posiciones" className="btn bg-white/10 text-white hover:bg-white/20">
                <Trophy size={18} />
                Posiciones
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Inscripciones abiertas - banner llamativo */}
      {torneosAbiertos.length > 0 && (
        <section>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                  <ClipboardList size={16} className="text-white" />
                </span>
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
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-yellow-100 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{torneo.nombre}</h3>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 transition-colors mt-0.5 shrink-0" />
                  </div>
                  {torneo.descripcion && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{torneo.descripcion}</p>
                  )}
                  {(torneo.premio_1er_lugar || torneo.premio_2do_lugar || torneo.premio_3er_lugar) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {torneo.premio_1er_lugar && (
                        <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          <Award size={11} /> 1ro: {torneo.premio_1er_lugar}
                        </span>
                      )}
                      {torneo.premio_2do_lugar && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          2do: {torneo.premio_2do_lugar}
                        </span>
                      )}
                      {torneo.premio_3er_lugar && (
                        <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                          3ro: {torneo.premio_3er_lugar}
                        </span>
                      )}
                    </div>
                  )}
                  {torneo.categorias?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {torneo.categorias.map(cat => (
                        <span key={cat.id} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          {cat.nombre}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    {torneo.lugar && (
                      <span className="flex items-center gap-1"><MapPin size={12} /> {torneo.lugar}</span>
                    )}
                    {torneo.fecha_inscripcion_fin && (
                      <span className="text-orange-600 font-semibold flex items-center gap-1">
                        <Clock size={12} /> Cierra {formatDate(torneo.fecha_inscripcion_fin, 'dd/MM')}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className={`grid ${haySidebar ? 'lg:grid-cols-3' : ''} gap-8`}>
        {/* Columna principal */}
        <div className={`${haySidebar ? 'lg:col-span-2' : ''} space-y-8`}>
          {/* Proximos juegos */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-primary-500" />
                Próximos Juegos
              </h2>
              <Link to="/calendario" className="text-primary-500 hover:text-primary-600 flex items-center gap-1 text-sm font-medium">
                Ver todos <ArrowRight size={16} />
              </Link>
            </div>

            {proximosJuegos.length > 0 ? (
              <div className="space-y-3">
                {proximosJuegos.map((juego) => (
                  <Link
                    key={juego.id}
                    to={`/juegos/${juego.id}`}
                    className="card-hover overflow-hidden flex flex-col"
                  >
                    <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          juego.torneo_id
                            ? juego.fase_juego === 'playoff' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {juego.torneo_id
                            ? juego.fase_juego === 'playoff' ? 'Playoff' : 'Temporada Regular'
                            : 'Amistoso'}
                        </span>
                        {juego.categoria_nombre && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {juego.categoria_nombre}
                          </span>
                        )}
                      </div>
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
              <div className="card p-10 text-center">
                <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 font-medium">No hay juegos programados</p>
                <Link to="/calendario" className="text-primary-500 text-sm mt-2 inline-block hover:underline">
                  Ver calendario completo
                </Link>
              </div>
            )}
          </section>

          {/* Últimos resultados */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" />
                Últimos Resultados
              </h2>
            </div>

            {ultimosResultados.length > 0 ? (
              <div className="space-y-3">
                {ultimosResultados.map((juego) => (
                  <Link
                    key={juego.id}
                    to={`/juegos/${juego.id}`}
                    className="card-hover overflow-hidden flex flex-col"
                  >
                    <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          juego.torneo_id
                            ? juego.fase_juego === 'playoff' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {juego.torneo_id
                            ? juego.fase_juego === 'playoff' ? 'Playoff' : 'Temporada Regular'
                            : 'Amistoso'}
                        </span>
                        {juego.categoria_nombre && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                            {juego.categoria_nombre}
                          </span>
                        )}
                      </div>
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
              <div className="card p-10 text-center">
                <Trophy size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 font-medium">No hay resultados disponibles</p>
                <p className="text-gray-300 text-sm mt-1">Los resultados aparecerán cuando se jueguen partidos</p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar - solo si hay datos */}
        {haySidebar && (
          <div className="space-y-6">
            {/* Tabs de categoria si hay multiples */}
            {categoriasUnicas.length > 1 && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {categoriasUnicas.map((cat, i) => (
                  <button
                    key={cat || 'all'}
                    onClick={() => setCatTab(i)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      catTab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {cat || 'General'}
                  </button>
                ))}
              </div>
            )}

            {/* Tabla de posiciones */}
            {(() => {
              const grupo = categoriasUnicas.length > 1
                ? posConDatos.find(g => g.categoria === categoriasUnicas[catTab])
                : posConDatos[0]
              if (!grupo) return null
              return (
                <div className="card">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Trophy size={16} className="text-yellow-500" />
                      Posiciones
                    </h3>
                    <Link to="/posiciones" className="text-primary-500 text-sm hover:underline">
                      Ver completa
                    </Link>
                  </div>
                  <div className="p-4">
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
                        {grupo.equipos.map((equipo, index) => (
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
                  </div>
                </div>
              )
            })()}

            {/* Líderes */}
            {(() => {
              const grupo = categoriasUnicas.length > 1
                ? lidConDatos.find(g => g.categoria === categoriasUnicas[catTab])
                : lidConDatos[0]
              if (!grupo) return null
              return (
                <div className="card">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary-500" />
                      Líderes en Puntos
                    </h3>
                    <Link to="/estadisticas" className="text-primary-500 text-sm hover:underline">
                      Ver más
                    </Link>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {grupo.jugadores.map((jugador, index) => (
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
                  </div>
                </div>
              )
            })()}
          </div>
        )}
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
