// ABOUTME: Script para verificar las credenciales de usuarios demo
// ABOUTME: Intenta autenticarse con las credenciales esperadas

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const credentials = [
  {
    email: 'mentor1@demo.espanacreativa.com',
    password: 'DemoPass123!',
    role: 'Mentor'
  },
  {
    email: 'emprendedor1@demo.espanacreativa.com',
    password: 'DemoPass456!',
    role: 'Emprendedor'
  }
]

console.log('🔐 Verificando credenciales de usuarios demo...\n')

for (const cred of credentials) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cred.email,
      password: cred.password
    })

    if (error) {
      console.log(`❌ ${cred.role}: ${cred.email}`)
      console.log(`   Error: ${error.message}\n`)
    } else {
      console.log(`✅ ${cred.role}: ${cred.email}`)
      console.log(`   Password: ${cred.password}`)
      console.log(`   Usuario autenticado correctamente\n`)

      // Cerrar sesión
      await supabase.auth.signOut()
    }
  } catch (error) {
    console.log(`❌ ${cred.role}: ${cred.email}`)
    console.log(`   Error: ${error.message}\n`)
  }
}
