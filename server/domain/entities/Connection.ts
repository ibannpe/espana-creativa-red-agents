// ABOUTME: Connection domain entity representing a network connection between two users
// ABOUTME: Contains business logic for connection status transitions and validation rules

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked'

export interface ConnectionProps {
  id: string
  requesterId: string
  addresseeId: string
  status: ConnectionStatus
  createdAt: Date
  updatedAt: Date
}

/**
 * Connection Domain Entity
 *
 * Represents a connection/relationship between two users in the network.
 * Enforces business rules for connection status transitions.
 */
export class Connection {
  private constructor(
    public readonly id: string,
    public readonly requesterId: string,
    public readonly addresseeId: string,
    private _status: ConnectionStatus,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Factory method to create a new Connection
   */
  static create(props: ConnectionProps): Connection {
    return new Connection(
      props.id,
      props.requesterId,
      props.addresseeId,
      props.status,
      props.createdAt,
      props.updatedAt
    )
  }

  /**
   * Factory method to create a new pending connection request
   */
  static createRequest(
    id: string,
    requesterId: string,
    addresseeId: string
  ): Connection {
    const now = new Date()
    return new Connection(
      id,
      requesterId,
      addresseeId,
      'pending',
      now,
      now
    )
  }

  get status(): ConnectionStatus {
    return this._status
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Accept a pending connection request
   * Business rule: Can only accept if status is 'pending'
   */
  accept(): void {
    if (this._status !== 'pending') {
      throw new Error(
        `Cannot accept connection with status '${this._status}'. Only 'pending' connections can be accepted.`
      )
    }
    this._status = 'accepted'
    this._updatedAt = new Date()
  }

  /**
   * Reject a pending connection request
   * Business rule: Can only reject if status is 'pending'
   */
  reject(): void {
    if (this._status !== 'pending') {
      throw new Error(
        `Cannot reject connection with status '${this._status}'. Only 'pending' connections can be rejected.`
      )
    }
    this._status = 'rejected'
    this._updatedAt = new Date()
  }

  /**
   * Block a user (can be done from any status)
   */
  block(): void {
    this._status = 'blocked'
    this._updatedAt = new Date()
  }

  /**
   * Check if connection involves a specific user (either as requester or addressee)
   */
  involvesUser(userId: string): boolean {
    return this.requesterId === userId || this.addresseeId === userId
  }

  /**
   * Get the other user in the connection
   */
  getOtherUser(userId: string): string | null {
    if (this.requesterId === userId) {
      return this.addresseeId
    }
    if (this.addresseeId === userId) {
      return this.requesterId
    }
    return null
  }

  /**
   * Check if user is the requester
   */
  isRequester(userId: string): boolean {
    return this.requesterId === userId
  }

  /**
   * Check if user is the addressee
   */
  isAddressee(userId: string): boolean {
    return this.addresseeId === userId
  }

  /**
   * Check if connection is active (accepted)
   */
  isActive(): boolean {
    return this._status === 'accepted'
  }

  /**
   * Check if connection is pending
   */
  isPending(): boolean {
    return this._status === 'pending'
  }

  /**
   * Validate connection business rules
   */
  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Connection ID cannot be empty')
    }

    if (!this.requesterId || this.requesterId.trim() === '') {
      throw new Error('Requester ID cannot be empty')
    }

    if (!this.addresseeId || this.addresseeId.trim() === '') {
      throw new Error('Addressee ID cannot be empty')
    }

    if (this.requesterId === this.addresseeId) {
      throw new Error('Cannot create connection with yourself')
    }

    const validStatuses: ConnectionStatus[] = ['pending', 'accepted', 'rejected', 'blocked']
    if (!validStatuses.includes(this._status)) {
      throw new Error(`Invalid connection status: ${this._status}`)
    }

    if (this.createdAt > this._updatedAt) {
      throw new Error('Created date cannot be after updated date')
    }
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): ConnectionProps {
    return {
      id: this.id,
      requesterId: this.requesterId,
      addresseeId: this.addresseeId,
      status: this._status,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    }
  }
}
