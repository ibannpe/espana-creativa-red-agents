-- ABOUTME: Script para insertar datos de prueba en la tabla programs
-- ABOUTME: Ejecutar en Supabase SQL Editor para poblar la feature de programas

-- Insertar programas de prueba
INSERT INTO programs (
  title, description, type, start_date, end_date,
  duration, location, participants, max_participants,
  instructor, status, featured, skills, price,
  image_url, created_by
) VALUES
-- Programa 1: Aceleración (Featured, Próximo)
(
  'Aceleración Startup España Creativa 2025',
  'Programa intensivo de 3 meses diseñado para acelerar el crecimiento de startups en fase temprana. Incluye mentorías personalizadas, acceso a inversores y networking con el ecosistema emprendedor español.',
  'aceleracion',
  '2025-02-01',
  '2025-05-01',
  '3 meses',
  'Madrid',
  0,
  20,
  'María García',
  'upcoming',
  true,
  ARRAY['emprendimiento', 'ventas', 'marketing', 'fundraising'],
  'Gratuito',
  null,
  (SELECT id FROM users LIMIT 1)
),

-- Programa 2: Workshop (Próximo)
(
  'Workshop de Diseño UX/UI',
  'Aprende los fundamentos del diseño de experiencias de usuario y diseño de interfaces. Incluye ejercicios prácticos con Figma y casos reales.',
  'workshop',
  '2025-12-15',
  '2025-12-16',
  '2 días',
  'Barcelona',
  0,
  30,
  'Juan Pérez',
  'upcoming',
  false,
  ARRAY['diseño', 'ux', 'ui', 'figma'],
  '150€',
  null,
  (SELECT id FROM users LIMIT 1)
),

-- Programa 3: Bootcamp (Activo)
(
  'Bootcamp Desarrollo Web Full Stack',
  'Bootcamp intensivo de 12 semanas para convertirte en desarrollador Full Stack. Aprende React, Node.js, bases de datos y deployment.',
  'bootcamp',
  '2024-11-01',
  '2025-01-31',
  '12 semanas',
  'Online',
  15,
  25,
  'Carlos Rodríguez',
  'active',
  true,
  ARRAY['react', 'nodejs', 'typescript', 'postgresql'],
  '2500€',
  null,
  (SELECT id FROM users LIMIT 1)
),

-- Programa 4: Mentoría (Activo)
(
  'Mentoría en Marketing Digital',
  'Programa de mentoría 1-a-1 para emprendedores que quieren mejorar su estrategia de marketing digital. Sesiones semanales durante 2 meses.',
  'mentoria',
  '2024-11-15',
  '2025-01-15',
  '2 meses',
  'Online',
  8,
  10,
  'Ana Martínez',
  'active',
  false,
  ARRAY['marketing', 'seo', 'redes sociales', 'analytics'],
  '500€',
  null,
  (SELECT id FROM users LIMIT 1)
),

-- Programa 5: Curso (Completado)
(
  'Curso de Finanzas para Emprendedores',
  'Curso online de 6 semanas sobre gestión financiera para startups. Incluye modelos de negocio, valoración, y presentaciones a inversores.',
  'curso',
  '2024-09-01',
  '2024-10-15',
  '6 semanas',
  'Online',
  45,
  50,
  'Laura Sánchez',
  'completed',
  false,
  ARRAY['finanzas', 'inversión', 'contabilidad'],
  '300€',
  null,
  (SELECT id FROM users LIMIT 1)
),

-- Programa 6: Workshop (Próximo, Featured)
(
  'Workshop de Pitch y Presentación',
  'Aprende a crear y presentar un pitch efectivo para inversores. Incluye feedback personalizado y grabación en vídeo.',
  'workshop',
  '2025-12-10',
  '2025-12-10',
  '1 día',
  'Valencia',
  0,
  15,
  'Pedro López',
  'upcoming',
  true,
  ARRAY['pitch', 'presentación', 'comunicación'],
  'Gratuito',
  null,
  (SELECT id FROM users LIMIT 1)
),

-- Programa 7: Aceleración (Activo)
(
  'Programa de Innovación Social',
  'Aceleradora especializada en startups de impacto social. Mentoría, formación y acceso a financiación para proyectos que generan cambio positivo.',
  'aceleracion',
  '2024-10-01',
  '2025-03-01',
  '5 meses',
  'Sevilla',
  12,
  15,
  'Carmen Ruiz',
  'active',
  true,
  ARRAY['impacto social', 'sostenibilidad', 'emprendimiento social'],
  'Gratuito',
  null,
  (SELECT id FROM users LIMIT 1)
);

-- Verificar inserción
SELECT
  id,
  title,
  type,
  status,
  start_date,
  participants,
  max_participants,
  featured
FROM programs
ORDER BY status, start_date;
