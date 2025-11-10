// ABOUTME: Resend implementation of IEmailService port
// ABOUTME: Handles email sending operations using Resend API

import { Resend } from 'resend'
import {
  IEmailService,
  EmailOptions,
  EmailResult
} from '../../../application/ports/services/IEmailService'
import { Email } from '../../../domain/value-objects/Email'
import { PendingSignup } from '../../../domain/entities/PendingSignup'

export class ResendEmailService implements IEmailService {
  private readonly resend: Resend
  private readonly defaultFrom: string

  constructor(apiKey: string, defaultFrom: string = 'España Creativa <send@infinitofit.com>') {
    this.resend = new Resend(apiKey)
    this.defaultFrom = defaultFrom
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to.getValue(),
        subject: options.subject,
        html: options.html
      })

      if (error) {
        return {
          success: false,
          error: new Error(error.message)
        }
      }

      return {
        success: true,
        messageId: data?.id
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error
      }
    }
  }

  async sendWelcomeEmail(to: Email, name: string): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">¡Bienvenido/a a España Creativa Red!</h1>
            <p>Hola ${name},</p>
            <p>Nos alegra mucho que te hayas unido a nuestra red de emprendedores y mentores.</p>
            <p>España Creativa Red es una plataforma diseñada para conectar profesionales, compartir oportunidades y construir una comunidad creativa.</p>
            <p><strong>Próximos pasos:</strong></p>
            <ol>
              <li>Completa tu perfil para que otros miembros puedan conocerte mejor</li>
              <li>Explora la red y encuentra a otros emprendedores y mentores</li>
              <li>Participa en oportunidades que se alineen con tus intereses</li>
            </ol>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>¡Bienvenido/a a la comunidad!</p>
            <p style="margin-top: 30px;">
              <strong>El equipo de España Creativa</strong>
            </p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to,
      subject: '¡Bienvenido/a a España Creativa Red!',
      html
    })
  }

  async sendProfileIncompleteEmail(to: Email, name: string, completionPct: number): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Completa tu perfil en España Creativa Red</h1>
            <p>Hola ${name},</p>
            <p>Tu perfil está ${completionPct}% completo. Un perfil completo te ayuda a:</p>
            <ul>
              <li>Conectar mejor con otros miembros de la comunidad</li>
              <li>Recibir oportunidades más relevantes</li>
              <li>Aumentar tu visibilidad en la red</li>
            </ul>
            <p><a href="${process.env.APP_URL || 'http://localhost:8080'}/profile" style="display: inline-block; padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px;">Completar mi perfil</a></p>
            <p>¡Gracias por ser parte de España Creativa!</p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to,
      subject: 'Completa tu perfil en España Creativa Red',
      html
    })
  }

  async sendNewMessageEmail(recipientEmail: Email, recipientName: string, senderName: string): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Nuevo mensaje de ${senderName}</h1>
            <p>Hola ${recipientName},</p>
            <p>Has recibido un nuevo mensaje de <strong>${senderName}</strong> en España Creativa Red.</p>
            <p><a href="${process.env.APP_URL || 'http://localhost:8080'}/messages" style="display: inline-block; padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px;">Ver mensaje</a></p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: recipientEmail,
      subject: `Nuevo mensaje de ${senderName}`,
      html
    })
  }

  async sendNewOpportunityEmail(to: Email, name: string, opportunityTitle: string): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Nueva oportunidad: ${opportunityTitle}</h1>
            <p>Hola ${name},</p>
            <p>Hay una nueva oportunidad que podría interesarte: <strong>${opportunityTitle}</strong></p>
            <p><a href="${process.env.APP_URL || 'http://localhost:8080'}/opportunities" style="display: inline-block; padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px;">Ver oportunidad</a></p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to,
      subject: `Nueva oportunidad: ${opportunityTitle}`,
      html
    })
  }

  async sendAdminSignupNotification(email: Email, signup: PendingSignup): Promise<EmailResult> {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').filter(e => e.trim())
    const approvalToken = signup.getApprovalToken().getValue()
    const approveUrl = `${process.env.APP_URL || 'http://localhost:8080'}/admin/signup-approval/approve/${approvalToken}`
    const rejectUrl = `${process.env.APP_URL || 'http://localhost:8080'}/admin/signup-approval/reject/${approvalToken}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Nueva solicitud de registro</h1>
            <p><strong>Email:</strong> ${email.getValue()}</p>
            <p><strong>Nombre:</strong> ${signup.getName()} ${signup.getSurname() || ''}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${approveUrl}" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Aprobar</a>
              <a href="${rejectUrl}" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px;">Rechazar</a>
            </div>
          </div>
        </body>
      </html>
    `

    const results = await Promise.all(
      adminEmails.map(adminEmail =>
        this.resend.emails.send({
          from: this.defaultFrom,
          to: adminEmail.trim(),
          subject: 'Nueva solicitud de registro - España Creativa',
          html
        })
      )
    )

    return {
      success: results.every(r => !r.error),
      messageId: results[0]?.data?.id
    }
  }

  async sendSignupApprovedEmail(email: Email, activationLink: string): Promise<EmailResult> {
    console.log('📧 [ResendEmailService] sendSignupApprovedEmail called')
    console.log('📧 [ResendEmailService] To:', email.getValue())
    console.log('📧 [ResendEmailService] Activation link:', activationLink)

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">¡Tu solicitud ha sido aprobada!</h1>
            <p>¡Bienvenido/a a España Creativa Red!</p>
            <p>Tu solicitud de registro ha sido aprobada. Para completar tu registro, haz clic en el botón y crea tu contraseña:</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${activationLink}" style="display: inline-block; padding: 15px 30px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-size: 16px;">Acceder a mi cuenta</a>
            </div>
            <p style="color: #666; font-size: 14px;">Este enlace es válido por 7 días.</p>
          </div>
        </body>
      </html>
    `

    const result = await this.sendEmail({
      to: email,
      subject: '¡Tu cuenta ha sido aprobada! - España Creativa',
      html
    })

    console.log('📧 [ResendEmailService] Result:', result)
    return result
  }

  async sendSignupRejectedEmail(email: Email): Promise<EmailResult> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Solicitud de registro - España Creativa</h1>
            <p>Gracias por tu interés en España Creativa Red.</p>
            <p>Lamentablemente, no podemos procesar tu solicitud de registro en este momento.</p>
            <p>Si crees que esto es un error o tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>Saludos,<br><strong>El equipo de España Creativa</strong></p>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: email,
      subject: 'Solicitud de registro - España Creativa',
      html
    })
  }
}
