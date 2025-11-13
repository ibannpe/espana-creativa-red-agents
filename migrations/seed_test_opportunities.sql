-- ABOUTME: Script to seed test opportunities for each city
-- ABOUTME: Creates diverse opportunities to showcase the city-based opportunities feature

-- Insert test opportunities for each city
-- Note: Using the first available user as creator

-- Córdoba (city_id = 1)
INSERT INTO opportunities (
  title,
  description,
  type,
  skills_required,
  location,
  remote,
  duration,
  compensation,
  city_id,
  status,
  created_by
) VALUES
(
  'Desarrollador Full Stack para Startup Turística',
  'Buscamos un desarrollador full stack con experiencia en React y Node.js para unirse a nuestro equipo en Córdoba. Estamos construyendo una plataforma innovadora para el turismo cultural.',
  'empleo',
  ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
  'Córdoba',
  true,
  'Indefinido',
  '30.000-40.000€/año',
  1,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Mentor para Emprendedores Gastronómicos',
  'Si tienes experiencia en el sector gastronómico y te apasiona ayudar a otros emprendedores, únete a nuestra red de mentores. Programa de 3 meses con encuentros quincenales.',
  'mentoria',
  ARRAY['Gestión de Restaurantes', 'Marketing Digital', 'Finanzas'],
  'Córdoba',
  false,
  '3 meses',
  'Voluntario',
  1,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Proyecto de Digitalización del Patrimonio',
  'Colaboración con instituciones culturales para digitalizar y crear experiencias interactivas del patrimonio cordobés. Buscamos fotógrafos, diseñadores y desarrolladores.',
  'proyecto',
  ARRAY['Fotografía', 'Diseño UX/UI', 'Desarrollo Web', '3D Modeling'],
  'Córdoba',
  false,
  '6 meses',
  'Subvencionado',
  1,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
);

-- Tenerife (city_id = 2)
INSERT INTO opportunities (
  title,
  description,
  type,
  skills_required,
  location,
  remote,
  duration,
  compensation,
  city_id,
  status,
  created_by
) VALUES
(
  'Co-fundador Técnico para App de Sostenibilidad',
  'Startup en fase inicial busca co-fundador con experiencia técnica para desarrollar una aplicación móvil enfocada en turismo sostenible en las Islas Canarias.',
  'colaboracion',
  ARRAY['React Native', 'Flutter', 'Backend Development', 'Startup Experience'],
  'Tenerife',
  true,
  'A largo plazo',
  'Equity + Salario según financiación',
  2,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Hackathon: Innovación en Energías Renovables',
  'Evento de 48 horas para desarrollar soluciones innovadoras en energía solar y eólica. Premios en metálico y mentoría de expertos del sector.',
  'evento',
  ARRAY['Programación', 'Diseño de Producto', 'Ingeniería'],
  'Tenerife',
  false,
  '2 días',
  'Premios hasta 5.000€',
  2,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Diseñador UX/UI para Plataforma EdTech',
  'Proyecto educativo busca diseñador para crear una experiencia de aprendizaje gamificada para estudiantes de secundaria.',
  'proyecto',
  ARRAY['Figma', 'UI Design', 'UX Research', 'Gamification'],
  'Tenerife',
  true,
  '4 meses',
  '2.500€/mes',
  2,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
);

-- Quinto (city_id = 3)
INSERT INTO opportunities (
  title,
  description,
  type,
  skills_required,
  location,
  remote,
  duration,
  compensation,
  city_id,
  status,
  created_by
) VALUES
(
  'Agrotech: Sistema de Riego Inteligente',
  'Desarrollo de solución IoT para optimizar el riego en cultivos locales. Proyecto conjunto con cooperativas agrícolas de la zona.',
  'proyecto',
  ARRAY['IoT', 'Arduino', 'Sensores', 'Data Analytics'],
  'Quinto',
  false,
  '8 meses',
  'Financiado por cooperativas',
  3,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Marketing Digital para Productos Locales',
  'Ayuda a productores locales a vender online. Buscamos expertos en e-commerce, redes sociales y fotografía de producto.',
  'colaboracion',
  ARRAY['Marketing Digital', 'E-commerce', 'Fotografía', 'Community Management'],
  'Quinto',
  true,
  'Flexible',
  'Por proyecto',
  3,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
);

