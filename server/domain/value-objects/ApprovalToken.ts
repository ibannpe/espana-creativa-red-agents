// ABOUTME: Value object for admin approval token
// ABOUTME: Encapsulates UUID-based single-use tokens for secure signup approval links

import { validate as uuidValidate } from 'uuid'

export class ApprovalToken {
  private constructor(private readonly value: string) {}

  static create(value: string): ApprovalToken | null {
    if (!value || typeof value !== 'string') {
      return null
    }

    const trimmedValue = value.trim()

    if (!uuidValidate(trimmedValue)) {
      return null
    }

    return new ApprovalToken(trimmedValue.toLowerCase())
  }

  getValue(): string {
    return this.value
  }

  equals(other: ApprovalToken): boolean {
    if (!other) {
      return false
    }
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
