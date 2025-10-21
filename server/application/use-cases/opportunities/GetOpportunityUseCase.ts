// ABOUTME: Use case for retrieving a single opportunity by ID
// ABOUTME: Returns opportunity with creator information

import { OpportunityRepository, OpportunityWithCreator } from '../../ports/OpportunityRepository'

export interface GetOpportunityDTO {
  opportunityId: string
}

/**
 * GetOpportunityUseCase
 *
 * Retrieves a single opportunity by ID with creator information.
 */
export class GetOpportunityUseCase {
  constructor(private opportunityRepository: OpportunityRepository) {}

  async execute(dto: GetOpportunityDTO): Promise<OpportunityWithCreator | null> {
    return await this.opportunityRepository.findByIdWithCreator(dto.opportunityId)
  }
}
