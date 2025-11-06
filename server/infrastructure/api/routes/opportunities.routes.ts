// ABOUTME: Opportunities HTTP routes for managing collaboration opportunities
// ABOUTME: Thin adapter layer delegating to opportunity use cases with authentication middleware

import { Router, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'
import { AuthenticatedRequest } from '../middleware/auth.middleware'

export const createOpportunitiesRoutes = (): Router => {
  const router = Router()

  // All routes require authentication (applied in server/index.ts)

  // GET /api/opportunities - Get all opportunities with optional filters
  router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { type, status, skills, remote, search } = req.query

      const getOpportunitiesUseCase = Container.getGetOpportunitiesUseCase()

      const opportunities = await getOpportunitiesUseCase.execute({
        filters: {
          type: type as any,
          status: status as any,
          skills: skills ? (skills as string).split(',') : undefined,
          remote: remote === 'true' ? true : remote === 'false' ? false : undefined,
          search: search as string
        }
      })

      return res.status(200).json({
        opportunities: opportunities.map((o) => ({
          id: o.opportunity.id,
          title: o.opportunity.title,
          description: o.opportunity.description,
          type: o.opportunity.type,
          status: o.opportunity.status,
          skills_required: o.opportunity.skillsRequired,
          location: o.opportunity.location,
          remote: o.opportunity.remote,
          duration: o.opportunity.duration,
          compensation: o.opportunity.compensation,
          created_by: o.opportunity.createdBy,
          created_at: o.opportunity.createdAt.toISOString(),
          updated_at: o.opportunity.updatedAt.toISOString(),
          creator: o.creator
        })),
        total: opportunities.length
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/opportunities/my - Get current user's opportunities
  router.get('/my', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const getMyOpportunitiesUseCase = Container.getGetMyOpportunitiesUseCase()

      const opportunities = await getMyOpportunitiesUseCase.execute({ userId })

      return res.status(200).json({
        opportunities: opportunities.map((o) => ({
          id: o.opportunity.id,
          title: o.opportunity.title,
          description: o.opportunity.description,
          type: o.opportunity.type,
          status: o.opportunity.status,
          skills_required: o.opportunity.skillsRequired,
          location: o.opportunity.location,
          remote: o.opportunity.remote,
          duration: o.opportunity.duration,
          compensation: o.opportunity.compensation,
          created_by: o.opportunity.createdBy,
          created_at: o.opportunity.createdAt.toISOString(),
          updated_at: o.opportunity.updatedAt.toISOString(),
          creator: o.creator
        })),
        total: opportunities.length
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/opportunities/:id - Get single opportunity
  router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const opportunityId = req.params.id

      const getOpportunityUseCase = Container.getGetOpportunityUseCase()

      const result = await getOpportunityUseCase.execute({ opportunityId })

      if (!result) {
        return res.status(404).json({ error: 'Opportunity not found' })
      }

      return res.status(200).json({
        opportunity: {
          id: result.opportunity.id,
          title: result.opportunity.title,
          description: result.opportunity.description,
          type: result.opportunity.type,
          status: result.opportunity.status,
          skills_required: result.opportunity.skillsRequired,
          location: result.opportunity.location,
          remote: result.opportunity.remote,
          duration: result.opportunity.duration,
          compensation: result.opportunity.compensation,
          created_by: result.opportunity.createdBy,
          created_at: result.opportunity.createdAt.toISOString(),
          updated_at: result.opportunity.updatedAt.toISOString(),
          creator: result.creator
        }
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/opportunities - Create new opportunity
  router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const {
        title,
        description,
        type,
        skills_required,
        location,
        remote,
        duration,
        compensation
      } = req.body

      if (!title || !description || !type || !skills_required) {
        return res.status(400).json({
          error: 'Missing required fields: title, description, type, skills_required'
        })
      }

      const createOpportunityUseCase = Container.getCreateOpportunityUseCase()

      const opportunity = await createOpportunityUseCase.execute({
        title,
        description,
        type,
        skillsRequired: skills_required,
        location,
        remote: remote || false,
        duration,
        compensation,
        createdBy: userId
      })

      return res.status(201).json({
        opportunity: {
          id: opportunity.id,
          title: opportunity.title,
          description: opportunity.description,
          type: opportunity.type,
          status: opportunity.status,
          skills_required: opportunity.skillsRequired,
          location: opportunity.location || null,
          remote: opportunity.remote,
          duration: opportunity.duration || null,
          compensation: opportunity.compensation || null,
          created_by: opportunity.createdBy,
          created_at: opportunity.createdAt.toISOString(),
          updated_at: opportunity.updatedAt.toISOString()
        }
      })
    } catch (error: any) {
      if (error.message.includes('must be at least')) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  })

  // PUT /api/opportunities/:id - Update opportunity
  router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      const opportunityId = req.params.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const {
        title,
        description,
        type,
        status,
        skills_required,
        location,
        remote,
        duration,
        compensation
      } = req.body

      const updateOpportunityUseCase = Container.getUpdateOpportunityUseCase()

      const opportunity = await updateOpportunityUseCase.execute({
        opportunityId,
        userId,
        updates: {
          title,
          description,
          type,
          status,
          skillsRequired: skills_required,
          location,
          remote,
          duration,
          compensation
        }
      })

      return res.status(200).json({
        opportunity: {
          id: opportunity.id,
          title: opportunity.title,
          description: opportunity.description,
          type: opportunity.type,
          status: opportunity.status,
          skills_required: opportunity.skillsRequired,
          location: opportunity.location || null,
          remote: opportunity.remote,
          duration: opportunity.duration || null,
          compensation: opportunity.compensation || null,
          created_by: opportunity.createdBy,
          created_at: opportunity.createdAt.toISOString(),
          updated_at: opportunity.updatedAt.toISOString()
        }
      })
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      if (error.message.includes('must be at least')) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  })

  // DELETE /api/opportunities/:id - Delete opportunity
  router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      const opportunityId = req.params.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const deleteOpportunityUseCase = Container.getDeleteOpportunityUseCase()

      await deleteOpportunityUseCase.execute({
        opportunityId,
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
