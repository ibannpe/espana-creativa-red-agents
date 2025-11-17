// ABOUTME: Use case for deleting a city
// ABOUTME: Validates admin permissions and checks for dependencies before deletion

import { CityRepository } from '../../ports/CityRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export interface DeleteCityRequest {
  adminUserId: string
  cityId: number
}

export interface DeleteCityResponse {
  success: boolean
  error?: string
}

/**
 * DeleteCityUseCase
 *
 * Deletes a city with validation:
 * - Checks if user is admin
 * - Validates city exists
 * - Deletes the city
 *
 * Note: Consider adding checks for existing opportunities before deletion
 */
export class DeleteCityUseCase {
  constructor(
    private cityRepository: CityRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: DeleteCityRequest): Promise<DeleteCityResponse> {
    // 1. Check admin permissions
    const adminUserId = UserId.create(request.adminUserId)
    if (!adminUserId) {
      return {
        success: false,
        error: 'Invalid user ID'
      }
    }

    const adminUser = await this.userRepository.findById(adminUserId)
    if (!adminUser || !adminUser.isAdmin()) {
      return {
        success: false,
        error: 'Unauthorized: Only admins can delete cities'
      }
    }

    // 2. Check if city exists
    const cityExists = await this.cityRepository.exists(request.cityId)
    if (!cityExists) {
      return {
        success: false,
        error: 'City not found'
      }
    }

    // 3. Delete city
    try {
      await this.cityRepository.delete(request.cityId)

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete city'
      }
    }
  }
}
