// ABOUTME: Projects HTTP routes for managing educational projects
// ABOUTME: Thin adapter layer delegating to project use cases with authentication middleware

import { Router, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware'

export const createProgramsRoutes = (): Router => {
  const router = Router()

  // GET /api/projects - Get all projects with optional filters
  router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { type, status, skills, featured, search } = req.query

      const getProgramsUseCase = Container.getGetProgramsUseCase()

      const result = await getProgramsUseCase.execute({
        type: type as any,
        status: status as any,
        skills: skills ? (skills as string).split(',') : undefined,
        featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        search: search as string
      })

      return res.status(200).json({
        projects: result.programs.map((p) => ({
          id: p.program.id,
          title: p.program.title,
          description: p.program.description,
          type: p.program.type,
          start_date: p.program.startDate.toISOString(),
          end_date: p.program.endDate.toISOString(),
          duration: p.program.duration,
          location: p.program.location,
          participants: p.program.participants,
          max_participants: p.program.maxParticipants,
          instructor: p.program.instructor,
          status: p.program.status,
          featured: p.program.featured,
          skills: p.program.skills,
          price: p.program.price,
          image_url: p.program.imageUrl,
          more_info_url: p.program.moreInfoUrl,
          created_by: p.program.createdBy,
          created_at: p.program.createdAt.toISOString(),
          updated_at: p.program.updatedAt.toISOString(),
          creator: p.creator
        })),
        total: result.total
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/projects/my/enrollments - Get user's enrollments (requires authentication)
  router.get('/my/enrollments', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const getUserEnrollmentsUseCase = Container.getGetUserEnrollmentsUseCase()
      const enrollments = await getUserEnrollmentsUseCase.execute(userId)

      // Disable HTTP caching for enrollment data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')

      return res.status(200).json({
        enrollments: enrollments.map((e) => ({
          id: e.enrollment.id,
          project_id: e.enrollment.programId,
          user_id: e.enrollment.userId,
          status: e.enrollment.status,
          enrolled_at: e.enrollment.enrolledAt.toISOString(),
          completed_at: e.enrollment.completedAt?.toISOString(),
          rating: e.enrollment.rating,
          feedback: e.enrollment.feedback,
          created_at: e.enrollment.createdAt.toISOString(),
          updated_at: e.enrollment.updatedAt.toISOString(),
          project: {
            id: e.program.id,
            title: e.program.title,
            description: e.program.description,
            type: e.program.type,
            start_date: e.program.startDate.toISOString(),
            end_date: e.program.endDate.toISOString(),
            duration: e.program.duration,
            location: e.program.location,
            participants: e.program.participants,
            max_participants: e.program.maxParticipants,
            instructor: e.program.instructor,
            status: e.program.status,
            featured: e.program.featured,
            skills: e.program.skills,
            price: e.program.price,
            image_url: e.program.imageUrl,
            more_info_url: e.program.moreInfoUrl,
            created_by: e.program.createdBy,
            created_at: e.program.createdAt.toISOString(),
            updated_at: e.program.updatedAt.toISOString()
          }
        }))
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/programs/:id - Get single program
  router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const programId = req.params.id

      const getProgramUseCase = Container.getGetProgramUseCase()
      const result = await getProgramUseCase.execute(programId)

      if (!result) {
        return res.status(404).json({ error: 'Program not found' })
      }

      return res.status(200).json({
        project: {
          id: result.program.id,
          title: result.program.title,
          description: result.program.description,
          type: result.program.type,
          start_date: result.program.startDate.toISOString(),
          end_date: result.program.endDate.toISOString(),
          duration: result.program.duration,
          location: result.program.location,
          participants: result.program.participants,
          max_participants: result.program.maxParticipants,
          instructor: result.program.instructor,
          status: result.program.status,
          featured: result.program.featured,
          skills: result.program.skills,
          price: result.program.price,
          image_url: result.program.imageUrl,
          more_info_url: result.program.moreInfoUrl,
          created_by: result.program.createdBy,
          created_at: result.program.createdAt.toISOString(),
          updated_at: result.program.updatedAt.toISOString(),
          creator: result.creator
        }
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/programs - Create new program (requires authentication)
  router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const createProgramUseCase = Container.getCreateProgramUseCase()

      const program = await createProgramUseCase.execute({
        ...req.body,
        startDate: new Date(req.body.start_date),
        endDate: new Date(req.body.end_date),
        moreInfoUrl: req.body.more_info_url,
        createdBy: userId
      })

      return res.status(201).json({
        project: {
          id: program.id,
          title: program.title,
          description: program.description,
          type: program.type,
          start_date: program.startDate.toISOString(),
          end_date: program.endDate.toISOString(),
          duration: program.duration,
          location: program.location,
          participants: program.participants,
          max_participants: program.maxParticipants,
          instructor: program.instructor,
          status: program.status,
          featured: program.featured,
          skills: program.skills,
          price: program.price,
          image_url: program.imageUrl,
          more_info_url: program.moreInfoUrl,
          created_by: program.createdBy,
          created_at: program.createdAt.toISOString(),
          updated_at: program.updatedAt.toISOString()
        }
      })
    } catch (error) {
      next(error)
    }
  })

  // PUT /api/programs/:id - Update program (requires authentication)
  router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const programId = req.params.id
      const updateProgramUseCase = Container.getUpdateProgramUseCase()

      const updateData: any = {
        id: programId,
        userId,
        ...req.body
      }

      if (req.body.start_date) {
        updateData.startDate = new Date(req.body.start_date)
      }
      if (req.body.end_date) {
        updateData.endDate = new Date(req.body.end_date)
      }
      if (req.body.more_info_url !== undefined) {
        updateData.moreInfoUrl = req.body.more_info_url
      }

      const program = await updateProgramUseCase.execute(updateData)

      return res.status(200).json({
        project: {
          id: program.id,
          title: program.title,
          description: program.description,
          type: program.type,
          start_date: program.startDate.toISOString(),
          end_date: program.endDate.toISOString(),
          duration: program.duration,
          location: program.location,
          participants: program.participants,
          max_participants: program.maxParticipants,
          instructor: program.instructor,
          status: program.status,
          featured: program.featured,
          skills: program.skills,
          price: program.price,
          image_url: program.imageUrl,
          more_info_url: program.moreInfoUrl,
          created_by: program.createdBy,
          created_at: program.createdAt.toISOString(),
          updated_at: program.updatedAt.toISOString()
        }
      })
    } catch (error) {
      next(error)
    }
  })

  // DELETE /api/programs/:id - Delete program (requires authentication)
  router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const programId = req.params.id
      const deleteProgramUseCase = Container.getDeleteProgramUseCase()

      await deleteProgramUseCase.execute({ id: programId, userId })

      return res.status(204).send()
    } catch (error) {
      next(error)
    }
  })

  // POST /api/programs/:id/enroll - Enroll in program (requires authentication)
  router.post('/:id/enroll', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      console.log('[ENROLL] Starting enrollment process...')
      const userId = req.user?.id
      const token = req.token

      if (!userId || !token) {
        console.log('[ENROLL] ERROR: No userId or token found')
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const programId = req.params.id
      console.log('[ENROLL] userId:', userId, 'programId:', programId)

      // Import dependencies
      const { createClient } = await import('@supabase/supabase-js')
      const { SupabaseProgramRepository } = await import('../../adapters/repositories/SupabaseProgramRepository')
      const { SupabaseProgramEnrollmentRepository } = await import('../../adapters/repositories/SupabaseProgramEnrollmentRepository')
      const { EnrollInProgramUseCase } = await import('../../../application/use-cases/program-enrollments/EnrollInProgramUseCase')

      // Create user-authenticated Supabase client
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY

      if (!supabaseUrl || !anonKey) {
        console.error('[ENROLL] Missing Supabase configuration')
        return res.status(500).json({ error: 'Server configuration error' })
      }

      const userClient = createClient(supabaseUrl, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })

      // Create repositories with user-authenticated client
      const programRepository = new SupabaseProgramRepository(userClient)
      const enrollmentRepository = new SupabaseProgramEnrollmentRepository(userClient)
      const enrollInProgramUseCase = new EnrollInProgramUseCase(programRepository, enrollmentRepository)

      console.log('[ENROLL] Use case created with user client')

      console.log('[ENROLL] Executing enrollment...')
      const enrollment = await enrollInProgramUseCase.execute({
        programId,
        userId
      })
      console.log('[ENROLL] Enrollment successful:', enrollment.id)

      return res.status(201).json({
        enrollment: {
          id: enrollment.id,
          project_id: enrollment.programId,
          user_id: enrollment.userId,
          status: enrollment.status,
          enrolled_at: enrollment.enrolledAt.toISOString(),
          created_at: enrollment.createdAt.toISOString(),
          updated_at: enrollment.updatedAt.toISOString()
        }
      })
    } catch (error) {
      console.log('[ENROLL] ERROR:', error)
      console.log('[ENROLL] Error stack:', error instanceof Error ? error.stack : 'No stack')
      next(error)
    }
  })

  // DELETE /api/programs/enrollments/:id - Cancel enrollment (requires authentication)
  router.delete('/enrollments/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      console.log('[CANCEL] Starting cancellation process...')
      const userId = req.user?.id
      if (!userId) {
        console.log('[CANCEL] ERROR: No userId found')
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const enrollmentId = req.params.id
      console.log('[CANCEL] userId:', userId, 'enrollmentId:', enrollmentId)

      const cancelEnrollmentUseCase = Container.getCancelEnrollmentUseCase()
      console.log('[CANCEL] Use case obtained:', !!cancelEnrollmentUseCase)

      console.log('[CANCEL] Executing cancellation...')
      await cancelEnrollmentUseCase.execute({
        enrollmentId,
        userId
      })
      console.log('[CANCEL] Cancellation successful')

      return res.status(204).send()
    } catch (error) {
      console.log('[CANCEL] ERROR:', error)
      console.log('[CANCEL] Error stack:', error instanceof Error ? error.stack : 'No stack')
      next(error)
    }
  })

  return router
}
