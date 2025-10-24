// ABOUTME: Test script to simulate approval email sending
// ABOUTME: Run with: node test-approval-email.mjs

import { Resend } from 'resend'
import dotenv from 'dotenv'

dotenv.config()

const resend = new Resend(process.env.RESEND_API_KEY)

async function testApprovalEmail() {
  console.log('🧪 Testing approval email flow...')

  const testEmail = 'iban.perezmi@gmail.com'
  const testToken = 'test-token-123'
  const APP_URL = process.env.APP_URL || 'http://localhost:8080'
  const activationLink = `${APP_URL}/auth/set-password/${testToken}`

  console.log('📧 To:', testEmail)
  console.log('📧 Activation link:', activationLink)
  console.log('📧 APP_URL from env:', process.env.APP_URL)

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e;">¡Tu solicitud ha sido aprobada!</h1>
          <p>¡Bienvenido/a a España Creativa Red!</p>
          <p>Tu solicitud de registro ha sido aprobada. Para completar tu registro, haz clic en el botón y crea tu contraseña:</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${activationLink}" style="display: inline-block; padding: 15px 30px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-size: 16px;">Acceder a mi cuenta</a>
          </div>
          <p style="color: #666; font-size: 14px;">Este enlace es válido por 7 días.</p>
        </div>
      </body>
    </html>
  `

  try {
    console.log('📧 Sending approval email...')
    const { data, error } = await resend.emails.send({
      from: 'España Creativa <send@infinitofit.com>',
      to: testEmail,
      subject: '¡Tu cuenta ha sido aprobada! - España Creativa',
      html
    })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Email sent successfully!')
    console.log('📧 Message ID:', data?.id)
    console.log('\n✅ Check your email inbox!')
  } catch (err) {
    console.error('❌ Exception:', err)
  }
}

testApprovalEmail()
