-- =============================================
-- MIGRACION 003: Sistema de categorias por torneo
-- =============================================

-- 1. Tabla de categorias por torneo
CREATE TABLE IF NOT EXISTS torneo_categorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    torneo_id UUID NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(torneo_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_torneo_categorias_torneo ON torneo_categorias(torneo_id);

-- 2. Agregar categoria_id a torneo_equipos
ALTER TABLE torneo_equipos
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES torneo_categorias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_torneo_equipos_categoria ON torneo_equipos(categoria_id);

-- 3. Agregar categoria_id a inscripciones
ALTER TABLE inscripciones
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES torneo_categorias(id) ON DELETE SET NULL;

-- 4. Agregar categoria_id a juegos
ALTER TABLE juegos
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES torneo_categorias(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_juegos_categoria ON juegos(categoria_id);

-- 5. Agregar categoria_id a series_playoff
ALTER TABLE series_playoff
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES torneo_categorias(id) ON DELETE SET NULL;

-- 6. RLS para torneo_categorias
ALTER TABLE torneo_categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica categorias" ON torneo_categorias;
CREATE POLICY "Lectura publica categorias" ON torneo_categorias
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin escribe categorias" ON torneo_categorias;
CREATE POLICY "Admin escribe categorias" ON torneo_categorias
  FOR ALL USING (auth.role() = 'authenticated');

-- 7. Actualizar vista_calendario para incluir categoria
-- DROP necesario porque se agregan columnas nuevas que cambian el orden
DROP VIEW IF EXISTS vista_calendario;
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
    g.categoria_id,
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
    t.nombre AS temporada_nombre,
    tc.nombre AS categoria_nombre
FROM juegos g
JOIN equipos el ON g.equipo_local_id = el.id
JOIN equipos ev ON g.equipo_visitante_id = ev.id
LEFT JOIN temporadas t ON g.temporada_id = t.id
LEFT JOIN torneo_categorias tc ON g.categoria_id = tc.id
ORDER BY g.fecha;
