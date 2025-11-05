// ABOUTME: Use case for getting interests in an opportunity
// ABOUTME: Returns all users interested in a specific opportunity

import type { IOpportunityInterestRepository } from '../../ports/IOpportunityInterestRepository'
import type { OpportunityInterest } from '../../../domain/entities/OpportunityInterest'

export class GetOpportunityInterestsUseCase {
  constructor(
    private opportunityInterestRepository: IOpportunityInterestRepository
  ) {}

  async execute(opportunityId: number, requestingUserId: string): Promise<OpportunityInterest[]> {
    // TODO: Add authorization check - only opportunity creator should see interests
    return await this.opportunityInterestRepository.findByOpportunity(opportunityId)
  }
}
