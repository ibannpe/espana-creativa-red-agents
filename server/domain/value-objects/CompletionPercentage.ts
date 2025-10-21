// ABOUTME: Value object representing profile completion percentage (0-100)
// ABOUTME: Encapsulates validation logic ensuring percentage is within valid range

export class CompletionPercentage {
  private constructor(private readonly value: number) {}

  static create(percentage: number): CompletionPercentage | null {
    if (!CompletionPercentage.isValid(percentage)) {
      return null
    }
    return new CompletionPercentage(Math.round(percentage))
  }

  private static isValid(percentage: number): boolean {
    return percentage >= 0 && percentage <= 100
  }

  getValue(): number {
    return this.value
  }

  isComplete(): boolean {
    return this.value === 100
  }

  isIncomplete(): boolean {
    return this.value < 100
  }

  equals(other: CompletionPercentage): boolean {
    return this.value === other.value
  }

  toString(): string {
    return `${this.value}%`
  }
}
