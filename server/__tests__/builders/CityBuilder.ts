// ABOUTME: Builder pattern for creating City test data
// ABOUTME: Provides fluent API for creating cities with customizable properties in tests

import { City } from '../../domain/entities/City'
import { CitySlug } from '../../domain/value-objects/CitySlug'

/**
 * CityBuilder - Builder pattern for creating City entities in tests
 *
 * Usage:
 *   const city = new CityBuilder().withName('Madrid').withActive(true).build()
 */
export class CityBuilder {
  private id: number = 1
  private name: string = 'Madrid'
  private slug: string = 'madrid'
  private imageUrl: string = 'https://example.com/madrid.jpg'
  private description: string | null = 'La capital de España'
  private active: boolean = true
  private displayOrder: number = 0
  private createdAt: Date = new Date('2024-01-01')
  private updatedAt: Date = new Date('2024-01-01')

  withId(id: number): this {
    this.id = id
    return this
  }

  withName(name: string): this {
    this.name = name
    return this
  }

  withSlug(slug: string): this {
    this.slug = slug
    return this
  }

  withImageUrl(imageUrl: string): this {
    this.imageUrl = imageUrl
    return this
  }

  withDescription(description: string | null): this {
    this.description = description
    return this
  }

  withActive(active: boolean): this {
    this.active = active
    return this
  }

  withDisplayOrder(displayOrder: number): this {
    this.displayOrder = displayOrder
    return this
  }

  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt
    return this
  }

  withUpdatedAt(updatedAt: Date): this {
    this.updatedAt = updatedAt
    return this
  }

  build(): City {
    const citySlug = CitySlug.create(this.slug)
    if (!citySlug) {
      throw new Error(`Invalid slug: ${this.slug}`)
    }

    return City.create({
      id: this.id,
      name: this.name,
      slug: citySlug,
      imageUrl: this.imageUrl,
      description: this.description,
      active: this.active,
      displayOrder: this.displayOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    })
  }

  /**
   * Builds and returns the city as a plain object (for repository mocking)
   */
  buildObject() {
    return this.build().toObject()
  }

  /**
   * Preset: Barcelona city
   */
  static barcelona(): CityBuilder {
    return new CityBuilder()
      .withId(2)
      .withName('Barcelona')
      .withSlug('barcelona')
      .withImageUrl('https://example.com/barcelona.jpg')
      .withDescription('La ciudad condal')
      .withDisplayOrder(1)
  }

  /**
   * Preset: Valencia city
   */
  static valencia(): CityBuilder {
    return new CityBuilder()
      .withId(3)
      .withName('Valencia')
      .withSlug('valencia')
      .withImageUrl('https://example.com/valencia.jpg')
      .withDescription('Ciudad mediterránea')
      .withDisplayOrder(2)
  }

  /**
   * Preset: Sevilla city
   */
  static sevilla(): CityBuilder {
    return new CityBuilder()
      .withId(4)
      .withName('Sevilla')
      .withSlug('sevilla')
      .withImageUrl('https://example.com/sevilla.jpg')
      .withDescription('Ciudad del sur')
      .withDisplayOrder(3)
  }

  /**
   * Preset: Inactive city
   */
  static inactive(): CityBuilder {
    return new CityBuilder()
      .withId(99)
      .withName('Inactive City')
      .withSlug('inactive-city')
      .withImageUrl('https://example.com/inactive.jpg')
      .withDescription('This city is not active')
      .withActive(false)
  }
}
