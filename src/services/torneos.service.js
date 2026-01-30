import { supabase } from '../config/supabase'

// ---- Temporadas ----

export const createTemporada = async (temporada) => {
  const { data, error } = await supabase
    .from('temporadas')
    .insert([temporada])
    .select()
    .single()
  if (error) throw error
  return data
}

export const getTemporadas = async () => {
  const { data, error } = await supabase
    .from('temporadas')
    .select('*')
    .order('fecha_inicio', { ascending: false })
  if (error) throw error
  return data
}

// ---- Torneos CRUD ----

export const createTorneo = async (torneo) => {
  const { data, error } = await supabase
    .from('torneos')
    .insert([torneo])
    .select()
    .single()
  if (error) throw error
  return data
}

export const getTorneos = async () => {
  const { data, error } = await supabase
    .from('torneos')
    .select(`*, temporada:temporadas(nombre)`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const getTorneoById = async (id) => {
  const { data, error } = await supabase
    .from('torneos')
    .select(`*, temporada:temporadas(*)`)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const updateTorneo = async (id, updates) => {
  const { data, error } = await supabase
    .from('torneos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteTorneo = async (id) => {
  // 1. Obtener torneo para saber la temporada_id
  const { data: torneo, error: errTorneo } = await supabase
    .from('torneos')
    .select('temporada_id')
    .eq('id', id)
    .single()
  if (errTorneo) throw errTorneo

  // 2. Obtener IDs de juegos del torneo
  const { data: juegos, error: errJuegos } = await supabase
    .from('juegos')
    .select('id')
    .eq('torneo_id', id)
  if (errJuegos) throw errJuegos

  const juegoIds = juegos.map(j => j.id)

  // 3. Eliminar estadisticas de esos juegos
  if (juegoIds.length > 0) {
    const { error: errStats } = await supabase
      .from('estadisticas_jugador')
      .delete()
      .in('juego_id', juegoIds)
    if (errStats) throw errStats
  }

  // 4. Eliminar juegos del torneo
  if (juegoIds.length > 0) {
    const { error: errDelJuegos } = await supabase
      .from('juegos')
      .delete()
      .eq('torneo_id', id)
    if (errDelJuegos) throw errDelJuegos
  }

  // 5. Eliminar series de playoff
  const { error: errSeries } = await supabase
    .from('series_playoff')
    .delete()
    .eq('torneo_id', id)
  if (errSeries) throw errSeries

  // 6. Eliminar equipos del torneo
  const { error: errEquipos } = await supabase
    .from('torneo_equipos')
    .delete()
    .eq('torneo_id', id)
  if (errEquipos) throw errEquipos

  // 7. Eliminar el torneo
  const { error: errDel } = await supabase
    .from('torneos')
    .delete()
    .eq('id', id)
  if (errDel) throw errDel

  // 8. Eliminar la temporada asociada
  if (torneo.temporada_id) {
    const { error: errTemp } = await supabase
      .from('temporadas')
      .delete()
      .eq('id', torneo.temporada_id)
    if (errTemp) console.warn('No se pudo eliminar la temporada:', errTemp.message)
  }

  return true
}

export const getTorneoActivo = async () => {
  // Buscar torneo en fase activa (regular o playoffs)
  const { data, error } = await supabase
    .from('torneos')
    .select('*')
    .in('fase', ['regular', 'playoffs'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  // Si no hay activo, retornar el mas reciente de cualquier fase
  if (!data) {
    const { data: fallback, error: err2 } = await supabase
      .from('torneos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (err2) throw err2
    return fallback
  }

  return data
}

// ---- Torneo Equipos ----

export const addTorneoEquipos = async (torneoId, equipoIds) => {
  const rows = equipoIds.map(eqId => ({
    torneo_id: torneoId,
    equipo_id: eqId,
  }))
  const { data, error } = await supabase
    .from('torneo_equipos')
    .insert(rows)
    .select()
  if (error) throw error
  return data
}

export const getTorneoEquipos = async (torneoId) => {
  const { data, error } = await supabase
    .from('torneo_equipos')
    .select(`*, equipo:equipos(id, nombre, nombre_corto, logo_url, color_primario, activo)`)
    .eq('torneo_id', torneoId)
  if (error) throw error
  return data
}

// ---- Bulk game creation ----

export const createJuegosBulk = async (games) => {
  const { data, error } = await supabase
    .from('juegos')
    .insert(games)
    .select()
  if (error) throw error
  return data
}

// ---- Series Playoff ----

export const createSeriesPlayoff = async (seriesArray) => {
  const { data, error } = await supabase
    .from('series_playoff')
    .insert(seriesArray)
    .select()
  if (error) throw error
  return data
}

export const getSeriesPlayoff = async (torneoId) => {
  const { data, error } = await supabase
    .from('series_playoff')
    .select(`
      *,
      equipo_superior:equipos!series_playoff_equipo_superior_id_fkey(id, nombre, nombre_corto, logo_url, color_primario),
      equipo_inferior:equipos!series_playoff_equipo_inferior_id_fkey(id, nombre, nombre_corto, logo_url, color_primario),
      ganador:equipos!series_playoff_ganador_id_fkey(id, nombre, nombre_corto)
    `)
    .eq('torneo_id', torneoId)
    .order('ronda')
    .order('numero_serie')
  if (error) throw error
  return data
}

export const updateSeriePlayoff = async (id, updates) => {
  const { data, error } = await supabase
    .from('series_playoff')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ---- Conteo de juegos por torneo ----

export const getTorneoGameStats = async (torneoId) => {
  const { data, error } = await supabase
    .from('juegos')
    .select('id, estado, fase_juego')
    .eq('torneo_id', torneoId)
  if (error) throw error

  const total = data.length
  const finalizados = data.filter(g => g.estado === 'finalizado').length
  const regulares = data.filter(g => g.fase_juego !== 'playoff').length
  const regularesFinalizados = data.filter(g => g.fase_juego !== 'playoff' && g.estado === 'finalizado').length
  const playoffs = data.filter(g => g.fase_juego === 'playoff').length

  return { total, finalizados, regulares, regularesFinalizados, playoffs }
}
