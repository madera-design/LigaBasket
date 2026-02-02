-- =============================================
-- SEED DATA - Liga de Basquetbol (Reducido para pruebas de notificaciones)
-- 4 equipos, 1 torneo, delegate_email en Tigres
-- =============================================

-- Limpiar datos existentes (en orden de dependencias)
DELETE FROM estadisticas_jugador;
DELETE FROM notifications_log;
DELETE FROM tabla_posiciones;
DELETE FROM juegos;
DELETE FROM series_playoff;
DELETE FROM torneo_equipos;
DELETE FROM inscripciones;
DELETE FROM torneos;
DELETE FROM temporadas;
DELETE FROM jugadores;
DELETE FROM equipos;

-- Limpiar archivos de storage
DELETE FROM storage.objects WHERE bucket_id = 'reglamentos';
DELETE FROM storage.objects WHERE bucket_id = 'logos';
DELETE FROM storage.objects WHERE bucket_id = 'fotos';

-- =============================================
-- EQUIPOS (4) - Tigres con delegate_email para pruebas
-- =============================================
INSERT INTO equipos (id, nombre, nombre_corto, color_primario, color_secundario, entrenador, fundado_en, activo, delegate_name, delegate_email) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'Tigres', 'TIG', '#F97316', '#FFFFFF', 'Carlos Mendoza', 2018, true, 'Jose Antonio Madera', 'joseantoniomaderag@gmail.com'),
  ('e0000001-0000-0000-0000-000000000002', 'Lobos', 'LOB', '#6366F1', '#FFFFFF', 'Miguel Herrera', 2019, true, NULL, NULL),
  ('e0000001-0000-0000-0000-000000000003', 'Aguilas', 'AGU', '#EF4444', '#FFFFFF', 'Roberto Diaz', 2017, true, NULL, NULL),
  ('e0000001-0000-0000-0000-000000000004', 'Toros', 'TOR', '#10B981', '#FFFFFF', 'Fernando Ortiz', 2020, true, NULL, NULL);

-- =============================================
-- JUGADORES (12 por equipo = 48 total)
-- =============================================

-- TIGRES
INSERT INTO jugadores (equipo_id, nombre, apellido, numero, posicion, altura_cm, peso_kg, activo) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'Carlos', 'Martinez', 1, 'Base', 178, 75, true),
  ('e0000001-0000-0000-0000-000000000001', 'Miguel', 'Lopez', 2, 'Base', 180, 78, true),
  ('e0000001-0000-0000-0000-000000000001', 'Diego', 'Garcia', 5, 'Escolta', 185, 82, true),
  ('e0000001-0000-0000-0000-000000000001', 'Andres', 'Rodriguez', 7, 'Escolta', 188, 85, true),
  ('e0000001-0000-0000-0000-000000000001', 'Luis', 'Hernandez', 10, 'Alero', 193, 90, true),
  ('e0000001-0000-0000-0000-000000000001', 'Roberto', 'Sanchez', 11, 'Alero', 195, 92, true),
  ('e0000001-0000-0000-0000-000000000001', 'Fernando', 'Torres', 14, 'Ala-Pivot', 198, 95, true),
  ('e0000001-0000-0000-0000-000000000001', 'Alejandro', 'Ramirez', 21, 'Ala-Pivot', 200, 98, true),
  ('e0000001-0000-0000-0000-000000000001', 'Pablo', 'Flores', 23, 'Pivot', 203, 102, true),
  ('e0000001-0000-0000-0000-000000000001', 'Javier', 'Morales', 32, 'Pivot', 205, 105, true),
  ('e0000001-0000-0000-0000-000000000001', 'Ricardo', 'Diaz', 8, 'Escolta', 186, 83, true),
  ('e0000001-0000-0000-0000-000000000001', 'Eduardo', 'Reyes', 15, 'Alero', 191, 88, true);

