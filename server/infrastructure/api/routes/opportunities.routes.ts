// ABOUTME: Opportunities HTTP routes for managing collaboration opportunities
// ABOUTME: Thin adapter layer delegating to opportunity use cases with authentication middleware

import { Router, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'
import { AuthenticatedRequest } from '../middleware/auth.middleware'

export const createOpportunitiesRoutes = (): Router => {
  const router = Router()

  // All routes require authentication (applied in server/index.ts)

  // GET /api/opportunities/allowed-cities - Get cities where user can create opportunities
  router.get('/allowed-cities', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const getAllowedCitiesForUserUseCase = Container.getGetAllowedCitiesForUserUseCase()

      const result = await getAllowedCitiesForUserUseCase.execute({ userId })

      if (result.error) {
        return res.status(400).json({ error: result.error })
      }

      return res.status(200).json({
        cities: result.cities.map(city => ({
          id: city.id,
          name: city.name,
          slug: city.slug.getValue(),
          image_url: city.imageUrl,
          description: city.description,
          active: city.active,
          display_order: city.displayOrder
        }))
      })
    } catch (error: any) {
      next(error)
    }
  })

  // GET /api/opportunities - Get all opportunities with optional filters
  router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { type, status, skills, remote, search, limit, city_id } = req.query

      // If city_id is provided, use GetOpportunitiesByCityUseCase
      if (city_id) {
        const cityId = parseInt(city_id as string, 10)
        const getOpportunitiesByCityUseCase = Container.getGetOpportunitiesByCityUseCase()

        const result = await getOpportunitiesByCityUseCase.execute({
          cityId,
          filters: {
            type: type as any,
            status: status as any,
            skills: skills ? (skills as string).split(',') : undefined,
            remote: remote === 'true' ? true : remote === 'false' ? false : undefined,
            search: search as string
          }
        })

        let opportunities = result.opportunities

        // Apply limit if provided
        const limitNum = limit ? parseInt(limit as string, 10) : undefined
        if (limitNum && limitNum > 0) {
          opportunities = opportunities.slice(0, limitNum)
        }

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
            city_id: o.opportunity.cityId,
            created_by: o.opportunity.createdBy,
            created_at: o.opportunity.createdAt.toISOString(),
            updated_at: o.opportunity.updatedAt.toISOString(),
            creator: {
              id: o.creator.id,
              name: o.creator.name,
              avatar_url: o.creator.avatar_url,
              professional_title: o.creator.professional_title
            }
          })),
          total: opportunities.length
        })
      }

      // Otherwise, get all opportunities
      const getOpportunitiesUseCase = Container.getGetOpportunitiesUseCase()

      let opportunities = await getOpportunitiesUseCase.execute({
        filters: {
          type: type as any,
          status: status as any,
          skills: skills ? (skills as string).split(',') : undefined,
          remote: remote === 'true' ? true : remote === 'false' ? false : undefined,
          search: search as string
        }
      })

      // Apply limit if provided
      const limitNum = limit ? parseInt(limit as string, 10) : undefined
      if (limitNum && limitNum > 0) {
        opportunities = opportunities.slice(0, limitNum)
      }

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
          city_id: o.opportunity.cityId,
          created_by: o.opportunity.createdBy,
          created_at: o.opportunity.createdAt.toISOString(),
          updated_at: o.opportunity.updatedAt.toISOString(),
          creator: {
            id: o.creator.id,
            name: o.creator.name,
            avatar_url: o.creator.avatar_url,
            professional_title: o.creator.professional_title
          }
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
          city_id: o.opportunity.cityId,
          created_by: o.opportunity.createdBy,
          created_at: o.opportunity.createdAt.toISOString(),
          updated_at: o.opportunity.updatedAt.toISOString(),
          creator: {
            id: o.creator.id,
            name: o.creator.name,
            avatar_url: o.creator.avatar_url,
            professional_title: o.creator.professional_title
          }
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
          city_id: result.opportunity.cityId,
          created_by: result.opportunity.createdBy,
          created_at: result.opportunity.createdAt.toISOString(),
          updated_at: result.opportunity.updatedAt.toISOString(),
          creator: {
            id: result.creator.id,
            name: result.creator.name,
            avatar_url: result.creator.avatar_url,
            professional_title: result.creator.professional_title
          }
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
        city_id,
        location,
        remote,
        duration,
        compensation
      } = req.body

      if (!title || !description || !type || !skills_required || !city_id) {
        return res.status(400).json({
          error: 'Missing required fields: title, description, type, skills_required, city_id'
        })
      }

      const createOpportunityUseCase = Container.getCreateOpportunityUseCase()

      const result = await createOpportunityUseCase.execute({
        title,
        description,
        type,
        skillsRequired: skills_required,
        cityId: parseInt(city_id),
        location,
        remote: remote || false,
        duration,
        compensation,
        createdBy: userId
      })

      if (result.error) {
        return res.status(403).json({ error: result.error })
      }

      if (!result.opportunity) {
        return res.status(500).json({ error: 'Failed to create opportunity' })
      }

      return res.status(201).json({
        opportunity: {
          id: result.opportunity.id,
          title: result.opportunity.title,
          description: result.opportunity.description,
          type: result.opportunity.type,
          status: result.opportunity.status,
          skills_required: result.opportunity.skillsRequired,
          location: result.opportunity.location || null,
          remote: result.opportunity.remote,
          duration: result.opportunity.duration || null,
          compensation: result.opportunity.compensation || null,
          city_id: result.opportunity.cityId,
          created_by: result.opportunity.createdBy,
          created_at: result.opportunity.createdAt.toISOString(),
          updated_at: result.opportunity.updatedAt.toISOString()
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

      const result = await updateOpportunityUseCase.execute({
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

      if (result.error) {
        return res.status(400).json({ error: result.error })
      }

      if (!result.opportunity) {
        return res.status(500).json({ error: 'Failed to update opportunity' })
      }

      return res.status(200).json({
        opportunity: {
          id: result.opportunity.id,
          title: result.opportunity.title,
          description: result.opportunity.description,
          type: result.opportunity.type,
          status: result.opportunity.status,
          skills_required: result.opportunity.skillsRequired,
          location: result.opportunity.location || null,
          remote: result.opportunity.remote,
          duration: result.opportunity.duration || null,
          compensation: result.opportunity.compensation || null,
          city_id: result.opportunity.cityId,
          created_by: result.opportunity.createdBy,
          created_at: result.opportunity.createdAt.toISOString(),
          updated_at: result.opportunity.updatedAt.toISOString()
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

      const result = await deleteOpportunityUseCase.execute({
        opportunityId,
        userId
      })

      if (result.error) {
        return res.status(400).json({ error: result.error })
      }

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
