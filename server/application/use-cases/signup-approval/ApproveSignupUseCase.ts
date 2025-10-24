// ABOUTME: Use case for approving pending signup requests
// ABOUTME: Validates token, approves signup, sends activation email with password setup link

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
  activationLink?: string
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

    // Validate admin ID (use system default if not provided)
    const SYSTEM_ADMIN_ID = '00000000-0000-0000-0000-000000000000'
    const adminIdValue = dto.adminId || SYSTEM_ADMIN_ID
    const adminId = UserId.create(adminIdValue)
    if (!adminId) {
      return { success: false, error: 'Invalid admin ID' }
    }

    // Approve signup
    const approvedSignup = pendingSignup.approve(adminId)

    // Update in repository
    try {
      await this.pendingSignupRepository.update(approvedSignup)
    } catch (error) {
      return { success: false, error: 'Failed to update signup status' }
    }

    // Generate activation link using approval token
    const APP_URL = process.env.APP_URL || 'http://localhost:8080'
    const activationLink = `${APP_URL}/auth/set-password/${pendingSignup.getApprovalToken().getValue()}`

    // Send approval email to user (fire-and-forget)
    console.log('📧 [ApproveSignupUseCase] Sending approval email to:', pendingSignup.getEmail().getValue())
    console.log('📧 [ApproveSignupUseCase] Activation link:', activationLink)
    console.log('📧 [ApproveSignupUseCase] APP_URL from env:', process.env.APP_URL)

    this.emailService.sendSignupApprovedEmail(pendingSignup.getEmail(), activationLink)
      .then(result => {
        console.log('✅ [ApproveSignupUseCase] Email sent successfully:', result)
      })
      .catch(err => {
        console.error('❌ [ApproveSignupUseCase] Failed to send approval email:', err)
        console.error('❌ [ApproveSignupUseCase] Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        })
      })

    return {
      success: true,
      activationLink
    }
  }
}
