// ABOUTME: Use case for retrieving opportunities with optional filtering
// ABOUTME: Supports filtering by type, status, skills, remote, and text search

import { OpportunityRepository, OpportunityWithCreator, FilterOpportunitiesParams } from '../../ports/OpportunityRepository'

export interface GetOpportunitiesDTO {
  filters?: FilterOpportunitiesParams
}

/**
 * GetOpportunitiesUseCase
 *
 * Retrieves opportunities with optional filters.
 * Returns opportunities with creator information.
 */
export class GetOpportunitiesUseCase {
  constructor(private opportunityRepository: OpportunityRepository) {}

  async execute(dto: GetOpportunitiesDTO = {}): Promise<OpportunityWithCreator[]> {
    return await this.opportunityRepository.findAll(dto.filters)
  }
}
