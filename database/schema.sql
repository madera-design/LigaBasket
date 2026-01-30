-- =============================================
-- SISTEMA DE ADMINISTRACIÓN DE LIGA DE BASQUETBOL
-- Esquema de Base de Datos para Supabase
-- =============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: temporadas
-- Gestiona las diferentes temporadas de la liga
-- =============================================
CREATE TABLE temporadas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activa BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: equipos
-- Información de cada equipo de la liga
-- =============================================
CREATE TABLE equipos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    nombre_corto VARCHAR(10),
    logo_url TEXT,
    color_primario VARCHAR(7) DEFAULT '#000000',
    color_secundario VARCHAR(7) DEFAULT '#FFFFFF',
    entrenador VARCHAR(100),
    fundado_en INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: jugadores
-- Información de cada jugador
-- =============================================
CREATE TABLE jugadores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    numero INTEGER NOT NULL,
    posicion VARCHAR(20) NOT NULL CHECK (posicion IN ('Base', 'Escolta', 'Alero', 'Ala-Pivot', 'Pivot')),
    fecha_nacimiento DATE,
    altura_cm INTEGER,
    peso_kg DECIMAL(5,2),
    foto_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(equipo_id, numero)
);

-- =============================================
-- TABLA: torneos
-- Configuracion de torneos
-- =============================================
CREATE TABLE torneos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    temporada_id UUID NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    fecha_inicio DATE NOT NULL,
    dias_juego INTEGER[] NOT NULL,
    horarios TEXT[] NOT NULL,
    lugar VARCHAR(200),
    fase VARCHAR(20) DEFAULT 'regular' CHECK (fase IN ('configuracion', 'regular', 'playoffs', 'finalizado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: torneo_equipos
-- Equipos participantes en un torneo
-- =============================================
CREATE TABLE torneo_equipos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    torneo_id UUID NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    UNIQUE(torneo_id, equipo_id)
);

-- =============================================
-- TABLA: series_playoff
-- Series al mejor de 3
-- =============================================
CREATE TABLE series_playoff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    torneo_id UUID NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
    ronda INTEGER NOT NULL DEFAULT 1,
    numero_serie INTEGER NOT NULL,
    equipo_superior_id UUID REFERENCES equipos(id),
    equipo_inferior_id UUID REFERENCES equipos(id),
    victorias_superior INTEGER DEFAULT 0,
    victorias_inferior INTEGER DEFAULT 0,
    ganador_id UUID REFERENCES equipos(id),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'finalizada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: juegos
-- Calendario y resultados de partidos
-- =============================================
CREATE TABLE juegos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    temporada_id UUID REFERENCES temporadas(id) ON DELETE CASCADE,
    torneo_id UUID REFERENCES torneos(id) ON DELETE SET NULL,
    equipo_local_id UUID NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,
    equipo_visitante_id UUID NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    lugar VARCHAR(200),
    estado VARCHAR(20) DEFAULT 'programado' CHECK (estado IN ('programado', 'en_curso', 'finalizado', 'suspendido', 'cancelado')),
    puntos_local INTEGER DEFAULT 0,
    puntos_visitante INTEGER DEFAULT 0,
    q1_local INTEGER DEFAULT 0,
    q1_visitante INTEGER DEFAULT 0,
    q2_local INTEGER DEFAULT 0,
    q2_visitante INTEGER DEFAULT 0,
    q3_local INTEGER DEFAULT 0,
    q3_visitante INTEGER DEFAULT 0,
    q4_local INTEGER DEFAULT 0,
    q4_visitante INTEGER DEFAULT 0,
    ot_local INTEGER DEFAULT 0,
    ot_visitante INTEGER DEFAULT 0,
    jornada INTEGER,
    fase_juego VARCHAR(20) DEFAULT 'ida' CHECK (fase_juego IN ('ida', 'vuelta', 'playoff')),
    serie_id UUID REFERENCES series_playoff(id) ON DELETE SET NULL,
    numero_juego_serie INTEGER,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (equipo_local_id != equipo_visitante_id)
);

