// ABOUTME: ConnectionRepository port interface defining connection data access operations
// ABOUTME: Follows hexagonal architecture - defines contract for infrastructure adapters

import { Connection, ConnectionStatus } from '../../domain/entities/Connection'

export interface NetworkStats {
  total_connections: number
  pending_requests: number
  sent_requests: number
}

export interface ConnectionWithUser {
  connection: Connection
  user: {
    id: string
    name: string
    avatar_url: string | null
    professional_title: string | null
  }
}

export interface GetConnectionsParams {
  userId: string
  status?: ConnectionStatus
}

/**
 * ConnectionRepository Port
 *
 * Defines the contract for connection data persistence.
 * Implementations must be provided in the infrastructure layer.
 */
export interface ConnectionRepository {
  /**
   * Find a connection by ID
   */
  findById(id: string): Promise<Connection | null>

  /**
   * Find connection between two users (regardless of who requested)
   */
  findBetweenUsers(userId1: string, userId2: string): Promise<Connection | null>

  /**
   * Get all connections for a user (optionally filtered by status)
   */
  findByUser(params: GetConnectionsParams): Promise<ConnectionWithUser[]>

  /**
   * Get network statistics for a user
   */
  getNetworkStats(userId: string): Promise<NetworkStats>

  /**
   * Get mutual connections between two users
   */
  getMutualConnections(userId1: string, userId2: string): Promise<ConnectionWithUser[]>

  /**
   * Create a new connection request
   */
  create(connection: Connection): Promise<Connection>

  /**
   * Update an existing connection
   */
  update(connection: Connection): Promise<Connection>

  /**
   * Delete a connection
   */
  delete(id: string): Promise<void>

  /**
   * Check if connection exists between two users
   */
  existsBetweenUsers(userId1: string, userId2: string): Promise<boolean>
}
