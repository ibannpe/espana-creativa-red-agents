// ABOUTME: Supabase implementation of MessageRepository port
// ABOUTME: Handles message persistence with conversation grouping and unread count tracking

import { SupabaseClient } from '@supabase/supabase-js'
import { Message } from '../../../domain/entities/Message'
import {
  MessageRepository,
  MessageWithUsers,
  Conversation,
  GetConversationMessagesParams
} from '../../../application/ports/MessageRepository'

interface MessageRow {
  id: string | number // BIGSERIAL from database returns as number
  sender_id: string
  recipient_id: string
  content: string
  read_at: string | null
  created_at: string
  updated_at: string
}

interface UserRow {
  id: string
  name: string
  avatar_url: string | null
}

/**
 * SupabaseMessageRepository
 *
 * Infrastructure adapter for message persistence using Supabase.
 * Implements MessageRepository port from application layer.
 */
export class SupabaseMessageRepository implements MessageRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Message | null> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return this.toDomain(data)
  }

  async findByIdWithUsers(id: string): Promise<MessageWithUsers | null> {
    const { data: message, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !message) {
      return null
    }

    // Fetch user information separately
    const { data: users } = await this.supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', [message.sender_id, message.recipient_id])

    const userMap = new Map<string, UserRow>()
    users?.forEach((user: UserRow) => {
      userMap.set(user.id, user)
    })

    const sender = userMap.get(message.sender_id) || {
      id: message.sender_id,
      name: 'Unknown',
      avatar_url: null
    }
    const recipient = userMap.get(message.recipient_id) || {
      id: message.recipient_id,
      name: 'Unknown',
      avatar_url: null
    }

    return {
      message: this.toDomain(message),
      sender: {
        id: sender.id,
        name: sender.name,
        avatar_url: sender.avatar_url
      },
      recipient: {
        id: recipient.id,
        name: recipient.name,
        avatar_url: recipient.avatar_url
      }
    }
  }

  async findConversations(userId: string): Promise<Conversation[]> {
    // Get all messages where user is involved (sender or recipient)
    const { data: messages, error } = await this.supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error || !messages) {
      return []
    }

    if (messages.length === 0) {
      return []
    }

    // Get unique user IDs
    const userIds = new Set<string>()
    messages.forEach((msg: any) => {
      userIds.add(msg.sender_id)
      userIds.add(msg.recipient_id)
    })

    // Fetch user information
    const { data: users } = await this.supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', Array.from(userIds))

    const userMap = new Map<string, UserRow>()
    users?.forEach((user: UserRow) => {
      userMap.set(user.id, user)
    })

    // Group by other user and get last message + unread count
    const conversationsMap = new Map<string, Conversation>()

    for (const msgRow of messages) {
      const message = this.toDomain(msgRow)
      const otherUserId = message.senderId === userId ? message.recipientId : message.senderId
      const otherUser = userMap.get(otherUserId) || {
        id: otherUserId,
        name: 'Unknown',
        avatar_url: null
      }

      if (!conversationsMap.has(otherUserId)) {
        // Count unread messages from this user
        const unreadCount = messages.filter(
          (m: any) =>
            m.sender_id === otherUserId &&
            m.recipient_id === userId &&
            m.read_at === null
        ).length

        conversationsMap.set(otherUserId, {
          user: {
            id: otherUser.id,
            name: otherUser.name,
            avatar_url: otherUser.avatar_url
          },
          lastMessage: message,
          unreadCount
        })
      }
    }

    // Convert to array and sort by last message date
    return Array.from(conversationsMap.values()).sort((a, b) =>
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    )
  }

  async findConversationMessages(
    params: GetConversationMessagesParams
  ): Promise<MessageWithUsers[]> {
    console.log('[SupabaseMessageRepository] findConversationMessages called with:', {
      userId: params.userId,
      otherUserId: params.otherUserId,
      limit: params.limit,
      offset: params.offset
    })

    // Build query for messages between two specific users
    // Using separate queries for simplicity
    let query = this.supabase
      .from('messages')
      .select('*')

    // Filter for conversations between the two users (both directions)
    query = query.or(
      `and(sender_id.eq.${params.userId},recipient_id.eq.${params.otherUserId}),` +
      `and(sender_id.eq.${params.otherUserId},recipient_id.eq.${params.userId})`
    )

    query = query.order('created_at', { ascending: true })

    if (params.limit) {
      query = query.limit(params.limit)
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('[SupabaseMessageRepository] Error fetching conversation messages:', error)
      console.error('[SupabaseMessageRepository] Error details:', JSON.stringify(error, null, 2))
      return []
    }

    if (!data) {
      console.log('[SupabaseMessageRepository] No messages found for conversation')
      return []
    }

    console.log(`[SupabaseMessageRepository] Found ${data.length} messages between ${params.userId} and ${params.otherUserId}`)

    // If no messages, return empty array
    if (data.length === 0) {
      return []
    }

    // Get unique user IDs from messages
    const userIds = new Set<string>()
    data.forEach((msg: any) => {
      userIds.add(msg.sender_id)
      userIds.add(msg.recipient_id)
    })

    // Fetch user information for all users involved
    const { data: users, error: userError } = await this.supabase
      .from('users')
      .select('id, name, avatar_url')
      .in('id', Array.from(userIds))

    if (userError) {
      console.error('[SupabaseMessageRepository] Error fetching users:', userError)
      // Return messages without user info if user fetch fails
      return data.map((row: any) => ({
        message: this.toDomain(row),
        sender: {
          id: row.sender_id,
          name: 'Unknown',
          avatar_url: null
        },
        recipient: {
          id: row.recipient_id,
          name: 'Unknown',
          avatar_url: null
        }
      }))
    }

    // Create a map of users by ID
    const userMap = new Map<string, UserRow>()
    users?.forEach((user: UserRow) => {
      userMap.set(user.id, user)
    })

    // Map messages with user information
    return data.map((row: any) => {
      const sender = userMap.get(row.sender_id) || {
        id: row.sender_id,
        name: 'Unknown',
        avatar_url: null
      }
      const recipient = userMap.get(row.recipient_id) || {
        id: row.recipient_id,
        name: 'Unknown',
        avatar_url: null
      }

      return {
        message: this.toDomain(row),
        sender: {
          id: sender.id,
          name: sender.name,
          avatar_url: sender.avatar_url
        },
        recipient: {
          id: recipient.id,
          name: recipient.name,
          avatar_url: recipient.avatar_url
        }
      }
    })
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null)

    return count || 0
  }

  async create(message: Message): Promise<Message> {
    const row = this.toRow(message)
    // Remove id since it's auto-generated by database (BIGSERIAL)
    const { id, ...rowWithoutId } = row

    const { data, error } = await this.supabase
      .from('messages')
      .insert(rowWithoutId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create message: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async update(message: Message): Promise<Message> {
    const row = this.toRow(message)

    const { data, error } = await this.supabase
      .from('messages')
      .update(row)
      .eq('id', message.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update message: ${error.message}`)
    }

    return this.toDomain(data)
  }

  async markAsRead(messageIds: string[]): Promise<number> {
    const { error, count } = await this.supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .is('read_at', null) // Only update if not already read

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`)
    }

    return count || 0
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('messages').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`)
    }
  }

  async exists(id: string): Promise<boolean> {
    const { count } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('id', id)

    return (count || 0) > 0
  }

  /**
   * Convert database row to domain entity
   */
  private toDomain(row: MessageRow): Message {
    return Message.create({
      id: String(row.id), // Convert bigint to string
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      content: row.content,
      readAt: row.read_at ? new Date(row.read_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    })
  }

  /**
   * Convert domain entity to database row
   */
  private toRow(message: Message): Omit<MessageRow, 'created_at' | 'updated_at'> & {
    created_at?: string
    updated_at?: string
  } {
    return {
      id: message.id,
      sender_id: message.senderId,
      recipient_id: message.recipientId,
      content: message.content,
      read_at: message.readAt ? message.readAt.toISOString() : null,
      created_at: message.createdAt.toISOString(),
      updated_at: message.updatedAt.toISOString()
    }
  }
}
