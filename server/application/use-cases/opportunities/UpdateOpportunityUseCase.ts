// ABOUTME: Use case for updating an opportunity (UPDATED for role-based permissions)
// ABOUTME: Validates that user is creator, has territorial role, or is admin

import { Opportunity, OpportunityType, OpportunityStatus } from '../../../domain/entities/Opportunity'
import { OpportunityRepository } from '../../ports/OpportunityRepository'
import { CityRepository } from '../../ports/CityRepository'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { RoleRepository } from '../../ports/RoleRepository'
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
 * Permission: creator + users with territorial role + admins
 */
export class UpdateOpportunityUseCase {
  constructor(
    private opportunityRepository: OpportunityRepository,
    private cityRepository: CityRepository,
    private cityManagerRepository: CityManagerRepository,
    private userRepository: IUserRepository,
    private roleRepository: RoleRepository
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

    // Get the city to find its role
    const city = await this.cityRepository.findById(opportunity.cityId)
    if (!city) {
      return {
        opportunity: null,
        error: 'City not found for this opportunity'
      }
    }

    // Get the role that corresponds to this city
    const cityRole = await this.roleRepository.findByName(city.getName())
    const hasTerritorialRole = cityRole ? user.hasRole(cityRole.id) : false

    if (!isCreator && !isAdmin && !hasTerritorialRole) {
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
