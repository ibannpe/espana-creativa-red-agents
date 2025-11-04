// ABOUTME: Script para resetear contraseñas de usuarios demo
// ABOUTME: Establece contraseñas conocidas para testing E2E

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const credentials = [
  {
    authUserId: '617fba2f-6ab3-4291-930f-85fe57f95769',
    email: 'mentor1@demo.espanacreativa.com',
    password: 'DemoPass123!',
    role: 'Mentor'
  },
  {
    authUserId: 'cef93075-c09e-4d62-9ebb-b22262a7a1f3',
    email: 'emprendedor1@demo.espanacreativa.com',
    password: 'DemoPass456!',
    role: 'Emprendedor'
  }
]

console.log('🔑 Reseteando contraseñas de usuarios demo...\n')

for (const cred of credentials) {
  try {
    // Actualizar contraseña usando admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      cred.authUserId,
      { password: cred.password }
    )

    if (updateError) {
      console.log(`❌ ${cred.role}: ${cred.email}`)
      console.log(`   Error: ${updateError.message}\n`)
    } else {
      console.log(`✅ ${cred.role}: ${cred.email}`)
      console.log(`   Password: ${cred.password}`)
      console.log(`   Contraseña actualizada correctamente\n`)
    }
  } catch (error) {
    console.log(`❌ ${cred.role}: ${cred.email}`)
    console.log(`   Error: ${error.message}\n`)
  }
}

console.log('='.repeat(60))
console.log('📋 CREDENCIALES PARA TESTING E2E')
console.log('='.repeat(60) + '\n')

console.log('👩‍🏫 MENTOR:')
console.log(`   Email: ${credentials[0].email}`)
console.log(`   Password: ${credentials[0].password}\n`)

console.log('👨‍💼 EMPRENDEDOR:')
console.log(`   Email: ${credentials[1].email}`)
console.log(`   Password: ${credentials[1].password}\n`)

console.log('='.repeat(60))
