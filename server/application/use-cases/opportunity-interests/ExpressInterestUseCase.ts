// ABOUTME: Use case for expressing interest in an opportunity
// ABOUTME: Validates and creates new opportunity interest

import type { IOpportunityInterestRepository } from '../../ports/IOpportunityInterestRepository'
import type { IOpportunityRepository } from '../../ports/IOpportunityRepository'
import type { OpportunityInterest, CreateOpportunityInterestData } from '../../../domain/entities/OpportunityInterest'

export class ExpressInterestUseCase {
  constructor(
    private opportunityInterestRepository: IOpportunityInterestRepository,
    private opportunityRepository: IOpportunityRepository
  ) {}

  async execute(data: CreateOpportunityInterestData): Promise<OpportunityInterest> {
    // Verify opportunity exists
    const opportunity = await this.opportunityRepository.findById(data.opportunityId)
    if (!opportunity) {
      throw new Error('Opportunity not found')
    }

    // Check if opportunity is open
    if (opportunity.status !== 'abierta') {
      throw new Error('Cannot express interest in a closed opportunity')
    }

    // Check if user is the creator
    if (opportunity.createdBy === data.userId) {
      throw new Error('Cannot express interest in your own opportunity')
    }

    // Check if user has already expressed interest
    const hasInterest = await this.opportunityInterestRepository.hasUserExpressedInterest(
      data.opportunityId,
      data.userId
    )

    if (hasInterest) {
      throw new Error('You have already expressed interest in this opportunity')
    }

    // Create interest
    return await this.opportunityInterestRepository.create(data)
  }
}
