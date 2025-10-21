// ABOUTME: MessageRepository port interface defining message and conversation data access operations
// ABOUTME: Follows hexagonal architecture - defines contract for infrastructure adapters

import { Message } from '../../domain/entities/Message'

export interface MessageWithUsers {
  message: Message
  sender: {
    id: string
    name: string
    avatar_url: string | null
  }
  recipient: {
    id: string
    name: string
    avatar_url: string | null
  }
}

export interface Conversation {
  user: {
    id: string
    name: string
    avatar_url: string | null
  }
  lastMessage: Message
  unreadCount: number
}

export interface GetConversationMessagesParams {
  userId: string
  otherUserId: string
  limit?: number
  offset?: number
}

/**
 * MessageRepository Port
 *
 * Defines the contract for message data persistence.
 * Implementations must be provided in the infrastructure layer.
 */
export interface MessageRepository {
  /**
   * Find a message by ID
   */
  findById(id: string): Promise<Message | null>

  /**
   * Find message by ID with user information
   */
  findByIdWithUsers(id: string): Promise<MessageWithUsers | null>

  /**
   * Get all conversations for a user
   * Returns list of users with last message and unread count
   */
  findConversations(userId: string): Promise<Conversation[]>

  /**
   * Get messages in a conversation between two users
   */
  findConversationMessages(
    params: GetConversationMessagesParams
  ): Promise<MessageWithUsers[]>

  /**
   * Get unread message count for a user
   */
  getUnreadCount(userId: string): Promise<number>

  /**
   * Create a new message
   */
  create(message: Message): Promise<Message>

  /**
   * Update an existing message (for marking as read)
   */
  update(message: Message): Promise<Message>

  /**
   * Mark multiple messages as read
   */
  markAsRead(messageIds: string[]): Promise<number>

  /**
   * Delete a message
   */
  delete(id: string): Promise<void>

  /**
   * Check if message exists
   */
  exists(id: string): Promise<boolean>
}
