// ABOUTME: User roles management HTTP routes for assigning/removing territorial roles
// ABOUTME: Admin-only endpoints with automatic audit logging

import { Router, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'
import { AuthenticatedRequest } from '../middleware/auth.middleware'

export const createUserRolesRoutes = (): Router => {
  const router = Router()

  // All routes require authentication (applied in server/index.ts)

  // POST /api/user-roles/assign - Assign a role to a user
  router.post('/assign', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id

      if (!adminId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { userId, roleId } = req.body

      if (!userId || !roleId) {
        return res.status(400).json({
          error: 'Missing required fields: userId, roleId'
        })
      }

      const assignRoleToUserUseCase = Container.getAssignRoleToUserUseCase()

      const result = await assignRoleToUserUseCase.execute({
        userId,
        roleId: parseInt(roleId),
        performedBy: adminId
      })

      if (result.error) {
        return res.status(403).json({ error: result.error })
      }

      return res.status(200).json({
        success: true,
        message: 'Role assigned successfully'
      })
    } catch (error: any) {
      next(error)
    }
  })

  // POST /api/user-roles/remove - Remove a role from a user
  router.post('/remove', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id

      if (!adminId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { userId, roleId } = req.body

      if (!userId || !roleId) {
        return res.status(400).json({
          error: 'Missing required fields: userId, roleId'
        })
      }

      const removeRoleFromUserUseCase = Container.getRemoveRoleFromUserUseCase()

      const result = await removeRoleFromUserUseCase.execute({
        userId,
        roleId: parseInt(roleId),
        performedBy: adminId
      })

      if (result.error) {
        return res.status(403).json({ error: result.error })
      }

      return res.status(200).json({
        success: true,
        message: 'Role removed successfully'
      })
    } catch (error: any) {
      next(error)
    }
  })

  // GET /api/user-roles/audit-log - Get role change audit log
  router.get('/audit-log', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id

      if (!adminId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { userId, roleId, action, limit, offset } = req.query

      const getRoleAuditLogUseCase = Container.getGetRoleAuditLogUseCase()

      const result = await getRoleAuditLogUseCase.execute({
        requestedBy: adminId,
        filters: {
          userId: userId as string | undefined,
          roleId: roleId ? parseInt(roleId as string) : undefined,
          action: action as 'assigned' | 'removed' | undefined,
          limit: limit ? parseInt(limit as string) : 50,
          offset: offset ? parseInt(offset as string) : 0
        }
      })

      if (result.error) {
        return res.status(403).json({ error: result.error })
      }

      return res.status(200).json({
        logs: result.logs.map(log => ({
          id: log.id,
          user_id: log.userId,
          user_name: log.userName,
          user_email: log.userEmail,
          role_id: log.roleId,
          role_name: log.roleName,
          action: log.action,
          performed_by: log.performedBy,
          performed_by_name: log.performedByName,
          reason: log.reason,
          created_at: log.createdAt.toISOString(),
          metadata: log.metadata
        })),
        total: result.total
      })
    } catch (error: any) {
      next(error)
    }
  })

  return router
}
