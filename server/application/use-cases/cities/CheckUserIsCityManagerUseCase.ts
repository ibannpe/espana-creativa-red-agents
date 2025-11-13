// ABOUTME: Use case for checking if a user is a city manager
// ABOUTME: Used for permission validation and UI conditional rendering

import { UserId } from '../../../domain/value-objects/UserId'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'

export interface CheckUserIsCityManagerRequest {
  userId: string
  cityId?: number  // If provided, checks specific city; otherwise checks ANY city
}

export interface CheckUserIsCityManagerResponse {
  isManager: boolean
  managedCityIds: number[]
}

/**
 * CheckUserIsCityManagerUseCase
 *
 * Checks if a user is a city manager.
 * Can check for a specific city or just check if user manages any city.
 */
export class CheckUserIsCityManagerUseCase {
  constructor(
    private cityManagerRepository: CityManagerRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(request: CheckUserIsCityManagerRequest): Promise<CheckUserIsCityManagerResponse> {
    const userId = UserId.create(request.userId)
    if (!userId) {
      return {
        isManager: false,
        managedCityIds: []
      }
    }

    // Get user to check if admin (admins can manage all cities)
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        isManager: false,
        managedCityIds: []
      }
    }

    // Admins are managers of all cities
    if (user.isAdmin()) {
      return {
        isManager: true,
        managedCityIds: [] // Empty means ALL cities (admin privilege)
      }
    }

    // Check specific city or all cities
    if (request.cityId !== undefined) {
      const isManager = await this.cityManagerRepository.isManagerOfCity(userId, request.cityId)
      return {
        isManager,
        managedCityIds: isManager ? [request.cityId] : []
      }
    } else {
      const managedCityIds = await this.cityManagerRepository.getCitiesByManager(userId)
      return {
        isManager: managedCityIds.length > 0,
        managedCityIds
      }
    }
  }
}
