// ABOUTME: Script to execute migration 006 using Supabase client
// ABOUTME: Creates opportunity_interests table

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🚀 Executing migration 006...\n')

// Read migration file
const migrationPath = join(__dirname, '..', 'migrations', '006_create_opportunity_interests.sql')
const migrationSQL = readFileSync(migrationPath, 'utf-8')

// Split by statements
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`📄 Found ${statements.length} statements to execute\n`)

let successCount = 0
let failCount = 0

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';'
  console.log(`[${i + 1}/${statements.length}] Executing statement...`)

  try {
    const { data, error } = await supabase.rpc('exec', { sql: statement })

    if (error) {
      console.error(`  ❌ Error: ${error.message}`)
      failCount++
    } else {
      console.log(`  ✅ Success`)
      successCount++
    }
  } catch (err) {
    console.error(`  ❌ Exception: ${err.message}`)
    failCount++
  }
}

console.log(`\n📊 Migration Summary:`)
console.log(`  ✅ Successful: ${successCount}`)
console.log(`  ❌ Failed: ${failCount}`)

if (failCount === 0) {
  console.log('\n✨ Migration completed successfully!')
} else {
  console.log('\n⚠️  Some statements failed. You may need to execute them manually in Supabase SQL Editor.')
}
