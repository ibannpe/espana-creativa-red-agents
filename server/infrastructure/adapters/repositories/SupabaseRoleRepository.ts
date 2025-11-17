// ABOUTME: Supabase implementation of RoleRepository port
// ABOUTME: Handles role data persistence and retrieval using Supabase client

import { SupabaseClient } from '@supabase/supabase-js'
import { Role, RoleRepository } from '../../../application/ports/RoleRepository'

export class SupabaseRoleRepository implements RoleRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(roleId: number): Promise<Role | null> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToRole(data)
  }

  async findByName(name: string): Promise<Role | null> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .eq('name', name)
      .single()

    if (error || !data) {
      return null
    }

    return this.mapToRole(data)
  }

  async findAll(): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .order('id', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map(row => this.mapToRole(row))
  }

  private mapToRole(data: any): Role {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at)
    }
  }
}
