// ABOUTME: Script para poblar la base de datos con datos realistas para demo
// ABOUTME: Crea usuarios a través del API de signup y luego inserta datos relacionados

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Datos de usuarios realistas
const demoUsers = [
  {
    email: 'maria.gonzalez@creativa.es',
    password: 'DemoPass123!',
    name: 'María González',
    bio: 'Directora de Innovación en startup tecnológica. Más de 15 años de experiencia liderando equipos creativos. Especializada en transformación digital y emprendimiento social.',
    location: 'Madrid',
    linkedin_url: 'https://linkedin.com/in/mariagonzalez',
    website_url: 'https://mariagonzalez.es',
    skills: ['Innovación', 'Liderazgo', 'Transformación Digital', 'Emprendimiento Social', 'Design Thinking'],
    interests: ['Sostenibilidad', 'Impacto Social', 'Tecnología', 'Mentoring'],
    role: 'mentor'
  },
  {
    email: 'carlos.ruiz@mentor.com',
    password: 'DemoPass123!',
    name: 'Carlos Ruiz Martínez',
    bio: 'Inversor ángel y mentor de startups. Ex-director de producto en Google España. Apasionado por el ecosistema emprendedor y la economía circular.',
    location: 'Barcelona',
    linkedin_url: 'https://linkedin.com/in/carlosruiz',
    skills: ['Product Management', 'Inversión', 'Estrategia', 'Growth', 'UX/UI'],
    interests: ['Startups', 'Inversión', 'Tecnología', 'Innovación'],
    role: 'mentor'
  },
  {
    email: 'laura.martinez@design.es',
    password: 'DemoPass123!',
    name: 'Laura Martínez López',
    bio: 'Diseñadora gráfica y directora creativa. Fundadora de estudio de branding en Valencia. Especializada en identidad visual para marcas sostenibles.',
    location: 'Valencia',
    linkedin_url: 'https://linkedin.com/in/lauramartinez',
    website_url: 'https://lauramartinez.design',
    skills: ['Branding', 'Diseño Gráfico', 'Identidad Visual', 'Ilustración', 'Dirección de Arte'],
    interests: ['Diseño Sostenible', 'Arte', 'Cultura', 'Emprendimiento'],
    role: 'mentor'
  },
  {
    email: 'jorge.santos@startup.io',
    password: 'DemoPass123!',
    name: 'Jorge Santos Díaz',
    bio: 'Fundador de plataforma de educación online. Ingeniero de software con pasión por democratizar el acceso a la formación de calidad.',
    location: 'Madrid',
    linkedin_url: 'https://linkedin.com/in/jorgesantos',
    website_url: 'https://eduplatform.io',
    skills: ['Desarrollo Web', 'React', 'Node.js', 'Emprendimiento', 'EdTech'],
    interests: ['Educación', 'Tecnología', 'Innovación Social', 'Startups'],
    role: 'emprendedor'
  },
  {
    email: 'ana.lopez@gastro.es',
    password: 'DemoPass123!',
    name: 'Ana López Fernández',
    bio: 'Chef y emprendedora gastronómica. Creando experiencias culinarias que fusionan tradición e innovación. Especializada en cocina de producto local.',
    location: 'San Sebastián',
    linkedin_url: 'https://linkedin.com/in/analopez',
    website_url: 'https://analopezchef.com',
    skills: ['Gastronomía', 'Innovación Culinaria', 'Gestión de Restaurantes', 'Marketing'],
    interests: ['Cocina', 'Sostenibilidad', 'Producto Local', 'Emprendimiento'],
    role: 'emprendedor'
  },
  {
    email: 'david.torres@tech.com',
    password: 'DemoPass123!',
    name: 'David Torres Ruiz',
    bio: 'Desarrollador full-stack trabajando en mi primera startup de FinTech. Interesado en blockchain y Web3.',
    location: 'Málaga',
    linkedin_url: 'https://linkedin.com/in/davidtorres',
    skills: ['JavaScript', 'Python', 'Blockchain', 'Smart Contracts', 'React'],
    interests: ['Criptomonedas', 'FinTech', 'Web3', 'Startups'],
    role: 'emprendedor'
  },
  {
    email: 'sofia.ramirez@creative.es',
    password: 'DemoPass123!',
    name: 'Sofía Ramírez Castro',
    bio: 'Productora audiovisual y creadora de contenido. Especializada en documentales sobre cultura y sostenibilidad. Buscando financiación para nuevo proyecto.',
    location: 'Sevilla',
    linkedin_url: 'https://linkedin.com/in/sofiaramirez',
    website_url: 'https://sofiaramirez.tv',
    skills: ['Producción Audiovisual', 'Dirección', 'Storytelling', 'Marketing Digital'],
    interests: ['Cine', 'Documentales', 'Cultura', 'Sostenibilidad'],
    role: 'emprendedor'
  },
  {
    email: 'miguel.herrera@fashion.es',
    password: 'DemoPass123!',
    name: 'Miguel Herrera Sánchez',
    bio: 'Diseñador de moda sostenible. Creando una marca que combina artesanía tradicional española con diseño contemporáneo.',
    location: 'Barcelona',
    linkedin_url: 'https://linkedin.com/in/miguelherrera',
    website_url: 'https://miguelherrera.fashion',
    skills: ['Diseño de Moda', 'Moda Sostenible', 'Patronaje', 'Textil'],
    interests: ['Moda', 'Sostenibilidad', 'Artesanía', 'Diseño'],
    role: 'emprendedor'
  }
];

