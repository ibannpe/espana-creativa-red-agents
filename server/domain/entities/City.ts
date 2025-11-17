// ABOUTME: City domain entity representing a geographic location with opportunities
// ABOUTME: Contains business logic for city validation and activation rules

import { CitySlug } from '../value-objects/CitySlug'

export interface CityProps {
  id: number
  name: string
  slug: CitySlug
  imageUrl: string
  description: string | null
  active: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * City Domain Entity
 *
 * Represents a geographic location where opportunities are published.
 * Each city can have multiple city managers who can create opportunities.
 */
export class City {
  private constructor(
    public readonly id: number,
    private _name: string,
    private _slug: CitySlug,
    private _imageUrl: string,
    private _description: string | null,
    private _active: boolean,
    private _displayOrder: number,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Factory method to create a City from props
   */
  static create(props: CityProps): City {
    return new City(
      props.id,
      props.name,
      props.slug,
      props.imageUrl,
      props.description,
      props.active,
      props.displayOrder,
      props.createdAt,
      props.updatedAt
    )
  }

  /**
   * Factory method to create a new City (for initial creation)
   */
  static createNew(
    id: number,
    name: string,
    slug: string,
    imageUrl: string,
    options?: {
      description?: string
      active?: boolean
      displayOrder?: number
    }
  ): City {
    const citySlug = CitySlug.create(slug)
    if (!citySlug) {
      throw new Error('Invalid city slug format')
    }

    const now = new Date()
    return new City(
      id,
      name,
      citySlug,
      imageUrl,
      options?.description || null,
      options?.active ?? true,
      options?.displayOrder ?? 0,
      now,
      now
    )
  }

  // Getters
  get name(): string {
    return this._name
  }

  getName(): string {
    return this._name
  }

  get slug(): CitySlug {
    return this._slug
  }

  get imageUrl(): string {
    return this._imageUrl
  }

  get description(): string | null {
    return this._description
  }

  get active(): boolean {
    return this._active
  }

  get displayOrder(): number {
    return this._displayOrder
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Update city details
   */
  update(updates: {
    name?: string
    slug?: string
    imageUrl?: string
    description?: string | null
    active?: boolean
    displayOrder?: number
  }): void {
    if (updates.name !== undefined) {
      this._name = updates.name
    }
    if (updates.slug !== undefined) {
      const newSlug = CitySlug.create(updates.slug)
      if (!newSlug) {
        throw new Error('Invalid city slug format')
      }
      this._slug = newSlug
    }
    if (updates.imageUrl !== undefined) {
      this._imageUrl = updates.imageUrl
    }
    if (updates.description !== undefined) {
      this._description = updates.description
    }
    if (updates.active !== undefined) {
      this._active = updates.active
    }
    if (updates.displayOrder !== undefined) {
      this._displayOrder = updates.displayOrder
    }

    this._updatedAt = new Date()
    this.validate()
  }

  /**
   * Activate the city (make it visible)
   */
  activate(): void {
    this._active = true
    this._updatedAt = new Date()
  }

  /**
   * Deactivate the city (hide it from public view)
   */
  deactivate(): void {
    this._active = false
    this._updatedAt = new Date()
  }

  /**
   * Check if city is currently accepting opportunities
   */
  isAcceptingOpportunities(): boolean {
    return this._active
  }

  /**
   * Validate city business rules
   */
  private validate(): void {
    // ID validation
    if (!this.id || this.id <= 0) {
      throw new Error('City ID must be a positive number')
    }

    // Name validation
    if (!this._name || this._name.trim() === '') {
      throw new Error('City name cannot be empty')
    }
    if (this._name.length < 2) {
      throw new Error('City name must be at least 2 characters')
    }
    if (this._name.length > 100) {
      throw new Error('City name cannot exceed 100 characters')
    }

    // Image URL validation
    if (!this._imageUrl || this._imageUrl.trim() === '') {
      throw new Error('City image URL cannot be empty')
    }
    try {
      new URL(this._imageUrl)
    } catch {
      throw new Error('City image URL must be a valid URL')
    }

    // Description validation (optional but length limit)
    if (this._description && this._description.length > 500) {
      throw new Error('City description cannot exceed 500 characters')
    }

    // Display order validation
    if (this._displayOrder < 0) {
      throw new Error('Display order cannot be negative')
    }

    // Date validation
    if (this.createdAt > this._updatedAt) {
      throw new Error('Created date cannot be after updated date')
    }
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): CityProps {
    return {
      id: this.id,
      name: this._name,
      slug: this._slug,
      imageUrl: this._imageUrl,
      description: this._description,
      active: this._active,
      displayOrder: this._displayOrder,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    }
  }
}
