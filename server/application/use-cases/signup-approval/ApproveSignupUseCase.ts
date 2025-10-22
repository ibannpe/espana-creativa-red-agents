// ABOUTME: Use case for approving pending signup requests
// ABOUTME: Validates token, creates auth user with magic link, sends approval email

import { ApprovalToken } from '../../../domain/value-objects/ApprovalToken'
import { UserId } from '../../../domain/value-objects/UserId'
import { IPendingSignupRepository } from '../../ports/IPendingSignupRepository'
import { IAuthService } from '../../ports/services/IAuthService'
import { IEmailService } from '../../ports/services/IEmailService'

interface ApproveSignupDTO {
  token: string
  adminId: string
}

interface ApproveSignupResult {
  success: boolean
  magicLink?: string
  error?: string
}

export class ApproveSignupUseCase {
  constructor(
    private readonly pendingSignupRepository: IPendingSignupRepository,
    private readonly authService: IAuthService,
    private readonly emailService: IEmailService
  ) {}

  async execute(dto: ApproveSignupDTO): Promise<ApproveSignupResult> {
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

    // Check if token is valid
    if (!pendingSignup.isTokenValid()) {
      if (pendingSignup.getTokenUsedAt()) {
        return { success: false, error: 'This approval link has already been used' }
      }
      if (pendingSignup.isTokenExpired(168)) {
        return { success: false, error: 'Approval token has expired' }
      }
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

    // Generate magic link for user
    let magicLink: string
    try {
      const result = await this.authService.generateMagicLink(pendingSignup.getEmail().getValue())
      if (!result || !result.action_link) {
        throw new Error('Failed to generate magic link')
      }
      magicLink = result.action_link
    } catch (error) {
      return { success: false, error: 'Failed to create user account' }
    }

    // Approve signup
    const approvedSignup = pendingSignup.approve(adminId)

    // Update in repository
    try {
      await this.pendingSignupRepository.update(approvedSignup)
    } catch (error) {
      // Rollback: delete auth user if repository update fails
      // Note: In production, implement proper transaction handling
      return { success: false, error: 'Failed to update signup status' }
    }

    // Send approval email to user (fire-and-forget)
    this.emailService.sendSignupApprovedEmail(pendingSignup.getEmail(), magicLink).catch(err => {
      console.error('Failed to send approval email:', err)
    })

    return {
      success: true,
      magicLink
    }
  }
}
