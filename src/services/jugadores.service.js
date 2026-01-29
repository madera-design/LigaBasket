import { supabase } from '../config/supabase'

const TABLE = 'jugadores'

/**
 * Obtiene todos los jugadores
 */
export const getJugadores = async (filters = {}) => {
  let query = supabase
    .from(TABLE)
    .select(`
      *,
      equipo:equipos (
        id,
        nombre,
        nombre_corto,
        logo_url,
        color_primario
      )
    `)
    .order('apellido')

  if (filters.equipoId) {
    query = query.eq('equipo_id', filters.equipoId)
  }

  if (filters.activo !== undefined) {
    query = query.eq('activo', filters.activo)
  } else {
    query = query.eq('activo', true)
  }

  if (filters.posicion) {
    query = query.eq('posicion', filters.posicion)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Obtiene un jugador por ID
 */
export const getJugadorById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      equipo:equipos (
        id,
        nombre,
        nombre_corto,
        logo_url,
        color_primario
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene jugadores de un equipo
 */
export const getJugadoresByEquipo = async (equipoId) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('equipo_id', equipoId)
    .eq('activo', true)
    .order('numero')

  if (error) throw error
  return data
}

/**
 * Crea un nuevo jugador
 */
export const createJugador = async (jugador) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([jugador])
    .select(`
      *,
      equipo:equipos (
        id,
        nombre,
        nombre_corto
      )
    `)
    .single()

  if (error) throw error
  return data
}

/**
 * Actualiza un jugador
 */
export const updateJugador = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      equipo:equipos (
        id,
        nombre,
        nombre_corto
      )
    `)
    .single()

  if (error) throw error
  return data
}

/**
 * Elimina un jugador (soft delete)
 */
export const deleteJugador = async (id) => {
  const { error } = await supabase
    .from(TABLE)
    .update({ activo: false })
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Transfiere jugador a otro equipo
 */
export const transferJugador = async (jugadorId, nuevoEquipoId) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ equipo_id: nuevoEquipoId })
    .eq('id', jugadorId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Busca jugadores por nombre
 */
export const searchJugadores = async (searchTerm) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      equipo:equipos (
        id,
        nombre,
        nombre_corto
      )
    `)
    .or(`nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%`)
    .eq('activo', true)
    .order('apellido')
    .limit(20)

  if (error) throw error
  return data
}

/**
 * Verifica si número de jersey está disponible
 */
export const isJerseyNumberAvailable = async (equipoId, numero, excludeJugadorId = null) => {
  let query = supabase
    .from(TABLE)
    .select('id')
    .eq('equipo_id', equipoId)
    .eq('numero', numero)
    .eq('activo', true)

  if (excludeJugadorId) {
    query = query.neq('id', excludeJugadorId)
  }

  const { data, error } = await query
  if (error) throw error
  return data.length === 0
}

/**
 * Sube foto del jugador
 */
export const uploadJugadorFoto = async (jugadorId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${jugadorId}.${fileExt}`
  const filePath = `jugadores/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('fotos')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('fotos').getPublicUrl(filePath)

  await updateJugador(jugadorId, { foto_url: data.publicUrl })

  return data.publicUrl
}

export default {
  getJugadores,
  getJugadorById,
  getJugadoresByEquipo,
  createJugador,
  updateJugador,
  deleteJugador,
  transferJugador,
  searchJugadores,
  isJerseyNumberAvailable,
  uploadJugadorFoto,
}
