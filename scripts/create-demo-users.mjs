// ABOUTME: Script para crear usuarios de prueba con perfiles completos
// ABOUTME: Crea dos usuarios de demo con datos realistas para testing E2E

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const demoUsers = [
  {
    email: 'mentor1@demo.espanacreativa.com',
    password: 'DemoPass123!',
    profile: {
      name: 'María García Mentor',
      headline: 'Mentora Senior en Transformación Digital',
      bio: 'Con más de 15 años de experiencia en el sector tecnológico, he ayudado a más de 50 startups en su proceso de digitalización y escalado. Especializada en metodologías ágiles, desarrollo de producto y estrategia de crecimiento.',
      location: 'Madrid, España',
      linkedin_url: 'https://linkedin.com/in/maria-garcia-mentor',
      website_url: 'https://mariagarcia.tech',
      skills: ['Mentoring', 'Transformación Digital', 'Scrum', 'Product Management', 'Growth Strategy'],
      interests: ['Innovación', 'Startups', 'IA', 'Sostenibilidad'],
      experience_years: 15,
      availability: 'part_time'
    },
    role: 'mentor'
  },
  {
    email: 'emprendedor1@demo.espanacreativa.com',
    password: 'DemoPass456!',
    profile: {
      name: 'Carlos Ruiz Emprendedor',
      headline: 'Fundador de EcoTech Solutions',
      bio: 'Emprendedor apasionado por la sostenibilidad y la tecnología. Actualmente desarrollando una plataforma SaaS para ayudar a empresas a medir y reducir su huella de carbono. Buscando mentoría en escalado de producto y captación de inversión.',
      location: 'Barcelona, España',
      linkedin_url: 'https://linkedin.com/in/carlos-ruiz-eco',
      website_url: 'https://ecotechsolutions.es',
      skills: ['Emprendimiento', 'Desarrollo de Producto', 'Sostenibilidad', 'JavaScript', 'React'],
      interests: ['Tecnología Verde', 'Impact Investing', 'Web3', 'Economía Circular'],
      experience_years: 3,
      availability: 'full_time',
      seeking_mentorship: true,
      mentorship_areas: ['Fundraising', 'Product-Market Fit', 'Team Building']
    },
    role: 'emprendedor'
  }
]

async function createDemoUsers() {
  console.log('🚀 Iniciando creación de usuarios de prueba...\n')

  for (const demoUser of demoUsers) {
    try {
      console.log(`📝 Creando usuario: ${demoUser.email}`)

      // 1. Crear usuario en auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: demoUser.email,
        password: demoUser.password,
        email_confirm: true,
        user_metadata: {
          name: demoUser.profile.name
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  Usuario ${demoUser.email} ya existe, actualizando perfil...`)

          // Obtener el usuario existente
          const { data: existingUsers } = await supabase
            .from('users')
            .select('id, auth_user_id')
            .eq('email', demoUser.email)
            .single()

          if (existingUsers) {
            // Actualizar perfil existente
            const { error: updateError } = await supabase
              .from('users')
              .update({
                ...demoUser.profile,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingUsers.id)

            if (updateError) {
              console.error(`❌ Error actualizando perfil: ${updateError.message}`)
              continue
            }

            console.log(`✅ Perfil actualizado para ${demoUser.email}`)
            continue
          }
        } else {
          throw authError
        }
      }

      const userId = authData.user.id

      // 2. Crear/actualizar perfil en public.users
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          auth_user_id: userId,
          email: demoUser.email,
          ...demoUser.profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error(`❌ Error creando perfil: ${profileError.message}`)
        continue
      }

      // 3. Obtener el ID del perfil creado
      const { data: userProfile, error: getUserError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single()

      if (getUserError || !userProfile) {
        console.error(`❌ Error obteniendo perfil: ${getUserError?.message}`)
        continue
      }

      // 4. Asignar rol
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', demoUser.role)
        .single()

      if (roleError || !roleData) {
        console.error(`❌ Error obteniendo rol: ${roleError?.message}`)
        continue
      }

      const { error: userRoleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userProfile.id,
          role_id: roleData.id,
          created_at: new Date().toISOString()
        })

      if (userRoleError) {
        console.error(`❌ Error asignando rol: ${userRoleError.message}`)
        continue
      }

      console.log(`✅ Usuario creado exitosamente: ${demoUser.email}`)
      console.log(`   Rol: ${demoUser.role}`)
      console.log(`   Contraseña: ${demoUser.password}\n`)

    } catch (error) {
      console.error(`❌ Error creando usuario ${demoUser.email}:`, error.message)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 CREDENCIALES DE PRUEBA PARA TESTING E2E')
  console.log('='.repeat(60) + '\n')

  console.log('👩‍🏫 MENTOR:')
  console.log(`   Email: ${demoUsers[0].email}`)
  console.log(`   Password: ${demoUsers[0].password}`)
  console.log(`   Perfil: ${demoUsers[0].profile.name}\n`)

  console.log('👨‍💼 EMPRENDEDOR:')
  console.log(`   Email: ${demoUsers[1].email}`)
  console.log(`   Password: ${demoUsers[1].password}`)
  console.log(`   Perfil: ${demoUsers[1].profile.name}\n`)

  console.log('='.repeat(60))
  console.log('✅ Proceso completado')
}

createDemoUsers()
