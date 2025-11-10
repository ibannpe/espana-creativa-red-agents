-- ABOUTME: Script SQL para poblar la base de datos con datos realistas para demo
-- ABOUTME: Incluye usuarios, proyectos, oportunidades, conexiones y mensajes

-- ============================================================================
-- USUARIOS - Perfiles realistas del ecosistema creativo español
-- ============================================================================

-- Primero necesitamos los IDs de los usuarios existentes
-- Iban: 219f178d-1f91-442a-a507-6d4f2d90f156
-- Corral: 9ca36e35-0316-4b23-91ab-3bf2cada4657

-- Nuevos usuarios con perfiles completos
INSERT INTO users (id, email, name, bio, location, avatar_url, linkedin_url, website, skills, interests, profile_completeness, is_mentor, is_approved, created_at) VALUES
-- Mentores
('550e8400-e29b-41d4-a716-446655440001', 'maria.gonzalez@creativa.es', 'María González', 'Directora de Innovación en startup tecnológica. Más de 15 años de experiencia liderando equipos creativos. Especializada en transformación digital y emprendimiento social.', 'Madrid', 'https://i.pravatar.cc/150?img=1', 'https://linkedin.com/in/mariagonzalez', 'https://mariagonzalez.es', ARRAY['Innovación', 'Liderazgo', 'Transformación Digital', 'Emprendimiento Social', 'Design Thinking'], ARRAY['Sostenibilidad', 'Impacto Social', 'Tecnología', 'Mentoring'], 100, true, true, NOW() - INTERVAL '6 months'),

('550e8400-e29b-41d4-a716-446655440002', 'carlos.ruiz@mentor.com', 'Carlos Ruiz Martínez', 'Inversor ángel y mentor de startups. Ex-director de producto en Google España. Apasionado por el ecosistema emprendedor y la economía circular.', 'Barcelona', 'https://i.pravatar.cc/150?img=12', 'https://linkedin.com/in/carlosruiz', NULL, ARRAY['Product Management', 'Inversión', 'Estrategia', 'Growth', 'UX/UI'], ARRAY['Startups', 'Inversión', 'Tecnología', 'Innovación'], 95, true, true, NOW() - INTERVAL '8 months'),

('550e8400-e29b-41d4-a716-446655440003', 'laura.martinez@design.es', 'Laura Martínez López', 'Diseñadora gráfica y directora creativa. Fundadora de estudio de branding en Valencia. Especializada en identidad visual para marcas sostenibles.', 'Valencia', 'https://i.pravatar.cc/150?img=5', 'https://linkedin.com/in/lauramartinez', 'https://lauramartinez.design', ARRAY['Branding', 'Diseño Gráfico', 'Identidad Visual', 'Ilustración', 'Dirección de Arte'], ARRAY['Diseño Sostenible', 'Arte', 'Cultura', 'Emprendimiento'], 100, true, true, NOW() - INTERVAL '4 months'),

-- Emprendedores
('550e8400-e29b-41d4-a716-446655440004', 'jorge.santos@startup.io', 'Jorge Santos Díaz', 'Fundador de plataforma de educación online. Ingeniero de software con pasión por democratizar el acceso a la formación de calidad.', 'Madrid', 'https://i.pravatar.cc/150?img=13', 'https://linkedin.com/in/jorgesantos', 'https://eduplatform.io', ARRAY['Desarrollo Web', 'React', 'Node.js', 'Emprendimiento', 'EdTech'], ARRAY['Educación', 'Tecnología', 'Innovación Social', 'Startups'], 90, false, true, NOW() - INTERVAL '3 months'),

('550e8400-e29b-41d4-a716-446655440005', 'ana.lopez@gastro.es', 'Ana López Fernández', 'Chef y emprendedora gastronómica. Creando experiencias culinarias que fusionan tradición e innovación. Especializada en cocina de producto local.', 'San Sebastián', 'https://i.pravatar.cc/150?img=9', 'https://linkedin.com/in/analopez', 'https://analopezchef.com', ARRAY['Gastronomía', 'Innovación Culinaria', 'Gestión de Restaurantes', 'Marketing'], ARRAY['Cocina', 'Sostenibilidad', 'Producto Local', 'Emprendimiento'], 85, false, true, NOW() - INTERVAL '2 months'),

