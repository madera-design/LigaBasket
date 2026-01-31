import { supabase } from '../config/supabase'

export const NOTIFICATION_TYPES = {
  GAME_CREATED: 'game_created',
  GAME_RESCHEDULED: 'game_rescheduled',
  GAME_FINALIZED: 'game_finalized',
  GAME_CANCELLED: 'game_cancelled',
  GAME_SUSPENDED: 'game_suspended',
}

/**
 * Envia una notificacion por email a traves de Edge Function
 */
export const sendNotification = async (tipo, juegoId) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { tipo, juegoId },
    })

    if (error) {
      console.error('Error calling notification function:', error)
      return { success: false, error: error.message }
    }

    return { success: true, ...data }
  } catch (error) {
    console.error('Error sending notification:', error)
    return { success: false, error: error.message }
  }
}

export const notifyGameCreated = (juegoId) =>
  sendNotification(NOTIFICATION_TYPES.GAME_CREATED, juegoId)

export const notifyGameRescheduled = (juegoId) =>
  sendNotification(NOTIFICATION_TYPES.GAME_RESCHEDULED, juegoId)

export const notifyGameFinalized = (juegoId) =>
  sendNotification(NOTIFICATION_TYPES.GAME_FINALIZED, juegoId)

export const notifyGameCancelled = (juegoId) =>
  sendNotification(NOTIFICATION_TYPES.GAME_CANCELLED, juegoId)

export const notifyGameSuspended = (juegoId) =>
  sendNotification(NOTIFICATION_TYPES.GAME_SUSPENDED, juegoId)
