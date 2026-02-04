import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { calcularPosiciones } from '../../services/estadisticas.service'
import { getTorneos, getTorneoActivo } from '../../services/torneos.service'
import { getCategoriasByTorneo } from '../../services/categorias.service'
import toast from 'react-hot-toast'

export default function TablaPosicionesPage() {
  const [posiciones, setPosiciones] = useState([])
  const [posicionesPorCategoria, setPosicionesPorCategoria] = useState({})
  const [torneos, setTorneos] = useState([])
  const [selectedTorneoId, setSelectedTorneoId] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [selectedCategoriaId, setSelectedCategoriaId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingTabla, setLoadingTabla] = useState(false)

  // Cargar torneos y seleccionar el activo
  useEffect(() => {
    const init = async () => {
      try {
        const [torneosData, activo] = await Promise.all([
          getTorneos(),
          getTorneoActivo()
        ])
        setTorneos(torneosData)
        if (activo) {
          setSelectedTorneoId(activo.id)
        } else if (torneosData.length > 0) {
          setSelectedTorneoId(torneosData[0].id)
        }
      } catch (error) {
        toast.error('Error al cargar torneos')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Cargar categorías y posiciones cuando cambia el torneo seleccionado
  useEffect(() => {
    if (!selectedTorneoId) return
    const fetchData = async () => {
      setLoadingTabla(true)
      setSelectedCategoriaId(null)
      try {
        const cats = await getCategoriasByTorneo(selectedTorneoId)
        setCategorias(cats || [])

        if (cats?.length > 0) {
          // Cargar posiciones por cada categoría
          const porCat = {}
          await Promise.all(cats.map(async (cat) => {
            const tabla = await calcularPosiciones(selectedTorneoId, cat.id)
            porCat[cat.id] = tabla
          }))
          setPosicionesPorCategoria(porCat)
          setPosiciones([])
        } else {
          const tabla = await calcularPosiciones(selectedTorneoId)
          setPosiciones(tabla)
          setPosicionesPorCategoria({})
        }
      } catch (error) {
        toast.error('Error al cargar posiciones')
        console.error(error)
      } finally {
        setLoadingTabla(false)
      }
    }
    fetchData()
  }, [selectedTorneoId])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
  }

  if (torneos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Tabla de Posiciones</h1>
        </div>
        <div className="card p-8 text-center text-gray-500">No hay torneos disponibles</div>
      </div>
    )
  }

  // Determinar qué equipos mostrar
  const getEquiposToShow = () => {
    if (categorias.length === 0) return posiciones
    if (selectedCategoriaId) return posicionesPorCategoria[selectedCategoriaId] || []
    return null // null = mostrar por categoría
  }

  const renderTable = (equipos, titulo = null) => {
    if (equipos.length === 0) {
      return <div className="card p-8 text-center text-gray-500">No hay juegos finalizados</div>
    }
    return (
      <div className="card overflow-hidden">
        <div className="bg-gray-800 text-white text-center py-3 font-display text-lg tracking-wider">
          {titulo || 'CLASIFICACION'}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-xs uppercase">
                <th className="px-3 py-3 text-left w-10">Pos</th>
                <th className="px-3 py-3 text-left">Equipos</th>
                <th className="px-3 py-3 text-center">Pts</th>
                <th className="px-3 py-3 text-center">J</th>
                <th className="px-3 py-3 text-center">G</th>
                <th className="px-3 py-3 text-center">P</th>
                <th className="px-3 py-3 text-center">PJ</th>
                <th className="px-3 py-3 text-center">PC</th>
                <th className="px-3 py-3 text-center">DP</th>
                <th className="px-3 py-3 text-center">%</th>
                <th className="px-3 py-3 text-center">PE</th>
              </tr>
            </thead>
            <tbody>
              {equipos.map((equipo, index) => {
                const isTop3 = index < 3
                return (
                  <tr
                    key={equipo.equipo_id}
                    className={`border-t transition-colors hover:bg-gray-50 ${
                      isTop3 ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="px-3 py-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                        index === 0 ? 'bg-yellow-400 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <Link
                        to={`/equipos/${equipo.equipo_id}`}
                        className="flex items-center gap-3 font-semibold hover:text-primary-500 transition-colors"
                      >
                        {equipo.equipo_logo ? (
                          <img src={equipo.equipo_logo} alt={equipo.equipo_nombre} className="w-8 h-8 object-contain" />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: equipo.equipo_color || '#6B7280' }}
                          >
                            {(equipo.equipo_corto || equipo.equipo_nombre || '').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        {equipo.equipo_nombre}
                      </Link>
                    </td>
                    <td className="px-3 py-4 text-center font-bold text-lg">{equipo.pts}</td>
                    <td className="px-3 py-4 text-center">{equipo.juegos}</td>
                    <td className="px-3 py-4 text-center font-medium text-green-600">{equipo.ganados}</td>
                    <td className="px-3 py-4 text-center font-medium text-red-500">{equipo.perdidos}</td>
                    <td className="px-3 py-4 text-center">{equipo.puntos_favor}</td>
                    <td className="px-3 py-4 text-center">{equipo.puntos_contra}</td>
                    <td className={`px-3 py-4 text-center font-medium ${
                      equipo.diferencia > 0 ? 'text-green-600' :
                      equipo.diferencia < 0 ? 'text-red-500' : ''
                    }`}>
                      {equipo.diferencia > 0 ? '+' : ''}{equipo.diferencia}
                    </td>
                    <td className="px-3 py-4 text-center">{equipo.porcentaje}</td>
                    <td className="px-3 py-4 text-center">{equipo.puntos_extras || 0}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const equiposToShow = getEquiposToShow()

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-white">Tabla de Posiciones</h1>
        <select
          value={selectedTorneoId || ''}
          onChange={(e) => setSelectedTorneoId(e.target.value)}
          className="bg-gray-700 text-white text-sm rounded-lg px-4 py-2 border-0 focus:ring-2 focus:ring-primary-500"
        >
          {torneos.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>

      {/* Selector de categoría */}
      {categorias.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategoriaId(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategoriaId === null
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoriaId(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategoriaId === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {loadingTabla ? (
        <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
      ) : equiposToShow !== null ? (
        // Una sola tabla (sin categorías o con categoría seleccionada)
        equiposToShow.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">No hay juegos finalizados en este torneo</div>
        ) : renderTable(equiposToShow)
      ) : (
        // Tablas separadas por categoría
        <div className="space-y-6">
          {categorias.map(cat => (
            <div key={cat.id}>
              {renderTable(posicionesPorCategoria[cat.id] || [], cat.nombre.toUpperCase())}
            </div>
          ))}
        </div>
      )}

      {/* Leyenda */}
      <div className="card p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
          <div><span className="font-bold">Pts</span> - Puntos</div>
          <div><span className="font-bold">J</span> - Juegos</div>
          <div><span className="font-bold">G</span> - Ganados</div>
          <div><span className="font-bold">P</span> - Perdidos</div>
          <div><span className="font-bold">PJ</span> - Puntos en Juego</div>
          <div><span className="font-bold">PC</span> - Puntos Contra</div>
          <div><span className="font-bold">DP</span> - Diferencia de Puntos</div>
          <div><span className="font-bold">%</span> - Aprovechamiento</div>
          <div><span className="font-bold">PE</span> - Puntos Extras</div>
        </div>
      </div>
    </div>
  )
}