('550e8400-e29b-41d4-a716-446655440006', 'david.torres@tech.com', 'David Torres Ruiz', 'Desarrollador full-stack trabajando en mi primera startup de FinTech. Interesado en blockchain y Web3.', 'Málaga', 'https://i.pravatar.cc/150?img=15', 'https://linkedin.com/in/davidtorres', NULL, ARRAY['JavaScript', 'Python', 'Blockchain', 'Smart Contracts', 'React'], ARRAY['Criptomonedas', 'FinTech', 'Web3', 'Startups'], 75, false, true, NOW() - INTERVAL '1 month'),

('550e8400-e29b-41d4-a716-446655440007', 'sofia.ramirez@creative.es', 'Sofía Ramírez Castro', 'Productora audiovisual y creadora de contenido. Especializada en documentales sobre cultura y sostenibilidad. Buscando financiación para nuevo proyecto.', 'Sevilla', 'https://i.pravatar.cc/150?img=10', 'https://linkedin.com/in/sofiaramirez', 'https://sofiaramirez.tv', ARRAY['Producción Audiovisual', 'Dirección', 'Storytelling', 'Marketing Digital'], ARRAY['Cine', 'Documentales', 'Cultura', 'Sostenibilidad'], 88, false, true, NOW() - INTERVAL '2 months'),

('550e8400-e29b-41d4-a716-446655440008', 'miguel.herrera@fashion.es', 'Miguel Herrera Sánchez', 'Diseñador de moda sostenible. Creando una marca que combina artesanía tradicional española con diseño contemporáneo.', 'Barcelona', 'https://i.pravatar.cc/150?img=14', 'https://linkedin.com/in/miguelherrera', 'https://miguelherrera.fashion', ARRAY['Diseño de Moda', 'Moda Sostenible', 'Patronaje', 'Textil'], ARRAY['Moda', 'Sostenibilidad', 'Artesanía', 'Diseño'], 82, false, true, NOW() - INTERVAL '1 month'),

('550e8400-e29b-41d4-a716-446655440009', 'elena.moreno@social.org', 'Elena Moreno Gil', 'Emprendedora social fundando una plataforma de economía colaborativa para comunidades rurales. Psicóloga de formación.', 'Zaragoza', 'https://i.pravatar.cc/150?img=20', 'https://linkedin.com/in/elenamoreno', NULL, ARRAY['Emprendimiento Social', 'Economía Colaborativa', 'Psicología', 'Desarrollo Rural'], ARRAY['Impacto Social', 'Comunidades', 'Sostenibilidad', 'Innovación Social'], 80, false, true, NOW() - INTERVAL '3 weeks'),

('550e8400-e29b-41d4-a716-446655440010', 'pablo.navarro@music.es', 'Pablo Navarro León', 'Músico y productor desarrollando una app para conectar músicos independientes con espacios culturales. Guitarrista de formación clásica.', 'Granada', 'https://i.pravatar.cc/150?img=33', 'https://linkedin.com/in/pablonavarro', 'https://pablonavarro.music', ARRAY['Producción Musical', 'Desarrollo de Apps', 'Marketing Musical', 'Gestión Cultural'], ARRAY['Música', 'Tecnología', 'Cultura', 'Emprendimiento'], 77, false, true, NOW() - INTERVAL '2 weeks');

-- ============================================================================
-- ROLES DE USUARIO
-- ============================================================================

-- Asignar roles a los nuevos usuarios
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003'
) AND r.name = 'mentor'
UNION ALL
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.id IN (
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440010'
) AND r.name = 'emprendedor';

-- ============================================================================
-- PROYECTOS - Programas y actividades realistas
-- ============================================================================

INSERT INTO projects (title, description, type, start_date, end_date, duration, location, max_participants, instructor, status, featured, skills, price, created_by) VALUES
-- Proyecto existente ya está en la BD (id: 18)

