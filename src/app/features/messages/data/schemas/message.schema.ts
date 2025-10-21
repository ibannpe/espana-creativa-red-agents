// ABOUTME: Message schemas with Zod validation for messages and conversations
// ABOUTME: Defines types for Message, Conversation, and their request/response schemas

import { z } from 'zod'

/**
 * Base message schema representing a single message
 */
export const messageSchema = z.object({
  id: z.string().uuid(),
  sender_id: z.string().uuid(),
  recipient_id: z.string().uuid(),
  content: z.string(),
  read_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export type Message = z.infer<typeof messageSchema>

/**
 * User info for message display
 */
export const messageUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  avatar_url: z.string().url().nullable()
})

export type MessageUser = z.infer<typeof messageUserSchema>

/**
 * Message with sender and recipient user info
 */
export const messageWithUsersSchema = messageSchema.extend({
  sender: messageUserSchema,
  recipient: messageUserSchema
})

export type MessageWithUsers = z.infer<typeof messageWithUsersSchema>

/**
 * Conversation summary between two users
 */
export const conversationSchema = z.object({
  user: messageUserSchema,
  last_message: messageSchema,
  unread_count: z.number().int().min(0)
})

export type Conversation = z.infer<typeof conversationSchema>

/**
 * Request to send a new message
 */
export const sendMessageRequestSchema = z.object({
  recipient_id: z.string().uuid({ message: 'ID de destinatario inválido' }),
  content: z.string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(5000, 'El mensaje no puede superar 5000 caracteres')
})

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>

/**
 * Request to mark messages as read
 */
export const markAsReadRequestSchema = z.object({
  message_ids: z.array(z.string().uuid()).min(1, 'Debes especificar al menos un mensaje')
})

export type MarkAsReadRequest = z.infer<typeof markAsReadRequestSchema>

/**
 * Request to get conversation with a specific user
 */
export const getConversationRequestSchema = z.object({
  user_id: z.string().uuid({ message: 'ID de usuario inválido' }),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().min(0).optional()
})

export type GetConversationRequest = z.infer<typeof getConversationRequestSchema>

/**
 * Response schemas with validation
 */
export const getConversationsResponseSchema = z.object({
  conversations: z.array(conversationSchema),
  total: z.number().int().min(0)
})

export type GetConversationsResponse = z.infer<typeof getConversationsResponseSchema>

export const getConversationMessagesResponseSchema = z.object({
  messages: z.array(messageWithUsersSchema),
  total: z.number().int().min(0)
})

export type GetConversationMessagesResponse = z.infer<typeof getConversationMessagesResponseSchema>

export const sendMessageResponseSchema = z.object({
  message: messageWithUsersSchema
})

export type SendMessageResponse = z.infer<typeof sendMessageResponseSchema>

export const markAsReadResponseSchema = z.object({
  updated_count: z.number().int().min(0)
})

export type MarkAsReadResponse = z.infer<typeof markAsReadResponseSchema>

export const getUnreadCountResponseSchema = z.object({
  unread_count: z.number().int().min(0)
})

export type GetUnreadCountResponse = z.infer<typeof getUnreadCountResponseSchema>
