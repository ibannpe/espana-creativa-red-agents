// ABOUTME: Value object for pending signup unique identifier
// ABOUTME: Validates and encapsulates UUID-based pending signup IDs with immutability

import { validate as uuidValidate } from 'uuid'

export class PendingSignupId {
  private constructor(private readonly value: string) {}

  static create(value: string): PendingSignupId | null {
    if (!value || typeof value !== 'string') {
      return null
    }

    const trimmedValue = value.trim()

    if (!uuidValidate(trimmedValue)) {
      return null
    }

    return new PendingSignupId(trimmedValue.toLowerCase())
  }

  getValue(): string {
    return this.value
  }

  equals(other: PendingSignupId): boolean {
    if (!other) {
      return false
    }
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
