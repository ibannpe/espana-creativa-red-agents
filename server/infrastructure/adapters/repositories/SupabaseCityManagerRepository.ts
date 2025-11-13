// ABOUTME: Supabase implementation of CityManagerRepository port
// ABOUTME: Handles city_managers junction table operations

import { SupabaseClient } from '@supabase/supabase-js'
import { UserId } from '../../../domain/value-objects/UserId'
import {
  CityManagerRepository,
  CityManagerAssignment
} from '../../../application/ports/CityManagerRepository'

interface CityManagerRow {
  user_id: string
  city_id: number
  created_at: string
}

/**
 * SupabaseCityManagerRepository
 *
 * Infrastructure adapter for city manager persistence using Supabase.
 * Implements CityManagerRepository port from application layer.
 */
export class SupabaseCityManagerRepository implements CityManagerRepository {
  constructor(private supabase: SupabaseClient) {}

  async assignManager(userId: UserId, cityId: number): Promise<void> {
    const { error } = await this.supabase
      .from('city_managers')
      .insert({
        user_id: userId.getValue(),
        city_id: cityId
      })

    if (error) {
      throw new Error(`Failed to assign city manager: ${error.message}`)
    }
  }

  async removeManager(userId: UserId, cityId: number): Promise<void> {
    const { error } = await this.supabase
      .from('city_managers')
      .delete()
      .eq('user_id', userId.getValue())
      .eq('city_id', cityId)

    if (error) {
      throw new Error(`Failed to remove city manager: ${error.message}`)
    }
  }

  async getCitiesByManager(userId: UserId): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('city_managers')
      .select('city_id')
      .eq('user_id', userId.getValue())

    if (error || !data) {
      return []
    }

    return data.map(row => row.city_id)
  }

  async getManagersByCity(cityId: number): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('city_managers')
      .select('user_id')
      .eq('city_id', cityId)

    if (error || !data) {
      return []
    }

    return data.map(row => row.user_id)
  }

  async isManagerOfCity(userId: UserId, cityId: number): Promise<boolean> {
    const { count } = await this.supabase
      .from('city_managers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId.getValue())
      .eq('city_id', cityId)

    return (count || 0) > 0
  }

  async isManager(userId: UserId): Promise<boolean> {
    const { count } = await this.supabase
      .from('city_managers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId.getValue())

    return (count || 0) > 0
  }

  async getAssignmentsByUser(userId: UserId): Promise<CityManagerAssignment[]> {
    const { data, error } = await this.supabase
      .from('city_managers')
      .select('*')
      .eq('user_id', userId.getValue())

    if (error || !data) {
      return []
    }

    return data.map(row => ({
      userId: row.user_id,
      cityId: row.city_id,
      assignedAt: new Date(row.created_at)
    }))
  }
}