('Bootcamp de Emprendimiento Digital',
'Programa intensivo de 12 semanas para transformar tu idea en un negocio digital viable. Incluye: validación de modelo de negocio, desarrollo de MVP, estrategias de captación de clientes y pitch a inversores. Mentorías individualizadas con emprendedores de éxito.',
'bootcamp',
'2025-02-01',
'2025-04-30',
'12 semanas',
'Madrid (híbrido)',
25,
'María González & Carlos Ruiz',
'upcoming',
true,
ARRAY['Business Model Canvas', 'Lean Startup', 'Marketing Digital', 'Pitch', 'Validación'],
'890€',
'550e8400-e29b-41d4-a716-446655440001'),

('Taller de Branding para Startups',
'Aprende a construir una identidad de marca sólida desde cero. En este taller práctico crearás el naming, identidad visual y estrategia de comunicación de tu proyecto. Incluye sesión de feedback personalizada.',
'workshop',
'2025-01-20',
'2025-01-21',
'2 días',
'Valencia',
15,
'Laura Martínez',
'upcoming',
true,
ARRAY['Branding', 'Diseño', 'Identidad Visual', 'Comunicación', 'Storytelling'],
'350€',
'550e8400-e29b-41d4-a716-446655440003'),

('Aceleradora FoodTech España',
'Programa de aceleración especializado en startups de tecnología alimentaria y gastronomía innovadora. 6 meses de acompañamiento, networking con inversores y acceso a laboratorios de innovación culinaria.',
'aceleracion',
'2025-03-15',
'2025-09-15',
'6 meses',
'San Sebastián',
10,
'Ana López & Equipo Basque Culinary Center',
'upcoming',
true,
ARRAY['FoodTech', 'Innovación', 'Gastronomía', 'Business Plan', 'Inversión'],
'Gratuito (equity)',
'550e8400-e29b-41d4-a716-446655440005'),

('Curso: De Idea a Producto Digital',
'Curso online de 8 semanas para aprender a llevar tu idea desde el concepto hasta un producto digital funcional. Incluye módulos de diseño UX, desarrollo no-code y estrategias de lanzamiento.',
'curso',
'2025-02-10',
'2025-04-10',
'8 semanas',
'Online',
50,
'Jorge Santos',
'upcoming',
false,
ARRAY['Product Management', 'UX/UI', 'No-Code', 'Lean Startup', 'MVP'],
'450€',
'550e8400-e29b-41d4-a716-446655440004'),

('Mentorías en FinTech & Blockchain',
'Programa de mentoría 1-a-1 para proyectos en el espacio blockchain, criptomonedas y fintech. Sesiones quincenales de 90 minutos durante 3 meses con mentores expertos del sector.',
'mentoria',
'2025-01-15',
'2025-04-15',
'3 meses',
'Online',
8,
'Carlos Ruiz',
'upcoming',
false,
ARRAY['Blockchain', 'FinTech', 'Smart Contracts', 'Criptomonedas', 'Tokenización'],
'1.200€',
'550e8400-e29b-41d4-a716-446655440002'),

('Workshop: Storytelling Audiovisual',
'Taller intensivo de 3 días para aprender a contar historias impactantes a través del lenguaje audiovisual. Perfecto para emprendedores que necesitan comunicar su proyecto de forma efectiva.',
'workshop',
'2025-02-28',
'2025-03-02',
'3 días',
'Sevilla',
12,
'Sofía Ramírez',
'upcoming',
false,
ARRAY['Storytelling', 'Video', 'Comunicación', 'Producción', 'Marketing de Contenidos'],
'420€',
'550e8400-e29b-41d4-a716-446655440007'),

('Programa Moda Sostenible & Emprendimiento',
'Formación especializada en creación de marcas de moda sostenible. Aprende sobre economía circular, textiles ecológicos, cadena de suministro ética y posicionamiento de marca consciente.',
'curso',
'2025-03-01',
'2025-05-30',
'3 meses',
'Barcelona',
20,
'Miguel Herrera & Laura Martínez',
'upcoming',
true,
ARRAY['Moda Sostenible', 'Economía Circular', 'Branding', 'Textil', 'Diseño'],
'680€',
'550e8400-e29b-41d4-a716-446655440008');

