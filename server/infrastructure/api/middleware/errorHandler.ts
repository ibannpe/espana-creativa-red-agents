// ABOUTME: Global error handling middleware for Express application
// ABOUTME: Catches and formats errors with appropriate HTTP status codes and logging

import { Request, Response, NextFunction } from 'express'
import { serverLogger } from '../../../logger.js'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  // Log error
  serverLogger.error('ERROR_HANDLER', message, {
    path: req.path,
    method: req.method,
    statusCode,
    stack: err.stack
  })

  // Don't leak error details in production
  const response = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  }

  res.status(statusCode).json(response)
}

// Helper to create operational errors
export class OperationalError extends Error implements AppError {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    Object.setPrototypeOf(this, OperationalError.prototype)
  }
}
