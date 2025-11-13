// ABOUTME: Use case for retrieving a city by its slug
// ABOUTME: Used when navigating to /oportunidades/:citySlug

import { City } from '../../../domain/entities/City'
import { CitySlug } from '../../../domain/value-objects/CitySlug'
import { CityRepository } from '../../ports/CityRepository'

export interface GetCityBySlugRequest {
  slug: string
}

export interface GetCityBySlugResponse {
  city: City | null
  error: string | null
}

/**
 * GetCityBySlugUseCase
 *
 * Retrieves a city by its URL slug.
 * Used when user navigates to /oportunidades/:citySlug
 */
export class GetCityBySlugUseCase {
  constructor(private cityRepository: CityRepository) {}

  async execute(request: GetCityBySlugRequest): Promise<GetCityBySlugResponse> {
    // Validate slug format
    const citySlug = CitySlug.create(request.slug)
    if (!citySlug) {
      return {
        city: null,
        error: 'Invalid city slug format'
      }
    }

    // Find city
    const city = await this.cityRepository.findBySlug(citySlug)
    if (!city) {
      return {
        city: null,
        error: 'City not found'
      }
    }

    // Check if city is active
    if (!city.active) {
      return {
        city: null,
        error: 'City is not currently active'
      }
    }

    return {
      city,
      error: null
    }
  }
}
