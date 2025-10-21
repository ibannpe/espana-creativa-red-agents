// ABOUTME: HTTP request logging middleware
// ABOUTME: Logs all incoming requests with method, path, and response time

import { Request, Response, NextFunction } from 'express'
import { serverLogger } from '../../../logger.js'

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start
    serverLogger.info('HTTP_REQUEST', `${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    })
  })

  next()
}
