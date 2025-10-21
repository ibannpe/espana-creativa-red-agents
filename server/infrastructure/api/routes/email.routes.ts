// ABOUTME: Email notification HTTP routes for transactional emails
// ABOUTME: Provides endpoints for sending various types of email notifications via email service

import { Router, Request, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'
import { Email } from '../../../domain/value-objects/Email'

export const createEmailRoutes = (): Router => {
  const router = Router()

  // POST /api/email/send - Send generic email
  router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { to, subject, html, from } = req.body

      if (!to || !subject || !html) {
        return res.status(400).json({
          error: 'Missing required fields: to, subject, html'
        })
      }

      const email = Email.create(to)
      if (!email) {
        return res.status(400).json({
          error: 'Invalid email format'
        })
      }

      const emailService = Container.getEmailService()
      const result = await emailService.sendEmail({
        to: email,
        subject,
        html,
        from
      })

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to send email',
          details: result.error?.message
        })
      }

      return res.status(200).json({
        success: true,
        messageId: result.messageId
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/email/welcome - Send welcome email
  router.post('/welcome', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email: emailAddress, name } = req.body

      if (!emailAddress || !name) {
        return res.status(400).json({
          error: 'Missing required fields: email, name'
        })
      }

      const email = Email.create(emailAddress)
      if (!email) {
        return res.status(400).json({
          error: 'Invalid email format'
        })
      }

      const emailService = Container.getEmailService()
      const result = await emailService.sendWelcomeEmail(email, name)

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to send welcome email',
          details: result.error?.message
        })
      }

      return res.status(200).json({
        success: true,
        messageId: result.messageId
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/email/profile-reminder - Send profile completion reminder
  router.post('/profile-reminder', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email: emailAddress, name, completionPct } = req.body

      if (!emailAddress || !name || typeof completionPct !== 'number') {
        return res.status(400).json({
          error: 'Missing required fields: email, name, completionPct'
        })
      }

      const email = Email.create(emailAddress)
      if (!email) {
        return res.status(400).json({
          error: 'Invalid email format'
        })
      }

      const emailService = Container.getEmailService()
      const result = await emailService.sendProfileIncompleteEmail(email, name, completionPct)

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to send profile reminder email',
          details: result.error?.message
        })
      }

      return res.status(200).json({
        success: true,
        messageId: result.messageId
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/email/message-notification - Send new message notification
  router.post('/message-notification', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { recipientEmail: recipientEmailAddress, recipientName, senderName } = req.body

      if (!recipientEmailAddress || !recipientName || !senderName) {
        return res.status(400).json({
          error: 'Missing required fields: recipientEmail, recipientName, senderName'
        })
      }

      const recipientEmail = Email.create(recipientEmailAddress)
      if (!recipientEmail) {
        return res.status(400).json({
          error: 'Invalid email format'
        })
      }

      const emailService = Container.getEmailService()
      const result = await emailService.sendNewMessageEmail(recipientEmail, recipientName, senderName)

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to send message notification email',
          details: result.error?.message
        })
      }

      return res.status(200).json({
        success: true,
        messageId: result.messageId
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/email/opportunity-notification - Send new opportunity notification
  router.post('/opportunity-notification', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email: emailAddress, name, opportunityTitle } = req.body

      if (!emailAddress || !name || !opportunityTitle) {
        return res.status(400).json({
          error: 'Missing required fields: email, name, opportunityTitle'
        })
      }

      const email = Email.create(emailAddress)
      if (!email) {
        return res.status(400).json({
          error: 'Invalid email format'
        })
      }

      const emailService = Container.getEmailService()
      const result = await emailService.sendNewOpportunityEmail(email, name, opportunityTitle)

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to send opportunity notification email',
          details: result.error?.message
        })
      }

      return res.status(200).json({
        success: true,
        messageId: result.messageId
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
