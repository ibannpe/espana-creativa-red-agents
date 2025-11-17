// ABOUTME: Use case for creating a new opportunity (UPDATED for role-based permissions)
// ABOUTME: Validates that user has the territorial role before allowing creation

import { v4 as uuidv4 } from 'uuid'
import { Opportunity, OpportunityType } from '../../../domain/entities/Opportunity'
import { OpportunityRepository } from '../../ports/OpportunityRepository'
import { CityRepository } from '../../ports/CityRepository'
import { CityManagerRepository } from '../../ports/CityManagerRepository'
import { IUserRepository } from '../../ports/repositories/IUserRepository'
import { RoleRepository } from '../../ports/RoleRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export interface CreateOpportunityDTO {
  title: string
  description: string
  type: OpportunityType
  skillsRequired: string[]
  cityId: number
  location?: string
  remote?: boolean
  duration?: string
  compensation?: string
  createdBy: string
}

export interface CreateOpportunityResponse {
  opportunity: Opportunity | null
  error: string | null
}

/**
 * CreateOpportunityUseCase
 *
 * Creates a new opportunity with validation.
 * ONLY users with the city's territorial role (or admins) can create opportunities.
 */
export class CreateOpportunityUseCase {
  constructor(
    private opportunityRepository: OpportunityRepository,
    private cityRepository: CityRepository,
    private cityManagerRepository: CityManagerRepository,
    private userRepository: IUserRepository,
    private roleRepository: RoleRepository
  ) {}

  async execute(dto: CreateOpportunityDTO): Promise<CreateOpportunityResponse> {
    // 1. Validate user ID
    const userId = UserId.create(dto.createdBy)
    if (!userId) {
      return {
        opportunity: null,
        error: 'Invalid user ID'
      }
    }

    // 2. Get user and check if exists
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return {
        opportunity: null,
        error: 'User not found'
      }
    }

    // 3. Validate city exists and is active
    const city = await this.cityRepository.findById(dto.cityId)
    if (!city) {
      return {
        opportunity: null,
        error: 'City not found'
      }
    }

    if (!city.isAcceptingOpportunities()) {
      return {
        opportunity: null,
        error: 'This city is not currently accepting new opportunities'
      }
    }

    // 4. CRITICAL: Check permission - user must have the city's role OR be admin
    const isAdmin = user.isAdmin()

    // Get the role that corresponds to this city (role name = city name)
    const cityRole = await this.roleRepository.findByName(city.getName())

    // Check if user has the territorial role
    const hasTerritorialRole = cityRole ? user.hasRole(cityRole.id) : false

    if (!isAdmin && !hasTerritorialRole) {
      return {
        opportunity: null,
        error: 'You do not have permission to create opportunities for this city. Only admins and users with the territorial role can create opportunities.'
      }
    }

    // 5. Create opportunity domain entity
    const opportunity = Opportunity.createNew(
      uuidv4(),
      dto.title,
      dto.description,
      dto.type,
      dto.skillsRequired,
      dto.cityId,
      dto.createdBy,
      {
        location: dto.location,
        remote: dto.remote,
        duration: dto.duration,
        compensation: dto.compensation
      }
    )

    // 6. Persist
    const created = await this.opportunityRepository.create(opportunity)

    return {
      opportunity: created,
      error: null
    }
  }
}
