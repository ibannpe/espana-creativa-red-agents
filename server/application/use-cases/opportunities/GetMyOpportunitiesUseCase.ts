// ABOUTME: Use case for retrieving opportunities created by current user
// ABOUTME: Returns all opportunities created by specified user ID

import { OpportunityRepository, OpportunityWithCreator } from '../../ports/OpportunityRepository'

export interface GetMyOpportunitiesDTO {
  userId: string
}

/**
 * GetMyOpportunitiesUseCase
 *
 * Retrieves all opportunities created by a specific user.
 */
export class GetMyOpportunitiesUseCase {
  constructor(private opportunityRepository: OpportunityRepository) {}

  async execute(dto: GetMyOpportunitiesDTO): Promise<OpportunityWithCreator[]> {
    return await this.opportunityRepository.findByCreator(dto.userId)
  }
}
