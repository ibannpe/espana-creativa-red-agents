// ABOUTME: Use case for updating an existing city
// ABOUTME: Validates admin permissions and updates city properties

import { CityRepository } from '../../ports/CityRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { City } from '../../../domain/entities/City'
import { UserId } from '../../../domain/value-objects/UserId'

export interface UpdateCityRequest {
  adminUserId: string
  cityId: number
  name?: string
  imageUrl?: string
  description?: string | null
  active?: boolean
  displayOrder?: number
}

export interface UpdateCityResponse {
  success: boolean
  city?: City
  error?: string
}

/**
 * UpdateCityUseCase
 *
 * Updates an existing city with validation:
 * - Checks if user is admin
 * - Validates city exists
 * - Updates city properties
 */
export class UpdateCityUseCase {
  constructor(
    private cityRepository: CityRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: UpdateCityRequest): Promise<UpdateCityResponse> {
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
        error: 'Unauthorized: Only admins can update cities'
      }
    }

    // 2. Find existing city
    const city = await this.cityRepository.findById(request.cityId)
    if (!city) {
      return {
        success: false,
        error: 'City not found'
      }
    }

    // 3. Update city properties
    try {
      city.update({
        name: request.name,
        imageUrl: request.imageUrl,
        description: request.description,
        active: request.active,
        displayOrder: request.displayOrder
      })

      // 4. Persist changes
      const updatedCity = await this.cityRepository.update(city)

      return {
        success: true,
        city: updatedCity
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update city'
      }
    }
  }
}
