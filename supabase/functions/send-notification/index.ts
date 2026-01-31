import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../shared/resend-client.ts'
import { generateDedupKey, checkDuplicate } from '../shared/dedup.ts'
import { renderEmailTemplate } from './email-templates.ts'
import type { NotificationRequest, GameData } from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { tipo, juegoId }: NotificationRequest = await req.json()

    if (!tipo || !juegoId) {
      return new Response(
        JSON.stringify({ error: 'tipo y juegoId son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch game data from vista_calendario
    const { data: juego, error: juegoError } = await supabase
      .from('vista_calendario')
      .select('*')
      .eq('id', juegoId)
      .single()

    if (juegoError || !juego) {
      throw new Error(`Juego no encontrado: ${juegoId}`)
    }

    // Fetch delegate emails from both teams
    const { data: equipos, error: equiposError } = await supabase
      .from('equipos')
      .select('id, nombre, delegate_name, delegate_email')
      .in('id', [juego.equipo_local_id, juego.equipo_visitante_id])

    if (equiposError) throw equiposError

    const destinatarios = (equipos || [])
      .map((e: { delegate_email: string | null }) => e.delegate_email)
      .filter((email: string | null): email is string => !!email && email.trim() !== '')

    if (destinatarios.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No hay destinatarios con email configurado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check deduplication
    const dedupKey = generateDedupKey(tipo, juegoId)
    const isDuplicate = await checkDuplicate(supabase, dedupKey)
    if (isDuplicate) {
      return new Response(
        JSON.stringify({ success: true, message: 'Notificacion duplicada omitida' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Render email
    const gameData: GameData = {
      localNombre: juego.local_nombre || juego.equipo_local_nombre || 'Local',
      visitanteNombre: juego.visitante_nombre || juego.equipo_visitante_nombre || 'Visitante',
      fecha: juego.fecha,
      lugar: juego.lugar,
      estado: juego.estado,
      puntosLocal: juego.puntos_local,
      puntosVisitante: juego.puntos_visitante,
    }

    const { subject, html } = renderEmailTemplate(tipo, gameData)

    // Log as pending
    const { data: logEntry, error: logError } = await supabase
      .from('notifications_log')
      .insert({
        juego_id: juegoId,
        tipo_notificacion: tipo,
        destinatarios,
        mensaje_asunto: subject,
        mensaje_cuerpo: html.substring(0, 500),
        dedup_key: dedupKey,
        estado: 'pendiente',
      })
      .select()
      .single()

    if (logError) throw logError

    // Send email
    try {
      await sendEmail({ to: destinatarios, subject, html })

      await supabase
        .from('notifications_log')
        .update({ estado: 'enviado', enviado_at: new Date().toISOString() })
        .eq('id', logEntry.id)

      return new Response(
        JSON.stringify({ success: true, message: 'Email enviado correctamente' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (emailError: unknown) {
      const errorMsg = emailError instanceof Error ? emailError.message : String(emailError)
      await supabase
        .from('notifications_log')
        .update({ estado: 'fallido', error_mensaje: errorMsg })
        .eq('id', logEntry.id)

      throw emailError
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error sending notification:', errorMsg)
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
