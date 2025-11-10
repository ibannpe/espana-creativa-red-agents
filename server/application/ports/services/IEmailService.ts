// ABOUTME: Email service port defining contract for email operations
// ABOUTME: Abstracts email provider (Resend) from business logic

import { Email } from '../../../domain/value-objects/Email'
import { PendingSignup } from '../../../domain/entities/PendingSignup'

export interface EmailOptions {
  to: Email
  subject: string
  html: string
  from?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: Error
}

export interface IEmailService {
  /**
   * Send a generic email
   */
  sendEmail(options: EmailOptions): Promise<EmailResult>

  /**
   * Send welcome email to new user
   */
  sendWelcomeEmail(to: Email, name: string): Promise<EmailResult>

  /**
   * Send profile incomplete reminder
   */
  sendProfileIncompleteEmail(to: Email, name: string, completionPct: number): Promise<EmailResult>

  /**
   * Send new message notification
   */
  sendNewMessageEmail(recipientEmail: Email, recipientName: string, senderName: string): Promise<EmailResult>

  /**
   * Send new opportunity notification
   */
  sendNewOpportunityEmail(to: Email, name: string, opportunityTitle: string): Promise<EmailResult>

  /**
   * Send admin notification when new signup request submitted
   */
  sendAdminSignupNotification(email: Email, signup: PendingSignup): Promise<EmailResult>

  /**
   * Send approval email to user with magic link
   */
  sendSignupApprovedEmail(email: Email, magicLink: string): Promise<EmailResult>

  /**
   * Send rejection email to user
   */
  sendSignupRejectedEmail(email: Email): Promise<EmailResult>
}