-- =============================================
-- TABLA: estadisticas_jugador
-- Estadísticas individuales por juego
-- =============================================
CREATE TABLE estadisticas_jugador (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    juego_id UUID NOT NULL REFERENCES juegos(id) ON DELETE CASCADE,
    jugador_id UUID NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    minutos INTEGER DEFAULT 0,
    segundos INTEGER DEFAULT 0,
    puntos INTEGER DEFAULT 0,
    tiros_campo_intentados INTEGER DEFAULT 0,
    tiros_campo_convertidos INTEGER DEFAULT 0,
    triples_intentados INTEGER DEFAULT 0,
    triples_convertidos INTEGER DEFAULT 0,
    tiros_libres_intentados INTEGER DEFAULT 0,
    tiros_libres_convertidos INTEGER DEFAULT 0,
    rebotes_ofensivos INTEGER DEFAULT 0,
    rebotes_defensivos INTEGER DEFAULT 0,
    asistencias INTEGER DEFAULT 0,
    robos INTEGER DEFAULT 0,
    bloqueos INTEGER DEFAULT 0,
    perdidas INTEGER DEFAULT 0,
    faltas INTEGER DEFAULT 0,
    titular BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(juego_id, jugador_id)
);

-- =============================================
-- TABLA: tabla_posiciones
-- Registro de posiciones por temporada
-- =============================================
CREATE TABLE tabla_posiciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    temporada_id UUID NOT NULL REFERENCES temporadas(id) ON DELETE CASCADE,
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    juegos_jugados INTEGER DEFAULT 0,
    juegos_ganados INTEGER DEFAULT 0,
    juegos_perdidos INTEGER DEFAULT 0,
    puntos_favor INTEGER DEFAULT 0,
    puntos_contra INTEGER DEFAULT 0,
    diferencia_puntos INTEGER DEFAULT 0,
    porcentaje_victorias DECIMAL(5,3) DEFAULT 0.000,
    racha VARCHAR(50),
    ultimos_5 VARCHAR(10),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(temporada_id, equipo_id)
);

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX idx_jugadores_equipo ON jugadores(equipo_id);
CREATE INDEX idx_jugadores_activo ON jugadores(activo);
CREATE INDEX idx_juegos_temporada ON juegos(temporada_id);
CREATE INDEX idx_juegos_torneo ON juegos(torneo_id);
CREATE INDEX idx_juegos_serie ON juegos(serie_id);
CREATE INDEX idx_juegos_fecha ON juegos(fecha);
CREATE INDEX idx_juegos_estado ON juegos(estado);
CREATE INDEX idx_estadisticas_juego ON estadisticas_jugador(juego_id);
CREATE INDEX idx_estadisticas_jugador ON estadisticas_jugador(jugador_id);

-- =============================================
-- VISTAS
-- =============================================

-- Vista: Estadísticas promedio por jugador
CREATE OR REPLACE VIEW vista_estadisticas_jugador AS
SELECT 
    j.id AS jugador_id,
    j.nombre,
    j.apellido,
    j.numero,
    j.posicion,
    e.id AS equipo_id,
    e.nombre AS equipo_nombre,
    e.nombre_corto AS equipo_corto,
    COUNT(ej.id) AS juegos_jugados,
    SUM(ej.puntos) AS puntos_totales,
    ROUND(AVG(ej.puntos)::numeric, 1) AS ppj,
    ROUND(AVG(ej.asistencias)::numeric, 1) AS apj,
    ROUND(AVG(ej.rebotes_ofensivos + ej.rebotes_defensivos)::numeric, 1) AS rpj,
    ROUND(AVG(ej.robos)::numeric, 1) AS robos_pj,
    ROUND(AVG(ej.bloqueos)::numeric, 1) AS bloqueos_pj,
    CASE WHEN SUM(ej.tiros_campo_intentados) > 0 
        THEN ROUND((SUM(ej.tiros_campo_convertidos)::numeric / SUM(ej.tiros_campo_intentados) * 100), 1)
        ELSE 0 END AS porcentaje_tc,
    CASE WHEN SUM(ej.triples_intentados) > 0 
        THEN ROUND((SUM(ej.triples_convertidos)::numeric / SUM(ej.triples_intentados) * 100), 1)
        ELSE 0 END AS porcentaje_3p,
    CASE WHEN SUM(ej.tiros_libres_intentados) > 0 
        THEN ROUND((SUM(ej.tiros_libres_convertidos)::numeric / SUM(ej.tiros_libres_intentados) * 100), 1)
        ELSE 0 END AS porcentaje_tl
