import { supabase } from '../config/supabase'

/**
 * Obtiene categorias de un torneo ordenadas por campo 'orden'
 */
export const getCategoriasByTorneo = async (torneoId) => {
  const { data, error } = await supabase
    .from('torneo_categorias')
    .select('*')
    .eq('torneo_id', torneoId)
    .order('orden')
  if (error) throw error
  return data
}

/**
 * Crea multiples categorias de una vez
 * @param {Array<{torneo_id: string, nombre: string, orden: number, descripcion?: string, genero?: string, anio_nacimiento_min?: number, anio_nacimiento_max?: number, min_mujeres?: number}>} categorias
 */
export const createCategoriasBulk = async (categorias) => {
  const { data, error } = await supabase
    .from('torneo_categorias')
    .insert(categorias)
    .select()
  if (error) throw error
  return data
}

/**
 * Actualiza una categoria (nombre u orden)
 */
export const updateCategoria = async (id, updates) => {
  const { data, error } = await supabase
    .from('torneo_categorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Elimina una categoria
 */
export const deleteCategoria = async (id) => {
  const { error } = await supabase
    .from('torneo_categorias')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}
