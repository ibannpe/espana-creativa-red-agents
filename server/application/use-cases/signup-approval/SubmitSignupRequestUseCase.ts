// ABOUTME: Use case for submitting new signup requests with rate limiting
// ABOUTME: Validates request, checks duplicates, enforces rate limits, sends admin notification

import { PendingSignup } from '../../../domain/entities/PendingSignup'
import { Email } from '../../../domain/value-objects/Email'
import { IPendingSignupRepository } from '../../ports/IPendingSignupRepository'
import { IRateLimitService } from '../../ports/IRateLimitService'
import { IEmailService } from '../../ports/services/IEmailService'
import { IAuthService } from '../../ports/services/IAuthService'

interface SubmitSignupRequestDTO {
  email: string
  name: string
  surname?: string
  ipAddress?: string
  userAgent?: string
}

interface SubmitSignupRequestResult {
  success: boolean
  pendingSignupId?: string
  error?: string
}

export class SubmitSignupRequestUseCase {
  constructor(
    private readonly pendingSignupRepository: IPendingSignupRepository,
    private readonly rateLimitService: IRateLimitService,
    private readonly emailService: IEmailService,
    private readonly authService: IAuthService
  ) {}

  async execute(dto: SubmitSignupRequestDTO): Promise<SubmitSignupRequestResult> {
    // Validate email
    const email = Email.create(dto.email)
    if (!email) {
      return { success: false, error: 'Invalid email format' }
    }

    // Validate name
    if (!dto.name || dto.name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' }
    }

    // Check if email already exists in pending signups
    const existingPending = await this.pendingSignupRepository.findByEmail(email)
    if (existingPending && existingPending.getStatus().isPending()) {
      return { success: false, error: 'A signup request with this email already exists' }
    }

    // Check if email already exists in auth.users
    const existingUser = await this.authService.checkEmailExists(email.getValue())
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' }
    }

    // Check IP rate limit
    if (dto.ipAddress) {
      const ipLimit = await this.rateLimitService.checkIpLimit(dto.ipAddress)
      if (!ipLimit.allowed) {
        return { success: false, error: ipLimit.message || 'Too many requests from this IP' }
      }
    }

    // Check email rate limit
    const emailLimit = await this.rateLimitService.checkEmailLimit(email)
    if (!emailLimit.allowed) {
      return { success: false, error: emailLimit.message || 'Too many requests for this email' }
    }

    // Create pending signup
    const pendingSignup = PendingSignup.create({
      email,
      name: dto.name.trim(),
      surname: dto.surname?.trim(),
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent
    })

    // Save to repository
    try {
      await this.pendingSignupRepository.save(pendingSignup)
    } catch (error) {
      return { success: false, error: 'Failed to save signup request' }
    }

    // Record request for rate limiting
    await this.rateLimitService.recordRequest(dto.ipAddress || 'unknown', email)

    // Send admin notification email (fire-and-forget)
    this.emailService.sendAdminSignupNotification(email, pendingSignup).catch(err => {
      console.error('Failed to send admin notification:', err)
    })

    return {
      success: true,
      pendingSignupId: pendingSignup.getId().getValue()
    }
  }
}
