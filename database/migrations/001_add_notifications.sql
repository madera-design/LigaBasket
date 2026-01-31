-- =============================================
-- MIGRACION: Sistema de notificaciones por email
-- Usa pg_net para enviar emails via Resend directamente desde triggers SQL
-- NO requiere Edge Functions, CLI, ni deploy externo
-- =============================================

-- 0. Habilitar extension pg_net (ya viene incluida en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1. Agregar campos de delegado a equipos
ALTER TABLE equipos
ADD COLUMN IF NOT EXISTS delegate_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS delegate_email VARCHAR(255);

-- 2. Tabla de configuracion para guardar la API key de Resend
CREATE TABLE IF NOT EXISTS app_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar placeholder para la API key (CAMBIAR por tu key real)
INSERT INTO app_config (key, value) VALUES
  ('resend_api_key', 'CAMBIAR_POR_TU_API_KEY'),
  ('from_email', 'LigaBasket <onboarding@resend.dev>')
ON CONFLICT (key) DO NOTHING;

-- RLS para app_config (solo lectura autenticada)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Solo lectura autenticada" ON app_config;
CREATE POLICY "Solo lectura autenticada" ON app_config FOR SELECT USING (true);

-- 3. Tabla de registro de notificaciones
CREATE TABLE IF NOT EXISTS notifications_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    juego_id UUID REFERENCES juegos(id) ON DELETE CASCADE,
    tipo_notificacion VARCHAR(50) NOT NULL,
    destinatarios TEXT[] NOT NULL,
    estado VARCHAR(20) DEFAULT 'enviado' CHECK (estado IN ('enviado', 'fallido')),
    mensaje_asunto TEXT,
    error_mensaje TEXT,
    dedup_key VARCHAR(200) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_juego ON notifications_log(juego_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tipo ON notifications_log(tipo_notificacion);
CREATE INDEX IF NOT EXISTS idx_notifications_estado ON notifications_log(estado);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications_log(created_at DESC);

ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lectura publica de notificaciones" ON notifications_log;
DROP POLICY IF EXISTS "Escritura de notificaciones" ON notifications_log;
DROP POLICY IF EXISTS "Actualizacion de notificaciones" ON notifications_log;
DROP POLICY IF EXISTS "Escritura autenticada de notificaciones" ON notifications_log;
CREATE POLICY "Lectura publica de notificaciones" ON notifications_log FOR SELECT USING (true);
CREATE POLICY "Escritura de notificaciones" ON notifications_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion de notificaciones" ON notifications_log FOR UPDATE USING (true);

-- =============================================
-- 4. FUNCION: Enviar email via Resend usando pg_net
-- =============================================
CREATE OR REPLACE FUNCTION send_resend_email(
    p_to TEXT[],
    p_subject TEXT,
    p_html TEXT,
    p_juego_id UUID,
    p_tipo TEXT,
    p_dedup_key TEXT
) RETURNS VOID AS $$
DECLARE
    v_api_key TEXT;
    v_from_email TEXT;
    v_body JSONB;
BEGIN
    -- Verificar deduplicacion
    IF p_dedup_key IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM notifications_log WHERE dedup_key = p_dedup_key) THEN
            RETURN; -- Ya se envio
        END IF;
    END IF;

    -- Obtener config
    SELECT value INTO v_api_key FROM app_config WHERE key = 'resend_api_key';
    SELECT value INTO v_from_email FROM app_config WHERE key = 'from_email';

    -- No enviar si no hay API key configurada
    IF v_api_key IS NULL OR v_api_key = 'CAMBIAR_POR_TU_API_KEY' THEN
        RAISE NOTICE 'Resend API key no configurada, omitiendo envio';
        RETURN;
    END IF;

    -- Construir body
    v_body := jsonb_build_object(
        'from', v_from_email,
        'to', to_jsonb(p_to),
        'subject', p_subject,
        'html', p_html
    );

    -- Enviar via pg_net
    PERFORM net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_api_key
        ),
        body := v_body
    );

    -- Registrar en log
    INSERT INTO notifications_log (juego_id, tipo_notificacion, destinatarios, estado, mensaje_asunto, dedup_key)
    VALUES (p_juego_id, p_tipo, p_to, 'enviado', p_subject, p_dedup_key);

