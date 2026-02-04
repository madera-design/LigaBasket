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
    .from('vista_estadisticas_jugador')
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
 * Obtiene líderes estadísticos (filtrado por torneo)
 */
export const getLideres = async (categoria = 'ppj', limit = 10, torneoId = null) => {
  // Si hay filtro de torneo, calcular desde estadisticas_jugador + juegos
  if (torneoId) {
    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        *,
        jugador:jugadores!inner (
          id, nombre, apellido, numero, posicion,
          equipo:equipos (id, nombre, nombre_corto)
        ),
        juego:juegos!inner (torneo_id)
      `)
      .eq('juego.torneo_id', torneoId)

    if (error) throw error

    // Agrupar por jugador y calcular promedios
    const jugadorMap = {}
    data.forEach(s => {
      const jid = s.jugador_id
      if (!jugadorMap[jid]) {
        jugadorMap[jid] = {
          jugador_id: jid,
          nombre: s.jugador?.nombre || '',
          apellido: s.jugador?.apellido || '',
          numero: s.jugador?.numero || 0,
          equipo_id: s.jugador?.equipo?.id || null,
          equipo_nombre: s.jugador?.equipo?.nombre || '',
          equipo_corto: s.jugador?.equipo?.nombre_corto || '',
          juegos_jugados: 0,
          puntos_totales: 0,
          asistencias_total: 0,
          rebotes_total: 0,
          robos_total: 0,
          bloqueos_total: 0,
          triples_total: 0,
        }
      }
      const p = jugadorMap[jid]
      p.juegos_jugados++
      p.puntos_totales += s.puntos || 0
      p.asistencias_total += s.asistencias || 0
      p.rebotes_total += (s.rebotes_ofensivos || 0) + (s.rebotes_defensivos || 0)
      p.robos_total += s.robos || 0
      p.bloqueos_total += s.bloqueos || 0
      p.triples_total += s.triples_convertidos || 0
    })

    // Calcular promedios
    const result = Object.values(jugadorMap)
      .filter(p => p.juegos_jugados > 0)
      .map(p => ({
        ...p,
        ppj: parseFloat((p.puntos_totales / p.juegos_jugados).toFixed(1)),
        apj: parseFloat((p.asistencias_total / p.juegos_jugados).toFixed(1)),
        rpj: parseFloat((p.rebotes_total / p.juegos_jugados).toFixed(1)),
        robos_pj: parseFloat((p.robos_total / p.juegos_jugados).toFixed(1)),
        bloqueos_pj: parseFloat((p.bloqueos_total / p.juegos_jugados).toFixed(1)),
      }))

    result.sort((a, b) => (b[categoria] || 0) - (a[categoria] || 0))
    return result.slice(0, limit)
  }

  // Sin filtro de torneo: usar vista (comportamiento original)
  const { data, error } = await supabase
    .from('vista_estadisticas_jugador')
    .select('*')
    .gt('juegos_jugados', 0)
    .order(categoria, { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Obtiene todos los promedios de jugadores (filtrado por torneo)
 */
export const getAllPromedios = async (torneoId = null) => {
  if (torneoId) {
    // Usar getLideres con un limit alto para obtener todos
    return getLideres('ppj', 999, torneoId)
  }

  const { data, error } = await supabase
    .from('vista_estadisticas_jugador')
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
    .from('vista_posiciones')
    .select('*')

  if (temporadaId) {
    query = query.eq('temporada_id', temporadaId)
  }

  const { data, error } = await query.order('posicion')
  if (error) throw error
  return data
}

/**
 * Calcula tabla de posiciones desde juegos finalizados
 * Pts: G*2 + P*1, ordenado por Pts desc, DP desc
 */
export const calcularPosiciones = async (torneoId = null, categoriaId = null) => {
  let query = supabase
    .from('vista_calendario')
    .select('*')
    .eq('estado', 'finalizado')

  if (torneoId) {
    query = query.eq('torneo_id', torneoId)
  } else {
    query = query.not('torneo_id', 'is', null)
  }

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId)
  }

  const { data: juegos, error } = await query

  if (error) throw error

  const equiposMap = {}

  juegos.forEach(j => {
    // Inicializar equipos si no existen
    if (!equiposMap[j.local_id]) {
      equiposMap[j.local_id] = {
        equipo_id: j.local_id,
        equipo_nombre: j.local_nombre,
        equipo_corto: j.local_corto,
        equipo_logo: j.local_logo,
        equipo_color: j.local_color,
        juegos: 0, ganados: 0, perdidos: 0,
        puntos_favor: 0, puntos_contra: 0,
        puntos_extras: 0,
      }
    }
    if (!equiposMap[j.visitante_id]) {
      equiposMap[j.visitante_id] = {
        equipo_id: j.visitante_id,
        equipo_nombre: j.visitante_nombre,
        equipo_corto: j.visitante_corto,
        equipo_logo: j.visitante_logo,
        equipo_color: j.visitante_color,
        juegos: 0, ganados: 0, perdidos: 0,
        puntos_favor: 0, puntos_contra: 0,
        puntos_extras: 0,
      }
    }

    const local = equiposMap[j.local_id]
    const visitante = equiposMap[j.visitante_id]

    // Local
    local.juegos++
    local.puntos_favor += j.puntos_local
    local.puntos_contra += j.puntos_visitante
    if (j.puntos_local > j.puntos_visitante) {
      local.ganados++
    } else {
      local.perdidos++
    }

    // Visitante
    visitante.juegos++
    visitante.puntos_favor += j.puntos_visitante
    visitante.puntos_contra += j.puntos_local
    if (j.puntos_visitante > j.puntos_local) {
      visitante.ganados++
    } else {
      visitante.perdidos++
    }
  })

  // Calcular campos derivados y ordenar
  const tabla = Object.values(equiposMap).map(e => ({
    ...e,
    pts: e.ganados * 2 + e.perdidos * 1,
    diferencia: e.puntos_favor - e.puntos_contra,
    porcentaje: e.juegos > 0 ? Math.round((e.ganados / e.juegos) * 100) : 0,
  }))

  tabla.sort((a, b) => b.pts - a.pts || b.diferencia - a.diferencia)

  return tabla
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

/**
 * Obtiene líderes por totales acumulados de una categoría
 */
export const getLideresTotales = async (categoria = 'puntos', limit = 10, torneoId = null) => {
  let query = supabase
    .from(TABLE)
    .select(`
      jugador_id,
      puntos,
      triples_convertidos,
      asistencias,
      bloqueos,
      robos,
      rebotes_ofensivos,
      rebotes_defensivos,
      jugador:jugadores (
        id, nombre, apellido, numero, foto_url,
        equipo:equipos (
          id, nombre, nombre_corto
        )
      ),
      juego:juegos!inner (torneo_id)
    `)

  if (torneoId) {
    query = query.eq('juego.torneo_id', torneoId)
  } else {
    query = query.not('juego.torneo_id', 'is', null)
  }

  const { data, error } = await query

  if (error) throw error

  const jugadorMap = {}
  data.forEach(s => {
    const jid = s.jugador_id
    if (!jugadorMap[jid]) {
      jugadorMap[jid] = {
        jugador_id: jid,
        nombre: s.jugador?.nombre || '',
        apellido: s.jugador?.apellido || '',
        numero: s.jugador?.numero || 0,
        foto_url: s.jugador?.foto_url || null,
        equipo_nombre: s.jugador?.equipo?.nombre || '',
        equipo_corto: s.jugador?.equipo?.nombre_corto || '',
        total: 0,
      }
    }
    let valor = 0
    if (categoria === 'rebotes') {
      valor = (s.rebotes_ofensivos || 0) + (s.rebotes_defensivos || 0)
    } else {
      valor = s[categoria] || 0
    }
    jugadorMap[jid].total += valor
  })

  return Object.values(jugadorMap)
    .filter(j => j.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

export default {
  getEstadisticasJugador,
  getEstadisticasPromedioJugador,
  getEstadisticasJuego,
  saveEstadisticasJugador,
  saveEstadisticasMultiple,
  deleteEstadisticasJuego,
  getLideres,
  getLideresTotales,
  getAllPromedios,
  getTablaPosiciones,
  calcularPosiciones,
  updateTablaPosiciones,
  getRecords,
  getHeadToHead,
}
