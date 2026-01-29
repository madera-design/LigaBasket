import { supabase } from '../config/supabase'

const TABLE = 'estadisticas_jugador'

/**
 * Obtiene estadísticas de un jugador
 */
export const getEstadisticasJugador = async (jugadorId) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      juego:juegos (
        id,
        fecha,
        estado,
        equipo_local_id,
        equipo_visitante_id,
        puntos_local,
        puntos_visitante
      )
    `)
    .eq('jugador_id', jugadorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Obtiene estadísticas promedio de un jugador
 */
export const getEstadisticasPromedioJugador = async (jugadorId) => {
  const { data, error } = await supabase
    .from('v_estadisticas_promedio_jugador')
    .select('*')
    .eq('jugador_id', jugadorId)
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene estadísticas de un juego
 */
export const getEstadisticasJuego = async (juegoId) => {
  const { data, error } = await supabase
    .from(TABLE)
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
    .eq('juego_id', juegoId)
    .order('puntos', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Guarda estadísticas de un jugador en un juego
 */
export const saveEstadisticasJugador = async (stats) => {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert([stats], {
      onConflict: 'juego_id,jugador_id',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Guarda estadísticas de múltiples jugadores
 */
export const saveEstadisticasMultiple = async (statsArray) => {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(statsArray, {
      onConflict: 'juego_id,jugador_id',
    })
    .select()

  if (error) throw error
  return data
}

/**
 * Elimina estadísticas de un juego
 */
export const deleteEstadisticasJuego = async (juegoId) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('juego_id', juegoId)

  if (error) throw error
  return true
}

/**
 * Obtiene líderes estadísticos
 */
export const getLideres = async (categoria = 'ppj', limit = 10) => {
  const { data, error } = await supabase
    .from('v_estadisticas_promedio_jugador')
    .select('*')
    .gt('juegos_jugados', 0)
    .order(categoria, { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Obtiene todos los promedios de jugadores
 */
export const getAllPromedios = async () => {
  const { data, error } = await supabase
    .from('v_estadisticas_promedio_jugador')
    .select('*')
    .gt('juegos_jugados', 0)
    .order('ppj', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Obtiene tabla de posiciones
 */
export const getTablaPosiciones = async (temporadaId = null) => {
  let query = supabase
    .from('v_tabla_posiciones')
    .select('*')

  if (temporadaId) {
    query = query.eq('temporada_id', temporadaId)
  }

  const { data, error } = await query.order('posicion')
  if (error) throw error
  return data
}

/**
 * Actualiza tabla de posiciones de un equipo
 */
export const updateTablaPosiciones = async (temporadaId, equipoId, stats) => {
  const { data, error } = await supabase
    .from('tabla_posiciones')
    .upsert([{
      temporada_id: temporadaId,
      equipo_id: equipoId,
      ...stats,
    }], {
      onConflict: 'temporada_id,equipo_id',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene récords de jugadores (máximos individuales)
 */
export const getRecords = async () => {
  const categories = ['puntos', 'asistencias', 'rebotes_defensivos', 'robos', 'bloqueos', 'triples_convertidos']
  const records = {}

  for (const cat of categories) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        ${cat},
        jugador:jugadores (
          nombre,
          apellido,
          numero
        ),
        juego:juegos (
          fecha
        )
      `)
      .order(cat, { ascending: false })
      .limit(1)
      .single()

    if (!error && data) {
      records[cat] = data
    }
  }

  return records
}

/**
 * Obtiene estadísticas head-to-head entre dos equipos
 */
export const getHeadToHead = async (equipo1Id, equipo2Id) => {
  const { data, error } = await supabase
    .from('juegos')
    .select('*')
    .eq('estado', 'finalizado')
    .or(`and(equipo_local_id.eq.${equipo1Id},equipo_visitante_id.eq.${equipo2Id}),and(equipo_local_id.eq.${equipo2Id},equipo_visitante_id.eq.${equipo1Id})`)
    .order('fecha', { ascending: false })

  if (error) throw error

  // Calcular victorias de cada equipo
  let equipo1Wins = 0
  let equipo2Wins = 0

  data.forEach(juego => {
    const equipo1EsLocal = juego.equipo_local_id === equipo1Id
    const localGana = juego.puntos_local > juego.puntos_visitante

    if ((equipo1EsLocal && localGana) || (!equipo1EsLocal && !localGana)) {
      equipo1Wins++
    } else {
      equipo2Wins++
    }
  })

  return {
    juegos: data,
    equipo1Wins,
    equipo2Wins,
    total: data.length,
  }
}

export default {
  getEstadisticasJugador,
  getEstadisticasPromedioJugador,
  getEstadisticasJuego,
  saveEstadisticasJugador,
  saveEstadisticasMultiple,
  deleteEstadisticasJuego,
  getLideres,
  getAllPromedios,
  getTablaPosiciones,
  updateTablaPosiciones,
  getRecords,
  getHeadToHead,
}
