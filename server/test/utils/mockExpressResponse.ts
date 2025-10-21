// ABOUTME: Mock Express Response object for API route testing
// ABOUTME: Provides chainable response methods with call tracking for assertions

import { Response } from 'express'
import { vi } from 'vitest'

/**
 * Creates a mock Express Response object for testing route handlers
 * Supports method chaining and tracks all calls for verification
 */
export function createMockResponse(): Response {
  const res: any = {
    statusCode: 200,
    locals: {},
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    render: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis()
  }

  // Make status() actually set statusCode for inspection
  res.status.mockImplementation((code: number) => {
    res.statusCode = code
    return res
  })

  return res as Response
}

/**
 * Helper to extract JSON response body from mock response
 */
export function getResponseBody(res: Response): any {
  const mockRes = res as any
  if (mockRes.json.mock.calls.length > 0) {
    return mockRes.json.mock.calls[0][0]
  }
  if (mockRes.send.mock.calls.length > 0) {
    return mockRes.send.mock.calls[0][0]
  }
  return null
}

/**
 * Helper to extract status code from mock response
 */
export function getResponseStatus(res: Response): number {
  return (res as any).statusCode
}
