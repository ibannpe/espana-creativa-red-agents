// ABOUTME: Network connections HTTP routes for managing user connections
// ABOUTME: Thin adapter layer delegating to network use cases with authentication middleware

import { Router, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'
import { AuthenticatedRequest } from '../middleware/auth.middleware'

export const createConnectionsRoutes = (): Router => {
  const router = Router()

  // All routes require authentication (applied in server/index.ts)

  // GET /api/connections - Get user's connections (optionally filtered by status)
  router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id

      const status = req.query.status as string | undefined
      const getConnectionsUseCase = Container.getGetConnectionsUseCase()

      const connections = await getConnectionsUseCase.execute({
        userId,
        status: status as any
      })

      return res.status(200).json({
        connections: connections.map((c) => ({
          id: c.connection.id,
          requester_id: c.connection.requesterId,
          addressee_id: c.connection.addresseeId,
          status: c.connection.status,
          created_at: c.connection.createdAt.toISOString(),
          updated_at: c.connection.updatedAt.toISOString(),
          user: c.user
        }))
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/connections/stats - Get network statistics
  router.get('/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const getNetworkStatsUseCase = Container.getGetNetworkStatsUseCase()
      const stats = await getNetworkStatsUseCase.execute({ userId })

      return res.status(200).json(stats)
    } catch (error) {
      next(error)
    }
  })

  // GET /api/connections/mutual/:userId - Get mutual connections with another user
  router.get('/mutual/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user?.id
      const otherUserId = req.params.userId

      if (!currentUserId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!otherUserId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      const getMutualConnectionsUseCase = Container.getGetMutualConnectionsUseCase()
      const connections = await getMutualConnectionsUseCase.execute({
        userId1: currentUserId,
        userId2: otherUserId
      })

      return res.status(200).json({
        mutual_connections: connections.map((c) => ({
          id: c.connection.id,
          user: c.user
        })),
        count: connections.length
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/connections/status/:userId - Get connection status with another user
  router.get('/status/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user?.id
      const otherUserId = req.params.userId

      if (!currentUserId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!otherUserId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      const getConnectionStatusUseCase = Container.getGetConnectionStatusUseCase()
      const connection = await getConnectionStatusUseCase.execute({
        currentUserId,
        otherUserId
      })

      if (!connection) {
        return res.status(200).json({ status: null })
      }

      return res.status(200).json({
        status: connection.status,
        connection: {
          id: connection.id,
          requester_id: connection.requesterId,
          addressee_id: connection.addresseeId,
          created_at: connection.createdAt.toISOString()
        }
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/connections - Request a new connection
  router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const requesterId = req.user?.id
      const { addressee_id } = req.body

      if (!requesterId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!addressee_id) {
        return res.status(400).json({ error: 'Addressee ID is required' })
      }

      const requestConnectionUseCase = Container.getRequestConnectionUseCase()
      const connection = await requestConnectionUseCase.execute({
        requesterId,
        addresseeId: addressee_id
      })

      return res.status(201).json({
        connection: {
          id: connection.id,
          requester_id: connection.requesterId,
          addressee_id: connection.addresseeId,
          status: connection.status,
          created_at: connection.createdAt.toISOString(),
          updated_at: connection.updatedAt.toISOString()
        }
      })
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: error.message })
      }
      if (error.message.includes('yourself')) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  })

  // PUT /api/connections/:id - Update connection status (accept/reject/block)
  router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      const connectionId = req.params.id
      const { status } = req.body

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!status) {
        return res.status(400).json({ error: 'Status is required' })
      }

      const updateConnectionStatusUseCase = Container.getUpdateConnectionStatusUseCase()
      const connection = await updateConnectionStatusUseCase.execute({
        connectionId,
        newStatus: status,
        userId
      })

      return res.status(200).json({
        connection: {
          id: connection.id,
          requester_id: connection.requesterId,
          addressee_id: connection.addresseeId,
          status: connection.status,
          created_at: connection.createdAt.toISOString(),
          updated_at: connection.updatedAt.toISOString()
        }
      })
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      if (error.message.includes('Only')) {
        return res.status(403).json({ error: error.message })
      }
      next(error)
    }
  })

  // DELETE /api/connections/:id - Delete a connection
  router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      const connectionId = req.params.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const deleteConnectionUseCase = Container.getDeleteConnectionUseCase()
      await deleteConnectionUseCase.execute({
        connectionId,
        userId
      })

      return res.status(204).send()
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      next(error)
    }
  })

  return router
}
