import { format } from 'https://esm.sh/date-fns@3.0.0'
import { es } from 'https://esm.sh/date-fns@3.0.0/locale'
import type { GameData, EmailContent, NotificationType } from './types.ts'

const EMAIL_HEADER = `
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
      &#127936; LigaBasket
    </h1>
  </div>
`

const EMAIL_FOOTER = `
  <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
    <p style="margin: 0;">Liga de Basquetbol - Sistema de Administracion</p>
    <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">
      Este es un correo automatico, por favor no responder.
    </p>
  </div>
`

function wrapEmail(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LigaBasket Notificacion</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr><td>${EMAIL_HEADER}</td></tr>
          <tr><td style="padding: 40px 30px;">${content}</td></tr>
          <tr><td>${EMAIL_FOOTER}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function formatFecha(fecha: string): string {
  try {
    const date = new Date(fecha)
    return format(date, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
  } catch {
    return fecha
  }
}

function matchupBlock(game: GameData, accentColor: string): string {
  return `
    <div style="text-align: center; margin-bottom: 15px;">
      <span style="font-size: 18px; font-weight: bold; color: #1f2937;">
        ${game.localNombre}
      </span>
      <span style="color: ${accentColor}; font-size: 24px; margin: 0 15px; font-weight: bold;">vs</span>
      <span style="font-size: 18px; font-weight: bold; color: #1f2937;">
        ${game.visitanteNombre}
      </span>
    </div>
  `
}

function detailsBlock(game: GameData, textColor: string, borderColor: string): string {
  return `
    <div style="border-top: 2px solid ${borderColor}; padding-top: 15px; margin-top: 15px;">
      <p style="margin: 8px 0; color: ${textColor};">
        <strong>&#128197; Fecha:</strong> ${formatFecha(game.fecha)}
      </p>
      ${game.lugar ? `
        <p style="margin: 8px 0; color: ${textColor};">
          <strong>&#128205; Lugar:</strong> ${game.lugar}
        </p>
      ` : ''}
    </div>
  `
}

// ─── TEMPLATES ──────────────────────────────────────────

function gameCreatedTemplate(game: GameData): EmailContent {
  return {
    subject: `Nuevo juego programado: ${game.localNombre} vs ${game.visitanteNombre}`,
    html: wrapEmail(`
      <h2 style="color: #111827; margin-top: 0;">Nuevo Juego Programado</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Se ha programado un nuevo juego de basquetbol:
      </p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        ${matchupBlock(game, '#f97316')}
        ${detailsBlock(game, '#6b7280', '#e5e7eb')}
      </div>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Por favor confirme la asistencia de su equipo.
      </p>
    `)
  }
}

function gameRescheduledTemplate(game: GameData): EmailContent {
  return {
    subject: `Juego reprogramado: ${game.localNombre} vs ${game.visitanteNombre}`,
    html: wrapEmail(`
      <h2 style="color: #d97706; margin-top: 0;">&#9888;&#65039; Juego Reprogramado</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        El siguiente juego ha sido reprogramado:
      </p>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px; margin: 20px 0;">
        ${matchupBlock(game, '#d97706')}
        ${detailsBlock(game, '#78350f', '#fbbf24')}
      </div>
      <p style="color: #92400e; font-size: 14px; background: #fef3c7; padding: 12px; border-radius: 4px;">
        <strong>Importante:</strong> Por favor tome nota de la nueva fecha y hora del juego.
      </p>
    `)
  }
}

function gameFinalizedTemplate(game: GameData): EmailContent {
  const pL = game.puntosLocal ?? 0
  const pV = game.puntosVisitante ?? 0
  const localGana = pL > pV
  const visitanteGana = pV > pL

  return {
    subject: `Resultado final: ${game.localNombre} ${pL} - ${pV} ${game.visitanteNombre}`,
    html: wrapEmail(`
      <h2 style="color: #059669; margin-top: 0;">&#9989; Juego Finalizado</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        El juego ha concluido con el siguiente marcador:
      </p>
      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; font-size: 18px; font-weight: ${localGana ? 'bold' : 'normal'}; color: #1f2937;">
              ${game.localNombre} ${localGana ? '&#127942;' : ''}
            </td>
            <td style="padding: 10px; font-size: 28px; font-weight: bold; color: #059669; text-align: right; width: 60px;">
              ${pL}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; font-size: 18px; font-weight: ${visitanteGana ? 'bold' : 'normal'}; color: #1f2937;">
              ${game.visitanteNombre} ${visitanteGana ? '&#127942;' : ''}
            </td>
            <td style="padding: 10px; font-size: 28px; font-weight: bold; color: #059669; text-align: right; width: 60px;">
              ${pV}
            </td>
          </tr>
        </table>
        <div style="border-top: 2px solid #6ee7b7; padding-top: 15px; margin-top: 15px; text-align: center;">
          <p style="margin: 0; color: #065f46; font-size: 14px;">
            ${formatFecha(game.fecha)}
          </p>
        </div>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        Gracias por su participacion.
      </p>
    `)
  }
}

function gameCancelledTemplate(game: GameData): EmailContent {
  return {
    subject: `Juego cancelado: ${game.localNombre} vs ${game.visitanteNombre}`,
    html: wrapEmail(`
      <h2 style="color: #dc2626; margin-top: 0;">&#10060; Juego Cancelado</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Lamentamos informar que el siguiente juego ha sido cancelado:
      </p>
      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 6px; margin: 20px 0;">
        ${matchupBlock(game, '#dc2626')}
        ${detailsBlock(game, '#7f1d1d', '#fca5a5')}
      </div>
      <p style="color: #991b1b; font-size: 14px; background: #fee2e2; padding: 12px; border-radius: 4px;">
        Para mas informacion, contacte a la administracion de la liga.
      </p>
    `)
  }
}

function gameSuspendedTemplate(game: GameData): EmailContent {
  return {
    subject: `Juego suspendido: ${game.localNombre} vs ${game.visitanteNombre}`,
    html: wrapEmail(`
      <h2 style="color: #ea580c; margin-top: 0;">&#9208;&#65039; Juego Suspendido</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        El siguiente juego ha sido suspendido temporalmente:
      </p>
      <div style="background: #fed7aa; border-left: 4px solid #f97316; padding: 20px; border-radius: 6px; margin: 20px 0;">
        ${matchupBlock(game, '#ea580c')}
        ${detailsBlock(game, '#7c2d12', '#fdba74')}
      </div>
      <p style="color: #9a3412; font-size: 14px; background: #fed7aa; padding: 12px; border-radius: 4px;">
        Se notificara la nueva fecha cuando se reprograme el juego.
      </p>
    `)
  }
}

function reminder24hTemplate(game: GameData): EmailContent {
  return {
    subject: `Recordatorio: Juego manana - ${game.localNombre} vs ${game.visitanteNombre}`,
    html: wrapEmail(`
      <h2 style="color: #2563eb; margin-top: 0;">&#128276; Recordatorio: Juego en 24 horas</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Les recordamos que tienen un juego programado para manana:
      </p>
      <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        ${matchupBlock(game, '#2563eb')}
        ${detailsBlock(game, '#1e3a8a', '#93c5fd')}
      </div>
      <p style="color: #1e40af; font-size: 14px; background: #dbeafe; padding: 12px; border-radius: 4px;">
        <strong>Preparativos:</strong> Asegurese de confirmar la asistencia de su equipo.
      </p>
    `)
  }
}

function reminder2hTemplate(game: GameData): EmailContent {
  return {
    subject: `ULTIMA HORA - Juego hoy: ${game.localNombre} vs ${game.visitanteNombre}`,
    html: wrapEmail(`
      <h2 style="color: #7c3aed; margin-top: 0;">&#9200; Recordatorio Urgente: Juego en 2 horas</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Su juego comenzara en aproximadamente 2 horas:
      </p>
      <div style="background: #ede9fe; border-left: 4px solid #8b5cf6; padding: 20px; border-radius: 6px; margin: 20px 0;">
        ${matchupBlock(game, '#7c3aed')}
        ${detailsBlock(game, '#4c1d95', '#c4b5fd')}
      </div>
      <p style="color: #5b21b6; font-size: 14px; background: #ede9fe; padding: 12px; border-radius: 4px;">
        <strong>&#127936; Preparense!</strong> El juego esta por comenzar. Buena suerte!
      </p>
    `)
  }
}

// ─── ROUTER ──────────────────────────────────────────

export function renderEmailTemplate(tipo: NotificationType, game: GameData): EmailContent {
  switch (tipo) {
    case 'game_created':
      return gameCreatedTemplate(game)
    case 'game_rescheduled':
      return gameRescheduledTemplate(game)
    case 'game_finalized':
      return gameFinalizedTemplate(game)
    case 'game_cancelled':
      return gameCancelledTemplate(game)
    case 'game_suspended':
      return gameSuspendedTemplate(game)
    case 'reminder_24h':
      return reminder24hTemplate(game)
    case 'reminder_2h':
      return reminder2hTemplate(game)
    default:
      throw new Error(`Tipo de notificacion desconocido: ${tipo}`)
  }
}
