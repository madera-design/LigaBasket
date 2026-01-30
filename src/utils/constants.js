// Posiciones de basquetbol
export const POSICIONES = [
  { value: 'Base', label: 'Base (PG)', abbr: 'PG' },
  { value: 'Escolta', label: 'Escolta (SG)', abbr: 'SG' },
  { value: 'Alero', label: 'Alero (SF)', abbr: 'SF' },
  { value: 'Ala-Pivot', label: 'Ala-Pivot (PF)', abbr: 'PF' },
  { value: 'Pivot', label: 'Pivot (C)', abbr: 'C' },
]

// Estados de juego
export const ESTADOS_JUEGO = [
  { value: 'programado', label: 'Programado', color: 'gray' },
  { value: 'en_curso', label: 'En curso', color: 'yellow' },
  { value: 'finalizado', label: 'Finalizado', color: 'green' },
  { value: 'suspendido', label: 'Suspendido', color: 'orange' },
  { value: 'cancelado', label: 'Cancelado', color: 'red' },
]

// Categorías de estadísticas
export const CATEGORIAS_STATS = {
  puntos: { label: 'Puntos', abbr: 'PTS', color: 'primary' },
  asistencias: { label: 'Asistencias', abbr: 'AST', color: 'blue' },
  rebotes: { label: 'Rebotes', abbr: 'REB', color: 'green' },
  robos: { label: 'Robos', abbr: 'STL', color: 'yellow' },
  bloqueos: { label: 'Bloqueos', abbr: 'BLK', color: 'red' },
  triples: { label: 'Triples', abbr: '3PT', color: 'purple' },
}

// Rutas de navegación
export const NAV_LINKS = {
  public: [
    { path: '/', label: 'Inicio', icon: 'Home' },
    { path: '/calendario', label: 'Calendario', icon: 'Calendar' },
    { path: '/equipos', label: 'Equipos', icon: 'Users' },
    { path: '/posiciones', label: 'Posiciones', icon: 'Trophy' },
    { path: '/estadisticas', label: 'Estadísticas', icon: 'BarChart2' },
  ],
  admin: [
    { path: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/admin/equipos', label: 'Equipos', icon: 'Users' },
    { path: '/admin/jugadores', label: 'Jugadores', icon: 'UserPlus' },
    { path: '/admin/calendario', label: 'Calendario', icon: 'CalendarPlus' },
    { path: '/admin/temporadas', label: 'Temporadas', icon: 'Calendar' },
  ],
}

// Colores para gráficos
export const CHART_COLORS = [
  '#f97316', // primary
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
]

// Fases del torneo
export const FASES_TORNEO = [
  { value: 'configuracion', label: 'Configuracion', color: 'gray' },
  { value: 'regular', label: 'Temporada Regular', color: 'blue' },
  { value: 'playoffs', label: 'Playoffs', color: 'orange' },
  { value: 'finalizado', label: 'Finalizado', color: 'green' },
]

// Dias de la semana (0=Dom, 1=Lun, ..., 6=Sab)
export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo', abbr: 'Dom' },
  { value: 1, label: 'Lunes', abbr: 'Lun' },
  { value: 2, label: 'Martes', abbr: 'Mar' },
  { value: 3, label: 'Miercoles', abbr: 'Mie' },
  { value: 4, label: 'Jueves', abbr: 'Jue' },
  { value: 5, label: 'Viernes', abbr: 'Vie' },
  { value: 6, label: 'Sabado', abbr: 'Sab' },
]

// Límites y validaciones
export const LIMITS = {
  MIN_PLAYERS_PER_TEAM: 5,
  MAX_PLAYERS_PER_TEAM: 15,
  MAX_JERSEY_NUMBER: 99,
  MIN_HEIGHT: 1.50,
  MAX_HEIGHT: 2.50,
  MIN_WEIGHT: 50,
  MAX_WEIGHT: 200,
  GAME_QUARTERS: 4,
  QUARTER_MINUTES: 10,
}
