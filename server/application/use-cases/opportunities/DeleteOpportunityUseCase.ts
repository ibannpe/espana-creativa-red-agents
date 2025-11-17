// ABOUTME: Use case for deleting an opportunity (UPDATED for role-based permissions)
// ABOUTME: Validates that user is creator, has territorial role, or is admin

import { OpportunityRepository } from '../../ports/OpportunityRepository'
import { CityRepository } from '../../ports/CityRepository'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { RoleRepository } from '../../ports/RoleRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export interface DeleteOpportunityDTO {
  opportunityId: string
  userId: string  // User performing the deletion
}

export interface DeleteOpportunityResponse {
  success: boolean
  error: string | null
}

/**
 * DeleteOpportunityUseCase
 *
 * Deletes an existing opportunity.
 * Permission: creator + users with territorial role + admins
 */
export class DeleteOpportunityUseCase {
  constructor(
    private opportunityRepository: OpportunityRepository,
    private cityRepository: CityRepository,
    private cityManagerRepository: CityManagerRepository,
    private userRepository: IUserRepository,
    private roleRepository: RoleRepository
  ) {}

  async execute(dto: DeleteOpportunityDTO): Promise<DeleteOpportunityResponse> {
    // 1. Validate user ID
    const userId = UserId.create(dto.userId)
    if (!userId) {
      return {
        success: false,
        error: 'Invalid user ID'
      }
    }

    // 2. Get user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    // 3. Get opportunity
    const opportunity = await this.opportunityRepository.findById(dto.opportunityId)
    if (!opportunity) {
      return {
        success: false,
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
        success: false,
        error: 'City not found for this opportunity'
      }
    }

    // Get the role that corresponds to this city
    const cityRole = await this.roleRepository.findByName(city.getName())
    const hasTerritorialRole = cityRole ? user.hasRole(cityRole.id) : false

    if (!isCreator && !isAdmin && !hasTerritorialRole) {
      return {
        success: false,
        error: 'You do not have permission to delete this opportunity'
      }
    }

    // 5. Delete
    await this.opportunityRepository.delete(dto.opportunityId)

    return {
      success: true,
      error: null
    }
  }
}