EXCEPTION WHEN OTHERS THEN
    -- Registrar fallo
    INSERT INTO notifications_log (juego_id, tipo_notificacion, destinatarios, estado, mensaje_asunto, error_mensaje, dedup_key)
    VALUES (p_juego_id, p_tipo, p_to, 'fallido', p_subject, SQLERRM, p_dedup_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. FUNCION: Generar HTML del email
-- =============================================
CREATE OR REPLACE FUNCTION build_game_email_html(
    p_tipo TEXT,
    p_local TEXT,
    p_visitante TEXT,
    p_fecha TIMESTAMP WITH TIME ZONE,
    p_lugar TEXT,
    p_puntos_local INT DEFAULT 0,
    p_puntos_visitante INT DEFAULT 0
) RETURNS TEXT AS $$
DECLARE
    v_fecha_fmt TEXT;
    v_titulo TEXT;
    v_color TEXT;
    v_bg TEXT;
    v_contenido TEXT;
    v_matchup TEXT;
    v_detalles TEXT;
BEGIN
    -- Formatear fecha
    v_fecha_fmt := TO_CHAR(p_fecha AT TIME ZONE 'America/Mexico_City', 'DD/MM/YYYY "a las" HH24:MI');

    -- Matchup block
    v_matchup := '<div style="text-align:center;margin-bottom:15px;">'
        || '<span style="font-size:18px;font-weight:bold;color:#1f2937;">' || p_local || '</span>'
        || ' <span style="font-size:24px;font-weight:bold;margin:0 12px;">vs</span> '
        || '<span style="font-size:18px;font-weight:bold;color:#1f2937;">' || p_visitante || '</span>'
        || '</div>';

    -- Detalles (fecha + lugar)
    v_detalles := '<p style="margin:8px 0;color:#4b5563;">Fecha: <strong>' || v_fecha_fmt || '</strong></p>';
    IF p_lugar IS NOT NULL AND p_lugar != '' THEN
        v_detalles := v_detalles || '<p style="margin:8px 0;color:#4b5563;">Lugar: <strong>' || p_lugar || '</strong></p>';
    END IF;

    -- Tipo-especifico
    CASE p_tipo
        WHEN 'game_created' THEN
            v_titulo := 'Nuevo Juego Programado';
            v_color := '#f97316'; v_bg := '#fff7ed';
        WHEN 'game_rescheduled' THEN
            v_titulo := 'Juego Reprogramado';
            v_color := '#d97706'; v_bg := '#fef3c7';
        WHEN 'game_finalized' THEN
            v_titulo := 'Juego Finalizado';
            v_color := '#059669'; v_bg := '#d1fae5';
            v_detalles := '<div style="text-align:center;font-size:28px;font-weight:bold;color:#059669;margin:15px 0;">'
                || p_puntos_local::TEXT || ' - ' || p_puntos_visitante::TEXT
                || '</div>' || v_detalles;
        WHEN 'game_cancelled' THEN
            v_titulo := 'Juego Cancelado';
            v_color := '#dc2626'; v_bg := '#fee2e2';
        WHEN 'game_suspended' THEN
            v_titulo := 'Juego Suspendido';
            v_color := '#ea580c'; v_bg := '#fed7aa';
        WHEN 'reminder_24h' THEN
            v_titulo := 'Recordatorio: Juego en 24 horas';
            v_color := '#2563eb'; v_bg := '#dbeafe';
        WHEN 'reminder_2h' THEN
            v_titulo := 'Recordatorio: Juego en 2 horas';
            v_color := '#7c3aed'; v_bg := '#ede9fe';
        ELSE
            v_titulo := 'Notificacion';
            v_color := '#6b7280'; v_bg := '#f3f4f6';
    END CASE;

    -- Contenido del card
    v_contenido := '<div style="background:' || v_bg || ';border-left:4px solid ' || v_color || ';padding:20px;border-radius:6px;margin:20px 0;">'
        || v_matchup || v_detalles || '</div>';

    -- Email completo
    RETURN '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
        || '<body style="margin:0;padding:0;font-family:Helvetica,Arial,sans-serif;background:#f9fafb;">'
        || '<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 0;">'
        || '<table role="presentation" style="width:600px;max-width:100%;background:white;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">'
        -- Header
        || '<tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:25px;text-align:center;">'
        || '<h1 style="color:white;margin:0;font-size:24px;">LigaBasket</h1>'
        || '</td></tr>'
        -- Body
        || '<tr><td style="padding:30px;">'
        || '<h2 style="color:' || v_color || ';margin-top:0;">' || v_titulo || '</h2>'
        || v_contenido
        || '</td></tr>'
        -- Footer
        || '<tr><td style="background:#f3f4f6;padding:15px;text-align:center;color:#9ca3af;font-size:12px;">'
        || '<p style="margin:0;">Correo automatico - LigaBasket</p>'
        || '</td></tr>'
        || '</table></td></tr></table></body></html>';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- 6. FUNCION: Trigger que detecta cambios en juegos y envia emails
-- =============================================
CREATE OR REPLACE FUNCTION notify_game_change() RETURNS TRIGGER AS $$
DECLARE
    v_tipo TEXT;
    v_emails TEXT[];
    v_subject TEXT;
    v_html TEXT;
    v_local_nombre TEXT;
    v_visitante_nombre TEXT;
    v_dedup_key TEXT;
    v_email TEXT;
BEGIN
    -- Determinar tipo de notificacion
    IF TG_OP = 'INSERT' AND NEW.estado = 'programado' THEN
        v_tipo := 'game_created';
    ELSIF TG_OP = 'UPDATE' THEN
        -- Cambio de estado
        IF OLD.estado != NEW.estado THEN
            CASE NEW.estado
                WHEN 'finalizado' THEN v_tipo := 'game_finalized';
                WHEN 'cancelado' THEN v_tipo := 'game_cancelled';
                WHEN 'suspendido' THEN v_tipo := 'game_suspended';
                ELSE RETURN NEW; -- No notificar otros cambios de estado
            END CASE;
        -- Cambio de fecha o lugar (reprogramacion)
        ELSIF (OLD.fecha != NEW.fecha OR COALESCE(OLD.lugar,'') != COALESCE(NEW.lugar,'')) AND NEW.estado = 'programado' THEN
            v_tipo := 'game_rescheduled';
        ELSE
            RETURN NEW; -- No notificar otros updates
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    -- Obtener nombres de equipos
    SELECT nombre INTO v_local_nombre FROM equipos WHERE id = NEW.equipo_local_id;
    SELECT nombre INTO v_visitante_nombre FROM equipos WHERE id = NEW.equipo_visitante_id;

    -- Obtener emails de delegados de ambos equipos
    v_emails := ARRAY[]::TEXT[];
    FOR v_email IN
        SELECT delegate_email FROM equipos
        WHERE id IN (NEW.equipo_local_id, NEW.equipo_visitante_id)
        AND delegate_email IS NOT NULL AND delegate_email != ''
    LOOP
        v_emails := array_append(v_emails, v_email);
    END LOOP;

    -- Si no hay destinatarios, salir
    IF array_length(v_emails, 1) IS NULL THEN
        RETURN NEW;
    END IF;

    -- Generar dedup key (tipo + juego_id + hora redondeada)
    v_dedup_key := v_tipo || ':' || NEW.id || ':' || TO_CHAR(NOW(), 'YYYY-MM-DD-HH24');

    -- Generar subject
    CASE v_tipo
        WHEN 'game_created' THEN
            v_subject := 'Nuevo juego: ' || v_local_nombre || ' vs ' || v_visitante_nombre;
        WHEN 'game_rescheduled' THEN
            v_subject := 'Juego reprogramado: ' || v_local_nombre || ' vs ' || v_visitante_nombre;
        WHEN 'game_finalized' THEN
            v_subject := 'Resultado: ' || v_local_nombre || ' ' || NEW.puntos_local || ' - ' || NEW.puntos_visitante || ' ' || v_visitante_nombre;
        WHEN 'game_cancelled' THEN
            v_subject := 'Juego cancelado: ' || v_local_nombre || ' vs ' || v_visitante_nombre;
        WHEN 'game_suspended' THEN
            v_subject := 'Juego suspendido: ' || v_local_nombre || ' vs ' || v_visitante_nombre;
        ELSE
            v_subject := 'Notificacion: ' || v_local_nombre || ' vs ' || v_visitante_nombre;
    END CASE;

    -- Generar HTML
    v_html := build_game_email_html(
        v_tipo, v_local_nombre, v_visitante_nombre,
        NEW.fecha, NEW.lugar,
        NEW.puntos_local, NEW.puntos_visitante
    );

    -- Enviar email
    PERFORM send_resend_email(v_emails, v_subject, v_html, NEW.id, v_tipo, v_dedup_key);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. TRIGGER en la tabla juegos
-- =============================================
DROP TRIGGER IF EXISTS trigger_notify_game_change ON juegos;
CREATE TRIGGER trigger_notify_game_change
    AFTER INSERT OR UPDATE ON juegos
    FOR EACH ROW
    EXECUTE FUNCTION notify_game_change();

-- =============================================
-- LISTO! Para activar:
-- 1. Ejecutar esta migracion en Supabase SQL Editor
-- 2. Actualizar la API key:
--    UPDATE app_config SET value = 're_TU_API_KEY' WHERE key = 'resend_api_key';
-- 3. (Opcional) Cambiar el remitente:
--    UPDATE app_config SET value = 'LigaBasket <noreply@tudominio.com>' WHERE key = 'from_email';
-- =============================================
