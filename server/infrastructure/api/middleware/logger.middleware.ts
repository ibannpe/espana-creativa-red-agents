// ABOUTME: HTTP request logging middleware
// ABOUTME: Logs all incoming requests with method, path, and response time

import { Request, Response, NextFunction } from 'express'
import { serverLogger } from '../../../logger.js'

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start

    // Don't log 401 errors on auth endpoints (expected behavior for unauthenticated requests)
    // Use originalUrl to get the full path including router prefixes
    const fullPath = req.originalUrl || req.path
    const isAuthEndpoint = fullPath.startsWith('/api/auth') || req.baseUrl?.startsWith('/api/auth')
    const is401 = res.statusCode === 401

    if (isAuthEndpoint && is401) {
      // Silent - expected behavior for unauthenticated requests to auth endpoints
      return
    }

    // Log errors (4xx, 5xx) as warnings, success as info
    const level = res.statusCode >= 400 ? 'warn' : 'info'

    serverLogger[level]('HTTP_REQUEST', `${req.method} ${fullPath}`, {
      method: req.method,
      path: fullPath,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    })
  })

  next()
}