console.log('🚀 Iniciando población de base de datos para demo...\n');

// Paso 1: Crear usuarios
console.log('👥 Creando usuarios...');
const createdUsers = [];

for (const userData of demoUsers) {
  try {
    // Crear usuario en auth.users mediante Supabase Admin
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    });

    if (authError) {
      console.log(`❌ Error creando usuario ${userData.email}:`, authError.message);
      continue;
    }

    console.log(`✅ Usuario auth creado: ${userData.email}`);

    // Actualizar perfil en users
    const { error: profileError } = await supabase
      .from('users')
      .update({
        name: userData.name,
        bio: userData.bio,
        location: userData.location,
        linkedin_url: userData.linkedin_url,
        website_url: userData.website_url,
        skills: userData.skills,
        interests: userData.interests
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.log(`⚠️  Error actualizando perfil de ${userData.email}:`, profileError.message);
    } else {
      console.log(`✅ Perfil actualizado: ${userData.name}`);
    }

    // Asignar rol
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', userData.role)
      .single();

    if (roleData) {
      await supabase
        .from('user_roles')
        .insert({ user_id: authData.user.id, role_id: roleData.id });
      console.log(`✅ Rol asignado: ${userData.role}`);
    }

    createdUsers.push({
      ...userData,
      id: authData.user.id
    });

    console.log('');
  } catch (error) {
    console.log(`❌ Error procesando ${userData.email}:`, error.message);
  }
}

console.log(`\n✅ ${createdUsers.length} usuarios creados exitosamente\n`);

// Paso 2: Crear proyectos
console.log('📚 Creando proyectos...');

const existingUsers = await supabase.from('users').select('id, email').in('email', [
  'iban.perezmi@gmail.com',
  'corral57.vegetal@icloud.com'
]);

const ibanId = existingUsers.data.find(u => u.email === 'iban.perezmi@gmail.com')?.id;
const mariaId = createdUsers.find(u => u.email === 'maria.gonzalez@creativa.es')?.id;
const lauraId = createdUsers.find(u => u.email === 'laura.martinez@design.es')?.id;
const anaId = createdUsers.find(u => u.email === 'ana.lopez@gastro.es')?.id;
const jorgeId = createdUsers.find(u => u.email === 'jorge.santos@startup.io')?.id;
const miguelId = createdUsers.find(u => u.email === 'miguel.herrera@fashion.es')?.id;

