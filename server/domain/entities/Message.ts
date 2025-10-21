// ABOUTME: Message domain entity representing private messages between users
// ABOUTME: Contains business logic for message read status and validation rules

export interface MessageProps {
  id: string
  senderId: string
  recipientId: string
  content: string
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Message Domain Entity
 *
 * Represents a private message between two users.
 * Enforces business rules for message content and read status.
 */
export class Message {
  private constructor(
    public readonly id: string,
    public readonly senderId: string,
    public readonly recipientId: string,
    private _content: string,
    private _readAt: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date
  ) {
    this.validate()
  }

  /**
   * Factory method to create a Message from props
   */
  static create(props: MessageProps): Message {
    return new Message(
      props.id,
      props.senderId,
      props.recipientId,
      props.content,
      props.readAt,
      props.createdAt,
      props.updatedAt
    )
  }

  /**
   * Factory method to create a new Message
   */
  static createNew(
    id: string,
    senderId: string,
    recipientId: string,
    content: string
  ): Message {
    const now = new Date()
    return new Message(
      id,
      senderId,
      recipientId,
      content,
      null, // New messages start as unread
      now,
      now
    )
  }

  // Getters
  get content(): string {
    return this._content
  }

  get readAt(): Date | null {
    return this._readAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * Mark message as read
   */
  markAsRead(): void {
    if (this._readAt !== null) {
      // Already read, no-op
      return
    }
    this._readAt = new Date()
    this._updatedAt = new Date()
  }

  /**
   * Check if message is unread
   */
  isUnread(): boolean {
    return this._readAt === null
  }

  /**
   * Check if message is read
   */
  isRead(): boolean {
    return this._readAt !== null
  }

  /**
   * Check if user is the sender
   */
  isSender(userId: string): boolean {
    return this.senderId === userId
  }

  /**
   * Check if user is the recipient
   */
  isRecipient(userId: string): boolean {
    return this.recipientId === userId
  }

  /**
   * Check if user is involved in this message (sender or recipient)
   */
  involvesUser(userId: string): boolean {
    return this.isSender(userId) || this.isRecipient(userId)
  }

  /**
   * Get the other user in the conversation
   */
  getOtherUser(userId: string): string | null {
    if (this.senderId === userId) {
      return this.recipientId
    }
    if (this.recipientId === userId) {
      return this.senderId
    }
    return null
  }

  /**
   * Validate message business rules
   */
  private validate(): void {
    // ID validation
    if (!this.id || this.id.trim() === '') {
      throw new Error('Message ID cannot be empty')
    }

    // Sender validation
    if (!this.senderId || this.senderId.trim() === '') {
      throw new Error('Sender ID cannot be empty')
    }

    // Recipient validation
    if (!this.recipientId || this.recipientId.trim() === '') {
      throw new Error('Recipient ID cannot be empty')
    }

    // Business rule: Can't send message to yourself
    if (this.senderId === this.recipientId) {
      throw new Error('Cannot send message to yourself')
    }

    // Content validation
    if (!this._content || this._content.trim() === '') {
      throw new Error('Message content cannot be empty')
    }
    if (this._content.length > 5000) {
      throw new Error('Message content cannot exceed 5000 characters')
    }

    // Date validation
    if (this.createdAt > this._updatedAt) {
      throw new Error('Created date cannot be after updated date')
    }

    // Read date validation
    if (this._readAt !== null && this._readAt < this.createdAt) {
      throw new Error('Read date cannot be before created date')
    }
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): MessageProps {
    return {
      id: this.id,
      senderId: this.senderId,
      recipientId: this.recipientId,
      content: this._content,
      readAt: this._readAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt
    }
  }
}