-- LOBOS
INSERT INTO jugadores (equipo_id, nombre, apellido, numero, posicion, altura_cm, peso_kg, activo) VALUES
  ('e0000001-0000-0000-0000-000000000002', 'David', 'Cruz', 3, 'Base', 179, 76, true),
  ('e0000001-0000-0000-0000-000000000002', 'Oscar', 'Vargas', 4, 'Base', 181, 79, true),
  ('e0000001-0000-0000-0000-000000000002', 'Ivan', 'Mendez', 6, 'Escolta', 186, 83, true),
  ('e0000001-0000-0000-0000-000000000002', 'Hugo', 'Castro', 9, 'Escolta', 187, 84, true),
  ('e0000001-0000-0000-0000-000000000002', 'Adrian', 'Ruiz', 12, 'Alero', 194, 91, true),
  ('e0000001-0000-0000-0000-000000000002', 'Sergio', 'Ortega', 13, 'Alero', 192, 89, true),
  ('e0000001-0000-0000-0000-000000000002', 'Raul', 'Jimenez', 20, 'Ala-Pivot', 199, 96, true),
  ('e0000001-0000-0000-0000-000000000002', 'Mario', 'Navarro', 22, 'Ala-Pivot', 201, 99, true),
  ('e0000001-0000-0000-0000-000000000002', 'Pedro', 'Gutierrez', 25, 'Pivot', 204, 103, true),
  ('e0000001-0000-0000-0000-000000000002', 'Enrique', 'Dominguez', 30, 'Pivot', 206, 106, true),
  ('e0000001-0000-0000-0000-000000000002', 'Victor', 'Ramos', 8, 'Escolta', 185, 82, true),
  ('e0000001-0000-0000-0000-000000000002', 'Daniel', 'Aguilar', 15, 'Alero', 190, 87, true);

-- AGUILAS
INSERT INTO jugadores (equipo_id, nombre, apellido, numero, posicion, altura_cm, peso_kg, activo) VALUES
  ('e0000001-0000-0000-0000-000000000003', 'Gabriel', 'Perez', 1, 'Base', 177, 74, true),
  ('e0000001-0000-0000-0000-000000000003', 'Arturo', 'Gonzalez', 4, 'Base', 182, 80, true),
  ('e0000001-0000-0000-0000-000000000003', 'Ramon', 'Silva', 5, 'Escolta', 184, 81, true),
  ('e0000001-0000-0000-0000-000000000003', 'Jorge', 'Medina', 7, 'Escolta', 189, 86, true),
  ('e0000001-0000-0000-0000-000000000003', 'Manuel', 'Herrera', 10, 'Alero', 192, 90, true),
  ('e0000001-0000-0000-0000-000000000003', 'Antonio', 'Rios', 11, 'Alero', 196, 93, true),
  ('e0000001-0000-0000-0000-000000000003', 'Francisco', 'Luna', 14, 'Ala-Pivot', 197, 94, true),
  ('e0000001-0000-0000-0000-000000000003', 'Alberto', 'Soto', 21, 'Ala-Pivot', 202, 100, true),
  ('e0000001-0000-0000-0000-000000000003', 'Hector', 'Vazquez', 24, 'Pivot', 205, 104, true),
  ('e0000001-0000-0000-0000-000000000003', 'Julio', 'Guerrero', 33, 'Pivot', 207, 108, true),
  ('e0000001-0000-0000-0000-000000000003', 'Rafael', 'Ibarra', 8, 'Escolta', 187, 84, true),
  ('e0000001-0000-0000-0000-000000000003', 'Emilio', 'Espinoza', 15, 'Alero', 193, 89, true);

