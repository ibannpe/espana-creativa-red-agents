// ABOUTME: Value object representing a city slug (URL-friendly identifier)
// ABOUTME: Ensures slug format is valid (lowercase, alphanumeric with hyphens)

export class CitySlug {
  private constructor(private readonly value: string) {}

  static create(slug: string): CitySlug | null {
    if (!CitySlug.isValid(slug)) {
      return null
    }
    return new CitySlug(slug.toLowerCase().trim())
  }

  private static isValid(slug: string): boolean {
    // Only lowercase letters, numbers, and hyphens
    // Must start and end with alphanumeric
    // Length between 2 and 100 characters
    const slugRegex = /^[a-z0-9][a-z0-9-]{0,98}[a-z0-9]$/
    return slugRegex.test(slug.toLowerCase())
  }

  getValue(): string {
    return this.value
  }

  equals(other: CitySlug): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