const projects = [
  {
    title: 'Bootcamp de Emprendimiento Digital',
    description: 'Programa intensivo de 12 semanas para transformar tu idea en un negocio digital viable. Incluye: validación de modelo de negocio, desarrollo de MVP, estrategias de captación de clientes y pitch a inversores.',
    type: 'bootcamp',
    start_date: '2025-02-01',
    end_date: '2025-04-30',
    duration: '12 semanas',
    location: 'Madrid (híbrido)',
    max_participants: 25,
    instructor: 'María González & Carlos Ruiz',
    status: 'upcoming',
    featured: true,
    skills: ['Business Model Canvas', 'Lean Startup', 'Marketing Digital', 'Pitch', 'Validación'],
    price: '890€',
    created_by: mariaId
  },
  {
    title: 'Taller de Branding para Startups',
    description: 'Aprende a construir una identidad de marca sólida desde cero. En este taller práctico crearás el naming, identidad visual y estrategia de comunicación de tu proyecto.',
    type: 'workshop',
    start_date: '2025-01-20',
    end_date: '2025-01-21',
    duration: '2 días',
    location: 'Valencia',
    max_participants: 15,
    instructor: 'Laura Martínez',
    status: 'upcoming',
    featured: true,
    skills: ['Branding', 'Diseño', 'Identidad Visual', 'Comunicación', 'Storytelling'],
    price: '350€',
    created_by: lauraId
  },
  {
    title: 'Aceleradora FoodTech España',
    description: 'Programa de aceleración especializado en startups de tecnología alimentaria y gastronomía innovadora. 6 meses de acompañamiento con inversores.',
    type: 'aceleracion',
    start_date: '2025-03-15',
    end_date: '2025-09-15',
    duration: '6 meses',
    location: 'San Sebastián',
    max_participants: 10,
    instructor: 'Ana López & Equipo',
    status: 'upcoming',
    featured: true,
    skills: ['FoodTech', 'Innovación', 'Gastronomía', 'Business Plan', 'Inversión'],
    price: 'Gratuito',
    created_by: anaId
  },
  {
    title: 'Curso: De Idea a Producto Digital',
    description: 'Curso online de 8 semanas para aprender a llevar tu idea desde el concepto hasta un producto digital funcional.',
    type: 'curso',
    start_date: '2025-02-10',
    end_date: '2025-04-10',
    duration: '8 semanas',
    location: 'Online',
    max_participants: 50,
    instructor: 'Jorge Santos',
    status: 'upcoming',
    featured: false,
    skills: ['Product Management', 'UX/UI', 'No-Code', 'Lean Startup', 'MVP'],
    price: '450€',
    created_by: jorgeId
  }
];

const createdProjects = [];
for (const project of projects) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) {
    console.log(`❌ Error creando proyecto: ${error.message}`);
  } else {
    console.log(`✅ Proyecto creado: ${project.title}`);
    createdProjects.push(data);
  }
}

console.log(`\n✅ ${createdProjects.length} proyectos creados\n`);

// Paso 3: Crear oportunidades
console.log('💼 Creando oportunidades...');

const sofiaId = createdUsers.find(u => u.email === 'sofia.ramirez@creative.es')?.id;
const davidId = createdUsers.find(u => u.email === 'david.torres@tech.com')?.id;

