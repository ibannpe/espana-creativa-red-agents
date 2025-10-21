import { Resend } from 'resend'

// Only initialize on server-side
const getResendClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Resend client should only be used on server-side')
  }
  
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  
  return new Resend(apiKey)
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from = 'España Creativa <noreply@espanacreativa.dev>' }: EmailOptions) {
  try {
    const resend = getResendClient()
    
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error }
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: '¡Bienvenido a España Creativa Red!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">¡Bienvenido a España Creativa Red!</h1>
        <p>Hola ${name},</p>
        <p>¡Nos complace darte la bienvenida a nuestra comunidad de emprendedores y mentores!</p>
        <p>España Creativa Red es la plataforma donde podrás:</p>
        <ul>
          <li>Conectar con otros emprendedores y mentores</li>
          <li>Encontrar oportunidades de colaboración</li>
          <li>Compartir y descubrir proyectos innovadores</li>
          <li>Participar en programas exclusivos</li>
        </ul>
        <p>Para comenzar, completa tu perfil y empieza a explorar la red.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.VITE_APP_URL || 'http://localhost:8082'}/dashboard" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Ir al Dashboard
          </a>
        </div>
        <p>¡Esperamos verte pronto en la plataforma!</p>
        <p>Saludos,<br>El equipo de España Creativa</p>
      </div>
    `
  }),

  profileIncomplete: (name: string, completionPct: number) => ({
    subject: 'Completa tu perfil en España Creativa Red',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Completa tu perfil</h1>
        <p>Hola ${name},</p>
        <p>Tu perfil está ${completionPct}% completo. Un perfil completo te ayudará a:</p>
        <ul>
          <li>Ser más visible en la comunidad</li>
          <li>Recibir mejores recomendaciones</li>
          <li>Conectar con personas afines</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.VITE_APP_URL || 'http://localhost:8082'}/profile" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Completar Perfil
          </a>
        </div>
        <p>Saludos,<br>El equipo de España Creativa</p>
      </div>
    `
  }),

  newMessage: (recipientName: string, senderName: string) => ({
    subject: `Nuevo mensaje de ${senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Nuevo Mensaje</h1>
        <p>Hola ${recipientName},</p>
        <p>Has recibido un nuevo mensaje de <strong>${senderName}</strong> en España Creativa Red.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.VITE_APP_URL || 'http://localhost:8082'}/messages" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Ver Mensaje
          </a>
        </div>
        <p>Saludos,<br>El equipo de España Creativa</p>
      </div>
    `
  }),

  newOpportunity: (name: string, opportunityTitle: string) => ({
    subject: `Nueva oportunidad: ${opportunityTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Nueva Oportunidad</h1>
        <p>Hola ${name},</p>
        <p>Se ha publicado una nueva oportunidad que podría interesarte:</p>
        <h2 style="color: #16a34a;">${opportunityTitle}</h2>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.VITE_APP_URL || 'http://localhost:8082'}/opportunities" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Ver Oportunidad
          </a>
        </div>
        <p>Saludos,<br>El equipo de España Creativa</p>
      </div>
    `
  })
}

// Helper functions for common email scenarios
export async function sendWelcomeEmail(email: string, name: string) {
  const template = emailTemplates.welcome(name)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}

export async function sendProfileIncompleteEmail(email: string, name: string, completionPct: number) {
  const template = emailTemplates.profileIncomplete(name, completionPct)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}

export async function sendNewMessageEmail(recipientEmail: string, recipientName: string, senderName: string) {
  const template = emailTemplates.newMessage(recipientName, senderName)
  return sendEmail({
    to: recipientEmail,
    subject: template.subject,
    html: template.html
  })
}

export async function sendNewOpportunityEmail(email: string, name: string, opportunityTitle: string) {
  const template = emailTemplates.newOpportunity(name, opportunityTitle)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}