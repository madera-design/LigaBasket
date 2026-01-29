# 🏀 Sistema de Administración de Liga de Basquetbol

Sistema web completo para gestionar una liga de basquetbol: equipos, jugadores, calendario de juegos y estadísticas.

## 🚀 Tecnologías

- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Routing:** React Router v6
- **Iconos:** Lucide React
- **Notificaciones:** React Hot Toast

## 📋 Características

### Público (sin login)
- ✅ Ver calendario de juegos
- ✅ Ver tabla de posiciones
- ✅ Ver estadísticas de jugadores
- ✅ Ver roster de equipos
- ✅ Ver detalles de partidos (box score)

### Administración (requiere login)
- ✅ CRUD de equipos
- ✅ CRUD de jugadores
- ✅ Programar juegos
- ✅ Registrar resultados y estadísticas
- ✅ Dashboard con resumen

## 🛠️ Instalación

### 1. Clonar e instalar dependencias

```bash
cd liga-basquetbol
npm install
```

### 2. Configurar Supabase

#### 2.1 Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se inicialice (puede tomar unos minutos)

#### 2.2 Ejecutar el esquema de base de datos

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Copia todo el contenido de `database/schema.sql`
3. Pégalo en el editor y ejecuta (Run)

#### 2.3 Configurar autenticación

1. Ve a **Authentication** → **Users**
2. Clic en **Add user** → **Create new user**
3. Ingresa email y contraseña para el admin
4. Marca "Auto Confirm User" si está disponible

#### 2.4 (Opcional) Configurar Storage para imágenes

1. Ve a **Storage**
2. Crea un bucket llamado `logos` (para logos de equipos)
3. Crea un bucket llamado `fotos` (para fotos de jugadores)
4. En cada bucket, ve a **Policies** y añade:
   - Policy para SELECT: Allow public access
   - Policy para INSERT/UPDATE/DELETE: Allow authenticated users

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

**¿Dónde encontrar estas credenciales?**
1. Ve a tu proyecto en Supabase
2. Settings → API
3. Copia "Project URL" y "anon public" key

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

## 📁 Estructura del Proyecto

```
liga-basquetbol/
├── database/
│   └── schema.sql          # Esquema de BD para Supabase
├── src/
│   ├── components/         # Componentes React
│   │   ├── layout/        # Header, Sidebar, Layouts
│   │   └── ui/            # Botones, Inputs, etc.
│   ├── config/            # Configuración (Supabase)
│   ├── contexts/          # React Context (Auth)
│   ├── pages/             # Páginas/Vistas
│   │   ├── admin/        # Panel de administración
│   │   ├── auth/         # Login
│   │   └── public/       # Páginas públicas
│   ├── services/          # Llamadas a Supabase
│   ├── styles/            # CSS + Tailwind
│   └── utils/             # Utilidades
└── README.md
```

## 🎯 Uso

### Como Visitante
Navega por el sitio para ver equipos, calendario y estadísticas. No requiere cuenta.

### Como Administrador
1. Haz clic en "Admin" en el menú
2. Inicia sesión con tus credenciales
3. Gestiona equipos, jugadores y juegos desde el panel

### Flujo típico:
1. **Crear equipos** con nombre, colores y entrenador
2. **Agregar jugadores** a cada equipo
3. **Programar juegos** en el calendario
4. **Registrar estadísticas** cuando termine cada juego
5. Las estadísticas y posiciones se calculan automáticamente

## 🗄️ Base de Datos

### Tablas principales:
- `temporadas` - Temporadas/torneos
- `equipos` - Información de equipos
- `jugadores` - Roster de jugadores
- `juegos` - Calendario y resultados
- `estadisticas_jugador` - Stats por partido
- `tabla_posiciones` - Standings

### Vistas útiles:
- `v_calendario_juegos` - Juegos con nombres de equipos
- `v_estadisticas_promedio_jugador` - Promedios por jugador
- `v_tabla_posiciones` - Tabla de posiciones completa

## 📊 Estadísticas Calculadas

- **PPJ** - Puntos por juego
- **APJ** - Asistencias por juego
- **RPJ** - Rebotes por juego
- **% TC** - Porcentaje de tiros de campo
- **% 3P** - Porcentaje de triples
- **% TL** - Porcentaje de tiros libres

## 🔒 Seguridad

- Row Level Security (RLS) habilitado
- Lectura pública para todos los datos
- Escritura solo para usuarios autenticados

## 🚀 Despliegue

```bash
npm run build
# Despliega la carpeta 'dist' en Vercel, Netlify, etc.
```

---

Desarrollado con ❤️ y 🏀
