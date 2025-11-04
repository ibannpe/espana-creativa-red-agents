// ABOUTME: Admin-specific HTTP routes for user management and system statistics
// ABOUTME: Delegates to admin use cases with proper authentication and authorization

import { Router, Request, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const createAdminRoutes = (): Router => {
  const router = Router()

  // GET /api/admin/users - Get all users with their roles (admin only)
  router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRepository = Container.getUserRepository()

      // Get all users
      const users = await userRepository.findAll()

      // For each user, get their roles
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const primitives = user.toPrimitives()

          // Query to get role names for this user
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role_id, roles(name)')
            .eq('user_id', primitives.id)

          let roles: string[] = []
          if (!roleError && roleData) {
            roles = roleData.map((ur: any) => ur.roles?.name).filter(Boolean)
          }

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
            roles,
            completed_pct: user.calculateCompletionPercentage().getValue(),
            created_at: primitives.createdAt,
            updated_at: primitives.updatedAt
          }
        })
      )

      return res.status(200).json({
        users: usersWithRoles,
        count: usersWithRoles.length
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/admin/statistics - Get platform statistics (admin only)
  router.get('/statistics', async (req: Request, res: Response, next: NextFunction) => {
    try {

      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (usersError) throw usersError

      // Get users by role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role_id, roles(name)')

      if (roleError) throw roleError

      const usersByRole: Record<string, number> = {}
      roleData?.forEach((item: any) => {
        const roleName = item.roles?.name
        if (roleName) {
          usersByRole[roleName] = (usersByRole[roleName] || 0) + 1
        }
      })

      // Get total opportunities
      const { count: totalOpportunities, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })

      if (opportunitiesError) throw opportunitiesError

      // Get active connections
      const { count: activeConnections, error: connectionsError } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')

      if (connectionsError) throw connectionsError

      // Get pending signups
      const { count: pendingSignups, error: signupsError } = await supabase
        .from('pending_signups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (signupsError) throw signupsError

      return res.status(200).json({
        statistics: {
          totalUsers: totalUsers || 0,
          usersByRole,
          totalOpportunities: totalOpportunities || 0,
          activeConnections: activeConnections || 0,
          pendingSignups: pendingSignups || 0
        }
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