-- TOROS
INSERT INTO jugadores (equipo_id, nombre, apellido, numero, posicion, altura_cm, peso_kg, activo) VALUES
  ('e0000001-0000-0000-0000-000000000004', 'Santiago', 'Acosta', 2, 'Base', 180, 77, true),
  ('e0000001-0000-0000-0000-000000000004', 'Mateo', 'Delgado', 3, 'Base', 178, 75, true),
  ('e0000001-0000-0000-0000-000000000004', 'Sebastian', 'Mora', 6, 'Escolta', 185, 82, true),
  ('e0000001-0000-0000-0000-000000000004', 'Nicolas', 'Rojas', 9, 'Escolta', 188, 85, true),
  ('e0000001-0000-0000-0000-000000000004', 'Tomas', 'Pena', 10, 'Alero', 191, 88, true),
  ('e0000001-0000-0000-0000-000000000004', 'Samuel', 'Cardenas', 12, 'Alero', 194, 91, true),
  ('e0000001-0000-0000-0000-000000000004', 'Benjamin', 'Fuentes', 14, 'Ala-Pivot', 198, 96, true),
  ('e0000001-0000-0000-0000-000000000004', 'Leonardo', 'Campos', 20, 'Ala-Pivot', 200, 98, true),
  ('e0000001-0000-0000-0000-000000000004', 'Emiliano', 'Salazar', 23, 'Pivot', 203, 102, true),
  ('e0000001-0000-0000-0000-000000000004', 'Joaquin', 'Contreras', 31, 'Pivot', 206, 107, true),
  ('e0000001-0000-0000-0000-000000000004', 'Rodrigo', 'Paredes', 7, 'Escolta', 186, 83, true),
  ('e0000001-0000-0000-0000-000000000004', 'Felipe', 'Sandoval', 15, 'Alero', 192, 90, true);

-- =============================================
-- TEMPORADA + TORNEO: Copa Test 2026 (REGULAR en curso)
-- =============================================
INSERT INTO temporadas (id, nombre, fecha_inicio, fecha_fin, activa) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Temporada 2026', '2026-01-01', NULL, true);

INSERT INTO torneos (id, temporada_id, nombre, fecha_inicio, dias_juego, horarios, lugar, fase) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Copa Test 2026', '2026-01-15', '{6,0}', '{"18:00","20:00"}', 'Gimnasio Municipal', 'regular');

INSERT INTO torneo_equipos (torneo_id, equipo_id) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001'),
  ('b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000002'),
  ('b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000003'),
  ('b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000004');

-- Jornada 1 (2 juegos finalizados)
INSERT INTO juegos (id, temporada_id, torneo_id, equipo_local_id, equipo_visitante_id, fecha, lugar, estado, puntos_local, puntos_visitante, q1_local, q1_visitante, q2_local, q2_visitante, q3_local, q3_visitante, q4_local, q4_visitante, jornada, fase_juego) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000002', '2026-01-17 18:00:00-06', 'Gimnasio Municipal', 'finalizado', 85, 78, 22, 18, 20, 22, 23, 19, 20, 19, 1, 'ida'),
  ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000004', '2026-01-17 20:00:00-06', 'Gimnasio Municipal', 'finalizado', 72, 80, 18, 20, 16, 22, 20, 18, 18, 20, 1, 'ida');

-- Jornada 2 (2 juegos finalizados)
INSERT INTO juegos (id, temporada_id, torneo_id, equipo_local_id, equipo_visitante_id, fecha, lugar, estado, puntos_local, puntos_visitante, q1_local, q1_visitante, q2_local, q2_visitante, q3_local, q3_visitante, q4_local, q4_visitante, jornada, fase_juego) VALUES
  ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000003', '2026-01-24 18:00:00-06', 'Gimnasio Municipal', 'finalizado', 90, 82, 24, 20, 22, 18, 22, 24, 22, 20, 2, 'ida'),
  ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000004', '2026-01-24 20:00:00-06', 'Gimnasio Municipal', 'finalizado', 88, 75, 22, 18, 24, 20, 20, 17, 22, 20, 2, 'ida');

-- Jornada 3 (2 juegos programados - para probar notificaciones de crear/reprogramar)
INSERT INTO juegos (id, temporada_id, torneo_id, equipo_local_id, equipo_visitante_id, fecha, lugar, estado, jornada, fase_juego) VALUES
  ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000004', '2026-02-07 18:00:00-06', 'Gimnasio Municipal', 'programado', 3, 'ida'),
  ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000003', '2026-02-07 20:00:00-06', 'Gimnasio Municipal', 'programado', 3, 'ida');

