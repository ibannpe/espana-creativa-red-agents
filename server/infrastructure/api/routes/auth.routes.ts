// ABOUTME: Authentication HTTP routes for sign up, sign in, and sign out operations
// ABOUTME: Thin adapter layer delegating to authentication use cases with proper error handling

import { Router, Request, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'

export const createAuthRoutes = (): Router => {
  const router = Router()

  // POST /api/auth/signup - Register new user
  router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body

      if (!email || !password || !name) {
        return res.status(400).json({
          error: 'Missing required fields: email, password, name'
        })
      }

      const signUpUseCase = Container.getSignUpUseCase()
      const result = await signUpUseCase.execute({ email, password, name })

      if (result.error) {
        return res.status(400).json({
          error: result.error
        })
      }

      const userPrimitives = result.user!.toPrimitives()

      return res.status(201).json({
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

  // POST /api/auth/signin - Authenticate user
  router.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({
          error: 'Missing required fields: email, password'
        })
      }

      const signInUseCase = Container.getSignInUseCase()
      const result = await signInUseCase.execute({ email, password })

      if (result.error) {
        return res.status(401).json({
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
        },
        session: result.session
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/auth/signout - Sign out user
  router.post('/signout', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authService = Container.getAuthService()
      const result = await authService.signOut()

      if (result.error) {
        return res.status(500).json({
          error: result.error.message
        })
      }

      return res.status(200).json({
        message: 'Signed out successfully'
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/auth/me - Get current user
  router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authService = Container.getAuthService()
      const authUser = await authService.getCurrentUser()

      if (!authUser) {
        return res.status(401).json({
          error: 'Not authenticated'
        })
      }

      const getUserProfileUseCase = Container.getGetUserProfileUseCase()
      const result = await getUserProfileUseCase.execute({ userId: authUser.id })

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

  return router
}
