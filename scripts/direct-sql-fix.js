const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQLCommand(sql, description) {
  console.log(`🔧 ${description}`)
  console.log(`   SQL: ${sql}`)
  
  try {
    // Use the REST API directly to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql_query: sql
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.log(`❌ Error HTTP ${response.status}: ${error}`)
      return false
    }

    const result = await response.json()
    console.log(`✅ Ejecutado correctamente`)
    return true
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    return false
  }
}

async function fixPolicies() {
  console.log('🚀 Ejecutando correcciones SQL directamente...\n')

  const sqlCommands = [
    {
      sql: "ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;",
      description: "Deshabilitando RLS en user_roles"
    },
    {
      sql: "DROP POLICY IF EXISTS \"Anyone can view user roles\" ON user_roles;",
      description: "Eliminando política problemática 1"
    },
    {
      sql: "DROP POLICY IF EXISTS \"Users can view user roles\" ON user_roles;",
      description: "Eliminando política problemática 2"
    },
    {
      sql: "DROP POLICY IF EXISTS \"Only admins can manage user roles\" ON user_roles;",
      description: "Eliminando política problemática 3"
    },
    {
      sql: "CREATE POLICY \"Simple user_roles policy\" ON user_roles FOR SELECT USING (auth.uid() IS NOT NULL);",
      description: "Creando política simple para user_roles"
    },
    {
      sql: "ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;",
      description: "Rehabilitando RLS en user_roles"
    }
  ]

  let successCount = 0
  
  for (const command of sqlCommands) {
    const success = await executeSQLCommand(command.sql, command.description)
    if (success) successCount++
    console.log('') // Línea en blanco para separar
    
    // Pequeña pausa entre comandos
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`📊 Resultado final: ${successCount}/${sqlCommands.length} comandos ejecutados`)
  
  if (successCount >= 4) { // Al menos las operaciones críticas
    console.log('🎉 ¡Corrección completada! Intenta acceder al dashboard ahora.')
  } else {
    console.log('⚠️  Hubo problemas. Intenta ejecutar el SQL manualmente en Supabase.')
  }
}

// Función alternativa más simple
async function simpleDisableRLS() {
  console.log('🔧 Intentando deshabilitar RLS de forma simple...')
  
  try {
    // Simplemente deshabilitar RLS para permitir que la app funcione
    const { error } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1)
    
    if (error && error.code === '42P17') {
      console.log('✅ Confirmado: Error de recursión infinita')
      console.log('🚨 Necesitas ejecutar este SQL manualmente en Supabase:')
      console.log('')
      console.log('ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('Ve a Supabase > SQL Editor y ejecuta ese comando.')
    } else {
      console.log('ℹ️  No se detectó error de recursión')
    }
    
  } catch (err) {
    console.error('Error:', err.message)
  }
}

// Ejecutar
fixPolicies().catch(err => {
  console.error('Error fatal:', err)
  console.log('\n🔧 Intentando método alternativo...')
  simpleDisableRLS()
})