-- =============================================
-- ESTADISTICAS INDIVIDUALES (solo juegos finalizados)
-- =============================================
DO $$
DECLARE
  game RECORD;
  player RECORD;
  pts INT;
  is_starter BOOLEAN;
  player_count INT;
BEGIN
  FOR game IN
    SELECT id AS game_id, equipo_local_id, equipo_visitante_id, puntos_local, puntos_visitante
    FROM juegos
    WHERE estado = 'finalizado'
  LOOP
    -- Equipo local
    player_count := 0;
    FOR player IN
      SELECT id AS player_id FROM jugadores
      WHERE equipo_id = game.equipo_local_id AND activo = true
      ORDER BY numero LIMIT 10
    LOOP
      player_count := player_count + 1;
      is_starter := player_count <= 5;

      IF player_count <= 3 THEN
        pts := (game.puntos_local * (15 + floor(random()*10)::int)) / 100;
      ELSIF player_count <= 5 THEN
        pts := (game.puntos_local * (8 + floor(random()*7)::int)) / 100;
      ELSE
        pts := (game.puntos_local * (2 + floor(random()*5)::int)) / 100;
      END IF;

      INSERT INTO estadisticas_jugador (
        juego_id, jugador_id, equipo_id, minutos, puntos,
        tiros_campo_intentados, tiros_campo_convertidos,
        triples_intentados, triples_convertidos,
        tiros_libres_intentados, tiros_libres_convertidos,
        rebotes_ofensivos, rebotes_defensivos,
        asistencias, robos, bloqueos, perdidas, faltas, titular
      ) VALUES (
        game.game_id, player.player_id, game.equipo_local_id,
        CASE WHEN is_starter THEN 25 + floor(random()*12)::int ELSE 8 + floor(random()*15)::int END,
        pts,
        pts + floor(random()*6)::int,
        GREATEST(1, pts - floor(random()*4)::int),
        floor(random()*8)::int,
        floor(random()*4)::int,
        floor(random()*6)::int,
        floor(random()*5)::int,
        floor(random()*3)::int,
        floor(random()*6)::int,
        floor(random()*8)::int,
        floor(random()*4)::int,
        floor(random()*3)::int,
        floor(random()*4)::int,
        floor(random()*5)::int,
        is_starter
      );
    END LOOP;

    -- Equipo visitante
    player_count := 0;
    FOR player IN
      SELECT id AS player_id FROM jugadores
      WHERE equipo_id = game.equipo_visitante_id AND activo = true
      ORDER BY numero LIMIT 10
    LOOP
      player_count := player_count + 1;
      is_starter := player_count <= 5;

      IF player_count <= 3 THEN
        pts := (game.puntos_visitante * (15 + floor(random()*10)::int)) / 100;
      ELSIF player_count <= 5 THEN
        pts := (game.puntos_visitante * (8 + floor(random()*7)::int)) / 100;
      ELSE
        pts := (game.puntos_visitante * (2 + floor(random()*5)::int)) / 100;
      END IF;

      INSERT INTO estadisticas_jugador (
        juego_id, jugador_id, equipo_id, minutos, puntos,
        tiros_campo_intentados, tiros_campo_convertidos,
        triples_intentados, triples_convertidos,
        tiros_libres_intentados, tiros_libres_convertidos,
        rebotes_ofensivos, rebotes_defensivos,
        asistencias, robos, bloqueos, perdidas, faltas, titular
      ) VALUES (
        game.game_id, player.player_id, game.equipo_visitante_id,
        CASE WHEN is_starter THEN 25 + floor(random()*12)::int ELSE 8 + floor(random()*15)::int END,
        pts,
        pts + floor(random()*6)::int,
        GREATEST(1, pts - floor(random()*4)::int),
        floor(random()*8)::int,
        floor(random()*4)::int,
        floor(random()*6)::int,
        floor(random()*5)::int,
        floor(random()*3)::int,
        floor(random()*6)::int,
        floor(random()*8)::int,
        floor(random()*4)::int,
        floor(random()*3)::int,
        floor(random()*4)::int,
        floor(random()*5)::int,
        is_starter
      );
    END LOOP;
  END LOOP;
END $$;
