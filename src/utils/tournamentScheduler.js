/**
 * Algoritmo de scheduling para torneos de basquetbol
 * Genera calendarios de temporada regular (doble round-robin) y playoffs
 */

/**
 * Genera rondas de round-robin simple usando el metodo Berger/circulo.
 * Si el numero de equipos es impar, agrega un BYE (descanso).
 * @param {string[]} teamIds - Array de UUIDs de equipos
 * @returns {Array<Array<{home: string, away: string}>>} - Rondas con matchups
 */
export function generateRoundRobinRounds(teamIds) {
  const teams = [...teamIds]
  if (teams.length % 2 !== 0) {
    teams.push('BYE')
  }

  const n = teams.length
  const totalRounds = n - 1
  const matchesPerRound = Math.floor(n / 2)
  const rounds = []

  // Indices de rotacion (todos excepto el primero que esta fijo)
  const rotating = []
  for (let i = 1; i < n; i++) {
    rotating.push(i)
  }

  for (let round = 0; round < totalRounds; round++) {
    const roundMatchups = []

    // Primer partido: equipo fijo vs primero en rotacion
    const home = teams[0]
    const away = teams[rotating[0]]
    if (home !== 'BYE' && away !== 'BYE') {
      roundMatchups.push({ home, away })
    }

    // Emparejar desde los extremos del array de rotacion
    for (let i = 1; i < matchesPerRound; i++) {
      const h = teams[rotating[i]]
      const a = teams[rotating[rotating.length - i]]
      if (h !== 'BYE' && a !== 'BYE') {
        roundMatchups.push({ home: h, away: a })
      }
    }

    rounds.push(roundMatchups)

    // Rotar: mover el ultimo al inicio
    rotating.unshift(rotating.pop())
  }

  return rounds
}

/**
 * Genera doble round-robin (ida y vuelta).
 * En la vuelta se invierten local/visitante.
 * @param {string[]} teamIds
 * @returns {{ ida: Array, vuelta: Array, allRounds: Array }}
 */
export function generateDoubleRoundRobin(teamIds) {
  const ida = generateRoundRobinRounds(teamIds)

  // Vuelta: mismos matchups con home/away invertidos
  const vuelta = ida.map(round =>
    round.map(match => ({ home: match.away, away: match.home }))
  )

  const allRounds = [...ida, ...vuelta]
  return { ida, vuelta, allRounds }
}

/**
 * Asigna fechas y horarios a las rondas generadas.
 * @param {Array<Array<{home, away}>>} rounds
 * @param {Object} config
 * @param {string} config.startDate - "YYYY-MM-DD"
 * @param {number[]} config.gameDays - Dias de juego [0=Dom, 1=Lun, ..., 6=Sab]
 * @param {string[]} config.timeSlots - ["20:15", "21:15"]
 * @param {string} config.lugar
 * @param {string} config.temporadaId
 * @param {string} config.torneoId
 * @returns {Array<Object>} - Juegos listos para insertar en la BD
 */
