// ABOUTME: Test data builder for Connection entities with fluent interface
// ABOUTME: Provides easy creation of connections in various states for testing

import { Connection, ConnectionStatus } from '../../domain/entities/Connection'
import { generateTestId } from '../utils/testHelpers'

export class ConnectionBuilder {
  private id: string = generateTestId()
  private requesterId: string = generateTestId()
  private addresseeId: string = generateTestId()
  private status: ConnectionStatus = 'pending'
  private createdAt: Date = new Date('2024-01-01')
  private updatedAt: Date = new Date('2024-01-01')

  withId(id: string): this {
    this.id = id
    return this
  }

  withRequesterId(requesterId: string): this {
    this.requesterId = requesterId
    return this
  }

  withAddresseeId(addresseeId: string): this {
    this.addresseeId = addresseeId
    return this
  }

  withStatus(status: ConnectionStatus): this {
    this.status = status
    return this
  }

  withCreatedAt(date: Date): this {
    this.createdAt = date
    return this
  }

  withUpdatedAt(date: Date): this {
    this.updatedAt = date
    return this
  }

  /**
   * Creates a connection between two specific users
   */
  between(requesterId: string, addresseeId: string): this {
    this.requesterId = requesterId
    this.addresseeId = addresseeId
    return this
  }

  /**
   * Creates a pending connection (default state)
   */
  asPending(): this {
    this.status = 'pending'
    return this
  }

  /**
   * Creates an accepted connection
   */
  asAccepted(): this {
    this.status = 'accepted'
    return this
  }

  /**
   * Creates a rejected connection
   */
  asRejected(): this {
    this.status = 'rejected'
    return this
  }

  /**
   * Creates a blocked connection
   */
  asBlocked(): this {
    this.status = 'blocked'
    return this
  }

  /**
   * Builds and returns the Connection entity
   */
  build(): Connection {
    return Connection.create({
      id: this.id,
      requesterId: this.requesterId,
      addresseeId: this.addresseeId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    })
  }

  /**
   * Builds a pending connection request (convenience method)
   */
  buildRequest(): Connection {
    return Connection.createRequest(this.id, this.requesterId, this.addresseeId)
  }
}

/**
 * Usage examples:
 *
 * const pending = new ConnectionBuilder().build()
 * const accepted = new ConnectionBuilder().asAccepted().build()
 * const userConnection = new ConnectionBuilder()
 *   .between('user-1', 'user-2')
 *   .asAccepted()
 *   .build()
 */
