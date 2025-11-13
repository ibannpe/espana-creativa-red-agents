// ABOUTME: Use case for retrieving opportunities filtered by city
// ABOUTME: Supports additional filters (type, status, skills, etc.)

import {
  OpportunityRepository,
  OpportunityWithCreator,
  FilterOpportunitiesParams
} from '../../ports/OpportunityRepository'
import { CityRepository } from '../../ports/CityRepository'

export interface GetOpportunitiesByCityRequest {
  cityId: number
  filters?: Omit<FilterOpportunitiesParams, 'cityId'>
}

export interface GetOpportunitiesByCityResponse {
  opportunities: OpportunityWithCreator[]
  error: string | null
}

/**
 * GetOpportunitiesByCityUseCase
 *
 * Retrieves all opportunities for a specific city.
 * Used in /oportunidades/:citySlug page.
 */
export class GetOpportunitiesByCityUseCase {
  constructor(
    private opportunityRepository: OpportunityRepository,
    private cityRepository: CityRepository
  ) {}

  async execute(request: GetOpportunitiesByCityRequest): Promise<GetOpportunitiesByCityResponse> {
    // Validate city exists
    const cityExists = await this.cityRepository.exists(request.cityId)
    if (!cityExists) {
      return {
        opportunities: [],
        error: 'City not found'
      }
    }

    // Fetch opportunities
    const opportunities = await this.opportunityRepository.findByCity(
      request.cityId,
      request.filters
    )

    return {
      opportunities,
      error: null
    }
  }
}