FROM jugadores j
JOIN equipos e ON j.equipo_id = e.id
LEFT JOIN estadisticas_jugador ej ON j.id = ej.jugador_id
WHERE j.activo = true
GROUP BY j.id, j.nombre, j.apellido, j.numero, j.posicion, e.id, e.nombre, e.nombre_corto;

-- Vista: Calendario con nombres de equipos
CREATE OR REPLACE VIEW vista_calendario AS
SELECT
    g.id,
    g.fecha,
    g.lugar,
    g.estado,
    g.puntos_local,
    g.puntos_visitante,
    g.torneo_id,
    g.jornada,
    g.fase_juego,
    g.serie_id,
    g.numero_juego_serie,
    el.id AS local_id,
    el.nombre AS local_nombre,
    el.nombre_corto AS local_corto,
    el.logo_url AS local_logo,
    el.color_primario AS local_color,
    ev.id AS visitante_id,
    ev.nombre AS visitante_nombre,
    ev.nombre_corto AS visitante_corto,
    ev.logo_url AS visitante_logo,
    ev.color_primario AS visitante_color,
    t.id AS temporada_id,
    t.nombre AS temporada_nombre
FROM juegos g
JOIN equipos el ON g.equipo_local_id = el.id
JOIN equipos ev ON g.equipo_visitante_id = ev.id
LEFT JOIN temporadas t ON g.temporada_id = t.id
ORDER BY g.fecha;

-- Vista: Tabla de posiciones completa
CREATE OR REPLACE VIEW vista_posiciones AS
SELECT 
    tp.*,
    e.nombre AS equipo_nombre,
    e.nombre_corto AS equipo_corto,
    e.logo_url AS equipo_logo,
    e.color_primario AS equipo_color,
    t.nombre AS temporada_nombre,
    ROW_NUMBER() OVER (PARTITION BY tp.temporada_id ORDER BY tp.porcentaje_victorias DESC, tp.diferencia_puntos DESC) AS posicion
FROM tabla_posiciones tp
JOIN equipos e ON tp.equipo_id = e.id
JOIN temporadas t ON tp.temporada_id = t.id;

