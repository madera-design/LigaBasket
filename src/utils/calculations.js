// ================================
// CÁLCULOS DE ESTADÍSTICAS DE BASQUETBOL
// ================================

/**
 * Calcula porcentaje de tiro
 * @param {number} made - Convertidos
 * @param {number} attempted - Intentados
 * @returns {number} Porcentaje (0-100)
 */
export const calculateShootingPercentage = (made, attempted) => {
  if (!attempted || attempted === 0) return 0
  return (made / attempted) * 100
}

/**
 * Calcula porcentaje efectivo de tiro (eFG%)
 * Fórmula: (FG + 0.5 * 3PM) / FGA
 */
export const calculateEffectiveFieldGoal = (fgMade, threePMade, fgAttempted) => {
  if (!fgAttempted || fgAttempted === 0) return 0
  return ((fgMade + 0.5 * threePMade) / fgAttempted) * 100
}

/**
 * Calcula True Shooting Percentage (TS%)
 * Fórmula: PTS / (2 * (FGA + 0.44 * FTA))
 */
export const calculateTrueShootingPercentage = (points, fgAttempted, ftAttempted) => {
  const denominator = 2 * (fgAttempted + 0.44 * ftAttempted)
  if (denominator === 0) return 0
  return (points / denominator) * 100
}

/**
 * Calcula rebotes totales
 */
export const calculateTotalRebounds = (offensive, defensive) => {
  return (offensive || 0) + (defensive || 0)
}

/**
 * Calcula promedio por juego
 */
export const calculatePerGame = (total, games) => {
  if (!games || games === 0) return 0
  return total / games
}

/**
 * Calcula porcentaje de victorias
 */
export const calculateWinPercentage = (wins, games) => {
  if (!games || games === 0) return 0
  return (wins / games) * 100
}

/**
 * Calcula diferencia de puntos
 */
export const calculatePointDifferential = (pointsFor, pointsAgainst) => {
  return (pointsFor || 0) - (pointsAgainst || 0)
}

/**
 * Calcula eficiencia del jugador (PER simplificado)
 * Fórmula simplificada: (PTS + REB + AST + STL + BLK - TO - Missed FG - Missed FT) / Games
 */
export const calculatePlayerEfficiency = (stats) => {
  const {
    puntos = 0,
    rebotes_ofensivos = 0,
    rebotes_defensivos = 0,
    asistencias = 0,
    robos = 0,
    bloqueos = 0,
    perdidas = 0,
    tiros_campo_intentados = 0,
    tiros_campo_convertidos = 0,
    tiros_libres_intentados = 0,
    tiros_libres_convertidos = 0,
  } = stats

  const rebotes = rebotes_ofensivos + rebotes_defensivos
  const missedFG = tiros_campo_intentados - tiros_campo_convertidos
  const missedFT = tiros_libres_intentados - tiros_libres_convertidos

  return puntos + rebotes + asistencias + robos + bloqueos - perdidas - missedFG - missedFT
}

/**
 * Determina si tiene doble-doble
 * (10+ en dos categorías)
 */
export const hasDoubleDouble = (stats) => {
  const categories = [
    stats.puntos || 0,
    (stats.rebotes_ofensivos || 0) + (stats.rebotes_defensivos || 0),
    stats.asistencias || 0,
    stats.robos || 0,
    stats.bloqueos || 0,
  ]
  
  const doubleDigits = categories.filter(val => val >= 10)
  return doubleDigits.length >= 2
}

/**
 * Determina si tiene triple-doble
 * (10+ en tres categorías)
 */
export const hasTripleDouble = (stats) => {
  const categories = [
    stats.puntos || 0,
    (stats.rebotes_ofensivos || 0) + (stats.rebotes_defensivos || 0),
    stats.asistencias || 0,
    stats.robos || 0,
    stats.bloqueos || 0,
  ]
  
  const doubleDigits = categories.filter(val => val >= 10)
  return doubleDigits.length >= 3
}

/**
 * Calcula racha (wins/losses consecutivos)
 * @param {Array} results - Array de resultados ['W', 'L', 'W', 'W']
 * @returns {string} Ej: 'G3' o 'P2'
 */
export const calculateStreak = (results) => {
  if (!results || results.length === 0) return '-'
  
  const lastResult = results[0]
  let streak = 1
  
  for (let i = 1; i < results.length; i++) {
    if (results[i] === lastResult) {
      streak++
    } else {
      break
    }
  }
  
  return `${lastResult === 'W' ? 'G' : 'P'}${streak}`
}

/**
 * Calcula últimos 5 juegos
 * @param {Array} results - Array de resultados
 * @returns {string} Ej: 'GWWLW'
 */
export const calculateLast5 = (results) => {
  if (!results || results.length === 0) return '-'
  return results.slice(0, 5).map(r => r === 'W' ? 'G' : 'P').join('')
}

/**
 * Ordena tabla de posiciones
 */
export const sortStandings = (standings) => {
  return [...standings].sort((a, b) => {
    // Primero por porcentaje de victorias
    if (b.porcentaje_victorias !== a.porcentaje_victorias) {
      return b.porcentaje_victorias - a.porcentaje_victorias
    }
    // Empate: por diferencia de puntos
    return b.diferencia_puntos - a.diferencia_puntos
  })
}

/**
 * Obtiene líderes por categoría
 */
export const getLeaders = (players, category, limit = 5) => {
  return [...players]
    .sort((a, b) => (b[category] || 0) - (a[category] || 0))
    .slice(0, limit)
}

/**
 * Agrupa estadísticas por equipo
 */
export const groupStatsByTeam = (stats) => {
  return stats.reduce((acc, stat) => {
    const teamId = stat.equipo_id
    if (!acc[teamId]) {
      acc[teamId] = []
    }
    acc[teamId].push(stat)
    return acc
  }, {})
}

/**
 * Calcula totales de equipo para un juego
 */
export const calculateTeamTotals = (playerStats) => {
  return playerStats.reduce(
    (totals, player) => ({
      puntos: totals.puntos + (player.puntos || 0),
      asistencias: totals.asistencias + (player.asistencias || 0),
      rebotes: totals.rebotes + (player.rebotes_ofensivos || 0) + (player.rebotes_defensivos || 0),
      robos: totals.robos + (player.robos || 0),
      bloqueos: totals.bloqueos + (player.bloqueos || 0),
      perdidas: totals.perdidas + (player.perdidas || 0),
      faltas: totals.faltas + (player.faltas_personales || 0),
      tiros_campo_intentados: totals.tiros_campo_intentados + (player.tiros_campo_intentados || 0),
      tiros_campo_convertidos: totals.tiros_campo_convertidos + (player.tiros_campo_convertidos || 0),
      triples_intentados: totals.triples_intentados + (player.triples_intentados || 0),
      triples_convertidos: totals.triples_convertidos + (player.triples_convertidos || 0),
      tiros_libres_intentados: totals.tiros_libres_intentados + (player.tiros_libres_intentados || 0),
      tiros_libres_convertidos: totals.tiros_libres_convertidos + (player.tiros_libres_convertidos || 0),
    }),
    {
      puntos: 0,
      asistencias: 0,
      rebotes: 0,
      robos: 0,
      bloqueos: 0,
      perdidas: 0,
      faltas: 0,
      tiros_campo_intentados: 0,
      tiros_campo_convertidos: 0,
      triples_intentados: 0,
      triples_convertidos: 0,
      tiros_libres_intentados: 0,
      tiros_libres_convertidos: 0,
    }
  )
}
