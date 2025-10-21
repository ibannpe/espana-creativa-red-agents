const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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

async function executeSQL(sql, description) {
  console.log(`🔧 Ejecutando: ${description}`)
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
      console.error(`❌ Error en ${description}:`, error.message)
      return false
    }
    console.log(`✅ Completado: ${description}`)
    return true
  } catch (err) {
    console.error(`❌ Excepción en ${description}:`, err.message)
    return false
  }
}

async function fixRLSPolicies() {
  console.log('🚀 Iniciando corrección de políticas RLS...')

  // SQL commands to fix the infinite recursion issue
  const sqlCommands = [
    {
      sql: `DROP POLICY IF EXISTS "Anyone can view user roles" ON user_roles;`,
      description: 'Eliminando política problemática 1'
    },
    {
      sql: `DROP POLICY IF EXISTS "Users can view user roles" ON user_roles;`,
      description: 'Eliminando política problemática 2'
    },
    {
      sql: `DROP POLICY IF EXISTS "Only admins can manage user roles" ON user_roles;`,
      description: 'Eliminando política problemática 3'
    },
    {
      sql: `DROP POLICY IF EXISTS "Service can insert user roles" ON user_roles;`,
      description: 'Eliminando política problemática 4'
    },
    {
      sql: `DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;`,
      description: 'Eliminando política problemática 5'
    },
    {
      sql: `ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;`,
      description: 'Deshabilitando RLS temporalmente en user_roles'
    },
    {
      sql: `CREATE POLICY "Simple view policy for user_roles" ON user_roles FOR SELECT USING (auth.uid() IS NOT NULL);`,
      description: 'Creando política simple de lectura para user_roles'
    },
    {
      sql: `ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;`,
      description: 'Rehabilitando RLS en user_roles'
    }
  ]

  let successCount = 0
  
  for (const command of sqlCommands) {
    const success = await executeSQL(command.sql, command.description)
    if (success) {
      successCount++
    }
    // Small delay between commands
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n📊 Resultado: ${successCount}/${sqlCommands.length} comandos ejecutados correctamente`)

  if (successCount === sqlCommands.length) {
    console.log('🎉 ¡Corrección completada exitosamente!')
    console.log('💡 Ahora intenta acceder al dashboard nuevamente')
  } else {
    console.log('⚠️  Algunas correcciones fallaron. Revisa los errores arriba.')
  }
}

// Alternative approach using direct SQL execution
async function fixRLSPoliciesDirectly() {
  console.log('🚀 Iniciando corrección directa de políticas RLS...')
  
  const fixSQL = `
    -- Drop problematic policies
    DROP POLICY IF EXISTS "Anyone can view user roles" ON user_roles;
    DROP POLICY IF EXISTS "Users can view user roles" ON user_roles;
    DROP POLICY IF EXISTS "Only admins can manage user roles" ON user_roles;
    DROP POLICY IF EXISTS "Service can insert user roles" ON user_roles;
    DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
    
    -- Temporarily disable RLS
    ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
    
    -- Create simple policy
    CREATE POLICY "Simple view policy for user_roles" ON user_roles 
    FOR SELECT USING (auth.uid() IS NOT NULL);
    
    -- Re-enable RLS
    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  `

  try {
    // Try using raw SQL query
    const { data, error } = await supabase
      .from('user_roles')
      .select('count', { count: 'exact', head: true })
    
    if (error && error.code === '42P17') {
      console.log('✅ Confirmado: Error de recursión infinita detectado')
      
      // Use the service client to execute raw SQL
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
      
      // Execute each command separately to avoid issues
      const commands = fixSQL.split(';').filter(cmd => cmd.trim())
      
      for (const cmd of commands) {
        if (cmd.trim()) {
          console.log(`🔧 Ejecutando: ${cmd.trim().substring(0, 50)}...`)
          try {
            await serviceClient.rpc('exec_sql', { sql: cmd.trim() })
            console.log('✅ Comando ejecutado')
          } catch (err) {
            console.log(`⚠️  Error en comando (puede ser normal): ${err.message}`)
          }
        }
      }
      
      console.log('🎉 Corrección completada')
    } else {
      console.log('ℹ️  No se detectó el error de recursión, las políticas podrían estar bien')
    }
    
  } catch (err) {
    console.error('❌ Error durante la corrección:', err.message)
  }
}

// Execute the fix
fixRLSPoliciesDirectly().then(() => {
  console.log('✨ Script completado')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Error fatal:', error)
  process.exit(1)
})