-- =============================================
-- FUNCIÓN: Actualizar tabla de posiciones
-- =============================================
CREATE OR REPLACE FUNCTION actualizar_posiciones()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'finalizado' AND (OLD.estado IS NULL OR OLD.estado != 'finalizado') AND NEW.temporada_id IS NOT NULL THEN
        -- Equipo local
        INSERT INTO tabla_posiciones (temporada_id, equipo_id, juegos_jugados, juegos_ganados, juegos_perdidos, puntos_favor, puntos_contra, diferencia_puntos, porcentaje_victorias)
        VALUES (
            NEW.temporada_id, NEW.equipo_local_id, 1,
            CASE WHEN NEW.puntos_local > NEW.puntos_visitante THEN 1 ELSE 0 END,
            CASE WHEN NEW.puntos_local < NEW.puntos_visitante THEN 1 ELSE 0 END,
            NEW.puntos_local, NEW.puntos_visitante,
            NEW.puntos_local - NEW.puntos_visitante,
            CASE WHEN NEW.puntos_local > NEW.puntos_visitante THEN 1.000 ELSE 0.000 END
        )
        ON CONFLICT (temporada_id, equipo_id) DO UPDATE SET
            juegos_jugados = tabla_posiciones.juegos_jugados + 1,
            juegos_ganados = tabla_posiciones.juegos_ganados + CASE WHEN NEW.puntos_local > NEW.puntos_visitante THEN 1 ELSE 0 END,
            juegos_perdidos = tabla_posiciones.juegos_perdidos + CASE WHEN NEW.puntos_local < NEW.puntos_visitante THEN 1 ELSE 0 END,
            puntos_favor = tabla_posiciones.puntos_favor + NEW.puntos_local,
            puntos_contra = tabla_posiciones.puntos_contra + NEW.puntos_visitante,
            diferencia_puntos = tabla_posiciones.puntos_favor + NEW.puntos_local - tabla_posiciones.puntos_contra - NEW.puntos_visitante,
            porcentaje_victorias = ROUND((tabla_posiciones.juegos_ganados + CASE WHEN NEW.puntos_local > NEW.puntos_visitante THEN 1 ELSE 0 END)::numeric / (tabla_posiciones.juegos_jugados + 1), 3),
            updated_at = NOW();
        
        -- Equipo visitante
        INSERT INTO tabla_posiciones (temporada_id, equipo_id, juegos_jugados, juegos_ganados, juegos_perdidos, puntos_favor, puntos_contra, diferencia_puntos, porcentaje_victorias)
        VALUES (
            NEW.temporada_id, NEW.equipo_visitante_id, 1,
            CASE WHEN NEW.puntos_visitante > NEW.puntos_local THEN 1 ELSE 0 END,
            CASE WHEN NEW.puntos_visitante < NEW.puntos_local THEN 1 ELSE 0 END,
            NEW.puntos_visitante, NEW.puntos_local,
            NEW.puntos_visitante - NEW.puntos_local,
            CASE WHEN NEW.puntos_visitante > NEW.puntos_local THEN 1.000 ELSE 0.000 END
        )
        ON CONFLICT (temporada_id, equipo_id) DO UPDATE SET
            juegos_jugados = tabla_posiciones.juegos_jugados + 1,
            juegos_ganados = tabla_posiciones.juegos_ganados + CASE WHEN NEW.puntos_visitante > NEW.puntos_local THEN 1 ELSE 0 END,
            juegos_perdidos = tabla_posiciones.juegos_perdidos + CASE WHEN NEW.puntos_visitante < NEW.puntos_local THEN 1 ELSE 0 END,
            puntos_favor = tabla_posiciones.puntos_favor + NEW.puntos_visitante,
            puntos_contra = tabla_posiciones.puntos_contra + NEW.puntos_local,
            diferencia_puntos = tabla_posiciones.puntos_favor + NEW.puntos_visitante - tabla_posiciones.puntos_contra - NEW.puntos_local,
            porcentaje_victorias = ROUND((tabla_posiciones.juegos_ganados + CASE WHEN NEW.puntos_visitante > NEW.puntos_local THEN 1 ELSE 0 END)::numeric / (tabla_posiciones.juegos_jugados + 1), 3),
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_posiciones
    AFTER INSERT OR UPDATE ON juegos
    FOR EACH ROW EXECUTE FUNCTION actualizar_posiciones();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE temporadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE juegos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estadisticas_jugador ENABLE ROW LEVEL SECURITY;
ALTER TABLE tabla_posiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE torneos ENABLE ROW LEVEL SECURITY;
ALTER TABLE torneo_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_playoff ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "Lectura pública" ON temporadas FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON equipos FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON jugadores FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON juegos FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON estadisticas_jugador FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON tabla_posiciones FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON torneos FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON torneo_equipos FOR SELECT USING (true);
CREATE POLICY "Lectura pública" ON series_playoff FOR SELECT USING (true);

-- Escritura solo autenticados
CREATE POLICY "Admin escribe" ON temporadas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin escribe" ON equipos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin escribe" ON jugadores FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin escribe" ON juegos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin escribe" ON estadisticas_jugador FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin escribe" ON tabla_posiciones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin escribe" ON torneos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin escribe" ON torneo_equipos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin escribe" ON series_playoff FOR ALL USING (auth.role() = 'authenticated');

