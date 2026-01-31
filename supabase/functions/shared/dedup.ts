import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function generateDedupKey(tipo: string, juegoId: string): string {
  const now = new Date()
  const roundedHour = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`
  return `${tipo}:${juegoId}:${roundedHour}`
}

export function generateReminderDedupKey(tipo: string, juegoId: string, fecha: string): string {
  const gameDate = new Date(fecha)
  const dateStr = `${gameDate.getFullYear()}-${String(gameDate.getMonth() + 1).padStart(2, '0')}-${String(gameDate.getDate()).padStart(2, '0')}`
  return `${tipo}:${juegoId}:${dateStr}`
}

export async function checkDuplicate(supabase: SupabaseClient, dedupKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('notifications_log')
    .select('id')
    .eq('dedup_key', dedupKey)
    .maybeSingle()

  if (error) {
    console.error('Error checking duplicate:', error)
    return false
  }

  return data !== null
}
