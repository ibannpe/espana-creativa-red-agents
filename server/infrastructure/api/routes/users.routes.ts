// ABOUTME: User management HTTP routes for profile operations and search
// ABOUTME: Delegates to user use cases with proper request validation and error handling

import { Router, Request, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'

export const createUsersRoutes = (): Router => {
  const router = Router()

  // GET /api/users/recent - Get recently registered users
  // IMPORTANT: This route MUST be defined BEFORE /:id to avoid /recent being treated as an ID
  router.get('/recent', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate query parameters
      const daysParam = req.query.days as string | undefined
      const limitParam = req.query.limit as string | undefined

      const days = daysParam ? parseInt(daysParam, 10) : undefined
      const limit = limitParam ? parseInt(limitParam, 10) : undefined

      const getRecentUsersUseCase = Container.getGetRecentUsersUseCase()
      const result = await getRecentUsersUseCase.execute({
        days,
        limit
      })

      if (result.error) {
        return res.status(500).json({
          error: result.error
        })
      }

      const users = result.users.map(user => {
        const primitives = user.toPrimitives()
        return {
          id: primitives.id,
          email: primitives.email,
          name: primitives.name,
          avatar_url: primitives.avatarUrl,
          bio: primitives.bio,
          location: primitives.location,
          linkedin_url: primitives.linkedinUrl,
          website_url: primitives.websiteUrl,
          skills: primitives.skills,
          interests: primitives.interests,
          role_ids: primitives.roleIds,
          completed_pct: user.calculateCompletionPercentage().getValue(),
          created_at: primitives.createdAt,
          updated_at: primitives.updatedAt
        }
      })

      return res.status(200).json({
        users,
        count: result.count,
        days_filter: result.daysFilter
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/users/:id - Get user profile by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      const getUserProfileUseCase = Container.getGetUserProfileUseCase()
      const result = await getUserProfileUseCase.execute({ userId: id })

      if (result.error) {
        return res.status(404).json({
          error: result.error
        })
      }

      const userPrimitives = result.user!.toPrimitives()

      return res.status(200).json({
        user: {
          id: userPrimitives.id,
          email: userPrimitives.email,
          name: userPrimitives.name,
          avatar_url: userPrimitives.avatarUrl,
          bio: userPrimitives.bio,
          location: userPrimitives.location,
          linkedin_url: userPrimitives.linkedinUrl,
          website_url: userPrimitives.websiteUrl,
          skills: userPrimitives.skills,
          interests: userPrimitives.interests,
          completed_pct: result.completionPercentage,
          created_at: userPrimitives.createdAt,
          updated_at: userPrimitives.updatedAt
        }
      })
    } catch (error) {
      next(error)
    }
  })

  // PUT /api/users/:id - Update user profile
  router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const {
        name,
        avatar_url,
        bio,
        location,
        linkedin_url,
        website_url,
        skills,
        interests
      } = req.body

      const updateUserProfileUseCase = Container.getUpdateUserProfileUseCase()
      const result = await updateUserProfileUseCase.execute({
        userId: id,
        name,
        avatarUrl: avatar_url,
        bio,
        location,
        linkedinUrl: linkedin_url,
        websiteUrl: website_url,
        skills,
        interests
      })

      if (result.error) {
        return res.status(400).json({
          error: result.error
        })
      }

      const userPrimitives = result.user!.toPrimitives()

      return res.status(200).json({
        user: {
          id: userPrimitives.id,
          email: userPrimitives.email,
          name: userPrimitives.name,
          avatar_url: userPrimitives.avatarUrl,
          bio: userPrimitives.bio,
          location: userPrimitives.location,
          linkedin_url: userPrimitives.linkedinUrl,
          website_url: userPrimitives.websiteUrl,
          skills: userPrimitives.skills,
          interests: userPrimitives.interests,
          completed_pct: result.user!.calculateCompletionPercentage().getValue(),
          created_at: userPrimitives.createdAt,
          updated_at: userPrimitives.updatedAt
        }
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/users/search - Search users with filters
  router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req.query.q as string) || ''
      const role = req.query.role as string | undefined
      const location = req.query.location as string | undefined
      const skillsParam = req.query.skills as string | undefined

      const skills = skillsParam ? skillsParam.split(',') : undefined

      const searchUsersUseCase = Container.getSearchUsersUseCase()
      const result = await searchUsersUseCase.execute({
        query,
        filters: {
          role,
          location,
          skills
        }
      })

      if (result.error) {
        return res.status(500).json({
          error: result.error
        })
      }

      const users = result.users.map(user => {
        const primitives = user.toPrimitives()
        return {
          id: primitives.id,
          email: primitives.email,
          name: primitives.name,
          avatar_url: primitives.avatarUrl,
          bio: primitives.bio,
          location: primitives.location,
          linkedin_url: primitives.linkedinUrl,
          website_url: primitives.websiteUrl,
          skills: primitives.skills,
          interests: primitives.interests,
          completed_pct: user.calculateCompletionPercentage().getValue(),
          created_at: primitives.createdAt,
          updated_at: primitives.updatedAt
        }
      })

      return res.status(200).json({
        users,
        count: result.count
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/users - Get all users
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRepository = Container.getUserRepository()
      const users = await userRepository.findAll()

      const usersResponse = users.map(user => {
        const primitives = user.toPrimitives()
        return {
          id: primitives.id,
          email: primitives.email,
          name: primitives.name,
          avatar_url: primitives.avatarUrl,
          bio: primitives.bio,
          location: primitives.location,
          linkedin_url: primitives.linkedinUrl,
          website_url: primitives.websiteUrl,
          skills: primitives.skills,
          interests: primitives.interests,
          completed_pct: user.calculateCompletionPercentage().getValue(),
          created_at: primitives.createdAt,
          updated_at: primitives.updatedAt
        }
      })

      return res.status(200).json({
        users: usersResponse,
        count: usersResponse.length
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
