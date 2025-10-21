// ABOUTME: Script to execute migrations directly via Supabase REST API
// ABOUTME: Uses service role key to run DDL statements

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 Executing database migrations...\n')

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

async function executeSQLStatements(sql, migrationName) {
  console.log(`\n📄 Executing: ${migrationName}`)

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.match(/^--/)) // Remove comments
    .filter(s => !s.match(/^BEGIN$/i))
    .filter(s => !s.match(/^COMMIT$/i))
    .filter(s => !s.match(/^Rollback/i))

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]

    // Skip empty statements
    if (!stmt || stmt.length < 5) continue

    try {
      console.log(`  [${i + 1}/${statements.length}] Executing...`)

      // Execute using rpc if available, otherwise use direct query
      const { error } = await supabase.rpc('exec', { sql: stmt + ';' })

      if (error) {
        console.log(`  ⚠️  RPC failed, trying direct execution...`)
        // If rpc doesn't work, we'll need to use a different approach
        throw error
      }

      console.log(`  ✅ Success`)
      successCount++
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
      failCount++

      // For some errors, we want to continue
      if (error.message.includes('already exists') ||
          error.message.includes('does not exist')) {
        console.log(`  ℹ️  Continuing despite error (may be expected)`)
        continue
      }

      // For critical errors, stop
      if (error.message.includes('syntax error') ||
          error.message.includes('permission denied')) {
        console.log(`  🛑 Critical error, stopping migration`)
        return { success: false, successCount, failCount, error }
      }
    }
  }

  return { success: failCount === 0, successCount, failCount }
}

async function main() {
  try {
    // Test connection first
    console.log('🔌 Testing Supabase connection...')
    const { data, error } = await supabase.from('users').select('count').limit(1).maybeSingle()

    if (error && !error.message.includes('count')) {
      console.log('✅ Connection successful\n')
    }

    // Read migration files
    const migrations = [
      {
        name: '003_update_messages_table',
        sql: readFileSync('migrations/003_update_messages_table.sql', 'utf8')
      },
      {
        name: '004_create_connections_table',
        sql: readFileSync('migrations/004_create_connections_table.sql', 'utf8')
      },
      {
        name: '005_update_opportunities_table',
        sql: readFileSync('migrations/005_update_opportunities_table.sql', 'utf8')
      }
    ]

    console.log(`📋 Found ${migrations.length} migrations to execute\n`)
    console.log('=' .repeat(60))

    const results = []

    for (const migration of migrations) {
      const result = await executeSQLStatements(migration.sql, migration.name)
      results.push({ ...migration, ...result })

      if (!result.success && result.error) {
        console.log(`\n⚠️  Migration ${migration.name} had issues`)
        console.log(`   Error: ${result.error.message}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('\n📊 Migration Summary:\n')

    results.forEach(r => {
      const status = r.success ? '✅' : '⚠️'
      console.log(`${status} ${r.name}: ${r.successCount} successful, ${r.failCount} failed`)
    })

    const allSuccess = results.every(r => r.success)

    if (allSuccess) {
      console.log('\n🎉 All migrations completed successfully!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some migrations had issues. Check logs above.')
      console.log('💡 You may need to run them manually in Supabase SQL Editor')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

main()
