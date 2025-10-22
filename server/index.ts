// ABOUTME: Main Express server entry point with hexagonal architecture
// ABOUTME: Initializes DI container, configures middleware, and sets up API routes

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Container } from './infrastructure/di/Container'
import { createAuthRoutes } from './infrastructure/api/routes/auth.routes'
import { createUsersRoutes } from './infrastructure/api/routes/users.routes'
import { createEmailRoutes } from './infrastructure/api/routes/email.routes'
import { createConnectionsRoutes } from './infrastructure/api/routes/connections.routes'
import { createOpportunitiesRoutes } from './infrastructure/api/routes/opportunities.routes'
import { createMessagesRoutes } from './infrastructure/api/routes/messages.routes'
import { createSignupApprovalRoutes } from './infrastructure/api/routes/signup-approval.routes'
import { errorHandler } from './infrastructure/api/middleware/errorHandler'
import { loggerMiddleware } from './infrastructure/api/middleware/logger.middleware'
import { authMiddleware } from './infrastructure/api/middleware/auth.middleware'
import { serverLogger } from './logger.js'

// Load environment variables (silent to avoid EPIPE errors)
dotenv.config({ silent: true })

const app = express()
const PORT = process.env.PORT || 3001

serverLogger.info('SERVER', `Starting España Creativa Red API Server (Hexagonal Architecture) on port ${PORT}`)

// Initialize Dependency Injection Container
try {
  Container.initialize()
} catch (error) {
  serverLogger.error('SERVER', 'Failed to initialize DI container', error)
  process.exit(1)
}

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:8085',
    'http://localhost:8086',
    'http://localhost:8087',
    'http://localhost:8088',
    'http://localhost:5173'
  ],
  credentials: true
}))

// Body parsing middleware
app.use(express.json())

// Logger middleware
app.use(loggerMiddleware)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    architecture: 'hexagonal'
  })
})

// Development logs endpoint (keep for compatibility)
app.post('/api/dev/logs', (req, res) => {
  try {
    const { logs, batchTimestamp, sessionId, unload } = req.body

    if (logs && Array.isArray(logs)) {
      logs.forEach(logEntry => {
        serverLogger.clientLog({
          ...logEntry,
          batchTimestamp,
          sessionId,
          unload
        })
      })
      serverLogger.debug('LOG_ENDPOINT', `Processed ${logs.length} client logs${unload ? ' (page unload)' : ''}`, { sessionId })
    } else {
      serverLogger.clientLog(req.body)
    }

    res.json({ success: true, processed: logs?.length || 1 })
  } catch (error) {
    serverLogger.error('LOG_ENDPOINT', 'Failed to process client logs', error)
    res.status(500).json({ error: 'Failed to log messages' })
  }
})

// API Routes (Hexagonal Architecture)
app.use('/api/auth', createAuthRoutes())
app.use('/api/email', createEmailRoutes())
app.use('/api/signup-approval', createSignupApprovalRoutes())

// Protected routes (require authentication)
app.use('/api/users', authMiddleware, createUsersRoutes())
app.use('/api/connections', authMiddleware, createConnectionsRoutes())
app.use('/api/opportunities', authMiddleware, createOpportunitiesRoutes())
app.use('/api/messages', authMiddleware, createMessagesRoutes())

// Legacy email endpoints (for backward compatibility - will be deprecated)
app.post('/api/send-email', async (req, res, next) => {
  // Redirect to new email routes
  req.url = '/api/email/send'
  app._router.handle(req, res, next)
})

app.post('/api/send-welcome-email', async (req, res, next) => {
  req.url = '/api/email/welcome'
  app._router.handle(req, res, next)
})

app.post('/api/send-profile-reminder', async (req, res, next) => {
  req.url = '/api/email/profile-reminder'
  app._router.handle(req, res, next)
})

app.post('/api/send-message-notification', async (req, res, next) => {
  req.url = '/api/email/message-notification'
  app._router.handle(req, res, next)
})

app.post('/api/send-opportunity-notification', async (req, res, next) => {
  req.url = '/api/email/opportunity-notification'
  app._router.handle(req, res, next)
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
  console.log(`🏗️  Architecture: Hexagonal (Domain-Driven Design)`)
  console.log(`📧 Email service ready with Resend`)
  console.log(`✅ DI Container initialized`)
})

export default app
