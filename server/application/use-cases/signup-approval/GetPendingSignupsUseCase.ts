// ABOUTME: Use case for retrieving pending signup requests (admin only)
// ABOUTME: Returns paginated list of pending signups with filtering by status

import { SignupStatus } from '../../../domain/value-objects/SignupStatus'
import { IPendingSignupRepository } from '../../ports/IPendingSignupRepository'
import { PendingSignup } from '../../../domain/entities/PendingSignup'

interface GetPendingSignupsDTO {
  status?: 'pending' | 'approved' | 'rejected'
  limit?: number
  offset?: number
}

interface GetPendingSignupsResult {
  success: boolean
  signups?: PendingSignup[]
  total?: number
  error?: string
}

export class GetPendingSignupsUseCase {
  constructor(
    private readonly pendingSignupRepository: IPendingSignupRepository
  ) {}

  async execute(dto: GetPendingSignupsDTO): Promise<GetPendingSignupsResult> {
    const statusFilter = dto.status || 'pending'
    const status = SignupStatus.create(statusFilter)

    if (!status) {
      return { success: false, error: 'Invalid status filter' }
    }

    const limit = dto.limit || 20
    const offset = dto.offset || 0

    try {
      const signups = await this.pendingSignupRepository.findByStatus(status, limit, offset)
      const total = await this.pendingSignupRepository.countByStatus(status)

      return {
        success: true,
        signups,
        total
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch pending signups' }
    }
  }
}
