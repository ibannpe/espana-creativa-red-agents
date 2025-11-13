// ABOUTME: Use case for retrieving all cities with optional filtering
// ABOUTME: Returns cities with active opportunity counts for grid display

import { CityRepository, CityWithOpportunityCount } from '../../ports/CityRepository'

export interface GetCitiesRequest {
  activeOnly?: boolean
}

/**
 * GetCitiesUseCase
 *
 * Retrieves all cities with their active opportunity counts.
 * Used for displaying the cities grid on /oportunidades page.
 */
export class GetCitiesUseCase {
  constructor(private cityRepository: CityRepository) {}

  async execute(request: GetCitiesRequest = {}): Promise<CityWithOpportunityCount[]> {
    const cities = await this.cityRepository.findAllWithOpportunityCount({
      activeOnly: request.activeOnly ?? true  // Default: only active cities
    })

    // Sort by display_order ASC
    return cities.sort((a, b) => a.city.displayOrder - b.city.displayOrder)
  }
}
