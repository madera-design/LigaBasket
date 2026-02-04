-- =============================================
-- SEED DATA - Liga de Basquetbol
-- 4 equipos, 2 torneos, categorias con reglas, jugadores con sexo/fecha_nacimiento
-- =============================================

-- Limpiar datos existentes (en orden de dependencias)
DELETE FROM estadisticas_jugador;
DELETE FROM notifications_log;
DELETE FROM tabla_posiciones;
DELETE FROM juegos;
DELETE FROM series_playoff;
DELETE FROM torneo_equipos;
DELETE FROM torneo_categorias;
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

-- TIGRES (varonil, adultos)
INSERT INTO jugadores (equipo_id, nombre, apellido, numero, posicion, altura_cm, peso_kg, sexo, fecha_nacimiento, activo) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'Carlos', 'Martinez', 1, 'Base', 178, 75, 'M', '1995-03-15', true),
  ('e0000001-0000-0000-0000-000000000001', 'Miguel', 'Lopez', 2, 'Base', 180, 78, 'M', '1997-07-22', true),
  ('e0000001-0000-0000-0000-000000000001', 'Diego', 'Garcia', 5, 'Escolta', 185, 82, 'M', '1996-11-08', true),
  ('e0000001-0000-0000-0000-000000000001', 'Andres', 'Rodriguez', 7, 'Escolta', 188, 85, 'M', '1998-01-30', true),
  ('e0000001-0000-0000-0000-000000000001', 'Luis', 'Hernandez', 10, 'Alero', 193, 90, 'M', '1994-05-12', true),
  ('e0000001-0000-0000-0000-000000000001', 'Roberto', 'Sanchez', 11, 'Alero', 195, 92, 'M', '1993-09-25', true),
  ('e0000001-0000-0000-0000-000000000001', 'Fernando', 'Torres', 14, 'Ala-Pivot', 198, 95, 'M', '1996-02-18', true),
  ('e0000001-0000-0000-0000-000000000001', 'Alejandro', 'Ramirez', 21, 'Ala-Pivot', 200, 98, 'M', '1995-08-04', true),
  ('e0000001-0000-0000-0000-000000000001', 'Pablo', 'Flores', 23, 'Pivot', 203, 102, 'M', '1997-12-11', true),
  ('e0000001-0000-0000-0000-000000000001', 'Javier', 'Morales', 32, 'Pivot', 205, 105, 'M', '1994-06-29', true),
  ('e0000001-0000-0000-0000-000000000001', 'Ricardo', 'Diaz', 8, 'Escolta', 186, 83, 'M', '1999-04-07', true),
  ('e0000001-0000-0000-0000-000000000001', 'Eduardo', 'Reyes', 15, 'Alero', 191, 88, 'M', '1998-10-20', true);

-- LOBOS (varonil, adultos)
INSERT INTO jugadores (equipo_id, nombre, apellido, numero, posicion, altura_cm, peso_kg, sexo, fecha_nacimiento, activo) VALUES
  ('e0000001-0000-0000-0000-000000000002', 'David', 'Cruz', 3, 'Base', 179, 76, 'M', '1996-01-14', true),
  ('e0000001-0000-0000-0000-000000000002', 'Oscar', 'Vargas', 4, 'Base', 181, 79, 'M', '1997-05-28', true),
  ('e0000001-0000-0000-0000-000000000002', 'Ivan', 'Mendez', 6, 'Escolta', 186, 83, 'M', '1995-09-03', true),
  ('e0000001-0000-0000-0000-000000000002', 'Hugo', 'Castro', 9, 'Escolta', 187, 84, 'M', '1998-03-17', true),
  ('e0000001-0000-0000-0000-000000000002', 'Adrian', 'Ruiz', 12, 'Alero', 194, 91, 'M', '1994-07-22', true),
  ('e0000001-0000-0000-0000-000000000002', 'Sergio', 'Ortega', 13, 'Alero', 192, 89, 'M', '1996-12-05', true),
  ('e0000001-0000-0000-0000-000000000002', 'Raul', 'Jimenez', 20, 'Ala-Pivot', 199, 96, 'M', '1995-02-19', true),
  ('e0000001-0000-0000-0000-000000000002', 'Mario', 'Navarro', 22, 'Ala-Pivot', 201, 99, 'M', '1997-08-13', true),
  ('e0000001-0000-0000-0000-000000000002', 'Pedro', 'Gutierrez', 25, 'Pivot', 204, 103, 'M', '1993-11-30', true),
  ('e0000001-0000-0000-0000-000000000002', 'Enrique', 'Dominguez', 30, 'Pivot', 206, 106, 'M', '1994-04-08', true),
  ('e0000001-0000-0000-0000-000000000002', 'Victor', 'Ramos', 8, 'Escolta', 185, 82, 'M', '1999-06-21', true),
  ('e0000001-0000-0000-0000-000000000002', 'Daniel', 'Aguilar', 15, 'Alero', 190, 87, 'M', '1998-10-14', true);

