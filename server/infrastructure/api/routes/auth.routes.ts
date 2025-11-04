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
          role_ids: userPrimitives.roleIds,
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
        // Translate common error messages to Spanish
        let errorMessage = result.error
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos'
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Email no confirmado'
        } else if (errorMessage.includes('User not found')) {
          errorMessage = 'Usuario no encontrado'
        }

        return res.status(401).json({
          error: errorMessage
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
          role_ids: userPrimitives.roleIds,
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
          role_ids: userPrimitives.roleIds,
          completed_pct: result.completionPercentage,
          created_at: userPrimitives.createdAt,
          updated_at: userPrimitives.updatedAt
        }
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/auth/validate-activation/:token - Validate activation token
  router.get('/validate-activation/:token', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params

      // Import needed here to avoid circular dependency
      const { ApprovalToken } = await import('../../../domain/value-objects/ApprovalToken')
      const approvalToken = ApprovalToken.create(token)

      if (!approvalToken) {
        return res.status(400).json({
          success: false,
          error: 'Token de activación inválido'
        })
      }

      // Get pending signup repository
      const { SupabasePendingSignupRepository } = await import('../../adapters/repositories/SupabasePendingSignupRepository')
      const { createClient } = await import('@supabase/supabase-js')

      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const repository = new SupabasePendingSignupRepository(supabase)

      const pendingSignup = await repository.findByToken(approvalToken)

      if (!pendingSignup) {
        return res.status(404).json({
          success: false,
          error: 'Solicitud de registro no encontrada'
        })
      }

      // Check if already used
      if (pendingSignup.getTokenUsedAt()) {
        return res.status(400).json({
          success: false,
          error: 'Este enlace ya ha sido utilizado'
        })
      }

      // Check if token expired (7 days)
      if (pendingSignup.isTokenExpired(168)) {
        return res.status(400).json({
          success: false,
          error: 'El enlace de activación ha expirado'
        })
      }

      // Check if status is approved
      if (!pendingSignup.getStatus().isApproved()) {
        return res.status(400).json({
          success: false,
          error: 'La solicitud aún no ha sido aprobada'
        })
      }

      return res.status(200).json({
        success: true,
        data: {
          email: pendingSignup.getEmail().getValue(),
          name: pendingSignup.getName(),
          surname: pendingSignup.getSurname()
        }
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/auth/forgot-password - Request password reset email
  router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          error: 'Email es requerido'
        })
      }

      const authService = Container.getAuthService()
      const result = await authService.sendPasswordResetEmail(email)

      if (result.error) {
        return res.status(400).json({
          error: result.error.message
        })
      }

      return res.status(200).json({
        message: 'Email de recuperación enviado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/auth/reset-password - Reset password with token
  router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { password } = req.body

      if (!password) {
        return res.status(400).json({
          error: 'Contraseña es requerida'
        })
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: 'La nueva contraseña debe tener al menos 8 caracteres'
        })
      }

      const authService = Container.getAuthService()
      const result = await authService.resetPassword(password)

      if (result.error) {
        return res.status(400).json({
          error: result.error.message
        })
      }

      return res.status(200).json({
        message: 'Contraseña restablecida exitosamente'
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/auth/change-password - Change user password
  router.post('/change-password', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Contraseña actual y nueva contraseña son requeridas'
        })
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'La nueva contraseña debe tener al menos 8 caracteres'
        })
      }

      const authService = Container.getAuthService()
      const result = await authService.changePassword(currentPassword, newPassword)

      if (result.error) {
        return res.status(400).json({
          error: result.error.message
        })
      }

      return res.status(200).json({
        message: 'Contraseña cambiada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/auth/activate - Activate account with password
  router.post('/activate', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          error: 'Token y contraseña son requeridos'
        })
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'La contraseña debe tener al menos 8 caracteres'
        })
      }

      // Validate token and get pending signup
      const { ApprovalToken } = await import('../../../domain/value-objects/ApprovalToken')
      const approvalToken = ApprovalToken.create(token)

      if (!approvalToken) {
        return res.status(400).json({
          success: false,
          error: 'Token de activación inválido'
        })
      }

      const { SupabasePendingSignupRepository } = await import('../../adapters/repositories/SupabasePendingSignupRepository')
      const { createClient } = await import('@supabase/supabase-js')

      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const repository = new SupabasePendingSignupRepository(supabase)

      const pendingSignup = await repository.findByToken(approvalToken)

      if (!pendingSignup) {
        return res.status(404).json({
          success: false,
          error: 'Solicitud de registro no encontrada'
        })
      }

      // Validate status and token
      if (pendingSignup.getTokenUsedAt()) {
        return res.status(400).json({
          success: false,
          error: 'Este enlace ya ha sido utilizado'
        })
      }

      if (pendingSignup.isTokenExpired(168)) {
        return res.status(400).json({
          success: false,
          error: 'El enlace de activación ha expirado'
        })
      }

      if (!pendingSignup.getStatus().isApproved()) {
        return res.status(400).json({
          success: false,
          error: 'La solicitud aún no ha sido aprobada'
        })
      }

      // Create user account with signup use case
      const signUpUseCase = Container.getSignUpUseCase()
      const result = await signUpUseCase.execute({
        email: pendingSignup.getEmail().getValue(),
        password,
        name: pendingSignup.getName() + (pendingSignup.getSurname() ? ' ' + pendingSignup.getSurname() : '')
      })

      if (result.error) {
        return res.status(400).json({
          success: false,
          error: result.error
        })
      }

      // Mark token as used
      const primitives = pendingSignup.toPrimitives()
      primitives.tokenUsedAt = new Date()

      const { PendingSignup } = await import('../../../domain/entities/PendingSignup')
      const { Email } = await import('../../../domain/value-objects/Email')
      const { SignupStatus } = await import('../../../domain/value-objects/SignupStatus')
      const { PendingSignupId } = await import('../../../domain/value-objects/PendingSignupId')
      const { UserId } = await import('../../../domain/value-objects/UserId')

      const updatedSignup = PendingSignup.create({
        id: PendingSignupId.create(primitives.id)!,
        email: Email.create(primitives.email)!,
        name: primitives.name,
        surname: primitives.surname || undefined,
        approvalToken,
        status: SignupStatus.create(primitives.status)!,
        createdAt: new Date(primitives.createdAt),
        approvedAt: primitives.approvedAt ? new Date(primitives.approvedAt) : null,
        approvedBy: primitives.approvedBy ? UserId.create(primitives.approvedBy)! : null,
        rejectedAt: primitives.rejectedAt ? new Date(primitives.rejectedAt) : null,
        rejectedBy: primitives.rejectedBy ? UserId.create(primitives.rejectedBy)! : null,
        ipAddress: primitives.ipAddress || undefined,
        userAgent: primitives.userAgent || undefined,
        tokenUsedAt: new Date()
      })

      await repository.update(updatedSignup)

      const userPrimitives = result.user!.toPrimitives()

      return res.status(201).json({
        success: true,
        user: {
          id: userPrimitives.id,
          email: userPrimitives.email,
          name: userPrimitives.name
        }
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
