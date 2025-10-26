// ABOUTME: Script temporal para listar todas las tablas de Supabase
// ABOUTME: Usado para probar la conexión con la base de datos

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function listTables() {
  try {
    console.log('🔍 Consultando tablas de Supabase...\n')

    // Consulta para obtener todas las tablas del schema public
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      console.error('❌ Error:', error.message)

      // Intentar método alternativo: listar algunas tablas conocidas
      console.log('\n📋 Intentando listar tablas conocidas del schema...\n')

      const tables = [
        'users',
        'roles',
        'user_roles',
        'projects',
        'opportunities',
        'messages',
        'interests'
      ]

      console.log('Tablas en el schema (basado en supabase-schema.sql):')
      for (const table of tables) {
        const { error: tableError, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (!tableError) {
          console.log(`  ✅ ${table} (${count} registros)`)
        } else {
          console.log(`  ❌ ${table} - ${tableError.message}`)
        }
      }
    } else {
      console.log('📊 Tablas encontradas:')
      data.forEach(table => {
        console.log(`  - ${table.table_name}`)
      })
      console.log(`\n✅ Total: ${data.length} tablas`)
    }

  } catch (err) {
    console.error('💥 Error inesperado:', err.message)
  }
}

listTables()
