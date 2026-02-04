-- =============================================
-- MIGRACION 004: Reglas de categoria + sexo en jugadores
-- =============================================

-- 1. Nuevos campos en torneo_categorias
ALTER TABLE torneo_categorias ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE torneo_categorias ADD COLUMN IF NOT EXISTS genero VARCHAR(20) DEFAULT 'cualquiera';
ALTER TABLE torneo_categorias ADD COLUMN IF NOT EXISTS anio_nacimiento_min INTEGER;
ALTER TABLE torneo_categorias ADD COLUMN IF NOT EXISTS anio_nacimiento_max INTEGER;
ALTER TABLE torneo_categorias ADD COLUMN IF NOT EXISTS min_mujeres INTEGER DEFAULT 0;

-- Constraint de genero (drop si existe para idempotencia)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'torneo_categorias_genero_check'
  ) THEN
    ALTER TABLE torneo_categorias ADD CONSTRAINT torneo_categorias_genero_check
      CHECK (genero IN ('varonil', 'femenil', 'mixto', 'cualquiera'));
  END IF;
END $$;

-- 2. Campo sexo en jugadores permanentes
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS sexo VARCHAR(1);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'jugadores_sexo_check'
  ) THEN
    ALTER TABLE jugadores ADD CONSTRAINT jugadores_sexo_check
      CHECK (sexo IN ('M', 'F'));
  END IF;
END $$;
