// ABOUTME: Use case for updating an opportunity (UPDATED for city-based permissions)
// ABOUTME: Validates that user is creator, city manager, or admin

import { Opportunity, OpportunityType, OpportunityStatus } from '../../../domain/entities/Opportunity'
import { OpportunityRepository } from '../../ports/OpportunityRepository'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export interface UpdateOpportunityDTO {
  opportunityId: string
  userId: string  // User performing the update
  updates: {
    title?: string
    description?: string
    type?: OpportunityType
    status?: OpportunityStatus
    skillsRequired?: string[]
    location?: string
    remote?: boolean
    duration?: string
    compensation?: string
    // cityId is NOT updatable (business rule: can't move opportunity to another city)
  }
}

export interface UpdateOpportunityResponse {
  opportunity: Opportunity | null
  error: string | null
}

/**
 * UpdateOpportunityUseCase
 *
 * Updates an existing opportunity.
 * Permission: creator + city managers of that city + admins
 */
export class UpdateOpportunityUseCase {
  constructor(
    private opportunityRepository: OpportunityRepository,
    private cityManagerRepository: CityManagerRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(dto: UpdateOpportunityDTO): Promise<UpdateOpportunityResponse> {
    // 1. Validate user ID
    const userId = UserId.create(dto.userId)
    if (!userId) {
      return {
        opportunity: null,
        error: 'Invalid user ID'
      }
    }

    // 2. Get user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        opportunity: null,
        error: 'User not found'
      }
    }

    // 3. Get opportunity
    const opportunity = await this.opportunityRepository.findById(dto.opportunityId)
    if (!opportunity) {
      return {
        opportunity: null,
        error: 'Opportunity not found'
      }
    }

    // 4. CRITICAL: Check permission
    const isCreator = opportunity.isCreator(dto.userId)
    const isAdmin = user.isAdmin()
    const isManagerOfCity = await this.cityManagerRepository.isManagerOfCity(
      userId,
      opportunity.cityId
    )

    if (!isCreator && !isAdmin && !isManagerOfCity) {
      return {
        opportunity: null,
        error: 'You do not have permission to edit this opportunity'
      }
    }

    // 5. Update opportunity
    try {
      opportunity.update(dto.updates)
    } catch (error) {
      return {
        opportunity: null,
        error: error instanceof Error ? error.message : 'Failed to update opportunity'
      }
    }

    // 6. Persist
    const updated = await this.opportunityRepository.update(opportunity)

    return {
      opportunity: updated,
      error: null
    }
  }
}