-- AGUILAS (mixto: 8 hombres + 4 mujeres, adultos)
INSERT INTO jugadores (equipo_id, nombre, apellido, numero, posicion, altura_cm, peso_kg, sexo, fecha_nacimiento, activo) VALUES
  ('e0000001-0000-0000-0000-000000000003', 'Gabriel', 'Perez', 1, 'Base', 177, 74, 'M', '1996-03-10', true),
  ('e0000001-0000-0000-0000-000000000003', 'Arturo', 'Gonzalez', 4, 'Base', 182, 80, 'M', '1997-07-25', true),
  ('e0000001-0000-0000-0000-000000000003', 'Ramon', 'Silva', 5, 'Escolta', 184, 81, 'M', '1995-11-18', true),
  ('e0000001-0000-0000-0000-000000000003', 'Jorge', 'Medina', 7, 'Escolta', 189, 86, 'M', '1998-02-06', true),
  ('e0000001-0000-0000-0000-000000000003', 'Manuel', 'Herrera', 10, 'Alero', 192, 90, 'M', '1994-08-14', true),
  ('e0000001-0000-0000-0000-000000000003', 'Antonio', 'Rios', 11, 'Alero', 196, 93, 'M', '1996-04-29', true),
  ('e0000001-0000-0000-0000-000000000003', 'Francisco', 'Luna', 14, 'Ala-Pivot', 197, 94, 'M', '1995-12-22', true),
  ('e0000001-0000-0000-0000-000000000003', 'Alberto', 'Soto', 21, 'Ala-Pivot', 202, 100, 'M', '1997-06-07', true),
  ('e0000001-0000-0000-0000-000000000003', 'Maria', 'Vazquez', 24, 'Base', 170, 62, 'F', '1998-01-15', true),
  ('e0000001-0000-0000-0000-000000000003', 'Sofia', 'Guerrero', 33, 'Escolta', 172, 60, 'F', '1997-09-20', true),
  ('e0000001-0000-0000-0000-000000000003', 'Valentina', 'Ibarra', 8, 'Alero', 175, 65, 'F', '1999-05-12', true),
  ('e0000001-0000-0000-0000-000000000003', 'Camila', 'Espinoza', 15, 'Base', 168, 58, 'F', '1998-11-03', true);

