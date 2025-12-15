// ABOUTME: Supabase implementation of opportunity interest repository
// ABOUTME: Handles database operations for opportunity interests

import type { SupabaseClient } from '@supabase/supabase-js'
import type { IOpportunityInterestRepository } from '../../../application/ports/IOpportunityInterestRepository'
import type { OpportunityInterest, CreateOpportunityInterestData, UpdateOpportunityInterestData } from '../../../domain/entities/OpportunityInterest'

export class OpportunityInterestRepository implements IOpportunityInterestRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreateOpportunityInterestData): Promise<OpportunityInterest> {
    const { data: interest, error } = await this.supabase
      .from('opportunity_interests')
      .insert({
        opportunity_id: data.opportunityId,
        user_id: data.userId,
        message: data.message,
        status: 'pending'
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to create opportunity interest: ${error.message}`)
    }

    return this.mapToEntity(interest)
  }

  async findById(id: string): Promise<OpportunityInterest | null> {
    const { data, error } = await this.supabase
      .from('opportunity_interests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find opportunity interest: ${error.message}`)
    }

    return data ? this.mapToEntity(data) : null
  }

  async findByOpportunityAndUser(opportunityId: string, userId: string): Promise<OpportunityInterest | null> {
    const { data, error } = await this.supabase
      .from('opportunity_interests')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find opportunity interest: ${error.message}`)
    }

    return data ? this.mapToEntity(data) : null
  }

  async findByOpportunity(opportunityId: string): Promise<OpportunityInterest[]> {
    const { data, error } = await this.supabase
      .from('opportunity_interests')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch opportunity interests: ${error.message}`)
    }

    return data.map(item => this.mapToEntity(item))
  }

  async findByUser(userId: string): Promise<OpportunityInterest[]> {
    const { data, error } = await this.supabase
      .from('opportunity_interests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user interests: ${error.message}`)
    }

    return data.map(item => this.mapToEntity(item))
  }

  async update(id: string, updateData: UpdateOpportunityInterestData): Promise<OpportunityInterest> {
    const { data, error } = await this.supabase
      .from('opportunity_interests')
      .update({
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.message !== undefined && { message: updateData.message })
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Failed to update opportunity interest: ${error.message}`)
    }

    return this.mapToEntity(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('opportunity_interests')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete opportunity interest: ${error.message}`)
    }
  }

  async hasUserExpressedInterest(opportunityId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('opportunity_interests')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return false
      throw new Error(`Failed to check user interest: ${error.message}`)
    }

    return !!data
  }

  private mapToEntity(data: any): OpportunityInterest {
    return {
      id: data.id,
      opportunityId: data.opportunity_id,
      userId: data.user_id,
      message: data.message,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}
