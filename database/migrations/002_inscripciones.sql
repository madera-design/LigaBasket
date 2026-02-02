-- =============================================
-- MIGRACION: Sistema de inscripciones de equipos
-- =============================================

-- 1. Agregar nuevas columnas a torneos
ALTER TABLE torneos
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS premio_1er_lugar TEXT,
ADD COLUMN IF NOT EXISTS premio_2do_lugar TEXT,
ADD COLUMN IF NOT EXISTS premio_3er_lugar TEXT,
ADD COLUMN IF NOT EXISTS reglamento_url TEXT,
ADD COLUMN IF NOT EXISTS fecha_inscripcion_inicio DATE,
ADD COLUMN IF NOT EXISTS fecha_inscripcion_fin DATE;

-- 2. Actualizar CHECK constraint de fase para incluir 'inscripcion'
ALTER TABLE torneos DROP CONSTRAINT IF EXISTS torneos_fase_check;
ALTER TABLE torneos ADD CONSTRAINT torneos_fase_check
  CHECK (fase IN ('configuracion', 'inscripcion', 'regular', 'playoffs', 'finalizado'));

-- 3. Tabla de inscripciones
CREATE TABLE IF NOT EXISTS inscripciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    torneo_id UUID NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
    nombre_equipo VARCHAR(100) NOT NULL,
    nombre_corto VARCHAR(10),
    delegado_nombre VARCHAR(100) NOT NULL,
    delegado_email VARCHAR(255) NOT NULL,
    delegado_telefono VARCHAR(20),
    jugadores JSONB NOT NULL DEFAULT '[]',
    estado VARCHAR(20) DEFAULT 'pendiente'
      CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    notas_admin TEXT,
    equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indices
CREATE INDEX IF NOT EXISTS idx_inscripciones_torneo ON inscripciones(torneo_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_estado ON inscripciones(estado);

-- 5. RLS
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;

-- Lectura publica
DROP POLICY IF EXISTS "Lectura publica inscripciones" ON inscripciones;
CREATE POLICY "Lectura publica inscripciones" ON inscripciones
  FOR SELECT USING (true);

-- Inscripcion publica (sin autenticacion requerida)
DROP POLICY IF EXISTS "Inscripcion publica" ON inscripciones;
CREATE POLICY "Inscripcion publica" ON inscripciones
  FOR INSERT WITH CHECK (true);

-- Solo admin puede actualizar
DROP POLICY IF EXISTS "Admin gestiona inscripciones" ON inscripciones;
CREATE POLICY "Admin gestiona inscripciones" ON inscripciones
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Solo admin puede eliminar
DROP POLICY IF EXISTS "Admin elimina inscripciones" ON inscripciones;
CREATE POLICY "Admin elimina inscripciones" ON inscripciones
  FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Columnas adicionales para datos visuales del equipo en inscripciones
ALTER TABLE inscripciones
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS color_primario VARCHAR(7) DEFAULT '#f97316',
ADD COLUMN IF NOT EXISTS color_secundario VARCHAR(7) DEFAULT '#ffffff';

-- 7. Policies de storage para uploads publicos (logos y fotos)
-- Ejecutar solo si no existen las policies

-- Permitir uploads publicos al bucket 'logos' (para inscripciones)
CREATE POLICY "Upload publico logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos');

-- Permitir uploads publicos al bucket 'fotos' (para inscripciones)
CREATE POLICY "Upload publico fotos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fotos');
