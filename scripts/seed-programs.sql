-- ABOUTME: Script to seed test programs data
-- ABOUTME: Creates sample programs for development and testing

-- First, get a valid user ID to use as creator
-- Replace this with your actual user ID from the database
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get the first user from the database
  SELECT id INTO test_user_id FROM users LIMIT 1;

  -- If no user exists, raise an error
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in database. Please create a user first.';
  END IF;

  -- Insert sample programs
  INSERT INTO programs (
    title,
    description,
    type,
    start_date,
    end_date,
    duration,
    location,
    participants,
    max_participants,
    instructor,
    status,
    featured,
    skills,
    price,
    created_by
  ) VALUES
  (
    'Programa de Aceleración Fintech',
    'Programa intensivo de 12 semanas para startups fintech con mentores expertos y acceso a inversores. Aprende a escalar tu negocio, validar tu modelo de negocio y conseguir financiación.',
    'aceleracion',
    '2024-03-15',
    '2024-06-07',
    '12 semanas',
    'Madrid + Online',
    0,
    30,
    'María González',
    'upcoming',
    true,
    ARRAY['Fintech', 'Business Model', 'Funding'],
    'Gratuito',
    test_user_id
  ),
  (
    'Workshop: Design Thinking para Emprendedores',
    'Taller práctico de 2 días para aprender metodologías de design thinking aplicadas al emprendimiento. Desarrolla soluciones innovadoras centradas en el usuario.',
    'workshop',
    '2024-02-20',
    '2024-02-21',
    '2 días',
    'Barcelona',
    0,
    20,
    'Carlos Martín',
    'upcoming',
    false,
    ARRAY['Design Thinking', 'Innovation', 'UX'],
    '150€',
    test_user_id
  ),
  (
    'Bootcamp: Marketing Digital Avanzado',
    'Curso intensivo de marketing digital con enfoque en estrategias avanzadas de growth hacking. Aprende a hacer crecer tu startup de forma exponencial.',
    'bootcamp',
    '2024-01-10',
    '2024-01-31',
    '3 semanas',
    'Online',
    12,
    50,
    'Ana López',
    'active',
    true,
    ARRAY['Marketing Digital', 'Growth Hacking', 'Analytics'],
    '299€',
    test_user_id
  ),
  (
    'Mentoring Program: Tech Leadership',
    'Programa de mentoría individual para desarrollar habilidades de liderazgo técnico en startups. Sesiones 1-1 con líderes experimentados del sector tech.',
    'mentoria',
    '2023-12-01',
    '2024-02-29',
    '3 meses',
    'Online',
    12,
    15,
    'David Ruiz',
    'completed',
    false,
    ARRAY['Leadership', 'Management', 'Tech'],
    '500€',
    test_user_id
  ),
  (
    'Curso: Fundraising para Startups',
    'Aprende a conseguir financiación para tu startup. Desde angels hasta VCs, pasando por subvenciones y crowdfunding.',
    'curso',
    '2024-04-01',
    '2024-04-15',
    '2 semanas',
    'Madrid',
    0,
    25,
    'Laura Sánchez',
    'upcoming',
    true,
    ARRAY['Fundraising', 'Pitch', 'Inversión'],
    '199€',
    test_user_id
  ),
  (
    'Workshop: Validación de Producto',
    'Aprende a validar tu idea de negocio antes de invertir recursos. Metodologías lean startup y customer development.',
    'workshop',
    '2024-03-05',
    '2024-03-06',
    '2 días',
    'Valencia',
    0,
    15,
    'Pedro García',
    'upcoming',
    false,
    ARRAY['Lean Startup', 'Product-Market Fit', 'Customer Development'],
    '120€',
    test_user_id
  ),
  (
    'Bootcamp: Full Stack Development',
    'Programa intensivo de desarrollo web full stack. Aprende React, Node.js, TypeScript y PostgreSQL construyendo proyectos reales.',
    'bootcamp',
    '2024-05-01',
    '2024-07-31',
    '3 meses',
    'Online',
    0,
    40,
    'Jorge Martínez',
    'upcoming',
    true,
    ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    'Gratuito',
    test_user_id
  );

  RAISE NOTICE 'Successfully inserted 7 sample programs';
END $$;
