import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { getEquipos } from '../../services/equipos.service'

export default function EquiposPage() {
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        const data = await getEquipos()
        setEquipos(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEquipos()
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
      <div className="page-header">
        <h1 className="page-title">Equipos</h1>
        <p className="page-subtitle">Todos los equipos de la liga</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipos.map((equipo) => (
          <Link
            key={equipo.id}
            to={`/equipos/${equipo.id}`}
            className="card-hover p-6"
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: equipo.color_primario || '#6b7280' }}
              >
                {equipo.nombre_corto || equipo.nombre.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg">{equipo.nombre}</h3>
                {equipo.entrenador && (
                  <p className="text-sm text-gray-500">DT: {equipo.entrenador}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {equipos.length === 0 && (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <p className="empty-state-title">No hay equipos</p>
          <p className="empty-state-description">Aún no se han registrado equipos</p>
        </div>
      )}
    </div>
  )
}
