// ABOUTME: Repository port for pending signup persistence operations
// ABOUTME: Defines contract for storing and retrieving pending signup requests

import { PendingSignup } from '../../domain/entities/PendingSignup'
import { PendingSignupId } from '../../domain/value-objects/PendingSignupId'
import { ApprovalToken } from '../../domain/value-objects/ApprovalToken'
import { Email } from '../../domain/value-objects/Email'
import { SignupStatus } from '../../domain/value-objects/SignupStatus'

export interface IPendingSignupRepository {
  save(signup: PendingSignup): Promise<void>
  update(signup: PendingSignup): Promise<void>
  findById(id: PendingSignupId): Promise<PendingSignup | null>
  findByEmail(email: Email): Promise<PendingSignup | null>
  findByToken(token: ApprovalToken): Promise<PendingSignup | null>
  findByStatus(status: SignupStatus, limit?: number, offset?: number): Promise<PendingSignup[]>
  countByStatus(status: SignupStatus): Promise<number>
  deleteOldRecords(olderThanDays: number): Promise<number>
}