-- ============================================================================
-- OPORTUNIDADES - Colaboraciones y búsquedas realistas
-- ============================================================================

INSERT INTO opportunities (title, description, type, location, skills_required, project_id, created_by, status, created_at) VALUES
-- Oportunidades generales (sin proyecto específico)
('Busco Co-Fundador Técnico para HealthTech',
'Estoy desarrollando una plataforma de telemedicina y necesito un co-fundador técnico con experiencia en desarrollo web/móvil y conocimientos del sector salud. El proyecto ya tiene validación inicial con 50+ usuarios beta.',
'colaboracion',
'Madrid (remoto posible)',
ARRAY['React Native', 'Node.js', 'Healthcare', 'Arquitectura Software'],
NULL,
'550e8400-e29b-41d4-a716-446655440009',
'open',
NOW() - INTERVAL '5 days'),

('Diseñador/a UX para App Musical',
'Busco diseñador/a UX/UI para colaborar en el diseño de una aplicación que conecta músicos con espacios culturales. Proyecto con financiación seed confirmada. Posibilidad de equity.',
'colaboracion',
'Remoto (con reuniones en Granada)',
ARRAY['UX/UI', 'Figma', 'Design Systems', 'Mobile Design'],
NULL,
'550e8400-e29b-41d4-a716-446655440010',
'open',
NOW() - INTERVAL '3 days'),

('Mentor/a de Marketing Digital',
'Startup de EdTech buscando mentor/a con experiencia en growth marketing y adquisición de usuarios. Necesito ayuda para escalar de 500 a 5000 usuarios en 3 meses.',
'mentoria',
'Online',
ARRAY['Growth Marketing', 'SEO', 'Paid Ads', 'Analytics', 'EdTech'],
NULL,
'550e8400-e29b-41d4-a716-446655440004',
'open',
NOW() - INTERVAL '1 day'),

('Socio/a Inversor para Proyecto Gastronómico',
'Proyecto de restaurante de alta cocina con enfoque sostenible busca socio inversor. Inversión: 80K€. Modelo de negocio validado, equipo consolidado, ubicación premium confirmada en San Sebastián.',
'financiacion',
'San Sebastián',
ARRAY['Inversión', 'Restauración', 'Business Analysis', 'Gastronomía'],
NULL,
'550e8400-e29b-41d4-a716-446655440005',
'open',
NOW() - INTERVAL '1 week'),

-- Oportunidades asociadas a proyectos
('Beca Completa: Bootcamp Emprendimiento Digital',
'Ofrecemos 3 becas completas para nuestro Bootcamp de Emprendimiento Digital. Buscamos perfiles diversos con proyectos en fase temprana que demuestren potencial de impacto social o tecnológico.',
'beca',
'Madrid',
ARRAY['Emprendimiento', 'Motivación', 'Ideas Innovadoras'],
19,
'550e8400-e29b-41d4-a716-446655440001',
'open',
NOW() - INTERVAL '2 days'),

('Plazas Limitadas: Aceleradora FoodTech',
'Última convocatoria 2025 para nuestra aceleradora FoodTech. Si tu startup está revolucionando la industria alimentaria con tecnología, esta es tu oportunidad. Equity program con acceso a inversores.',
'colaboracion',
'San Sebastián',
ARRAY['FoodTech', 'Innovación', 'Startup', 'Product-Market Fit'],
21,
'550e8400-e29b-41d4-a716-446655440005',
'open',
NOW() - INTERVAL '4 days'),

('Profesor/a Invitado: Módulo Blockchain',
'Buscamos experto/a en blockchain para impartir módulo especializado en nuestro curso "De Idea a Producto Digital". Sesiones online, marzo 2025. Compensación económica.',
'colaboracion',
'Online',
ARRAY['Blockchain', 'Smart Contracts', 'Docencia', 'Web3'],
22,
'550e8400-e29b-41d4-a716-446655440004',
'open',
NOW() - INTERVAL '6 days'),

