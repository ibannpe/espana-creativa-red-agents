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

  // ===== CONFIGURATION ENDPOINTS =====

  // GET /api/admin/config/roles - List all roles
  router.get('/config/roles', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: roles, error } = await supabase
        .from('roles')
        .select('id, name, description, created_at')
        .order('name')

      if (error) throw error

      return res.status(200).json({ roles: roles || [] })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/admin/config/roles - Create new role
  router.post('/config/roles', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body

      if (!name) {
        return res.status(400).json({ error: 'Name is required' })
      }

      const { data: role, error } = await supabase
        .from('roles')
        .insert({ name, description })
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({ role })
    } catch (error) {
      next(error)
    }
  })

  // PUT /api/admin/config/roles/:id - Update role
  router.put('/config/roles/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { name, description } = req.body

      const { data: role, error } = await supabase
        .from('roles')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json({ role })
    } catch (error) {
      next(error)
    }
  })

  // DELETE /api/admin/config/roles/:id - Delete role
  router.delete('/config/roles/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params

      // Check if role is in use
      const { data: usersWithRole, error: checkError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_id', id)

      if (checkError) throw checkError

      if (usersWithRole && usersWithRole.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete role that is assigned to users',
          usersCount: usersWithRole.length
        })
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.status(204).send()
    } catch (error) {
      next(error)
    }
  })

  // POST /api/admin/config/users/:userId/roles/:roleId - Assign role to user
  router.post('/config/users/:userId/roles/:roleId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, roleId } = req.params

      // Check if assignment already exists
      const { data: existing, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .single()

      if (existing) {
        return res.status(400).json({ error: 'User already has this role' })
      }

      const { data: userRole, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId })
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({ userRole })
    } catch (error) {
      next(error)
    }
  })

  // DELETE /api/admin/config/users/:userId/roles/:roleId - Remove role from user
  router.delete('/config/users/:userId/roles/:roleId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, roleId } = req.params

      // Check if user is the last admin
      const { data: role } = await supabase
        .from('roles')
        .select('name')
        .eq('id', roleId)
        .single()

      if (role?.name === 'admin') {
        const { count: adminCount, error: countError } = await supabase
          .from('user_roles')
          .select('user_id', { count: 'exact', head: true })
          .eq('role_id', roleId)

        if (countError) throw countError

        if (adminCount && adminCount <= 1) {
          return res.status(400).json({
            error: 'Cannot remove last admin user'
          })
        }
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId)

      if (error) throw error

      return res.status(204).send()
    } catch (error) {
      next(error)
    }
  })

  // GET /api/admin/config/settings - Get all system settings
  router.get('/config/settings', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('key, value, description, data_type, updated_at')
        .order('key')

      if (error) throw error

      return res.status(200).json({ settings })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/admin/config/settings/:key - Get specific setting
  router.get('/config/settings/:key', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params

      const { data: setting, error } = await supabase
        .from('system_settings')
        .select('key, value, description, data_type, updated_at')
        .eq('key', key)
        .single()

      if (error) throw error

      return res.status(200).json({ setting })
    } catch (error) {
      next(error)
    }
  })

  // PUT /api/admin/config/settings/:key - Update setting
  router.put('/config/settings/:key', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params
      const { value } = req.body

      // Get the auth user from the request (middleware should add it)
      const authHeader = req.headers.authorization
      let updatedBy: string | null = null

      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        if (user) {
          updatedBy = user.id
        }
      }

      const updateData: any = { value }
      if (updatedBy) {
        updateData.updated_by = updatedBy
      }

      const { data: setting, error } = await supabase
        .from('system_settings')
        .update(updateData)
        .eq('key', key)
        .select()
        .single()

      if (error) throw error

      return res.status(200).json({ setting })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/admin/config/settings - Create new setting
  router.post('/config/settings', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key, value, description, data_type } = req.body

      if (!key || !value || !data_type) {
        return res.status(400).json({
          error: 'key, value, and data_type are required'
        })
      }

      // Validate data_type
      const validTypes = ['boolean', 'number', 'string', 'text', 'json']
      if (!validTypes.includes(data_type)) {
        return res.status(400).json({
          error: `data_type must be one of: ${validTypes.join(', ')}`
        })
      }

      // Get the auth user from the request
      const authHeader = req.headers.authorization
      let updatedBy: string | null = null

      if (authHeader) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        if (user) {
          updatedBy = user.id
        }
      }

      const insertData: any = { key, value, description, data_type }
      if (updatedBy) {
        insertData.updated_by = updatedBy
      }

      const { data: setting, error } = await supabase
        .from('system_settings')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({ setting })
    } catch (error) {
      next(error)
    }
  })

  return router
}
