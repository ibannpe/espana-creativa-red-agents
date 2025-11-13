// ABOUTME: CityRepository port interface defining city data access operations
// ABOUTME: Follows hexagonal architecture - defines contract for infrastructure adapters

import { City } from '../../domain/entities/City'
import { CitySlug } from '../../domain/value-objects/CitySlug'

export interface CityWithOpportunityCount {
  city: City
  activeOpportunitiesCount: number
}

/**
 * CityRepository Port
 *
 * Defines the contract for city data persistence.
 * Implementations must be provided in the infrastructure layer.
 */
export interface CityRepository {
  /**
   * Find a city by ID
   */
  findById(id: number): Promise<City | null>

  /**
   * Find a city by slug
   */
  findBySlug(slug: CitySlug): Promise<City | null>

  /**
   * Get all cities (optionally only active ones)
   */
  findAll(options?: { activeOnly?: boolean }): Promise<City[]>

  /**
   * Get all cities with their active opportunity count
   */
  findAllWithOpportunityCount(options?: { activeOnly?: boolean }): Promise<CityWithOpportunityCount[]>

  /**
   * Check if city exists
   */
  exists(id: number): Promise<boolean>

  /**
   * Check if slug is already taken (for validation)
   */
  slugExists(slug: CitySlug, excludeCityId?: number): Promise<boolean>

  /**
   * Create a new city (admin only - not used in initial version)
   */
  create(city: City): Promise<City>

  /**
   * Update an existing city (admin only - not used in initial version)
   */
  update(city: City): Promise<City>

  /**
   * Delete a city (admin only - not used in initial version)
   */
  delete(id: number): Promise<void>
}
