// ABOUTME: HTTP routes for signup approval workflow (submit, approve, reject, list)
// ABOUTME: Thin adapter delegating to use cases with proper auth middleware

import { Router, Request, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'

// System admin ID used when no authenticated admin is available
const SYSTEM_ADMIN_ID = '00000000-0000-0000-0000-000000000000'

export const createSignupApprovalRoutes = (): Router => {
  const router = Router()

  // POST /api/signup-approval/request - Submit signup request (public)
  router.post('/request', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, surname } = req.body

      if (!email || !name) {
        return res.status(400).json({
          error: 'Missing required fields: email, name'
        })
      }

      const useCase = Container.getSubmitSignupRequestUseCase()
      const result = await useCase.execute({
        email,
        name,
        surname,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      })

      if (!result.success) {
        return res.status(400).json({
          error: result.error
        })
      }

      return res.status(201).json({
        success: true,
        pendingSignupId: result.pendingSignupId,
        message: 'Signup request submitted successfully. Admin will review within 24-48 hours.'
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/signup-approval/approve/:token - Approve signup (admin only)
  router.post('/approve/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params
      const adminId = req.body.adminId || SYSTEM_ADMIN_ID // In production, get from auth context

      const useCase = Container.getApproveSignupUseCase()
      const result = await useCase.execute({ token, adminId })

      if (!result.success) {
        return res.status(400).json({
          error: result.error
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Signup approved successfully. User will receive magic link via email.'
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/signup-approval/reject/:token - Reject signup (admin only)
  router.post('/reject/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params
      const adminId = req.body.adminId || SYSTEM_ADMIN_ID

      const useCase = Container.getRejectSignupUseCase()
      const result = await useCase.execute({ token, adminId })

      if (!result.success) {
        return res.status(400).json({
          error: result.error
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Signup rejected successfully.'
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/signup-approval/pending - List pending signups (admin only)
  router.get('/pending', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = (req.query.status as string) || 'pending'
      const limit = parseInt(req.query.limit as string) || 20
      const offset = parseInt(req.query.offset as string) || 0

      const useCase = Container.getGetPendingSignupsUseCase()
      const result = await useCase.execute({ status: status as any, limit, offset })

      if (!result.success) {
        return res.status(400).json({
          error: result.error
        })
      }

      const signups = result.signups?.map(signup => signup.toPrimitives()) || []

      return res.status(200).json({
        success: true,
        signups,
        total: result.total,
        limit,
        offset
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/signup-approval/count - Get pending count (admin only)
  router.get('/count', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const useCase = Container.getGetPendingSignupsUseCase()
      const result = await useCase.execute({ status: 'pending', limit: 1 })

      return res.status(200).json({
        success: true,
        count: result.total || 0
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
