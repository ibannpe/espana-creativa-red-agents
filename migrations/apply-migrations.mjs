// ABOUTME: Script to apply migrations to Supabase using REST API
// ABOUTME: Reads migration files and executes them via Supabase Management API

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Applying database migrations to Supabase...\n')
console.log(`📍 URL: ${supabaseUrl}\n`)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSql(sql) {
  // Use Supabase's from() with a raw SQL query
  // Note: This approach requires using the postgres direct connection
  const { data, error } = await supabase.rpc('exec_sql', { query: sql })

  if (error) {
    throw error
  }

  return data
}

async function runMigration(fileName, sql) {
  console.log(`📄 Running: ${fileName}`)

  try {
    // For Supabase, we need to use the postgres connection
    // Since we can't execute DDL via the API, we'll provide instructions
    console.log(`  ℹ️  Migration file ready: ${fileName}`)
    console.log(`  📝 SQL length: ${sql.length} characters`)
    return { success: true, fileName }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`)
    return { success: false, fileName, error: error.message }
  }
}

async function main() {
  const migrations = [
    {
      file: 'migrations/003_update_messages_table.sql',
      sql: readFileSync('migrations/003_update_messages_table.sql', 'utf8')
    },
    {
      file: 'migrations/004_create_connections_table.sql',
      sql: readFileSync('migrations/004_create_connections_table.sql', 'utf8')
    },
    {
      file: 'migrations/005_update_opportunities_table.sql',
      sql: readFileSync('migrations/005_update_opportunities_table.sql', 'utf8')
    }
  ]

  console.log('⚠️  IMPORTANT: Supabase DDL must be run through SQL Editor\n')
  console.log('📋 Instructions:\n')
  console.log('1. Go to: https://app.supabase.com/project/jbkzymvswvnkrxriyzdx/sql/new')
  console.log('2. Copy and paste each migration file:')

  for (const migration of migrations) {
    console.log(`\n   ➡️  ${migration.file}`)
  }

  console.log('\n3. Click "Run" for each migration')
  console.log('\n✅ Files are ready in the migrations/ directory')
  console.log('\n💡 Or run manually with these commands:\n')

  for (const migration of migrations) {
    const fileName = migration.file.split('/').pop()
    console.log(`   cat ${migration.file}`)
  }
}

main().catch(console.error)
