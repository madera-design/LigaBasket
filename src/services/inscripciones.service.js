import { supabase } from '../config/supabase'

const TABLE = 'inscripciones'

export const getInscripcionesByTorneo = async (torneoId) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('torneo_id', torneoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const getInscripcionById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createInscripcion = async (inscripcion) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([inscripcion])
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateInscripcion = async (id, updates) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteInscripcion = async (id) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}

export const getTorneosConInscripcionAbierta = async () => {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('torneos')
    .select('*, temporada:temporadas(nombre)')
    .lte('fecha_inscripcion_inicio', today)
    .gte('fecha_inscripcion_fin', today)
    .order('fecha_inscripcion_fin', { ascending: true })
  if (error) throw error
  return data
}

export const getTorneoParaInscripcion = async (torneoId) => {
  const { data, error } = await supabase
    .from('torneos')
    .select('*, temporada:temporadas(nombre)')
    .eq('id', torneoId)
    .single()
  if (error) throw error
  return data
}

// ---- Uploads publicos para inscripciones ----

export const uploadInscripcionLogo = async (inscripcionId, file) => {
  const fileExt = file.name.split('.').pop()
  const filePath = `inscripciones/${inscripcionId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(filePath, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('logos').getPublicUrl(filePath)
  return data.publicUrl
}

export const uploadInscripcionJugadorFoto = async (inscripcionId, playerIndex, file) => {
  const fileExt = file.name.split('.').pop()
  const filePath = `inscripciones/${inscripcionId}_j${playerIndex}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('fotos')
    .upload(filePath, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('fotos').getPublicUrl(filePath)
  return data.publicUrl
}
