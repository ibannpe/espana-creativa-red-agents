// ABOUTME: Supabase implementation of CityRepository port
// ABOUTME: Handles city data persistence with opportunity count aggregation

import { SupabaseClient } from '@supabase/supabase-js'
import { City } from '../../../domain/entities/City'
import { CitySlug } from '../../../domain/value-objects/CitySlug'
import { CityRepository, CityWithOpportunityCount } from '../../../application/ports/CityRepository'

interface CityRow {
  id: number
  name: string
  slug: string
  image_url: string
  description: string | null
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * SupabaseCityRepository
 *
 * Infrastructure adapter for city persistence using Supabase.
 * Implements CityRepository port from application layer.
 */
export class SupabaseCityRepository implements CityRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: number): Promise<City | null> {
    const { data, error } = await this.supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findBySlug(slug: CitySlug): Promise<City | null> {
    const { data, error } = await this.supabase
      .from('cities')
      .select('*')
      .eq('slug', slug.getValue())
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findAll(options?: { activeOnly?: boolean }): Promise<City[]> {
    let query = this.supabase.from('cities').select('*')

    if (options?.activeOnly) {
      query = query.eq('active', true)
    }

    query = query.order('display_order', { ascending: true })

    const { data, error } = await query

    if (error || !data) {
      return []
    }

    return data.map(row => this.toDomain(row))
  }

  async findAllWithOpportunityCount(
    options?: { activeOnly?: boolean }
  ): Promise<CityWithOpportunityCount[]> {
    // Query cities
    const cities = await this.findAll(options)

    // For each city, count active opportunities
    const citiesWithCounts = await Promise.all(
      cities.map(async city => {
        const { count } = await this.supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('city_id', city.id)
          .in('status', ['abierta', 'en_progreso'])  // Active statuses

        return {
          city,
          activeOpportunitiesCount: count || 0
        }
      })
    )

    return citiesWithCounts
  }

  async exists(id: number): Promise<boolean> {
    const { count } = await this.supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .eq('id', id)

    return (count || 0) > 0
  }

  async slugExists(slug: CitySlug, excludeCityId?: number): Promise<boolean> {
    let query = this.supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .eq('slug', slug.getValue())

    if (excludeCityId !== undefined) {
      query = query.neq('id', excludeCityId)
    }

    const { count } = await query

    return (count || 0) > 0
  }

  async create(city: City): Promise<City> {
    const row = this.toRow(city)

    const { data, error } = await this.supabase
      .from('cities')
      .insert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create city: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async update(city: City): Promise<City> {
    const row = this.toRow(city)

    const { data, error } = await this.supabase
      .from('cities')
      .update(row)
      .eq('id', city.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update city: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from('cities').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete city: ${error.message}`)
    }
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: CityRow): City {
    const slug = CitySlug.create(row.slug)
    if (!slug) {
      throw new Error(`Invalid city slug in database: ${row.slug}`)
    }

    return City.create({
      id: row.id,
      name: row.name,
      slug,
      imageUrl: row.image_url,
      description: row.description,
      active: row.active,
      displayOrder: row.display_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(city: City): Omit<CityRow, 'created_at' | 'updated_at'> & {
    created_at?: string
    updated_at?: string
  } {
    return {
      id: city.id,
      name: city.name,
      slug: city.slug.getValue(),
      image_url: city.imageUrl,
      description: city.description,
      active: city.active,
      display_order: city.displayOrder,
      created_at: city.createdAt.toISOString(),
      updated_at: city.updatedAt.toISOString()
    }
  }
}