-- TOROS (juvenil U17, nacidos 2008-2010)
INSERT INTO jugadores (equipo_id, nombre, apellido, numero, posicion, altura_cm, peso_kg, sexo, fecha_nacimiento, activo) VALUES
  ('e0000001-0000-0000-0000-000000000004', 'Santiago', 'Acosta', 2, 'Base', 175, 68, 'M', '2009-04-12', true),
  ('e0000001-0000-0000-0000-000000000004', 'Mateo', 'Delgado', 3, 'Base', 173, 66, 'M', '2008-08-23', true),
  ('e0000001-0000-0000-0000-000000000004', 'Sebastian', 'Mora', 6, 'Escolta', 178, 72, 'M', '2009-01-15', true),
  ('e0000001-0000-0000-0000-000000000004', 'Nicolas', 'Rojas', 9, 'Escolta', 180, 74, 'M', '2010-03-07', true),
  ('e0000001-0000-0000-0000-000000000004', 'Tomas', 'Pena', 10, 'Alero', 182, 76, 'M', '2008-11-19', true),
  ('e0000001-0000-0000-0000-000000000004', 'Samuel', 'Cardenas', 12, 'Alero', 184, 78, 'M', '2009-06-30', true),
  ('e0000001-0000-0000-0000-000000000004', 'Benjamin', 'Fuentes', 14, 'Ala-Pivot', 186, 80, 'M', '2010-02-14', true),
  ('e0000001-0000-0000-0000-000000000004', 'Leonardo', 'Campos', 20, 'Ala-Pivot', 185, 79, 'M', '2008-07-08', true),
  ('e0000001-0000-0000-0000-000000000004', 'Emiliano', 'Salazar', 23, 'Pivot', 188, 82, 'M', '2009-12-25', true),
  ('e0000001-0000-0000-0000-000000000004', 'Joaquin', 'Contreras', 31, 'Pivot', 190, 85, 'M', '2010-05-18', true),
  ('e0000001-0000-0000-0000-000000000004', 'Rodrigo', 'Paredes', 7, 'Escolta', 177, 71, 'M', '2009-09-02', true),
  ('e0000001-0000-0000-0000-000000000004', 'Felipe', 'Sandoval', 15, 'Alero', 181, 75, 'M', '2008-10-11', true);

-- =============================================
-- TEMPORADA + TORNEO: Copa Test 2026 (REGULAR en curso)
-- =============================================
INSERT INTO temporadas (id, nombre, fecha_inicio, fecha_fin, activa) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Temporada 2026', '2026-01-01', NULL, true);

-- Torneo 1: Copa Varonil 2026 (categoria varonil libre, ya en temporada regular)
INSERT INTO torneos (id, temporada_id, nombre, fecha_inicio, dias_juego, horarios, lugar, fase, fecha_inscripcion_inicio, fecha_inscripcion_fin) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Copa Varonil 2026', '2026-01-15', '{6,0}', '{"18:00","20:00"}', 'Gimnasio Municipal', 'regular', '2025-12-01', '2026-01-10');

-- Torneo 2: Copa Mixta 2026 (categoria mixta, min 2 mujeres, inscripciones abiertas)
INSERT INTO torneos (id, temporada_id, nombre, fecha_inicio, dias_juego, horarios, lugar, fase, fecha_inscripcion_inicio, fecha_inscripcion_fin) VALUES
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Copa Mixta 2026', '2026-03-01', '{6,0}', '{"16:00","18:00"}', 'Gimnasio Municipal', 'inscripcion', '2026-01-15', '2026-02-28');

-- Torneo 3: Copa Juvenil U17 (categoria con rango de edad, inscripciones abiertas)
INSERT INTO torneos (id, temporada_id, nombre, fecha_inicio, dias_juego, horarios, lugar, fase, fecha_inscripcion_inicio, fecha_inscripcion_fin) VALUES
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Copa Juvenil U17 2026', '2026-04-01', '{6,0}', '{"10:00","12:00"}', 'Gimnasio Municipal', 'inscripcion', '2026-01-15', '2026-03-15');

-- =============================================
-- CATEGORIAS DE TORNEO (con reglas de validacion)
-- =============================================

-- Copa Varonil: 1 categoria libre varonil
INSERT INTO torneo_categorias (id, torneo_id, nombre, orden, descripcion, genero, anio_nacimiento_min, anio_nacimiento_max, min_mujeres) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Libre Varonil', 0, 'Todas las edades, solo hombres', 'varonil', NULL, NULL, 0);

