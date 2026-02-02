/**
 * Valida formato de email
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email) return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone) => {
  if (!phone) return true
  const phoneRegex = /^[\d\s+\-()]{7,20}$/
  return phoneRegex.test(phone)
}

const VALID_POSITIONS = ['Base', 'Escolta', 'Alero', 'Ala-Pivot', 'Pivot']

export const validateInscripcionJugadores = (jugadores) => {
  const errors = []

  if (!jugadores || jugadores.length < 5) {
    errors.push('Se requieren al menos 5 jugadores')
  }
  if (jugadores && jugadores.length > 12) {
    errors.push('Maximo 12 jugadores permitidos')
  }

  const numeros = new Set()
  jugadores?.forEach((j, i) => {
    const n = i + 1
    if (!j.nombre?.trim()) errors.push(`Jugador ${n}: nombre requerido`)
    if (!j.apellido?.trim()) errors.push(`Jugador ${n}: apellido requerido`)
    if (j.numero === '' || j.numero === null || j.numero === undefined || j.numero < 0 || j.numero > 99) {
      errors.push(`Jugador ${n}: numero invalido (0-99)`)
    }
    if (!VALID_POSITIONS.includes(j.posicion)) errors.push(`Jugador ${n}: posicion invalida`)
    if (numeros.has(Number(j.numero))) errors.push(`Jugador ${n}: numero ${j.numero} duplicado`)
    numeros.add(Number(j.numero))
  })

  return { valid: errors.length === 0, errors }
}
