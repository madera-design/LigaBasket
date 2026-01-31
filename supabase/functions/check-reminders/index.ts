import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../shared/resend-client.ts'
import { generateReminderDedupKey, checkDuplicate } from '../shared/dedup.ts'
import { renderEmailTemplate } from '../send-notification/email-templates.ts'
import type { GameData, NotificationType } from '../send-notification/types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000)
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000)

    // Games in 24-25 hour window
    const { data: games24h } = await supabase
      .from('vista_calendario')
      .select('*')
      .eq('estado', 'programado')
      .gte('fecha', in24Hours.toISOString())
      .lt('fecha', in25Hours.toISOString())

    // Games in 2-3 hour window
    const { data: games2h } = await supabase
      .from('vista_calendario')
      .select('*')
      .eq('estado', 'programado')
      .gte('fecha', in2Hours.toISOString())
      .lt('fecha', in3Hours.toISOString())

    const results = {
      reminders24h: 0,
      reminders2h: 0,
      errors: [] as string[],
    }

    if (games24h && games24h.length > 0) {
      for (const juego of games24h) {
        try {
          await sendReminder(supabase, juego, 'reminder_24h')
          results.reminders24h++
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error)
          results.errors.push(`24h reminder for ${juego.id}: ${msg}`)
        }
      }
    }

    if (games2h && games2h.length > 0) {
      for (const juego of games2h) {
        try {
          await sendReminder(supabase, juego, 'reminder_2h')
          results.reminders2h++
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error)
          results.errors.push(`2h reminder for ${juego.id}: ${msg}`)
        }
      }
    }

    console.log('Reminder check completed:', results)

    return new Response(
      JSON.stringify(results),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Error in check-reminders:', msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// deno-lint-ignore no-explicit-any
async function sendReminder(supabase: any, juego: any, tipo: NotificationType) {
  // Fetch delegate emails
  const { data: equipos } = await supabase
    .from('equipos')
    .select('id, nombre, delegate_email')
    .in('id', [juego.equipo_local_id, juego.equipo_visitante_id])

  const destinatarios = (equipos || [])
    // deno-lint-ignore no-explicit-any
    .map((e: any) => e.delegate_email)
    .filter((email: string | null): email is string => !!email && email.trim() !== '')

  if (destinatarios.length === 0) return

  // Check dedup
  const dedupKey = generateReminderDedupKey(tipo, juego.id, juego.fecha)
  const isDuplicate = await checkDuplicate(supabase, dedupKey)
  if (isDuplicate) return

  // Render template
  const gameData: GameData = {
    localNombre: juego.local_nombre || juego.equipo_local_nombre || 'Local',
    visitanteNombre: juego.visitante_nombre || juego.equipo_visitante_nombre || 'Visitante',
    fecha: juego.fecha,
    lugar: juego.lugar,
    estado: juego.estado,
  }

  const { subject, html } = renderEmailTemplate(tipo, gameData)

  // Log
  const { data: logEntry } = await supabase
    .from('notifications_log')
    .insert({
      juego_id: juego.id,
      tipo_notificacion: tipo,
      destinatarios,
      mensaje_asunto: subject,
      mensaje_cuerpo: html.substring(0, 500),
      dedup_key: dedupKey,
      estado: 'pendiente',
    })
    .select()
    .single()

  // Send
  try {
    await sendEmail({ to: destinatarios, subject, html })

    await supabase
      .from('notifications_log')
      .update({ estado: 'enviado', enviado_at: new Date().toISOString() })
      .eq('id', logEntry.id)
  } catch (emailError: unknown) {
    const errorMsg = emailError instanceof Error ? emailError.message : String(emailError)
    await supabase
      .from('notifications_log')
      .update({ estado: 'fallido', error_mensaje: errorMsg })
      .eq('id', logEntry.id)

    throw emailError
  }
}
