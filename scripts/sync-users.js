const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function syncUsers() {
  try {
    console.log('🔄 Sincronizando usuarios...')

    // 1. Obtener todos los usuarios de auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios de auth:', authError)
      return
    }

    console.log(`📊 Encontrados ${authUsers.users.length} usuarios en auth`)

    // 2. Obtener usuarios existentes en la tabla users
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id')

    if (usersError) {
      console.error('❌ Error obteniendo usuarios de tabla users:', usersError)
      return
    }

    const existingUserIds = new Set(existingUsers.map(u => u.id))
    console.log(`📊 Encontrados ${existingUsers.length} usuarios en tabla users`)

    // 3. Obtener rol de emprendedor (por defecto para nuevos usuarios)
    const { data: emprendedorRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'emprendedor')
      .single()

    if (roleError) {
      console.error('❌ Error obteniendo rol emprendedor:', roleError)
      return
    }

    // 4. Crear perfiles faltantes
    let createdCount = 0
    
    for (const authUser of authUsers.users) {
      if (!existingUserIds.has(authUser.id)) {
        console.log(`➕ Creando perfil para usuario: ${authUser.email}`)
        
        // Crear perfil de usuario
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email.split('@')[0],
            avatar_url: authUser.user_metadata?.avatar_url || null,
            completed_pct: 20, // Básico: email y nombre
            created_at: authUser.created_at,
            updated_at: authUser.updated_at
          })

        if (insertError) {
          console.error(`❌ Error creando perfil para ${authUser.email}:`, insertError)
          continue
        }

        // Asignar rol de emprendedor
        const { error: roleInsertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authUser.id,
            role_id: emprendedorRole.id
          })

        if (roleInsertError) {
          console.error(`❌ Error asignando rol a ${authUser.email}:`, roleInsertError)
          continue
        }

        createdCount++
        console.log(`✅ Perfil creado para: ${authUser.email}`)
      }
    }

    console.log(`🎉 Sincronización completada. ${createdCount} perfiles creados.`)

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error)
  }
}

// Ejecutar el script
syncUsers().then(() => {
  console.log('✨ Script completado')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})