-- Denia (city_id = 4)
INSERT INTO opportunities (
  title,
  description,
  type,
  skills_required,
  location,
  remote,
  duration,
  compensation,
  city_id,
  status,
  created_by
) VALUES
(
  'App de Rutas Náuticas y Deportes Acuáticos',
  'Startup busca desarrollador mobile para crear una aplicación que conecte a entusiastas de deportes acuáticos con servicios locales.',
  'empleo',
  ARRAY['React Native', 'Maps API', 'Geolocalización', 'Mobile UI'],
  'Denia',
  true,
  '6 meses (renovable)',
  '2.000-3.000€/mes',
  4,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Programa de Mentoría para Negocios Gastronómicos',
  'Red de mentores para apoyar a nuevos restaurantes y negocios de food & beverage en la Marina Alta.',
  'mentoria',
  ARRAY['Hostelería', 'Gestión de Negocios', 'Marketing'],
  'Denia',
  false,
  '3-6 meses',
  'Voluntario',
  4,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Festival de Innovación y Emprendimiento',
  'Organización de evento anual que conecta emprendedores, inversores y empresas tecnológicas de la región.',
  'evento',
  ARRAY['Event Planning', 'Networking', 'Patrocinios'],
  'Denia',
  false,
  '3 meses preparación',
  'Comisión por patrocinios',
  4,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
);

-- Ribeira Sacra (city_id = 5)
INSERT INTO opportunities (
  title,
  description,
  type,
  skills_required,
  location,
  remote,
  duration,
  compensation,
  city_id,
  status,
  created_by
) VALUES
(
  'Plataforma de Venta Online para Bodegas',
  'Desarrollo de marketplace para vinos de la Ribeira Sacra con integración de pagos y logística.',
  'proyecto',
  ARRAY['E-commerce', 'WordPress/Shopify', 'Logística', 'Wine Industry'],
  'Ribeira Sacra',
  true,
  '5 meses',
  '15.000€ proyecto',
  5,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Turismo Rural: Experiencias Inmersivas',
  'Creación de experiencias de turismo rural combinando tradición, naturaleza y tecnología (VR/AR).',
  'colaboracion',
  ARRAY['Turismo Rural', 'VR/AR', 'Marketing de Experiencias'],
  'Ribeira Sacra',
  false,
  'A largo plazo',
  'Ingresos compartidos',
  5,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
);

-- Mondoñedo (city_id = 6)
INSERT INTO opportunities (
  title,
  description,
  type,
  skills_required,
  location,
  remote,
  duration,
  compensation,
  city_id,
  status,
  created_by
) VALUES
(
  'Proyecto de Smart Village',
  'Iniciativa para convertir Mondoñedo en un pueblo inteligente. Buscamos desarrolladores, diseñadores de servicios y expertos en IoT.',
  'proyecto',
  ARRAY['IoT', 'Smart Cities', 'UX Design', 'Community Engagement'],
  'Mondoñedo',
  false,
  '1 año',
  'Financiación europea',
  6,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Artesanía Digital: E-commerce para Artesanos',
  'Ayudar a artesanos locales a vender sus productos online. Necesitamos fotógrafos, diseñadores web y expertos en redes sociales.',
  'colaboracion',
  ARRAY['Fotografía de Producto', 'Diseño Web', 'Social Media', 'Artesanía'],
  'Mondoñedo',
  true,
  'Flexible',
  'Comisión por ventas',
  6,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
),
(
  'Mentor para Emprendimiento Rural',
  'Programa de mentoría para apoyar a jóvenes emprendedores que quieren desarrollar negocios innovadores en zonas rurales.',
  'mentoria',
  ARRAY['Business Development', 'Rural Innovation', 'Funding'],
  'Mondoñedo',
  true,
  '6 meses',
  'Voluntario',
  6,
  'abierta',
  'e9e66812-79b7-4f59-af39-adb23d0ba0d0'
);

-- Success message
SELECT 'Inserted ' || COUNT(*) || ' test opportunities' as result FROM opportunities WHERE created_at > NOW() - INTERVAL '1 minute';
