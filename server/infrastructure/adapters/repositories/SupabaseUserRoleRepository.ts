// ABOUTME: Supabase implementation of UserRoleRepository port
// ABOUTME: Handles user-role assignment operations with automatic audit logging via triggers

import { SupabaseClient } from '@supabase/supabase-js'
import { UserRoleRepository } from '../../../application/ports/UserRoleRepository'
import { UserId } from '../../../domain/value-objects/UserId'

export class SupabaseUserRoleRepository implements UserRoleRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async assignRole(userId: UserId, roleId: number): Promise<void> {
    const { error } = await this.supabase
      .from('user_roles')
      .insert({
        user_id: userId.getValue(),
        role_id: roleId
      })

    if (error) {
      throw new Error(`Failed to assign role: ${error.message}`)
    }
  }

  async removeRole(userId: UserId, roleId: number): Promise<void> {
    const { error } = await this.supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId.getValue())
      .eq('role_id', roleId)

    if (error) {
      throw new Error(`Failed to remove role: ${error.message}`)
    }
  }

  async getUserRoleIds(userId: UserId): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId.getValue())

    if (error) {
      throw new Error(`Failed to get user roles: ${error.message}`)
    }

    return data?.map(row => row.role_id) || []
  }

  async hasRole(userId: UserId, roleId: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId.getValue())
      .eq('role_id', roleId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to check role: ${error.message}`)
    }

    return !!data
  }
}
