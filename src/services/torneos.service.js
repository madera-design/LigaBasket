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

// ---- Reglamento PDF ----

export const uploadReglamento = async (torneoId, file) => {
  const fileExt = file.name.split('.').pop()
  const filePath = `torneos/${torneoId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('reglamentos')
    .upload(filePath, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('reglamentos').getPublicUrl(filePath)

  await updateTorneo(torneoId, { reglamento_url: data.publicUrl })
  return data.publicUrl
}

// ---- Materializar inscripciones ----

export const materializeInscripciones = async (torneoId) => {
  const { data: inscripciones, error } = await supabase
    .from('inscripciones')
    .select('*')
    .eq('torneo_id', torneoId)
    .eq('estado', 'aprobada')
  if (error) throw error

  if (inscripciones.length < 3) {
    throw new Error('Se necesitan al menos 3 equipos aprobados para iniciar el torneo')
  }

  const equipoIds = []

  for (const insc of inscripciones) {
    const { data: equipo, error: eqErr } = await supabase
      .from('equipos')
      .insert([{
        nombre: insc.nombre_equipo,
        nombre_corto: insc.nombre_corto || insc.nombre_equipo.substring(0, 4).toUpperCase(),
        entrenador: insc.delegado_nombre,
        delegate_name: insc.delegado_nombre,
        delegate_email: insc.delegado_email,
        logo_url: insc.logo_url || null,
        color_primario: insc.color_primario || '#f97316',
        color_secundario: insc.color_secundario || '#ffffff',
        activo: true,
      }])
      .select()
      .single()
    if (eqErr) throw eqErr

    equipoIds.push(equipo.id)

    const jugadores = (insc.jugadores || []).map(j => ({
      equipo_id: equipo.id,
      nombre: j.nombre,
      apellido: j.apellido,
      numero: Number(j.numero),
      posicion: j.posicion,
      altura_cm: j.altura ? Math.round(j.altura * 100) : null,
      peso_kg: j.peso || null,
      foto_url: j.foto_url || null,
      activo: true,
    }))

    if (jugadores.length > 0) {
      const { error: jugErr } = await supabase
        .from('jugadores')
        .insert(jugadores)
      if (jugErr) throw jugErr
    }

    await supabase
      .from('inscripciones')
      .update({ equipo_id: equipo.id })
      .eq('id', insc.id)
  }

  return equipoIds
}

// ---- Materializar UNA inscripcion (mid-torneo) ----

export const materializeSingleInscripcion = async (inscripcionId) => {
  const { data: insc, error } = await supabase
    .from('inscripciones')
    .select('*')
    .eq('id', inscripcionId)
    .single()
  if (error) throw error

  if (insc.estado !== 'aprobada') {
    throw new Error('La inscripcion debe estar aprobada')
  }

  const { data: equipo, error: eqErr } = await supabase
    .from('equipos')
    .insert([{
      nombre: insc.nombre_equipo,
      nombre_corto: insc.nombre_corto || insc.nombre_equipo.substring(0, 4).toUpperCase(),
      entrenador: insc.delegado_nombre,
      delegate_name: insc.delegado_nombre,
      delegate_email: insc.delegado_email,
      logo_url: insc.logo_url || null,
      color_primario: insc.color_primario || '#f97316',
      color_secundario: insc.color_secundario || '#ffffff',
      activo: true,
    }])
    .select()
    .single()
  if (eqErr) throw eqErr

  const jugadores = (insc.jugadores || []).map(j => ({
    equipo_id: equipo.id,
    nombre: j.nombre,
    apellido: j.apellido,
    numero: Number(j.numero),
    posicion: j.posicion,
    altura_cm: j.altura ? Math.round(j.altura * 100) : null,
    peso_kg: j.peso || null,
    foto_url: j.foto_url || null,
    activo: true,
  }))

  if (jugadores.length > 0) {
    const { error: jugErr } = await supabase
      .from('jugadores')
      .insert(jugadores)
    if (jugErr) throw jugErr
  }

  await supabase
    .from('inscripciones')
    .update({ equipo_id: equipo.id })
    .eq('id', insc.id)

  // Agregar al torneo
  await supabase
    .from('torneo_equipos')
    .insert([{ torneo_id: insc.torneo_id, equipo_id: equipo.id }])

  return { equipoId: equipo.id, torneoId: insc.torneo_id }
}

// ---- Regenerar calendario (preservando juegos finalizados) ----

export const regenerateCalendar = async (torneoId) => {
  // 1. Obtener torneo
  const { data: torneo, error: tErr } = await supabase
    .from('torneos')
    .select('*')
    .eq('id', torneoId)
    .single()
  if (tErr) throw tErr

  // 2. Obtener equipos del torneo
  const { data: torneoEquipos, error: teErr } = await supabase
    .from('torneo_equipos')
    .select('equipo_id')
    .eq('torneo_id', torneoId)
  if (teErr) throw teErr

  const teamIds = torneoEquipos.map(te => te.equipo_id)

  // 3. Obtener juegos existentes
  const { data: existingGames, error: gErr } = await supabase
    .from('juegos')
    .select('id, equipo_local_id, equipo_visitante_id, estado, fecha, fase_juego')
    .eq('torneo_id', torneoId)
    .in('fase_juego', ['ida', 'vuelta'])
  if (gErr) throw gErr

  // Separar finalizados de no-finalizados
  const finalized = existingGames.filter(g => g.estado === 'finalizado')
  const notFinalized = existingGames.filter(g => g.estado !== 'finalizado')

  // 4. Eliminar juegos no finalizados (no playoff)
  if (notFinalized.length > 0) {
    const deleteIds = notFinalized.map(g => g.id)
    const { error: delErr } = await supabase
      .from('juegos')
      .delete()
      .in('id', deleteIds)
    if (delErr) throw delErr
  }

  // 5. Generar round-robin completo con todos los equipos
  const { generateDoubleRoundRobin, assignDatesAndSlots } = await import('../utils/tournamentScheduler')
  const { allRounds } = generateDoubleRoundRobin(teamIds)

  // 6. Crear set de partidos ya jugados (finalizados)
  const playedPairs = new Set()
  finalized.forEach(g => {
    playedPairs.add(`${g.equipo_local_id}_${g.equipo_visitante_id}`)
  })

  // 7. Filtrar solo matchups no jugados
  const newRounds = allRounds.map(round =>
    round.filter(m => !playedPairs.has(`${m.home}_${m.away}`))
  ).filter(round => round.length > 0)

  // 8. Determinar fecha de inicio para nuevos juegos
  let startDate = torneo.fecha_inicio
  if (finalized.length > 0) {
    const lastDate = finalized.reduce((max, g) => g.fecha > max ? g.fecha : max, finalized[0].fecha)
    const nextDay = new Date(lastDate)
    nextDay.setDate(nextDay.getDate() + 1)
    startDate = nextDay.toISOString().split('T')[0]
  }

  // 9. Asignar fechas y crear juegos
  const games = assignDatesAndSlots(newRounds, {
    startDate,
    gameDays: torneo.dias_juego,
    timeSlots: torneo.horarios,
    lugar: torneo.lugar,
    temporadaId: torneo.temporada_id,
    torneoId: torneo.id,
  })

  let newGamesCreated = 0
  if (games.length > 0) {
    await createJuegosBulk(games)
    newGamesCreated = games.length
  }

  return {
    preservedGames: finalized.length,
    deletedGames: notFinalized.length,
    newGames: newGamesCreated,
  }
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