('Fotógrafo/a para Workshop Moda Sostenible',
'Necesitamos fotógrafo/a profesional para documentar nuestro programa de Moda Sostenible. 3 días de trabajo en Barcelona. Portfolio en moda imprescindible. Proyecto remunerado.',
'colaboracion',
'Barcelona',
ARRAY['Fotografía de Moda', 'Edición', 'Storytelling Visual'],
25,
'550e8400-e29b-41d4-a716-446655440008',
'open',
NOW()),

('Voluntario/a: Mentorías Emprendimiento Rural',
'Proyecto de impacto social busca mentores voluntarios para apoyar emprendimientos en zonas rurales. 2 horas/semana online. Experiencia gratificante y networking con otros profesionales.',
'voluntariado',
'Online',
ARRAY['Emprendimiento', 'Mentoría', 'Comunicación', 'Empatía'],
NULL,
'550e8400-e29b-41d4-a716-446655440009',
'open',
NOW() - INTERVAL '3 days');

-- ============================================================================
-- CONEXIONES - Red de networking entre usuarios
-- ============================================================================

INSERT INTO connections (requester_id, addressee_id, status, created_at) VALUES
-- Conexiones entre mentores y emprendedores
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'accepted', NOW() - INTERVAL '2 months'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'accepted', NOW() - INTERVAL '1 month'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'accepted', NOW() - INTERVAL '3 weeks'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'accepted', NOW() - INTERVAL '3 weeks'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'accepted', NOW() - INTERVAL '2 weeks'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'accepted', NOW() - INTERVAL '1 week'),

-- Conexiones entre emprendedores
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006', 'accepted', NOW() - INTERVAL '2 weeks'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', 'accepted', NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440007', 'accepted', NOW() - INTERVAL '1 week'),
('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440010', 'accepted', NOW() - INTERVAL '5 days'),

-- Conexiones con los usuarios existentes (Iban y Corral)
('219f178d-1f91-442a-a507-6d4f2d90f156', '550e8400-e29b-41d4-a716-446655440001', 'accepted', NOW() - INTERVAL '1 month'),
('219f178d-1f91-442a-a507-6d4f2d90f156', '550e8400-e29b-41d4-a716-446655440004', 'accepted', NOW() - INTERVAL '3 weeks'),
('9ca36e35-0316-4b23-91ab-3bf2cada4657', '550e8400-e29b-41d4-a716-446655440002', 'accepted', NOW() - INTERVAL '2 weeks'),
('9ca36e35-0316-4b23-91ab-3bf2cada4657', '550e8400-e29b-41d4-a716-446655440005', 'accepted', NOW() - INTERVAL '1 week'),

-- Algunas conexiones pendientes
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'pending', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'pending', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 'pending', NOW());

-- ============================================================================
-- MENSAJES - Conversaciones realistas entre usuarios conectados
-- ============================================================================

-- Limpiar mensajes de prueba existentes
DELETE FROM messages WHERE id IN (49, 50);

INSERT INTO messages (sender_id, recipient_id, content, is_public, created_at, read_at) VALUES
-- Conversación entre Jorge y María (mentor-emprendedor)
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001',
'Hola María, me encantaría contar contigo como mentora para mi startup de EdTech. He visto tu perfil y creo que tu experiencia en transformación digital sería muy valiosa para nosotros.',
false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),

('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004',
'Hola Jorge! Gracias por contactarme. Me interesa mucho tu proyecto. ¿Podrías contarme un poco más sobre vuestra propuesta de valor y en qué fase estáis? Podemos agendar una videollamada esta semana.',
false, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),

('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001',
'Perfecto! Estamos en fase de validación, ya tenemos 500 usuarios activos y estamos buscando escalar. Te envío el deck por email. ¿Qué tal el jueves a las 10:00?',
false, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),

