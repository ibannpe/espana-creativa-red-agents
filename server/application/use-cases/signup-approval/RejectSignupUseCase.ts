// ABOUTME: Use case for rejecting pending signup requests
// ABOUTME: Validates token, marks as rejected, sends rejection email

import { ApprovalToken } from '../../../domain/value-objects/ApprovalToken'
import { UserId } from '../../../domain/value-objects/UserId'
import { IPendingSignupRepository } from '../../ports/IPendingSignupRepository'
import { IEmailService } from '../../ports/services/IEmailService'

interface RejectSignupDTO {
  token: string
  adminId: string
}

interface RejectSignupResult {
  success: boolean
  error?: string
}

export class RejectSignupUseCase {
  constructor(
    private readonly pendingSignupRepository: IPendingSignupRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(dto: RejectSignupDTO): Promise<RejectSignupResult> {
    // Validate token
    const token = ApprovalToken.create(dto.token)
    if (!token) {
      return { success: false, error: 'Invalid approval token format' }
    }

    // Find pending signup by token
    const pendingSignup = await this.pendingSignupRepository.findByToken(token)
    if (!pendingSignup) {
      return { success: false, error: 'Signup request not found' }
    }

    // Check if token is valid (allow rejection even if expired)
    if (pendingSignup.getTokenUsedAt()) {
      return { success: false, error: 'This approval link has already been used' }
    }

    // Check status
    if (!pendingSignup.getStatus().isPending()) {
      return { success: false, error: 'Signup request already processed' }
    }

    // Validate admin ID
    const adminId = UserId.create(dto.adminId)
    if (!adminId) {
      return { success: false, error: 'Invalid admin ID' }
    }

    // Reject signup
    const rejectedSignup = pendingSignup.reject(adminId)

    // Update in repository
    try {
      await this.pendingSignupRepository.update(rejectedSignup)
    } catch (error) {
      return { success: false, error: 'Failed to update signup status' }
    }

    // Send rejection email to user (fire-and-forget, generic message)
    this.emailService.sendSignupRejectedEmail(pendingSignup.getEmail()).catch(err => {
      console.error('Failed to send rejection email:', err)
    })

    return { success: true }
  }
}
