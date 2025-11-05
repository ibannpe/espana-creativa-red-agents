// ABOUTME: Use case for getting user's expressed interests
// ABOUTME: Returns all opportunities a user has expressed interest in

import type { IOpportunityInterestRepository } from '../../ports/IOpportunityInterestRepository'
import type { OpportunityInterest } from '../../../domain/entities/OpportunityInterest'

export class GetUserInterestsUseCase {
  constructor(
    private opportunityInterestRepository: IOpportunityInterestRepository
  ) {}

  async execute(userId: string): Promise<OpportunityInterest[]> {
    return await this.opportunityInterestRepository.findByUser(userId)
  }
}
