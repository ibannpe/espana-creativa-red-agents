// ABOUTME: Value object representing a unique user identifier (UUID)
// ABOUTME: Provides type safety and validation for user ID operations

export class UserId {
  private constructor(private readonly value: string) {}

  static create(id: string): UserId | null {
    if (!UserId.isValid(id)) {
      return null
    }
    return new UserId(id)
  }

  private static isValid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  getValue(): string {
    return this.value
  }

  equals(other: UserId): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
