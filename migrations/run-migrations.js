// ABOUTME: Script to run database migrations programmatically
// ABOUTME: Executes SQL migration files against Supabase database

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration(filePath) {
  const fileName = path.basename(filePath)
  console.log(`\n📄 Running migration: ${fileName}`)

  try {
    const sql = fs.readFileSync(filePath, 'utf8')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql })

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('  ℹ️  Trying direct SQL execution...')

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.toLowerCase().includes('begin') ||
            statement.toLowerCase().includes('commit') ||
            statement.toLowerCase().includes('rollback')) {
          continue // Skip transaction control statements
        }

        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement })
        if (stmtError) {
          throw stmtError
        }
      }
    }

    console.log(`  ✅ Successfully executed ${fileName}`)
    return true
  } catch (error) {
    console.error(`  ❌ Error executing ${fileName}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting database migrations...')
  console.log(`📍 Database: ${supabaseUrl}`)

  const migrations = [
    'migrations/003_update_messages_table.sql',
    'migrations/004_create_connections_table.sql',
    'migrations/005_update_opportunities_table.sql'
  ]

  let successCount = 0
  let failCount = 0

  for (const migration of migrations) {
    const success = await runMigration(migration)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('='.repeat(50))

  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please check the errors above.')
    console.log('💡 Tip: You may need to run these migrations manually in Supabase SQL Editor')
    process.exit(1)
  } else {
    console.log('\n🎉 All migrations completed successfully!')
  }
}

main().catch(console.error)
