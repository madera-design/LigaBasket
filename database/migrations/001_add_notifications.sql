-- Migración: Sistema de notificaciones por email
-- Agrega campos de delegado a equipos y crea tabla de registro de notificaciones

-- 1. Agregar campos de delegado a equipos
ALTER TABLE equipos
ADD COLUMN IF NOT EXISTS delegate_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS delegate_email VARCHAR(255);

-- 2. Crear tabla de registro de notificaciones
CREATE TABLE IF NOT EXISTS notifications_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    juego_id UUID REFERENCES juegos(id) ON DELETE CASCADE,
    tipo_notificacion VARCHAR(50) NOT NULL,
    destinatarios TEXT[] NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'fallido')),
    mensaje_asunto TEXT,
    mensaje_cuerpo TEXT,
    error_mensaje TEXT,
    dedup_key VARCHAR(200) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enviado_at TIMESTAMP WITH TIME ZONE
);

-- 3. Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_juego ON notifications_log(juego_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tipo ON notifications_log(tipo_notificacion);
CREATE INDEX IF NOT EXISTS idx_notifications_estado ON notifications_log(estado);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications_log(created_at DESC);

-- 4. RLS
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica de notificaciones" ON notifications_log
FOR SELECT USING (true);

CREATE POLICY "Escritura autenticada de notificaciones" ON notifications_log
FOR INSERT WITH CHECK (true);

CREATE POLICY "Actualizacion autenticada de notificaciones" ON notifications_log
FOR UPDATE USING (true);
