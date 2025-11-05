// ABOUTME: Use case for withdrawing interest in an opportunity
// ABOUTME: Allows users to remove their expressed interest

import type { IOpportunityInterestRepository } from '../../ports/IOpportunityInterestRepository'

export class WithdrawInterestUseCase {
  constructor(
    private opportunityInterestRepository: IOpportunityInterestRepository
  ) {}

  async execute(interestId: string, userId: string): Promise<void> {
    const interest = await this.opportunityInterestRepository.findById(interestId)

    if (!interest) {
      throw new Error('Interest not found')
    }

    // Verify ownership
    if (interest.userId !== userId) {
      throw new Error('Unauthorized: You can only withdraw your own interest')
    }

    await this.opportunityInterestRepository.delete(interestId)
  }
}
