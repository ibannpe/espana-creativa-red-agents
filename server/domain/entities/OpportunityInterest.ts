// ABOUTME: Domain entity for opportunity interest
// ABOUTME: Represents a user's expressed interest in an opportunity

export type OpportunityInterestStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface OpportunityInterest {
  id: string
  opportunityId: number
  userId: string
  message?: string
  status: OpportunityInterestStatus
  createdAt: Date
  updatedAt: Date
}

export interface CreateOpportunityInterestData {
  opportunityId: number
  userId: string
  message?: string
}

export interface UpdateOpportunityInterestData {
  status?: OpportunityInterestStatus
  message?: string
}
