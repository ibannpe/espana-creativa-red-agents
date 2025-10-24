// ABOUTME: Script de prueba para verificar envío de email de solicitud de registro al administrador
// ABOUTME: Usa Resend API directamente sin depender del servidor

import { Resend } from 'resend'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

const RESEND_API_KEY = process.env.RESEND_API_KEY
const ADMIN_EMAILS = process.env.ADMIN_EMAILS || ''
const APP_URL = process.env.APP_URL || 'http://localhost:8080'

console.log('🧪 TEST: Envío de Email de Solicitud de Registro al Administrador')
console.log('===============================================================\n')

// Validaciones
if (!RESEND_API_KEY) {
  console.error('❌ ERROR: RESEND_API_KEY no está configurada')
  console.error('   Configura la variable de entorno RESEND_API_KEY en tu archivo .env\n')
  process.exit(1)
}

if (!ADMIN_EMAILS) {
  console.error('❌ ERROR: ADMIN_EMAILS no está configurada')
  console.error('   Configura la variable de entorno ADMIN_EMAILS en tu archivo .env')
  console.error('   Ejemplo: ADMIN_EMAILS=admin1@example.com,admin2@example.com\n')
  process.exit(1)
}

const adminEmailsList = ADMIN_EMAILS.split(',').filter(e => e.trim())

if (adminEmailsList.length === 0) {
  console.error('❌ ERROR: ADMIN_EMAILS está vacío o mal formateado')
  console.error('   Formato correcto: email1@example.com,email2@example.com (sin espacios)\n')
  process.exit(1)
}

console.log('📋 Configuración:')
console.log(`   RESEND_API_KEY: ${RESEND_API_KEY.substring(0, 10)}...`)
console.log(`   ADMIN_EMAILS: ${ADMIN_EMAILS}`)
console.log(`   Número de administradores: ${adminEmailsList.length}`)
console.log(`   APP_URL: ${APP_URL}\n`)

// Datos de prueba
const testSignup = {
  email: 'test-signup@example.com',
  name: 'Usuario de Prueba',
  surname: 'Test',
  approvalToken: 'test-token-' + Date.now()
}

const approveUrl = `${APP_URL}/admin/signup-approval/approve/${testSignup.approvalToken}`
const rejectUrl = `${APP_URL}/admin/signup-approval/reject/${testSignup.approvalToken}`

// HTML del email
const html = `
  <!DOCTYPE html>
  <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ff5722;">🧪 TEST: Nueva solicitud de registro</h1>
        <p style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;">
          <strong>⚠️ Este es un email de prueba.</strong> No es una solicitud real.
        </p>
        <p><strong>Email:</strong> ${testSignup.email}</p>
        <p><strong>Nombre:</strong> ${testSignup.name} ${testSignup.surname}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${approveUrl}" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px;">Aprobar</a>
          <a href="${rejectUrl}" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px;">Rechazar</a>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666;">
          <strong>URLs de prueba:</strong><br>
          Aprobar: ${approveUrl}<br>
          Rechazar: ${rejectUrl}
        </p>
      </div>
    </body>
  </html>
`

// Inicializar Resend
const resend = new Resend(RESEND_API_KEY)

// Enviar emails
console.log('📧 Enviando emails de prueba...\n')

const sendEmails = async () => {
  const results = []

  for (const adminEmail of adminEmailsList) {
    console.log(`   Enviando a: ${adminEmail}...`)

    try {
      const { data, error } = await resend.emails.send({
        from: 'España Creativa <send@infinitofit.com>',
        to: adminEmail.trim(),
        subject: '🧪 TEST: Nueva solicitud de registro - España Creativa',
        html
      })

      if (error) {
        console.error(`   ❌ Error enviando a ${adminEmail}:`, error.message)
        results.push({ email: adminEmail, success: false, error: error.message })
      } else {
        console.log(`   ✅ Enviado exitosamente (ID: ${data.id})`)
        results.push({ email: adminEmail, success: true, messageId: data.id })
      }
    } catch (err) {
      console.error(`   ❌ Excepción enviando a ${adminEmail}:`, err.message)
      results.push({ email: adminEmail, success: false, error: err.message })
    }
  }

  return results
}

// Ejecutar prueba
sendEmails()
  .then(results => {
    console.log('\n===============================================================')
    console.log('📊 RESULTADOS:')
    console.log('===============================================================\n')

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    results.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.email}`)
        console.log(`   Message ID: ${result.messageId}`)
      } else {
        console.log(`❌ ${result.email}`)
        console.log(`   Error: ${result.error}`)
      }
      console.log('')
    })

    console.log(`Total enviados: ${successful}/${results.length}`)

    if (failed > 0) {
      console.log(`\n⚠️  Hubo ${failed} error(es). Revisa los mensajes arriba.`)
      process.exit(1)
    } else {
      console.log('\n✅ ¡Todos los emails se enviaron correctamente!')
      console.log('   Revisa la bandeja de entrada de los administradores.')
      process.exit(0)
    }
  })
  .catch(err => {
    console.error('\n❌ ERROR FATAL:', err.message)
    process.exit(1)
  })