-- Conversación entre Ana y Laura (colaboración de branding)
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003',
'Laura, me ha encantado tu trabajo en identidad visual. Estoy lanzando un proyecto gastronómico sostenible y necesito ayuda con el branding. ¿Tienes disponibilidad?',
false, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '13 days'),

('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005',
'Hola Ana! Justo ahora mismo estoy trabajando con varios proyectos de gastronomía sostenible, me apasiona el sector. Cuéntame más sobre tu proyecto. Mi agenda está bastante llena pero podemos buscar un hueco.',
false, NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days'),

-- Conversación entre David y Carlos (mentoría blockchain)
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002',
'Carlos, estoy desarrollando una solución FinTech con blockchain y he visto que ofreces mentorías. Me interesaría mucho aprender de tu experiencia, sobre todo en la parte de validación de modelo de negocio.',
false, NOW() - INTERVAL '1 week', NOW() - INTERVAL '6 days'),

('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006',
'Hola David! Encantado de ayudarte. El ecosistema blockchain es fascinante pero tiene sus particularidades. ¿Ya has definido tu customer persona? Empecemos por ahí. Te mando mi Calendly para que reserves una sesión sin compromiso.',
false, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'),

-- Conversación entre Iban y María
('219f178d-1f91-442a-a507-6d4f2d90f156', '550e8400-e29b-41d4-a716-446655440001',
'María, gracias por aceptar mi conexión. Me gustaría conocer más sobre el Bootcamp de Emprendimiento Digital que estáis organizando.',
false, NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '20 days'),

('550e8400-e29b-41d4-a716-446655440001', '219f178d-1f91-442a-a507-6d4f2d90f156',
'Hola Iban! Claro, será un programa intensivo de 12 semanas. Empezamos en febrero. ¿En qué fase está tu proyecto?',
false, NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days'),

-- Mensaje público en el tablón
('550e8400-e29b-41d4-a716-446655440001', NULL,
'🎉 ¡Últimas plazas para nuestro Bootcamp de Emprendimiento Digital! Arrancamos en febrero. Si tienes una idea que quieres convertir en realidad, este es tu momento. #Emprendimiento #Startups #InnovaciónDigital',
true, NOW() - INTERVAL '2 days', NULL),

('550e8400-e29b-41d4-a716-446655440003', NULL,
'📢 Abrimos inscripciones para el Taller de Branding en Valencia. Aprende a construir una marca memorable desde cero. Solo 15 plazas! #Branding #Diseño #Valencia',
true, NOW() - INTERVAL '1 day', NULL);

-- ============================================================================
-- INSCRIPCIONES A PROYECTOS
-- ============================================================================

INSERT INTO project_enrollments (user_id, project_id, status, created_at) VALUES
-- Inscripciones al Bootcamp de Emprendimiento Digital (id: 19)
('550e8400-e29b-41d4-a716-446655440004', 19, 'approved', NOW() - INTERVAL '1 week'),
('550e8400-e29b-41d4-a716-446655440006', 19, 'approved', NOW() - INTERVAL '5 days'),
('219f178d-1f91-442a-a507-6d4f2d90f156', 19, 'pending', NOW() - INTERVAL '2 days'),

-- Inscripciones al Taller de Branding (id: 20)
('550e8400-e29b-41d4-a716-446655440005', 20, 'approved', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440008', 20, 'approved', NOW() - INTERVAL '2 days'),

-- Inscripciones a la Aceleradora FoodTech (id: 21)
('550e8400-e29b-41d4-a716-446655440005', 21, 'approved', NOW() - INTERVAL '1 week'),

-- Inscripciones al CAMINO CREATIVO 2025 CÓRDOBA (id: 18)
('9ca36e35-0316-4b23-91ab-3bf2cada4657', 18, 'approved', NOW() - INTERVAL '1 month'),
('550e8400-e29b-41d4-a716-446655440007', 18, 'approved', NOW() - INTERVAL '3 weeks');

-- Actualizar contador de participantes
UPDATE projects SET participants = (
    SELECT COUNT(*)
    FROM project_enrollments
    WHERE project_id = projects.id AND status = 'approved'
);
