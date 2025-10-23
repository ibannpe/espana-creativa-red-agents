// ABOUTME: Aggregate root for pending signup approval workflow
// ABOUTME: Enforces business rules for signup approval, token usage, and status transitions

import { v4 as uuidv4 } from 'uuid'
import { PendingSignupId } from '../value-objects/PendingSignupId'
import { ApprovalToken } from '../value-objects/ApprovalToken'
import { SignupStatus } from '../value-objects/SignupStatus'
import { Email } from '../value-objects/Email'
import { UserId } from '../value-objects/UserId'

interface PendingSignupProps {
  id?: PendingSignupId
  email: Email
  name: string
  surname?: string
  approvalToken?: ApprovalToken
  status?: SignupStatus
  createdAt?: Date
  approvedAt?: Date | null
  approvedBy?: UserId | null
  rejectedAt?: Date | null
  rejectedBy?: UserId | null
  ipAddress?: string | null
  userAgent?: string | null
  tokenUsedAt?: Date | null
}

export class PendingSignup {
  private constructor(
    private readonly id: PendingSignupId,
    private readonly email: Email,
    private readonly name: string,
    private readonly surname: string | null,
    private readonly approvalToken: ApprovalToken,
    private status: SignupStatus,
    private readonly createdAt: Date,
    private approvedAt: Date | null,
    private approvedBy: UserId | null,
    private rejectedAt: Date | null,
    private rejectedBy: UserId | null,
    private readonly ipAddress: string | null,
    private readonly userAgent: string | null,
    private tokenUsedAt: Date | null
  ) {}

  static create(props: PendingSignupProps): PendingSignup {
    const id = props.id || PendingSignupId.create(uuidv4())!
    const approvalToken = props.approvalToken || ApprovalToken.create(uuidv4())!
    const status = props.status || SignupStatus.pending()
    const createdAt = props.createdAt || new Date()

    return new PendingSignup(
      id,
      props.email,
      props.name,
      props.surname || null,
      approvalToken,
      status,
      createdAt,
      props.approvedAt || null,
      props.approvedBy || null,
      props.rejectedAt || null,
      props.rejectedBy || null,
      props.ipAddress || null,
      props.userAgent || null,
      props.tokenUsedAt || null
    )
  }

  approve(adminId: UserId): PendingSignup {
    if (!this.status.isPending()) {
      throw new Error('Can only approve pending signups')
    }

    if (!adminId) {
      throw new Error('Admin ID is required for approval')
    }

    if (this.isTokenExpired(168)) { // 7 days = 168 hours
      throw new Error('Approval token has expired')
    }

    return new PendingSignup(
      this.id,
      this.email,
      this.name,
      this.surname,
      this.approvalToken,
      SignupStatus.approved(),
      this.createdAt,
      new Date(),
      adminId,
      null,
      null,
      this.ipAddress,
      this.userAgent,
      null // Don't mark token as used yet - only when password is set
    )
  }

  reject(adminId: UserId): PendingSignup {
    if (!this.status.isPending()) {
      throw new Error('Can only reject pending signups')
    }

    if (!adminId) {
      throw new Error('Admin ID is required for rejection')
    }

    return new PendingSignup(
      this.id,
      this.email,
      this.name,
      this.surname,
      this.approvalToken,
      SignupStatus.rejected(),
      this.createdAt,
      null,
      null,
      new Date(),
      adminId,
      this.ipAddress,
      this.userAgent,
      new Date()
    )
  }

  isTokenValid(): boolean {
    return this.tokenUsedAt === null && !this.isTokenExpired(168)
  }

  isTokenExpired(expiryHours: number): boolean {
    const now = new Date()
    const expiryTime = new Date(this.createdAt.getTime() + expiryHours * 60 * 60 * 1000)
    return now > expiryTime
  }

  // Getters
  getId(): PendingSignupId { return this.id }
  getEmail(): Email { return this.email }
  getName(): string { return this.name }
  getSurname(): string | null { return this.surname }
  getApprovalToken(): ApprovalToken { return this.approvalToken }
  getStatus(): SignupStatus { return this.status }
  getCreatedAt(): Date { return this.createdAt }
  getApprovedAt(): Date | null { return this.approvedAt }
  getApprovedBy(): UserId | null { return this.approvedBy }
  getRejectedAt(): Date | null { return this.rejectedAt }
  getRejectedBy(): UserId | null { return this.rejectedBy }
  getIpAddress(): string | null { return this.ipAddress }
  getUserAgent(): string | null { return this.userAgent }
  getTokenUsedAt(): Date | null { return this.tokenUsedAt }

  toPrimitives() {
    return {
      id: this.id.getValue(),
      email: this.email.getValue(),
      name: this.name,
      surname: this.surname,
      approvalToken: this.approvalToken.getValue(),
      status: this.status.getValue(),
      createdAt: this.createdAt,
      approvedAt: this.approvedAt,
      approvedBy: this.approvedBy?.getValue() || null,
      rejectedAt: this.rejectedAt,
      rejectedBy: this.rejectedBy?.getValue() || null,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      tokenUsedAt: this.tokenUsedAt
    }
  }
}
