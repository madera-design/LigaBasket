import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

// ================================
// FORMATEO DE FECHAS
// ================================

/**
 * Formatea una fecha a formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {string} formatStr - Formato deseado
 * @returns {string}
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '-'
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return '-'
  return format(parsedDate, formatStr, { locale: es })
}

/**
 * Formatea fecha y hora
 */
export const formatDateTime = (date) => {
  return formatDate(date, "dd/MM/yyyy 'a las' HH:mm")
}

/**
 * Formatea solo la hora
 */
export const formatTime = (date) => {
  return formatDate(date, 'HH:mm')
}

/**
 * Formatea fecha relativa (hace 2 días, etc)
 */
export const formatRelativeDate = (date) => {
  if (!date) return '-'
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(parsedDate)) return '-'
  return formatDistanceToNow(parsedDate, { addSuffix: true, locale: es })
}

/**
 * Formatea fecha para calendario
 */
export const formatCalendarDate = (date) => {
  return formatDate(date, "EEEE d 'de' MMMM")
}

// ================================
// FORMATEO DE NÚMEROS
// ================================

/**
 * Formatea porcentaje
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Decimales
 * @returns {string}
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return '-'
  return `${Number(value).toFixed(decimals)}%`
}

/**
 * Formatea promedio
 */
export const formatAverage = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return '-'
  return Number(value).toFixed(decimals)
}

/**
 * Formatea número con separador de miles
 */
export const formatNumber = (value) => {
  if (value == null || isNaN(value)) return '-'
  return new Intl.NumberFormat('es-MX').format(value)
}

/**
 * Formatea altura (metros a formato legible)
 */
export const formatHeight = (meters) => {
  if (!meters) return '-'
  return `${Number(meters).toFixed(2)} m`
}

/**
 * Formatea peso
 */
export const formatWeight = (kg) => {
  if (!kg) return '-'
  return `${Number(kg).toFixed(0)} kg`
}

/**
 * Formatea minutos jugados
 */
export const formatMinutes = (minutes) => {
  if (minutes == null) return '-'
  const mins = Math.floor(minutes)
  const secs = Math.round((minutes - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ================================
// FORMATEO DE TEXTO
// ================================

/**
 * Capitaliza primera letra
 */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Formatea nombre completo
 */
export const formatFullName = (nombre, apellido) => {
  return [nombre, apellido].filter(Boolean).join(' ')
}

/**
 * Trunca texto
 */
export const truncate = (str, length = 50) => {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Formatea récord de victorias/derrotas
 */
export const formatRecord = (wins, losses) => {
  return `${wins ?? 0}-${losses ?? 0}`
}

/**
 * Formatea tiro (convertidos/intentados)
 */
export const formatShots = (made, attempted) => {
  return `${made ?? 0}/${attempted ?? 0}`
}

// ================================
// FORMATEO DE ESTADÍSTICAS
// ================================

/**
 * Calcula y formatea porcentaje de tiro
 */
export const formatShotPercentage = (made, attempted) => {
  if (!attempted || attempted === 0) return '0.0%'
  const percentage = (made / attempted) * 100
  return `${percentage.toFixed(1)}%`
}

/**
 * Formatea estadística con etiqueta
 */
export const formatStatWithLabel = (value, label) => {
  return `${formatAverage(value)} ${label}`
}
