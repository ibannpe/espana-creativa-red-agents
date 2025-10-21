// ABOUTME: Value object representing an email address with validation
// ABOUTME: Ensures email format is valid and provides type safety for email operations

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email | null {
    if (!Email.isValid(email)) {
      return null
    }
    return new Email(email.toLowerCase().trim())
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
