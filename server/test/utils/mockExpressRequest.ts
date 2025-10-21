// ABOUTME: Mock Express Request object for API route testing
// ABOUTME: Provides type-safe request mocks with common properties pre-configured

import { Request } from 'express'
import { vi } from 'vitest'

/**
 * Creates a mock Express Request object for testing route handlers
 */
export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    method: 'GET',
    url: '/',
    path: '/',
    get: vi.fn(),
    ...overrides
  } as unknown as Request
}

/**
 * Creates a mock authenticated request with user context
 */
export function createAuthenticatedRequest(
  userId: string,
  overrides: Partial<Request> = {}
): Request {
  return createMockRequest({
    headers: {
      authorization: `Bearer mock-token-${userId}`
    },
    ...overrides
  })
}
