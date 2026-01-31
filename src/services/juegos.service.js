import { supabase } from '../config/supabase'

const TABLE = 'juegos'

/**
 * Obtiene juegos con filtros
 */
export const getJuegos = async (filters = {}) => {
  let query = supabase
    .from('vista_calendario')
    .select('*')

  if (filters.temporadaId) {
    query = query.eq('temporada_id', filters.temporadaId)
  }

  if (filters.equipoId) {
    query = query.or(`local_id.eq.${filters.equipoId},visitante_id.eq.${filters.equipoId}`)
  }

  if (filters.torneoId) {
    query = query.eq('torneo_id', filters.torneoId)
  }

  if (filters.faseJuego) {
    query = query.eq('fase_juego', filters.faseJuego)
  }

  if (filters.estado) {
    query = query.eq('estado', filters.estado)
  }

  if (filters.jornada) {
    query = query.eq('jornada', filters.jornada)
  }

  if (filters.fechaInicio) {
    query = query.gte('fecha', filters.fechaInicio)
  }

  if (filters.fechaFin) {
    query = query.lte('fecha', filters.fechaFin)
  }

  // Ordenar por fecha
  query = query.order('fecha', { ascending: filters.ascending ?? false })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Obtiene próximos juegos
 */
export const getProximosJuegos = async (limit = 5) => {
  const { data, error } = await supabase
    .from('vista_calendario')
    .select('*')
    .in('estado', ['programado', 'en_juego'])
    .order('fecha', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Obtiene últimos resultados
 */
export const getUltimosResultados = async (limit = 5) => {
  const { data, error } = await supabase
    .from('vista_calendario')
    .select('*')
    .eq('estado', 'finalizado')
    .order('fecha', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Obtiene un juego por ID
 */
export const getJuegoById = async (id) => {
  const { data, error } = await supabase
    .from('vista_calendario')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene un juego con estadísticas de jugadores
 */
export const getJuegoWithStats = async (id) => {
  // Obtener juego
  const juego = await getJuegoById(id)

  // Obtener estadísticas
  const { data: stats, error } = await supabase
    .from('estadisticas_jugador')
    .select(`
      *,
      jugador:jugadores (
        id,
        nombre,
        apellido,
        numero,
        posicion
      )
    `)
    .eq('juego_id', id)
    .order('puntos', { ascending: false })

  if (error) throw error

  return {
    ...juego,
    estadisticas: stats,
  }
}

/**
 * Crea un nuevo juego
 */
export const createJuego = async (juego) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([juego])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualiza un juego
 */
export const updateJuego = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualiza el marcador de un juego
 */
export const updateMarcador = async (id, puntosLocal, puntosVisitante, marcadorCuartos = null) => {
  const updates = {
    puntos_local: puntosLocal,
    puntos_visitante: puntosVisitante,
  }

  if (marcadorCuartos) {
    updates.marcador_cuartos = marcadorCuartos
  }

  return updateJuego(id, updates)
}

/**
 * Finaliza un juego
 */
export const finalizarJuego = async (id, puntosLocal, puntosVisitante) => {
  return updateJuego(id, {
    estado: 'finalizado',
    puntos_local: puntosLocal,
    puntos_visitante: puntosVisitante,
  })
}

/**
 * Cancela un juego
 */
export const cancelarJuego = async (id, notas = null) => {
  const updates = { estado: 'cancelado' }
  if (notas) updates.notas = notas
  return updateJuego(id, updates)
}

/**
 * Suspende un juego
 */
export const suspenderJuego = async (id, notas = null) => {
  const updates = { estado: 'suspendido' }
  if (notas) updates.notas = notas
  return updateJuego(id, updates)
}

/**
 * Elimina un juego
 */
export const deleteJuego = async (id) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Obtiene juegos por equipo
 */
export const getJuegosByEquipo = async (equipoId, limit = 10) => {
  const { data, error } = await supabase
    .from('vista_calendario')
    .select('*')
    .or(`local_id.eq.${equipoId},visitante_id.eq.${equipoId}`)
    .order('fecha', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Obtiene calendario mensual
 */
export const getCalendarioMensual = async (year, month) => {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const { data, error } = await supabase
    .from('vista_calendario')
    .select('*')
    .gte('fecha', startDate.toISOString())
    .lte('fecha', endDate.toISOString())
    .order('fecha')

  if (error) throw error
  return data
}

export default {
  getJuegos,
  getProximosJuegos,
  getUltimosResultados,
  getJuegoById,
  getJuegoWithStats,
  createJuego,
  updateJuego,
  updateMarcador,
  finalizarJuego,
  cancelarJuego,
  suspenderJuego,
  deleteJuego,
  getJuegosByEquipo,
  getCalendarioMensual,
}
