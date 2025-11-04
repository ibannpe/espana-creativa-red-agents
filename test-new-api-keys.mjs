// ABOUTME: Script de prueba para validar las nuevas claves API de Supabase
// ABOUTME: Verifica que tanto la clave publicable como la clave secreta funcionan correctamente

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🔑 Probando nuevas claves API de Supabase\n')
console.log('=' .repeat(60))

// Test 1: Clave Publicable (anon)
console.log('\n📋 Test 1: Clave Publicable (VITE_SUPABASE_ANON_KEY)')
console.log('-'.repeat(60))
console.log(`URL: ${SUPABASE_URL}`)
console.log(`Clave: ${ANON_KEY?.substring(0, 20)}...`)

try {
  const anonClient = createClient(SUPABASE_URL, ANON_KEY)

  // Probar una consulta básica (sin autenticación)
  const { data, error } = await anonClient
    .from('users')
    .select('count')
    .limit(1)

  if (error) {
    console.log(`❌ Error: ${error.message}`)
    console.log(`   Código: ${error.code}`)
  } else {
    console.log('✅ Clave publicable funciona correctamente')
    console.log(`   Conexión establecida con éxito`)
  }
} catch (err) {
  console.log(`❌ Excepción: ${err.message}`)
}

// Test 2: Clave Secreta (service_role)
console.log('\n📋 Test 2: Clave Secreta (SUPABASE_SERVICE_ROLE_KEY)')
console.log('-'.repeat(60))
console.log(`URL: ${SUPABASE_URL}`)
console.log(`Clave: ${SERVICE_ROLE_KEY?.substring(0, 20)}...`)

try {
  const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Probar una consulta que requiere privilegios elevados
  const { data, error } = await serviceClient
    .from('users')
    .select('id, email, name')
    .limit(1)

  if (error) {
    console.log(`❌ Error: ${error.message}`)
    console.log(`   Código: ${error.code}`)
  } else {
    console.log('✅ Clave secreta funciona correctamente')
    console.log(`   Puede acceder a datos protegidos`)
    if (data && data.length > 0) {
      console.log(`   Usuario de ejemplo: ${data[0].email}`)
    }
  }
} catch (err) {
  console.log(`❌ Excepción: ${err.message}`)
}

// Test 3: Verificar formato de las claves
console.log('\n📋 Test 3: Formato de las claves')
console.log('-'.repeat(60))

const isNewPublishableFormat = ANON_KEY?.startsWith('sb_publishable_')
const isNewSecretFormat = SERVICE_ROLE_KEY?.startsWith('sb_secret_')
const isOldJWTFormat = ANON_KEY?.startsWith('eyJ')

console.log(`Clave publicable (nuevo formato): ${isNewPublishableFormat ? '✅' : '❌'}`)
console.log(`Clave secreta (nuevo formato): ${isNewSecretFormat ? '✅' : '❌'}`)
console.log(`Formato JWT antiguo: ${isOldJWTFormat ? '⚠️  (deberías migrar)' : '✅ (migrado)'}`)

console.log('\n' + '='.repeat(60))
console.log('\n✨ Pruebas completadas\n')