export function assignDatesAndSlots(rounds, config) {
  const { startDate, gameDays, timeSlots, lugar, temporadaId, torneoId } = config
  const slotsPerDay = timeSlots.length
  const games = []
  const idaLength = rounds.length / 2

  // Aplanar matchups preservando jornada y fase
  const allMatchups = []
  rounds.forEach((round, roundIndex) => {
    round.forEach(match => {
      allMatchups.push({
        ...match,
        jornada: roundIndex + 1,
        fase_juego: roundIndex < idaLength ? 'ida' : 'vuelta',
      })
    })
  })

  // Recorrer desde fecha inicio asignando slots
  const currentDate = new Date(startDate + 'T00:00:00')
  let slotIndex = 0
  let matchIndex = 0

  while (matchIndex < allMatchups.length) {
    const dayOfWeek = currentDate.getDay()

    if (gameDays.includes(dayOfWeek)) {
      while (slotIndex < slotsPerDay && matchIndex < allMatchups.length) {
        const match = allMatchups[matchIndex]
        const [hours, minutes] = timeSlots[slotIndex].split(':').map(Number)

        const gameDate = new Date(currentDate)
        gameDate.setHours(hours, minutes, 0, 0)

        games.push({
          temporada_id: temporadaId,
          torneo_id: torneoId,
          equipo_local_id: match.home,
          equipo_visitante_id: match.away,
          fecha: gameDate.toISOString(),
          lugar: lugar || null,
          estado: 'programado',
          jornada: match.jornada,
          fase_juego: match.fase_juego,
          categoria_id: match.categoriaId || null,
        })

        slotIndex++
        matchIndex++
      }
      slotIndex = 0
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return games
}

/**
 * Determina equipos clasificados a playoffs.
 * Par: eliminan ultimos 2. Impar: elimina ultimo 1.
 * @param {Array<{equipo_id, posicion}>} standings - Ordenados por posicion
 * @param {number} totalTeams
 * @returns {{ qualified: Array, eliminated: Array, qualifiedCount: number }}
 */
export function calculatePlayoffQualifiers(standings, totalTeams) {
  const eliminateCount = totalTeams % 2 === 0 ? 2 : 1
  let qualifiedCount = totalTeams - eliminateCount

  // Asegurar que sea par
  if (qualifiedCount % 2 !== 0) {
    qualifiedCount -= 1
  }

  const qualified = standings.slice(0, qualifiedCount)
  const eliminated = standings.slice(qualifiedCount)

  return { qualified, eliminated, qualifiedCount }
}

/**
 * Genera bracket de playoffs: 1ro vs ultimo clasificado, etc.
 * @param {Array<{equipo_id}>} qualifiedTeams - Ordenados por posicion
 * @returns {Array<{serieNumber, superior, inferior}>}
 */
export function generatePlayoffBracket(qualifiedTeams) {
  const series = []
  const half = qualifiedTeams.length / 2

  for (let i = 0; i < half; i++) {
    series.push({
      serieNumber: i + 1,
      superior: qualifiedTeams[i],
      inferior: qualifiedTeams[qualifiedTeams.length - 1 - i],
    })
  }

  return series
}

/**
 * Genera juegos de playoff (mejor de 3) para cada serie.
 * J1 y J3: local = seed alto. J2: local = seed bajo.
 * @param {Array} series - De generatePlayoffBracket
 * @param {Object} config - { startDate, gameDays, timeSlots, lugar, temporadaId, torneoId }
 * @returns {{ seriesData: Array, games: Array }}
 */
export function generatePlayoffGames(series, config) {
  const allGames = []

  series.forEach(s => {
    // Juego 1: local = seed alto
    allGames.push({
      equipo_local_id: s.superior.equipo_id,
      equipo_visitante_id: s.inferior.equipo_id,
      _serieNumber: s.serieNumber,
      gameInSeries: 1,
      categoriaId: s.categoriaId || null,
    })
    // Juego 2: local = seed bajo
    allGames.push({
      equipo_local_id: s.inferior.equipo_id,
      equipo_visitante_id: s.superior.equipo_id,
      _serieNumber: s.serieNumber,
      gameInSeries: 2,
      categoriaId: s.categoriaId || null,
    })
    // Juego 3: local = seed alto
    allGames.push({
      equipo_local_id: s.superior.equipo_id,
      equipo_visitante_id: s.inferior.equipo_id,
      _serieNumber: s.serieNumber,
      gameInSeries: 3,
      categoriaId: s.categoriaId || null,
    })
  })

  // Ordenar: todos los J1 primero, luego J2, luego J3
  allGames.sort((a, b) => a.gameInSeries - b.gameInSeries || a._serieNumber - b._serieNumber)

  const { startDate, gameDays, timeSlots, lugar, temporadaId, torneoId } = config
  const slotsPerDay = timeSlots.length
  const games = []

  const currentDate = new Date(startDate + 'T00:00:00')
  let slotIndex = 0
  let matchIndex = 0

  while (matchIndex < allGames.length) {
    const dayOfWeek = currentDate.getDay()
    if (gameDays.includes(dayOfWeek)) {
      while (slotIndex < slotsPerDay && matchIndex < allGames.length) {
        const match = allGames[matchIndex]
        const [hours, minutes] = timeSlots[slotIndex].split(':').map(Number)
        const gameDate = new Date(currentDate)
        gameDate.setHours(hours, minutes, 0, 0)

        games.push({
          temporada_id: temporadaId,
          torneo_id: torneoId,
          equipo_local_id: match.equipo_local_id,
          equipo_visitante_id: match.equipo_visitante_id,
          fecha: gameDate.toISOString(),
          lugar: lugar || null,
          estado: 'programado',
          fase_juego: 'playoff',
          numero_juego_serie: match.gameInSeries,
          _serieNumber: match._serieNumber,
          categoria_id: match.categoriaId || null,
        })

        slotIndex++
        matchIndex++
      }
      slotIndex = 0
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return { seriesData: series, games }
}

/**
 * Calcula estadisticas del torneo para preview.
 * @param {number} teamCount
 * @param {number[]} gameDays
 * @param {string[]} timeSlots
 * @param {string} startDate
 * @returns {{ totalGames, totalRounds, gamesPerRound, estimatedWeeks, estimatedEndDate }}
 */
export function calculateTournamentStats(teamCount, gameDays, timeSlots, startDate) {
  const totalGames = teamCount * (teamCount - 1) // doble round-robin
  const hasOdd = teamCount % 2 !== 0
  const gamesPerRound = hasOdd ? Math.floor(teamCount / 2) : teamCount / 2
  const totalRounds = hasOdd ? teamCount * 2 : (teamCount - 1) * 2

  const slotsPerGameDay = timeSlots.length
  const gameDaysPerWeek = gameDays.length
  const gamesPerWeek = slotsPerGameDay * gameDaysPerWeek
  const estimatedWeeks = Math.ceil(totalGames / gamesPerWeek)

  // Calcular fecha estimada de fin
  let estimatedEndDate = null
  if (startDate) {
    const endDate = new Date(startDate + 'T00:00:00')
    endDate.setDate(endDate.getDate() + estimatedWeeks * 7)
    estimatedEndDate = endDate.toISOString().split('T')[0]
  }

  return {
    totalGames,
    totalRounds,
    gamesPerRound,
    estimatedWeeks,
    estimatedEndDate,
  }
}

/**
 * Genera calendario para torneo multi-categoria.
 * Agrupa equipos por categoria, genera round-robin por grupo,
 * e intercala rondas para distribucion justa de horarios.
 *
 * @param {Array<{equipoId: string, categoriaId: string}>} teamCategoryPairs
 * @param {Object} config - Mismo config que assignDatesAndSlots
 * @returns {Array<Object>} - Juegos listos para insertar con categoria_id
 */
export function generateMultiCategoryCalendar(teamCategoryPairs, config) {
  // 1. Agrupar equipos por categoriaId
  const groups = {}
  teamCategoryPairs.forEach(({ equipoId, categoriaId }) => {
    const key = categoriaId || '__none__'
    if (!groups[key]) groups[key] = []
    groups[key].push(equipoId)
  })

  // 2. Generar round-robin por categoria
  const allCategoryRounds = {}
  Object.entries(groups).forEach(([catId, teamIds]) => {
    if (teamIds.length < 2) return
    const { allRounds } = generateDoubleRoundRobin(teamIds)
    allCategoryRounds[catId] = allRounds
  })

  // 3. Intercalar rondas entre categorias para distribucion justa
  const mergedRounds = []
  const categoryKeys = Object.keys(allCategoryRounds)
  const roundIndices = {}
  categoryKeys.forEach(k => { roundIndices[k] = 0 })

  let moreRounds = true
  while (moreRounds) {
    moreRounds = false
    for (const catId of categoryKeys) {
      const rounds = allCategoryRounds[catId]
      const idx = roundIndices[catId]
      if (idx < rounds.length) {
        const taggedRound = rounds[idx].map(m => ({
          ...m,
          categoriaId: catId === '__none__' ? null : catId,
        }))
        mergedRounds.push(taggedRound)
        roundIndices[catId]++
        moreRounds = true
      }
    }
  }

  // 4. Asignar fechas/slots con la funcion existente
  return assignDatesAndSlots(mergedRounds, config)
}

/**
 * Calcula estadisticas de preview para torneo multi-categoria.
 * @param {Object} teamsByCategory - { categoriaName: teamCount }
 * @param {number[]} gameDays
 * @param {string[]} timeSlots
 * @param {string} startDate
 * @returns {{ totalGames, perCategory: Array<{name, stats}>, estimatedWeeks, estimatedEndDate }}
 */
export function calculateMultiCategoryStats(teamsByCategory, gameDays, timeSlots, startDate) {
  let totalGames = 0
  const perCategory = []

  Object.entries(teamsByCategory).forEach(([name, teamCount]) => {
    if (teamCount < 2) {
      perCategory.push({ name, stats: { totalGames: 0, totalRounds: 0, gamesPerRound: 0 } })
      return
    }
    const stats = calculateTournamentStats(teamCount, gameDays, timeSlots, startDate)
    totalGames += stats.totalGames
    perCategory.push({ name, stats })
  })

  const slotsPerGameDay = timeSlots.length
  const gameDaysPerWeek = gameDays.length
  const gamesPerWeek = slotsPerGameDay * gameDaysPerWeek
  const estimatedWeeks = gamesPerWeek > 0 ? Math.ceil(totalGames / gamesPerWeek) : 0

  let estimatedEndDate = null
  if (startDate && estimatedWeeks > 0) {
    const endDate = new Date(startDate + 'T00:00:00')
    endDate.setDate(endDate.getDate() + estimatedWeeks * 7)
    estimatedEndDate = endDate.toISOString().split('T')[0]
  }

  return { totalGames, perCategory, estimatedWeeks, estimatedEndDate }
}
