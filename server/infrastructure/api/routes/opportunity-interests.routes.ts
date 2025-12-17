// ABOUTME: API routes for opportunity interests
// ABOUTME: Handles HTTP requests for expressing and managing interest in opportunities

import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import type { Container } from '../../di/Container'
import { serverLogger } from '../../../logger.js'

const router = Router()

// Validation schemas
const expressInterestSchema = z.object({
  opportunityId: z.string().uuid(),
  message: z.string().optional()
})

const withdrawInterestSchema = z.object({
  interestId: z.string().uuid()
})

export function createOpportunityInterestsRoutes(container: typeof Container) {
  // Express interest in an opportunity
  router.post('/', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // DEBUG: Log request body
      serverLogger.info('opportunity-interests', `[DEBUG] Request body:`, req.body)

      // Validate request
      const validation = expressInterestSchema.safeParse(req.body)
      if (!validation.success) {
        serverLogger.error('opportunity-interests', '[DEBUG] Validation failed:', validation.error.errors)
        return res.status(400).json({
          error: 'Validation error',
          details: validation.error.errors
        })
      }

      const { opportunityId, message } = validation.data

      // Execute use case
      const expressInterestUseCase = container.getExpressInterestUseCase()
      const interest = await expressInterestUseCase.execute({
        opportunityId,
        userId,
        message
      })

      serverLogger.info('opportunity-interests', `User ${userId} expressed interest in opportunity ${opportunityId}`)

      return res.status(201).json({ interest })
    } catch (error: any) {
      serverLogger.error('opportunity-interests', 'Failed to express interest', error)

      // Handle specific errors
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('already expressed') || error.message.includes('Cannot express')) {
        return res.status(400).json({ error: error.message })
      }

      return res.status(500).json({ error: 'Failed to express interest' })
    }
  })

  // Get user's expressed interests
  router.get('/my', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const getUserInterestsUseCase = container.getGetUserInterestsUseCase()
      const interests = await getUserInterestsUseCase.execute(userId)

      return res.status(200).json({ interests })
    } catch (error: any) {
      serverLogger.error('opportunity-interests', 'Failed to fetch user interests', error)
      return res.status(500).json({ error: 'Failed to fetch interests' })
    }
  })

  // Get interests for an opportunity (opportunity creator only)
  router.get('/opportunity/:opportunityId', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id
      const opportunityId = parseInt(req.params.opportunityId)

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (isNaN(opportunityId)) {
        return res.status(400).json({ error: 'Invalid opportunity ID' })
      }

      const getOpportunityInterestsUseCase = container.getGetOpportunityInterestsUseCase()
      const interests = await getOpportunityInterestsUseCase.execute(opportunityId, userId)

      return res.status(200).json({ interests })
    } catch (error: any) {
      serverLogger.error('opportunity-interests', 'Failed to fetch opportunity interests', error)
      return res.status(500).json({ error: 'Failed to fetch interests' })
    }
  })

  // Withdraw interest
  router.delete('/:interestId', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id
      const { interestId } = req.params

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const withdrawInterestUseCase = container.getWithdrawInterestUseCase()
      await withdrawInterestUseCase.execute(interestId, userId)

      serverLogger.info('opportunity-interests', `User ${userId} withdrew interest ${interestId}`)

      return res.status(200).json({ message: 'Interest withdrawn successfully' })
    } catch (error: any) {
      serverLogger.error('opportunity-interests', 'Failed to withdraw interest', error)

      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }

      return res.status(500).json({ error: 'Failed to withdraw interest' })
    }
  })

  return router
}