const opportunities = [
  {
    title: 'Busco Co-Fundador Técnico para HealthTech',
    description: 'Estoy desarrollando una plataforma de telemedicina y necesito un co-fundador técnico con experiencia en desarrollo web/móvil.',
    type: 'colaboracion',
    location: 'Madrid (remoto posible)',
    skills_required: ['React Native', 'Node.js', 'Healthcare', 'Arquitectura Software'],
    status: 'abierta',
    created_by: sofiaId
  },
  {
    title: 'Diseñador/a UX para App Musical',
    description: 'Busco diseñador/a UX/UI para colaborar en el diseño de una aplicación que conecta músicos con espacios culturales.',
    type: 'colaboracion',
    location: 'Remoto',
    skills_required: ['UX/UI', 'Figma', 'Design Systems', 'Mobile Design'],
    status: 'abierta',
    created_by: davidId
  },
  {
    title: 'Mentor/a de Marketing Digital',
    description: 'Startup de EdTech buscando mentor/a con experiencia en growth marketing. Ayuda para escalar de 500 a 5000 usuarios.',
    type: 'mentoria',
    location: 'Online',
    skills_required: ['Growth Marketing', 'SEO', 'Paid Ads', 'Analytics'],
    status: 'abierta',
    created_by: jorgeId
  },
  {
    title: 'Beca Completa: Bootcamp Emprendimiento',
    description: 'Ofrecemos 3 becas completas para nuestro Bootcamp. Buscamos perfiles diversos con proyectos de impacto social.',
    type: 'otro',
    location: 'Madrid',
    skills_required: ['Emprendimiento', 'Innovación Social'],
    status: 'abierta',
    project_id: createdProjects[0]?.id,
    created_by: mariaId
  }
];

let oppCount = 0;
for (const opp of opportunities) {
  const { error } = await supabase
    .from('opportunities')
    .insert(opp);

  if (error) {
    console.log(`❌ Error creando oportunidad: ${error.message}`);
  } else {
    console.log(`✅ Oportunidad creada: ${opp.title}`);
    oppCount++;
  }
}

console.log(`\n✅ ${oppCount} oportunidades creadas\n`);

// Paso 4: Crear conexiones
console.log('🤝 Creando conexiones...');

const connections = [
  { requester_id: jorgeId, addressee_id: mariaId, status: 'accepted' },
  { requester_id: anaId, addressee_id: lauraId, status: 'accepted' },
  { requester_id: davidId, addressee_id: jorgeId, status: 'accepted' },
  { requester_id: ibanId, addressee_id: mariaId, status: 'accepted' },
  { requester_id: sofiaId, addressee_id: lauraId, status: 'accepted' },
  { requester_id: miguelId, addressee_id: lauraId, status: 'pending' }
];

let connCount = 0;
for (const conn of connections) {
  if (!conn.requester_id || !conn.addressee_id) continue;

  const { error } = await supabase
    .from('connections')
    .insert(conn);

  if (error) {
    console.log(`⚠️  Error creando conexión: ${error.message}`);
  } else {
    connCount++;
  }
}

console.log(`✅ ${connCount} conexiones creadas\n`);

// Paso 5: Crear algunos mensajes
console.log('💬 Creando mensajes...');

const messages = [
  {
    sender_id: jorgeId,
    recipient_id: mariaId,
    content: 'Hola María, me encantaría contar contigo como mentora para mi startup de EdTech.',
    is_public: false
  },
  {
    sender_id: mariaId,
    recipient_id: jorgeId,
    content: 'Hola Jorge! Me interesa mucho tu proyecto. ¿Podrías contarme más sobre vuestra propuesta de valor?',
    is_public: false
  },
  {
    sender_id: mariaId,
    recipient_id: null,
    content: '🎉 ¡Últimas plazas para nuestro Bootcamp de Emprendimiento Digital! Arrancamos en febrero. #Emprendimiento #Startups',
    is_public: true
  }
];

let msgCount = 0;
for (const msg of messages) {
  if (!msg.sender_id && !msg.is_public) continue;

  const { error } = await supabase
    .from('messages')
    .insert(msg);

  if (error) {
    console.log(`⚠️  Error creando mensaje: ${error.message}`);
  } else {
    msgCount++;
  }
}

console.log(`✅ ${msgCount} mensajes creados\n`);

console.log('🎉 ¡Base de datos poblada exitosamente para la demo!\n');
console.log('📊 Resumen:');
console.log(`   - ${createdUsers.length} usuarios`);
console.log(`   - ${createdProjects.length} proyectos`);
console.log(`   - ${oppCount} oportunidades`);
console.log(`   - ${connCount} conexiones`);
console.log(`   - ${msgCount} mensajes`);
console.log('\n✨ Todo listo para tu demo!\n');
