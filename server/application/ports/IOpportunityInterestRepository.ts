// ABOUTME: Repository port for opportunity interests
// ABOUTME: Defines interface for opportunity interest data access

import type { OpportunityInterest, CreateOpportunityInterestData, UpdateOpportunityInterestData } from '../../domain/entities/OpportunityInterest'

export interface IOpportunityInterestRepository {
  /**
   * Create a new opportunity interest
   */
  create(data: CreateOpportunityInterestData): Promise<OpportunityInterest>

  /**
   * Find interest by ID
   */
  findById(id: string): Promise<OpportunityInterest | null>

  /**
   * Find interest by opportunity and user
   */
  findByOpportunityAndUser(opportunityId: string, userId: string): Promise<OpportunityInterest | null>

  /**
   * Get all interests for an opportunity
   */
  findByOpportunity(opportunityId: string): Promise<OpportunityInterest[]>

  /**
   * Get all interests by a user
   */
  findByUser(userId: string): Promise<OpportunityInterest[]>

  /**
   * Update an opportunity interest
   */
  update(id: string, data: UpdateOpportunityInterestData): Promise<OpportunityInterest>

  /**
   * Delete an opportunity interest
   */
  delete(id: string): Promise<void>

  /**
   * Check if user has already expressed interest
   */
  hasUserExpressedInterest(opportunityId: string, userId: string): Promise<boolean>
}