-- Copa Mixta: 1 categoria mixta con min 2 mujeres
INSERT INTO torneo_categorias (id, torneo_id, nombre, orden, descripcion, genero, anio_nacimiento_min, anio_nacimiento_max, min_mujeres) VALUES
  ('d0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'Libre Mixto', 0, 'Todas las edades, min. 2 mujeres por equipo', 'mixto', NULL, NULL, 2);

-- Copa Juvenil: 1 categoria U17 (nacidos 2008-2010)
INSERT INTO torneo_categorias (id, torneo_id, nombre, orden, descripcion, genero, anio_nacimiento_min, anio_nacimiento_max, min_mujeres) VALUES
  ('d0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'U17', 0, 'Nacidos entre 2008 y 2010', 'cualquiera', 2008, 2010, 0);

-- =============================================
-- EQUIPOS EN TORNEOS
-- =============================================

-- Copa Varonil: 4 equipos en categoria Libre Varonil
INSERT INTO torneo_equipos (torneo_id, equipo_id, categoria_id) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001'),
  ('b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001'),
  ('b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001'),
  ('b0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001');

-- Copa Mixta: Aguilas en categoria Libre Mixto (tiene 4 mujeres, cumple min_mujeres=2)
INSERT INTO torneo_equipos (torneo_id, equipo_id, categoria_id) VALUES
  ('b0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000002');

-- Copa Juvenil U17: Toros en categoria U17 (todos nacidos 2008-2010)
INSERT INTO torneo_equipos (torneo_id, equipo_id, categoria_id) VALUES
  ('b0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000003');

-- =============================================
-- JUEGOS (solo Copa Varonil - Tigres, Lobos, Aguilas, Toros)
-- =============================================

-- Jornada 1 (2 juegos finalizados, con categoria_id)
INSERT INTO juegos (id, temporada_id, torneo_id, categoria_id, equipo_local_id, equipo_visitante_id, fecha, lugar, estado, puntos_local, puntos_visitante, q1_local, q1_visitante, q2_local, q2_visitante, q3_local, q3_visitante, q4_local, q4_visitante, jornada, fase_juego) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000002', '2026-01-17 18:00:00-06', 'Gimnasio Municipal', 'finalizado', 85, 78, 22, 18, 20, 22, 23, 19, 20, 19, 1, 'ida'),
  ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000004', '2026-01-17 20:00:00-06', 'Gimnasio Municipal', 'finalizado', 72, 80, 18, 20, 16, 22, 20, 18, 18, 20, 1, 'ida');

-- Jornada 2 (2 juegos finalizados, con categoria_id)
INSERT INTO juegos (id, temporada_id, torneo_id, categoria_id, equipo_local_id, equipo_visitante_id, fecha, lugar, estado, puntos_local, puntos_visitante, q1_local, q1_visitante, q2_local, q2_visitante, q3_local, q3_visitante, q4_local, q4_visitante, jornada, fase_juego) VALUES
  ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000003', '2026-01-24 18:00:00-06', 'Gimnasio Municipal', 'finalizado', 90, 82, 24, 20, 22, 18, 22, 24, 22, 20, 2, 'ida'),
  ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000004', '2026-01-24 20:00:00-06', 'Gimnasio Municipal', 'finalizado', 88, 75, 22, 18, 24, 20, 20, 17, 22, 20, 2, 'ida');

-- Jornada 3 (2 juegos programados, con categoria_id)
INSERT INTO juegos (id, temporada_id, torneo_id, categoria_id, equipo_local_id, equipo_visitante_id, fecha, lugar, estado, jornada, fase_juego) VALUES
  ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000004', '2026-02-07 18:00:00-06', 'Gimnasio Municipal', 'programado', 3, 'ida'),
  ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000003', '2026-02-07 20:00:00-06', 'Gimnasio Municipal', 'programado', 3, 'ida');

-- =============================================
-- INSCRIPCIONES DE PRUEBA (para probar validaciones de categoria)
-- =============================================

-- Inscripcion aprobada: Aguilas Mixtas en Copa Mixta (cumple: 4 mujeres >= min 2)
INSERT INTO inscripciones (id, torneo_id, categoria_id, nombre_equipo, nombre_corto, color_primario, color_secundario, delegado_nombre, delegado_email, delegado_telefono, jugadores, estado) VALUES
  ('f0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000002',
   'Aguilas Mixtas', 'AGM', '#EF4444', '#FFFFFF', 'Roberto Diaz', 'roberto@test.com', '6141234567',
   '[
     {"nombre":"Gabriel","apellido":"Perez","numero":1,"posicion":"Base","altura":1.77,"peso":74,"sexo":"M","fecha_nacimiento":"1996-03-10"},
     {"nombre":"Arturo","apellido":"Gonzalez","numero":4,"posicion":"Base","altura":1.82,"peso":80,"sexo":"M","fecha_nacimiento":"1997-07-25"},
     {"nombre":"Ramon","apellido":"Silva","numero":5,"posicion":"Escolta","altura":1.84,"peso":81,"sexo":"M","fecha_nacimiento":"1995-11-18"},
     {"nombre":"Jorge","apellido":"Medina","numero":7,"posicion":"Escolta","altura":1.89,"peso":86,"sexo":"M","fecha_nacimiento":"1998-02-06"},
     {"nombre":"Manuel","apellido":"Herrera","numero":10,"posicion":"Alero","altura":1.92,"peso":90,"sexo":"M","fecha_nacimiento":"1994-08-14"},
     {"nombre":"Maria","apellido":"Vazquez","numero":24,"posicion":"Base","altura":1.70,"peso":62,"sexo":"F","fecha_nacimiento":"1998-01-15"},
     {"nombre":"Sofia","apellido":"Guerrero","numero":33,"posicion":"Escolta","altura":1.72,"peso":60,"sexo":"F","fecha_nacimiento":"1997-09-20"},
     {"nombre":"Valentina","apellido":"Ibarra","numero":8,"posicion":"Alero","altura":1.75,"peso":65,"sexo":"F","fecha_nacimiento":"1999-05-12"}
   ]',
   'aprobada');

-- Inscripcion pendiente: Toros Juveniles en Copa Juvenil U17 (cumple: todos nacidos 2008-2010)
INSERT INTO inscripciones (id, torneo_id, categoria_id, nombre_equipo, nombre_corto, color_primario, color_secundario, delegado_nombre, delegado_email, delegado_telefono, jugadores, estado) VALUES
  ('f0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000003',
   'Toros Juveniles', 'TJV', '#10B981', '#FFFFFF', 'Fernando Ortiz', 'fernando@test.com', '6149876543',
   '[
     {"nombre":"Santiago","apellido":"Acosta","numero":2,"posicion":"Base","altura":1.75,"peso":68,"sexo":"M","fecha_nacimiento":"2009-04-12"},
     {"nombre":"Mateo","apellido":"Delgado","numero":3,"posicion":"Base","altura":1.73,"peso":66,"sexo":"M","fecha_nacimiento":"2008-08-23"},
     {"nombre":"Sebastian","apellido":"Mora","numero":6,"posicion":"Escolta","altura":1.78,"peso":72,"sexo":"M","fecha_nacimiento":"2009-01-15"},
     {"nombre":"Nicolas","apellido":"Rojas","numero":9,"posicion":"Escolta","altura":1.80,"peso":74,"sexo":"M","fecha_nacimiento":"2010-03-07"},
     {"nombre":"Tomas","apellido":"Pena","numero":10,"posicion":"Alero","altura":1.82,"peso":76,"sexo":"M","fecha_nacimiento":"2008-11-19"},
     {"nombre":"Samuel","apellido":"Cardenas","numero":12,"posicion":"Alero","altura":1.84,"peso":78,"sexo":"M","fecha_nacimiento":"2009-06-30"},
     {"nombre":"Benjamin","apellido":"Fuentes","numero":14,"posicion":"Ala-Pivot","altura":1.86,"peso":80,"sexo":"M","fecha_nacimiento":"2010-02-14"}
   ]',
   'pendiente');

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
