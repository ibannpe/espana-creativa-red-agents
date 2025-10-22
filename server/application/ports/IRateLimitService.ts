// ABOUTME: Service port for rate limiting signup requests
// ABOUTME: Prevents abuse by limiting requests per IP and email

import { Email } from '../../domain/value-objects/Email'

export interface RateLimitResult {
  allowed: boolean
  retryAfter?: number // seconds until next attempt allowed
  message?: string
}

export interface IRateLimitService {
  checkIpLimit(ipAddress: string): Promise<RateLimitResult>
  checkEmailLimit(email: Email): Promise<RateLimitResult>
  recordRequest(ipAddress: string, email: Email | null): Promise<void>
}
