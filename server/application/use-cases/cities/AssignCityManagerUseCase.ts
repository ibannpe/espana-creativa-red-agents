// ABOUTME: Use case for assigning a user as city manager (admin only)
// ABOUTME: Validates user and city existence before assignment

import { UserId } from '../../../domain/value-objects/UserId'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { CityRepository } from '../../ports/CityRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'

export interface AssignCityManagerRequest {
  adminUserId: string  // User performing the action
  targetUserId: string // User to assign as manager
  cityId: number
}

export interface AssignCityManagerResponse {
  success: boolean
  error: string | null
}

/**
 * AssignCityManagerUseCase
 *
 * Assigns a user as manager of a city.
 * Only admins can perform this action.
 */
export class AssignCityManagerUseCase {
  constructor(
    private cityManagerRepository: CityManagerRepository,
    private cityRepository: CityRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: AssignCityManagerRequest): Promise<AssignCityManagerResponse> {
    // 1. Validate admin user
    const adminUserId = UserId.create(request.adminUserId)
    if (!adminUserId) {
      return {
        success: false,
        error: 'Invalid admin user ID'
      }
    }

    const adminUser = await this.userRepository.findById(adminUserId)
    if (!adminUser || !adminUser.isAdmin()) {
      return {
        success: false,
        error: 'Only admins can assign city managers'
      }
    }

    // 2. Validate target user
    const targetUserId = UserId.create(request.targetUserId)
    if (!targetUserId) {
      return {
        success: false,
        error: 'Invalid target user ID'
      }
    }

    const targetUser = await this.userRepository.findById(targetUserId)
    if (!targetUser) {
      return {
        success: false,
        error: 'Target user not found'
      }
    }

    // 3. Validate city exists
    const city = await this.cityRepository.findById(request.cityId)
    if (!city) {
      return {
        success: false,
        error: 'City not found'
      }
    }

    // 4. Check if already assigned
    const isAlreadyManager = await this.cityManagerRepository.isManagerOfCity(
      targetUserId,
      request.cityId
    )
    if (isAlreadyManager) {
      return {
        success: false,
        error: 'User is already a manager of this city'
      }
    }

    // 5. Assign manager
    await this.cityManagerRepository.assignManager(targetUserId, request.cityId)

    return {
      success: true,
      error: null
    }
  }
}
