import { supabase } from '../config/supabase'

const TABLE = 'equipos'

/**
 * Obtiene todos los equipos
 */
export const getEquipos = async (onlyActive = true) => {
  let query = supabase
    .from(TABLE)
    .select('*')
    .order('nombre')

  if (onlyActive) {
    query = query.eq('activo', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Obtiene un equipo por ID
 */
export const getEquipoById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Obtiene un equipo con su roster de jugadores
 */
export const getEquipoWithRoster = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      jugadores (
        id,
        nombre,
        apellido,
        numero,
        posicion,
        foto_url,
        altura,
        peso,
        activo
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Crea un nuevo equipo
 */
export const createEquipo = async (equipo) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([equipo])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Actualiza un equipo
 */
export const updateEquipo = async (id, updates) => {
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
 * Elimina un equipo (soft delete - desactiva)
 */
export const deleteEquipo = async (id) => {
  const { error } = await supabase
    .from(TABLE)
    .update({ activo: false })
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Elimina un equipo permanentemente
 */
export const hardDeleteEquipo = async (id) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Busca equipos por nombre
 */
export const searchEquipos = async (searchTerm) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .ilike('nombre', `%${searchTerm}%`)
    .eq('activo', true)
    .order('nombre')

  if (error) throw error
  return data
}

/**
 * Sube logo del equipo
 */
export const uploadEquipoLogo = async (equipoId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${equipoId}.${fileExt}`
  const filePath = `equipos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('logos').getPublicUrl(filePath)

  // Actualizar equipo con URL del logo
  await updateEquipo(equipoId, { logo_url: data.publicUrl })

  return data.publicUrl
}

export default {
  getEquipos,
  getEquipoById,
  getEquipoWithRoster,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  hardDeleteEquipo,
  searchEquipos,
  uploadEquipoLogo,
}
