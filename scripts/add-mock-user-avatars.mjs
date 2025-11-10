// ABOUTME: Script para agregar fotos de perfil a usuarios mock
// ABOUTME: Descarga avatares generados y los sube a Supabase Storage

import { createClient } from '@supabase/supabase-js'
import { Buffer } from 'buffer'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Lista de usuarios mock con sus IDs y nombres
const mockUsers = [
  { id: 'c2b3d5e9-0730-4b88-897a-c023d5c4a5fe', name: 'Miguel Herrera Sánchez' },
  { id: '9b526ff2-76ab-4b64-b035-fdeb75734943', name: 'Sofía Ramírez Castro' },
  { id: 'c1428833-9b5d-4c91-ab41-79f02a241a1a', name: 'David Torres Ruiz' },
  { id: '3546ec25-216e-4de6-ac70-4996103c08b2', name: 'Ana López Fernández' },
  { id: 'a9f32c6a-7343-46d0-a3cc-c63186aa4e77', name: 'Jorge Santos Díaz' },
  { id: '2cba0e07-0297-41b6-b944-343928ee9cd4', name: 'Laura Martínez López' },
  { id: 'fbadeca5-5647-446b-b5cd-b253add08fc1', name: 'Carlos Ruiz Martínez' },
  { id: '35fa3e31-7f88-49b1-a00d-ce7109458db5', name: 'María González' }
]

// Función para generar avatar usando DiceBear API (fotos públicas y gratuitas)
function getAvatarUrl(name, seed) {
  // Usamos DiceBear API que genera avatares profesionales
  // Estilo: avataaars (estilo cartoon profesional)
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`
}

// Función alternativa usando UI Avatars
function getUIAvatarUrl(name) {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=22c55e&color=fff&bold=true`
}

async function downloadImage(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function uploadAvatar(userId, imageBuffer, index) {
  const fileName = `avatars/${userId}-${Date.now()}.png`

  console.log(`Subiendo avatar para usuario ${userId}...`)

  const { data, error } = await supabase.storage
    .from('fotos-perfil')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: false
    })

  if (error) {
    console.error(`Error subiendo avatar: ${error.message}`)
    throw error
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('fotos-perfil')
    .getPublicUrl(fileName)

  return publicUrl
}

async function updateUserAvatar(userId, avatarUrl) {
  console.log(`Actualizando usuario ${userId} con avatar ${avatarUrl}...`)

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (error) {
    console.error(`Error actualizando usuario: ${error.message}`)
    throw error
  }
}

async function main() {
  console.log('🎨 Agregando avatares a usuarios mock...\n')

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < mockUsers.length; i++) {
    const user = mockUsers[i]

    try {
      console.log(`\n[${i + 1}/${mockUsers.length}] Procesando: ${user.name}`)

      // Usar DiceBear con el ID del usuario como seed para consistencia
      const avatarUrl = getAvatarUrl(user.name, user.id)
      console.log(`  → Descargando avatar de: ${avatarUrl}`)

      const imageBuffer = await downloadImage(avatarUrl)
      console.log(`  → Avatar descargado (${imageBuffer.length} bytes)`)

      const publicUrl = await uploadAvatar(user.id, imageBuffer, i)
      console.log(`  → Avatar subido a: ${publicUrl}`)

      await updateUserAvatar(user.id, publicUrl)
      console.log(`  ✅ Usuario actualizado correctamente`)

      successCount++

      // Pequeña pausa para no saturar las APIs
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`  ❌ Error procesando ${user.name}:`, error.message)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\n✨ Proceso completado:`)
  console.log(`   ✅ Éxitos: ${successCount}`)
  console.log(`   ❌ Errores: ${errorCount}`)
  console.log(`   📊 Total: ${mockUsers.length}`)
  console.log('\n' + '='.repeat(50))
}

main().catch(console.error)
