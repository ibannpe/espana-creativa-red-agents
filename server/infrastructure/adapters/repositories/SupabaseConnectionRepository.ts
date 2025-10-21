// ABOUTME: Supabase implementation of ConnectionRepository port
// ABOUTME: Handles connection data persistence with Supabase PostgreSQL database

import { SupabaseClient } from '@supabase/supabase-js'
import { Connection, ConnectionStatus } from '../../../domain/entities/Connection'
import {
  ConnectionRepository,
  ConnectionWithUser,
  GetConnectionsParams,
  NetworkStats
} from '../../../application/ports/ConnectionRepository'

interface ConnectionRow {
  id: string
  requester_id: string
  addressee_id: string
  status: ConnectionStatus
  created_at: string
  updated_at: string
}

interface UserRow {
  id: string
  name: string
  avatar_url: string | null
  professional_title: string | null
}

/**
 * SupabaseConnectionRepository
 *
 * Infrastructure adapter for connection persistence using Supabase.
 * Implements ConnectionRepository port from application layer.
 */
export class SupabaseConnectionRepository implements ConnectionRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Connection | null> {
    const { data, error } = await this.supabase
      .from('connections')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findBetweenUsers(userId1: string, userId2: string): Promise<Connection | null> {
    const { data, error } = await this.supabase
      .from('connections')
      .select('*')
      .or(
        `and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`
      )
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByUser(params: GetConnectionsParams): Promise<ConnectionWithUser[]> {
    let query = this.supabase
      .from('connections')
      .select(`
        *,
        requester:users!connections_requester_id_fkey(id, name, avatar_url, professional_title),
        addressee:users!connections_addressee_id_fkey(id, name, avatar_url, professional_title)
      `)
      .or(`requester_id.eq.${params.userId},addressee_id.eq.${params.userId}`)

    if (params.status) {
      query = query.eq('status', params.status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((row: any) => {
      const connection = this.toDomain(row)
      // Return the OTHER user in the connection
      const isRequester = connection.requesterId === params.userId
      const otherUser = isRequester ? row.addressee : row.requester

      return {
        connection,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          avatar_url: otherUser.avatar_url,
          professional_title: otherUser.professional_title
        }
      }
    })
  }

  async getNetworkStats(userId: string): Promise<NetworkStats> {
    // Total accepted connections
    const { count: totalConnections } = await this.supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

    // Pending requests received (where user is addressee)
    const { count: pendingRequests } = await this.supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('addressee_id', userId)

    // Pending requests sent (where user is requester)
    const { count: sentRequests } = await this.supabase
      .from('connections')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('requester_id', userId)

    return {
      total_connections: totalConnections || 0,
      pending_requests: pendingRequests || 0,
      sent_requests: sentRequests || 0
    }
  }

  async getMutualConnections(userId1: string, userId2: string): Promise<ConnectionWithUser[]> {
    // Get all accepted connections for userId1
    const { data: user1Connections } = await this.supabase
      .from('connections')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId1},addressee_id.eq.${userId1}`)

    if (!user1Connections || user1Connections.length === 0) {
      return []
    }

    // Extract connected user IDs for userId1
    const user1ConnectedIds = user1Connections.map((conn) =>
      conn.requester_id === userId1 ? conn.addressee_id : conn.requester_id
    )

    // Find connections for userId2 that are also in user1's connections
    const { data, error } = await this.supabase
      .from('connections')
      .select(`
        *,
        requester:users!connections_requester_id_fkey(id, name, avatar_url, professional_title),
        addressee:users!connections_addressee_id_fkey(id, name, avatar_url, professional_title)
      `)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId2},addressee_id.eq.${userId2}`)

    if (error || !data) {
      return []
    }

    // Filter to only mutual connections
    const mutualConnections = data.filter((row: any) => {
      const otherId = row.requester_id === userId2 ? row.addressee_id : row.requester_id
      return user1ConnectedIds.includes(otherId)
    })

    return mutualConnections.map((row: any) => {
      const connection = this.toDomain(row)
      const isRequester = connection.requesterId === userId2
      const otherUser = isRequester ? row.addressee : row.requester

      return {
        connection,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          avatar_url: otherUser.avatar_url,
          professional_title: otherUser.professional_title
        }
      }
    })
  }

  async create(connection: Connection): Promise<Connection> {
    const row = this.toRow(connection)

    const { data, error } = await this.supabase
      .from('connections')
      .upsert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create connection: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async update(connection: Connection): Promise<Connection> {
    const row = this.toRow(connection)

    const { data, error } = await this.supabase
      .from('connections')
      .update(row)
      .eq('id', connection.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update connection: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('connections').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete connection: ${error.message}`)
    }
  }

  async existsBetweenUsers(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.findBetweenUsers(userId1, userId2)
    return connection !== null
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: ConnectionRow): Connection {
    return Connection.create({
      id: row.id,
      requesterId: row.requester_id,
      addresseeId: row.addressee_id,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(connection: Connection): Omit<ConnectionRow, 'created_at' | 'updated_at'> & {
    created_at?: string
    updated_at?: string
  } {
    return {
      id: connection.id,
      requester_id: connection.requesterId,
      addressee_id: connection.addresseeId,
      status: connection.status,
      created_at: connection.createdAt.toISOString(),
      updated_at: connection.updatedAt.toISOString()
    }
  }
}
