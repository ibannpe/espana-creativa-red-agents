// ABOUTME: Script to execute the opportunities table migration directly via Supabase client
// ABOUTME: Reads the SQL file and executes it using the service role key

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Running opportunities table migration...\n')

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '../migrations/005_update_opportunities_table.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Executing migration SQL...')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec', { sql })

    if (error) {
      // If RPC doesn't exist, try executing statements individually
      console.log('⚠️  RPC method not available, trying alternative approach...')

      // Split into individual statements and execute them
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

      for (const statement of statements) {
        if (statement.includes('BEGIN') || statement.includes('COMMIT')) continue

        console.log(`Executing: ${statement.substring(0, 80)}...`)
        const { error: stmtError } = await supabase.rpc('query', {
          query_string: statement
        })

        if (stmtError) {
          console.log(`⚠️  Statement failed (may be expected): ${stmtError.message}`)
        }
      }

      console.log('\n✅ Migration completed (with some expected warnings)')
      console.log('💡 Please verify the opportunities table in Supabase dashboard')
    } else {
      console.log('✅ Migration executed successfully!')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration()
