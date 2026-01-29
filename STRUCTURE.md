# Estructura del Proyecto - Liga de Basquetbol

```
liga-basquetbol/
│
├── database/
│   └── schema.sql              # Esquema de BD para Supabase
│
├── src/
│   ├── main.jsx                # Punto de entrada
│   ├── App.jsx                 # Componente raíz con rutas
│   │
│   ├── config/
│   │   └── supabase.js         # Configuración cliente Supabase
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx     # Contexto de autenticación
│   │
│   ├── hooks/
│   │   ├── useAuth.js          # Hook de autenticación
│   │   ├── useEquipos.js       # CRUD equipos
│   │   ├── useJugadores.js     # CRUD jugadores
│   │   ├── useJuegos.js        # CRUD juegos/calendario
│   │   ├── useEstadisticas.js  # Estadísticas
│   │   └── useTablaPosiciones.js
│   │
│   ├── services/
│   │   ├── equipos.service.js
│   │   ├── jugadores.service.js
│   │   ├── juegos.service.js
│   │   ├── estadisticas.service.js
│   │   └── auth.service.js
│   │
│   ├── components/
│   │   ├── ui/                 # Componentes reutilizables
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Alert.jsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── PublicLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   │
│   │   ├── equipos/
│   │   │   ├── EquipoCard.jsx
│   │   │   ├── EquipoForm.jsx
│   │   │   ├── EquiposList.jsx
│   │   │   └── EquipoRoster.jsx
│   │   │
│   │   ├── jugadores/
│   │   │   ├── JugadorCard.jsx
│   │   │   ├── JugadorForm.jsx
│   │   │   ├── JugadoresList.jsx
│   │   │   └── JugadorStats.jsx
│   │   │
│   │   ├── juegos/
│   │   │   ├── JuegoCard.jsx
│   │   │   ├── JuegoForm.jsx
│   │   │   ├── Calendario.jsx
│   │   │   ├── Marcador.jsx
│   │   │   └── RegistrarEstadisticas.jsx
│   │   │
│   │   └── estadisticas/
│   │       ├── TablaPosiciones.jsx
│   │       ├── LideresEstadisticos.jsx
│   │       ├── EstadisticasJugador.jsx
│   │       └── EstadisticasEquipo.jsx
│   │
│   ├── pages/
│   │   ├── public/             # Páginas públicas (sin auth)
│   │   │   ├── HomePage.jsx
│   │   │   ├── CalendarioPage.jsx
│   │   │   ├── EquiposPage.jsx
│   │   │   ├── EquipoDetailPage.jsx
│   │   │   ├── JugadorDetailPage.jsx
│   │   │   ├── JuegoDetailPage.jsx
│   │   │   ├── EstadisticasPage.jsx
│   │   │   └── TablaPosicionesPage.jsx
│   │   │
│   │   ├── admin/              # Páginas de administración
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AdminEquiposPage.jsx
│   │   │   ├── AdminJugadoresPage.jsx
│   │   │   ├── AdminCalendarioPage.jsx
│   │   │   ├── AdminJuegoPage.jsx      # Registrar resultado
│   │   │   └── AdminTemporadasPage.jsx
│   │   │
│   │   └── auth/
│   │       └── LoginPage.jsx
│   │
│   ├── utils/
│   │   ├── formatters.js       # Formateo de fechas, números
│   │   ├── calculations.js     # Cálculos de estadísticas
│   │   ├── constants.js        # Constantes (posiciones, estados)
│   │   └── validators.js       # Validaciones de formularios
│   │
│   └── styles/
│       └── index.css           # Estilos globales + Tailwind
│
├── public/
│   ├── favicon.ico
│   └── basketball-logo.svg
│
├── .env.example                # Variables de entorno ejemplo
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Descripción de Carpetas

### `/config`
Configuración de servicios externos (Supabase).

### `/contexts`
React Contexts para estado global (autenticación).

### `/hooks`
Custom hooks que encapsulan lógica de negocio y llamadas a servicios.

### `/services`
Capa de abstracción para llamadas a Supabase. Separa la lógica de datos de los componentes.

### `/components`
- **ui/**: Componentes genéricos reutilizables (botones, inputs, modales)
- **layout/**: Estructura de página (header, sidebar, layouts)
- **[feature]/**: Componentes específicos por funcionalidad

### `/pages`
- **public/**: Vistas accesibles sin autenticación
- **admin/**: Panel de administración (requiere auth)
- **auth/**: Páginas de login/logout

### `/utils`
Funciones utilitarias puras sin dependencias de React.

## Flujo de Datos

```
Página → Hook → Service → Supabase
   ↑        ↓
   └── Componentes
```

1. **Página**: Orquesta la vista, usa hooks
2. **Hook**: Maneja estado y efectos, llama servicios
3. **Service**: Realiza queries/mutations a Supabase
4. **Componentes**: Presentación pura, reciben props

## Rutas Principales

### Públicas
| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | HomePage | Landing con resumen |
| `/calendario` | CalendarioPage | Todos los juegos |
| `/equipos` | EquiposPage | Lista de equipos |
| `/equipos/:id` | EquipoDetailPage | Detalle + roster |
| `/jugadores/:id` | JugadorDetailPage | Perfil + stats |
| `/juegos/:id` | JuegoDetailPage | Box score |
| `/estadisticas` | EstadisticasPage | Líderes |
| `/posiciones` | TablaPosicionesPage | Standings |

### Admin (protegidas)
| Ruta | Página | Descripción |
|------|--------|-------------|
| `/admin` | DashboardPage | Resumen admin |
| `/admin/equipos` | AdminEquiposPage | CRUD equipos |
| `/admin/jugadores` | AdminJugadoresPage | CRUD jugadores |
| `/admin/calendario` | AdminCalendarioPage | Programar juegos |
| `/admin/juegos/:id` | AdminJuegoPage | Registrar stats |
| `/admin/temporadas` | AdminTemporadasPage | Gestión temporadas |
| `/login` | LoginPage | Autenticación |
