import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { calcularPosiciones } from '../../services/estadisticas.service'
import { getEquipos } from '../../services/equipos.service'
import toast from 'react-hot-toast'

export default function TablaPosicionesPage() {
  const [posiciones, setPosiciones] = useState([])
  const [equiposSinJuegos, setEquiposSinJuegos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tabla, equipos] = await Promise.all([
          calcularPosiciones(),
          getEquipos()
        ])
        setPosiciones(tabla)

        // Equipos que no tienen juegos finalizados
        const idsConJuegos = new Set(tabla.map(e => e.equipo_id))
        const sinJuegos = equipos
          .filter(e => !idsConJuegos.has(e.id))
          .map(e => ({
            equipo_id: e.id,
            equipo_nombre: e.nombre,
            equipo_corto: e.nombre_corto,
            equipo_logo: e.logo_url,
            equipo_color: e.color_primario,
            juegos: 0, ganados: 0, perdidos: 0,
            puntos_favor: 0, puntos_contra: 0,
            diferencia: 0, pts: 0, porcentaje: 0,
            puntos_extras: 0,
          }))
        setEquiposSinJuegos(sinJuegos)
      } catch (error) {
        toast.error('Error al cargar posiciones')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner w-8 h-8"></div></div>
  }

  const allEquipos = [...posiciones, ...equiposSinJuegos]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Tabla de Posiciones</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gray-800 text-white text-center py-3 font-display text-lg tracking-wider">
          CLASIFICACION
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
              {allEquipos.map((equipo, index) => {
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
