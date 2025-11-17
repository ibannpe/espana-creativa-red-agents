// ABOUTME: Use case to get cities where a user can create opportunities
// ABOUTME: Matches user's territorial roles with city names

import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { CityRepository } from '../../ports/CityRepository'
import { RoleRepository } from '../../ports/RoleRepository'
import { UserId } from '../../../domain/value-objects/UserId'
import { City } from '../../../domain/entities/City'

export interface GetAllowedCitiesDTO {
  userId: string
}

export interface GetAllowedCitiesResponse {
  cities: City[]
  error: string | null
}

/**
 * GetAllowedCitiesForUserUseCase
 *
 * Returns the list of cities where a user can create opportunities.
 * - Admins can create in all cities
 * - Users with territorial roles can create only in cities matching their role names
 */
export class GetAllowedCitiesForUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private cityRepository: CityRepository,
    private roleRepository: RoleRepository
  ) {}

  async execute(dto: GetAllowedCitiesDTO): Promise<GetAllowedCitiesResponse> {
    // 1. Validate and get user
    const userId = UserId.create(dto.userId)
    if (!userId) {
      return { cities: [], error: 'Invalid user ID' }
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      return { cities: [], error: 'User not found' }
    }

    // 2. Get all cities
    const allCities = await this.cityRepository.findAll({ activeOnly: true })

    // 3. If admin, return all cities
    if (user.isAdmin()) {
      return { cities: allCities, error: null }
    }

    // 4. For non-admins, filter cities by matching role names
    const userRoleIds = user.getRoleIds()

    // Get all user's roles
    const userRoles = await Promise.all(
      userRoleIds.map(roleId => this.roleRepository.findById(roleId))
    )

    // Filter out null roles and get role names
    const userRoleNames = userRoles
      .filter((role): role is NonNullable<typeof role> => role !== null)
      .map(role => role.name)

    // Filter cities where the user has a matching territorial role
    const allowedCities = allCities.filter(city =>
      userRoleNames.includes(city.getName())
    )

    return { cities: allowedCities, error: null }
  }
}
