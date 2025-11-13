// ABOUTME: OpportunityRepository port interface defining opportunity data access operations
// ABOUTME: Follows hexagonal architecture - defines contract for infrastructure adapters

import { Opportunity, OpportunityType, OpportunityStatus } from '../../domain/entities/Opportunity'

export interface OpportunityWithCreator {
  opportunity: Opportunity
  creator: {
    id: string
    name: string
    avatar_url: string | null
    professional_title: string | null
  }
}

export interface FilterOpportunitiesParams {
  type?: OpportunityType
  status?: OpportunityStatus
  skills?: string[]
  remote?: boolean
  search?: string
  createdBy?: string
  cityId?: number
}

/**
 * OpportunityRepository Port
 *
 * Defines the contract for opportunity data persistence.
 * Implementations must be provided in the infrastructure layer.
 */
export interface OpportunityRepository {
  /**
   * Find an opportunity by ID
   */
  findById(id: string): Promise<Opportunity | null>

  /**
   * Find opportunity by ID with creator information
   */
  findByIdWithCreator(id: string): Promise<OpportunityWithCreator | null>

  /**
   * Get all opportunities with optional filters
   */
  findAll(filters?: FilterOpportunitiesParams): Promise<OpportunityWithCreator[]>

  /**
   * Get opportunities created by a specific user
   */
  findByCreator(userId: string): Promise<OpportunityWithCreator[]>

  /**
   * Create a new opportunity
   */
  create(opportunity: Opportunity): Promise<Opportunity>

  /**
   * Update an existing opportunity
   */
  update(opportunity: Opportunity): Promise<Opportunity>

  /**
   * Delete an opportunity
   */
  delete(id: string): Promise<void>

  /**
   * Check if opportunity exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Count opportunities matching filters
   */
  count(filters?: FilterOpportunitiesParams): Promise<number>

  /**
   * Get all opportunities for a specific city
   */
  findByCity(cityId: number, filters?: FilterOpportunitiesParams): Promise<OpportunityWithCreator[]>

  /**
   * Count active opportunities for a city
   */
  countActiveByCity(cityId: number): Promise<number>
}
