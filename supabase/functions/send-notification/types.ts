export interface NotificationRequest {
  tipo: NotificationType
  juegoId: string
}

export type NotificationType =
  | 'game_created'
  | 'game_rescheduled'
  | 'game_finalized'
  | 'game_cancelled'
  | 'game_suspended'
  | 'reminder_24h'
  | 'reminder_2h'

export interface GameData {
  localNombre: string
  visitanteNombre: string
  fecha: string
  lugar: string | null
  estado: string
  puntosLocal?: number
  puntosVisitante?: number
}

export interface EmailContent {
  subject: string
  html: string
}
