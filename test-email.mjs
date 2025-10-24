// ABOUTME: Quick test script to verify email sending with Resend
// ABOUTME: Run with: node test-email.mjs

import { Resend } from 'resend'
import dotenv from 'dotenv'

dotenv.config()

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
  console.log('🧪 Testing email sending...')
  console.log('📧 RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set ✓' : 'NOT SET ✗')
  console.log('📧 Sending test email...')

  try {
    const { data, error } = await resend.emails.send({
      from: 'España Creativa <send@infinitofit.com>',
      to: 'iban.perezmi@gmail.com', // Change to your email
      subject: 'Test Email - España Creativa',
      html: '<p>This is a test email from España Creativa backend.</p>'
    })

    if (error) {
      console.error('❌ Error sending email:', error)
      return
    }

    console.log('✅ Email sent successfully!')
    console.log('📧 Message ID:', data?.id)
  } catch (err) {
    console.error('❌ Exception occurred:', err)
  }
}

testEmail()
