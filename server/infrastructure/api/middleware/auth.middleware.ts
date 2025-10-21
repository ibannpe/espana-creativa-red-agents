// ABOUTME: Authentication middleware for JWT token verification with Supabase
// ABOUTME: Validates bearer tokens and injects authenticated user into request with type safety

import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

// Extend Express Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
  }
}

/**
 * Middleware to verify JWT tokens and inject authenticated user
 *
 * Usage:
 *   router.get('/protected', authMiddleware, (req: Request, res: Response) => {
 *     const userId = (req as AuthenticatedRequest).user.id
 *   })
 *
 * Token format:
 *   Authorization: Bearer <supabase-jwt-token>
 *
 * Responses:
 *   - 401 if no token provided
 *   - 401 if token is invalid
 *   - 401 if user not found
 *   - Calls next() if valid
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' })
      return
    }

    const token = authHeader.replace('Bearer ', '')

    if (!token || token === authHeader) {
      res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' })
      return
    }

    // Create Supabase client with service role key
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      res.status(500).json({ error: 'Server configuration error' })
      return
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error) {
      console.error('Token verification error:', error.message)
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    // Inject user into request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email || ''
    }

    // Continue to next middleware/handler
    next()
  } catch (error) {
    console.error('Authentication middleware error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

/**
 * Optional middleware to verify user is authenticated but don't fail if not
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      next()
      return
    }

    const token = authHeader.replace('Bearer ', '')

    if (!token || token === authHeader) {
      next()
      return
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        (req as AuthenticatedRequest).user = {
          id: user.id,
          email: user.email || ''
        }
      }
    }

    next()
  } catch (error) {
    // Silently fail for optional auth
    next()
  }
}
