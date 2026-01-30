import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getJugadorById } from '../../services/jugadores.service'
import { getEstadisticasJugador, getEstadisticasPromedioJugador } from '../../services/estadisticas.service'
import toast from 'react-hot-toast'

export default function JugadorDetailPage() {
  const { id } = useParams()
  const [jugador, setJugador] = useState(null)
  const [promedios, setPromedios] = useState(null)
  const [estadisticas, setEstadisticas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jugadorData = await getJugadorById(id)
        setJugador(jugadorData)

        const [promediosResult, statsResult] = await Promise.allSettled([
          getEstadisticasPromedioJugador(id),
          getEstadisticasJugador(id),
        ])

        if (promediosResult.status === 'fulfilled') setPromedios(promediosResult.value)
        if (statsResult.status === 'fulfilled') setEstadisticas(statsResult.value)
      } catch (error) {
        toast.error('Error al cargar datos del jugador')
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

  if (!jugador) {
    return <div className="card p-8 text-center text-gray-500">Jugador no encontrado</div>
  }

  // Totales acumulados
  const totales = estadisticas.reduce((acc, s) => ({
    juegos: acc.juegos + 1,
    puntos: acc.puntos + (s.puntos || 0),
    asistencias: acc.asistencias + (s.asistencias || 0),
    rebotes: acc.rebotes + (s.rebotes_ofensivos || 0) + (s.rebotes_defensivos || 0),
    robos: acc.robos + (s.robos || 0),
    bloqueos: acc.bloqueos + (s.bloqueos || 0),
    triples_c: acc.triples_c + (s.triples_convertidos || 0),
    triples_i: acc.triples_i + (s.triples_intentados || 0),
    tc_c: acc.tc_c + (s.tiros_campo_convertidos || 0),
    tc_i: acc.tc_i + (s.tiros_campo_intentados || 0),
    tl_c: acc.tl_c + (s.tiros_libres_convertidos || 0),
    tl_i: acc.tl_i + (s.tiros_libres_intentados || 0),
    faltas: acc.faltas + (s.faltas || 0),
    perdidas: acc.perdidas + (s.perdidas || 0),
  }), {
    juegos: 0, puntos: 0, asistencias: 0, rebotes: 0, robos: 0, bloqueos: 0,
    triples_c: 0, triples_i: 0, tc_c: 0, tc_i: 0, tl_c: 0, tl_i: 0, faltas: 0, perdidas: 0,
  })

  const pct = (made, attempted) => attempted > 0 ? ((made / attempted) * 100).toFixed(1) + '%' : '0.0%'
  const avg = (val) => totales.juegos > 0 ? (val / totales.juegos).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/equipos" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Volver
      </Link>

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="bg-gray-800 p-6 sm:p-8">
          <div className="flex items-center gap-6">
            {jugador.foto_url ? (
              <img src={jugador.foto_url} alt={jugador.nombre} className="w-24 h-24 rounded-full object-cover border-4 border-white/20" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/20">
                {jugador.nombre?.charAt(0)}{jugador.apellido?.charAt(0)}
              </div>
            )}
            <div className="text-white">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-display">
                  {jugador.nombre} {jugador.apellido}
                </h1>
                <span className="text-4xl font-display text-gray-400">#{jugador.numero}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-gray-300 text-sm flex-wrap">
                {jugador.posicion && <span className="bg-white/10 px-3 py-1 rounded-full">{jugador.posicion}</span>}
                {jugador.altura_cm && <span>{(jugador.altura_cm / 100).toFixed(2)} m</span>}
                {jugador.peso_kg && <span>{jugador.peso_kg} kg</span>}
              </div>
              {jugador.equipo && (
                <Link to={`/equipos/${jugador.equipo.id}`} className="inline-flex items-center gap-2 mt-3 hover:text-primary-300 transition-colors">
                  {jugador.equipo.logo_url ? (
                    <img src={jugador.equipo.logo_url} alt={jugador.equipo.nombre} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: jugador.equipo.color_primario || '#6B7280' }}>
                      {(jugador.equipo.nombre_corto || jugador.equipo.nombre || '').charAt(0)}
                    </div>
                  )}
                  <span>{jugador.equipo.nombre}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Puntos" total={totales.puntos} avg={avg(totales.puntos)} avgLabel="PPJ" />
        <StatCard label="Asistencias" total={totales.asistencias} avg={avg(totales.asistencias)} avgLabel="APJ" />
        <StatCard label="Rebotes" total={totales.rebotes} avg={avg(totales.rebotes)} avgLabel="RPJ" />
        <StatCard label="Robos" total={totales.robos} avg={avg(totales.robos)} avgLabel="RPJ" />
      </div>

      {/* Shooting & Totals */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Porcentajes de tiro */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Porcentajes de Tiro</h3>
          <div className="space-y-4">
            <ShootingBar label="Tiros de Campo" made={totales.tc_c} attempted={totales.tc_i} pct={pct(totales.tc_c, totales.tc_i)} />
            <ShootingBar label="Triples" made={totales.triples_c} attempted={totales.triples_i} pct={pct(totales.triples_c, totales.triples_i)} />
            <ShootingBar label="Tiros Libres" made={totales.tl_c} attempted={totales.tl_i} pct={pct(totales.tl_c, totales.tl_i)} />
          </div>
        </div>

        {/* Resumen */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Resumen General</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0 text-sm">
            <SummaryRow label="Juegos" value={totales.juegos} />
            <SummaryRow label="Puntos" value={totales.puntos} />
            <SummaryRow label="Asistencias" value={totales.asistencias} />
            <SummaryRow label="Rebotes" value={totales.rebotes} />
            <SummaryRow label="Robos" value={totales.robos} />
            <SummaryRow label="Bloqueos" value={totales.bloqueos} />
            <SummaryRow label="Perdidas" value={totales.perdidas} />
            <SummaryRow label="Faltas" value={totales.faltas} />
          </div>
        </div>
      </div>

      {/* Game-by-game stats */}
      {estadisticas.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Estadisticas por Juego</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-center">PTS</th>
                  <th className="px-3 py-3 text-center">TC</th>
                  <th className="px-3 py-3 text-center">3P</th>
                  <th className="px-3 py-3 text-center">TL</th>
                  <th className="px-3 py-3 text-center">REB</th>
                  <th className="px-3 py-3 text-center">AST</th>
                  <th className="px-3 py-3 text-center">STL</th>
                  <th className="px-3 py-3 text-center">BLK</th>
                  <th className="px-3 py-3 text-center">TO</th>
                  <th className="px-3 py-3 text-center">PF</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.map((s) => {
                  const fecha = s.juego?.fecha
                    ? new Date(s.juego.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                    : '-'
                  return (
                    <tr key={s.id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 text-gray-600">{fecha}</td>
                      <td className="px-3 py-3 text-center font-bold">{s.puntos}</td>
                      <td className="px-3 py-3 text-center">{s.tiros_campo_convertidos}/{s.tiros_campo_intentados}</td>
                      <td className="px-3 py-3 text-center">{s.triples_convertidos}/{s.triples_intentados}</td>
                      <td className="px-3 py-3 text-center">{s.tiros_libres_convertidos}/{s.tiros_libres_intentados}</td>
                      <td className="px-3 py-3 text-center">{(s.rebotes_ofensivos || 0) + (s.rebotes_defensivos || 0)}</td>
                      <td className="px-3 py-3 text-center">{s.asistencias}</td>
                      <td className="px-3 py-3 text-center">{s.robos}</td>
                      <td className="px-3 py-3 text-center">{s.bloqueos}</td>
                      <td className="px-3 py-3 text-center">{s.perdidas}</td>
                      <td className="px-3 py-3 text-center">{s.faltas}</td>
                    </tr>
                  )
                })}
                {/* Totals row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="px-3 py-3">TOTAL</td>
                  <td className="px-3 py-3 text-center">{totales.puntos}</td>
                  <td className="px-3 py-3 text-center">{totales.tc_c}/{totales.tc_i}</td>
                  <td className="px-3 py-3 text-center">{totales.triples_c}/{totales.triples_i}</td>
                  <td className="px-3 py-3 text-center">{totales.tl_c}/{totales.tl_i}</td>
                  <td className="px-3 py-3 text-center">{totales.rebotes}</td>
                  <td className="px-3 py-3 text-center">{totales.asistencias}</td>
                  <td className="px-3 py-3 text-center">{totales.robos}</td>
                  <td className="px-3 py-3 text-center">{totales.bloqueos}</td>
                  <td className="px-3 py-3 text-center">{totales.perdidas}</td>
                  <td className="px-3 py-3 text-center">{totales.faltas}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {estadisticas.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          No hay estadisticas registradas para este jugador
        </div>
      )}
    </div>
  )
}

function StatCard({ label, total, avg, avgLabel }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-3xl font-display text-gray-900">{total}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      <p className="text-sm text-primary-500 font-medium mt-1">{avg} {avgLabel}</p>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function ShootingBar({ label, made, attempted, pct }) {
  const pctNum = attempted > 0 ? (made / attempted) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{made}/{attempted} ({pct})</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(pctNum, 100)}%` }}
        />
      </div>
    </div>
  )
}
