// ABOUTME: Rate limiting service implementation using Supabase
// ABOUTME: Enforces IP-based (5/hour) and email-based (1/day) rate limits

import { SupabaseClient } from '@supabase/supabase-js'
import { IRateLimitService, RateLimitResult } from '../../../application/ports/IRateLimitService'
import { Email } from '../../../domain/value-objects/Email'

export class RateLimitService implements IRateLimitService {
  private readonly IP_LIMIT_PER_HOUR = parseInt(process.env.RATE_LIMIT_SIGNUPS_PER_HOUR || '5')
  private readonly EMAIL_LIMIT_PER_DAY = parseInt(process.env.RATE_LIMIT_SIGNUPS_PER_DAY || '1')

  constructor(private readonly supabase: SupabaseClient) {}

  async checkIpLimit(ipAddress: string): Promise<RateLimitResult> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const { data, error } = await this.supabase
      .from('signup_rate_limits')
      .select('*')
      .eq('ip_address', ipAddress)
      .gte('window_start', oneHourAgo.toISOString())

    if (error) {
      return { allowed: true }
    }

    const totalRequests = data.reduce((sum, record) => sum + record.request_count, 0)

    if (totalRequests >= this.IP_LIMIT_PER_HOUR) {
      return {
        allowed: false,
        retryAfter: 3600,
        message: `Too many signup requests from this IP. Limit: ${this.IP_LIMIT_PER_HOUR} per hour.`
      }
    }

    return { allowed: true }
  }

  async checkEmailLimit(email: Email): Promise<RateLimitResult> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const { data, error } = await this.supabase
      .from('signup_rate_limits')
      .select('*')
      .eq('email', email.getValue())
      .gte('window_start', oneDayAgo.toISOString())

    if (error) {
      return { allowed: true }
    }

    if (data.length >= this.EMAIL_LIMIT_PER_DAY) {
      return {
        allowed: false,
        retryAfter: 86400,
        message: `Too many signup requests for this email. Limit: ${this.EMAIL_LIMIT_PER_DAY} per day.`
      }
    }

    return { allowed: true }
  }

  async recordRequest(ipAddress: string, email: Email | null): Promise<void> {
    const now = new Date()

    await this.supabase
      .from('signup_rate_limits')
      .insert({
        ip_address: ipAddress,
        email: email?.getValue() || null,
        request_count: 1,
        window_start: now.toISOString(),
        last_request_at: now.toISOString()
      })
  }
}
