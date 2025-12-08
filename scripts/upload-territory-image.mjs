// ABOUTME: Script to manually upload territory images to Supabase Storage
// ABOUTME: Updates city record with new image URL in database

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Upload image file to Supabase Storage and update city record
 * @param {number} cityId - The ID of the city to update
 * @param {string} imagePath - Path to the image file
 */
async function uploadTerritoryImage(cityId, imagePath) {
  try {
    console.log(`\n🔄 Processing territory ${cityId}...`)

    // Verify city exists
    const { data: city, error: fetchError } = await supabase
      .from('cities')
      .select('id, name, slug')
      .eq('id', cityId)
      .single()

    if (fetchError || !city) {
      console.error(`❌ City with ID ${cityId} not found`)
      return
    }

    console.log(`📍 Found city: ${city.name} (${city.slug})`)

    // Read image file
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Image file not found: ${imagePath}`)
      return
    }

    const imageBuffer = fs.readFileSync(imagePath)
    const fileExt = path.extname(imagePath)
    const fileName = `${city.slug}-${Date.now()}${fileExt}`
    const storagePath = `territories/${fileName}`

    console.log(`📤 Uploading image to: ${storagePath}`)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('city-images')
      .upload(storagePath, imageBuffer, {
        contentType: `image/${fileExt.replace('.', '')}`,
        upsert: false
      })

    if (uploadError) {
      console.error(`❌ Upload failed:`, uploadError)
      return
    }

    console.log(`✅ Image uploaded successfully`)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('city-images')
      .getPublicUrl(storagePath)

    console.log(`🔗 Public URL: ${publicUrl}`)

    // Update city record in database
    const { error: updateError } = await supabase
      .from('cities')
      .update({ image_url: publicUrl })
      .eq('id', cityId)

    if (updateError) {
      console.error(`❌ Database update failed:`, updateError)
      return
    }

    console.log(`✅ City record updated successfully`)
    console.log(`\n🎉 Territory "${city.name}" updated with new image!`)
    console.log(`   Image URL: ${publicUrl}`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length !== 2) {
  console.log(`
📋 Usage: node scripts/upload-territory-image.mjs <cityId> <imagePath>

Examples:
  node scripts/upload-territory-image.mjs 3 /path/to/quinto.jpg
  node scripts/upload-territory-image.mjs 4 /path/to/denia.jpg
  node scripts/upload-territory-image.mjs 5 /path/to/ribeira-sacra.jpg
  node scripts/upload-territory-image.mjs 6 /path/to/mondonedo.jpg

Available territories:
  3 - Quinto
  4 - Denia
  5 - Ribeira Sacra
  6 - Mondoñedo
`)
  process.exit(1)
}

const cityId = parseInt(args[0], 10)
const imagePath = args[1]

if (isNaN(cityId)) {
  console.error('❌ Invalid city ID. Must be a number.')
  process.exit(1)
}

uploadTerritoryImage(cityId, imagePath)
