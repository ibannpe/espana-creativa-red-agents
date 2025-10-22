// ABOUTME: Value object for signup approval status
// ABOUTME: Enforces valid status transitions (pending → approved/rejected only)

export type SignupStatusType = 'pending' | 'approved' | 'rejected'

export class SignupStatus {
  private constructor(private readonly value: SignupStatusType) {}

  static create(value: string): SignupStatus | null {
    if (!value) {
      return null
    }

    const normalized = value.toLowerCase().trim()

    if (normalized !== 'pending' && normalized !== 'approved' && normalized !== 'rejected') {
      return null
    }

    return new SignupStatus(normalized as SignupStatusType)
  }

  static pending(): SignupStatus {
    return new SignupStatus('pending')
  }

  static approved(): SignupStatus {
    return new SignupStatus('approved')
  }

  static rejected(): SignupStatus {
    return new SignupStatus('rejected')
  }

  getValue(): SignupStatusType {
    return this.value
  }

  isPending(): boolean {
    return this.value === 'pending'
  }

  isApproved(): boolean {
    return this.value === 'approved'
  }

  isRejected(): boolean {
    return this.value === 'rejected'
  }

  canTransitionTo(newStatus: SignupStatus): boolean {
    // Can only transition from pending to approved or rejected
    if (!this.isPending()) {
      return false
    }

    return newStatus.isApproved() || newStatus.isRejected()
  }

  equals(other: SignupStatus): boolean {
    if (!other) {
      return false
    }
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
