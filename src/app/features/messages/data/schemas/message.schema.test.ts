// ABOUTME: Unit tests for message Zod schemas
// ABOUTME: Tests validation rules for messages, conversations, and request schemas

import { describe, it, expect } from 'vitest'
import {
  messageSchema,
  messageUserSchema,
  messageWithUsersSchema,
  conversationSchema,
  sendMessageRequestSchema,
  markAsReadRequestSchema,
  getConversationRequestSchema,
  getConversationsResponseSchema,
  getConversationMessagesResponseSchema,
  sendMessageResponseSchema,
  markAsReadResponseSchema,
  getUnreadCountResponseSchema
} from './message.schema'

describe('Message Schemas', () => {
  describe('messageSchema', () => {
    it('should validate correct message', () => {
      const validMessage = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sender_id: '550e8400-e29b-41d4-a716-446655440001',
        recipient_id: '550e8400-e29b-41d4-a716-446655440002',
        content: 'Hello, this is a test message',
        read_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = messageSchema.safeParse(validMessage)
      expect(result.success).toBe(true)
    })

    it('should validate message with read_at timestamp', () => {
      const validMessage = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sender_id: '550e8400-e29b-41d4-a716-446655440001',
        recipient_id: '550e8400-e29b-41d4-a716-446655440002',
        content: 'Test message',
        read_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = messageSchema.safeParse(validMessage)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID for id', () => {
      const invalidMessage = {
        id: 'not-a-uuid',
        sender_id: '550e8400-e29b-41d4-a716-446655440001',
        recipient_id: '550e8400-e29b-41d4-a716-446655440002',
        content: 'Test',
        read_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = messageSchema.safeParse(invalidMessage)
      expect(result.success).toBe(false)
    })
  })

  describe('messageUserSchema', () => {
    it('should validate correct message user', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test User',
        avatar_url: null
      }

      const result = messageUserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should validate message user with avatar URL', () => {
      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg'
      }

      const result = messageUserSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('should reject invalid avatar URL', () => {
      const invalidUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test User',
        avatar_url: 'not-a-url'
      }

      const result = messageUserSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('conversationSchema', () => {
    it('should validate correct conversation', () => {
      const validConversation = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test User',
          avatar_url: null
        },
        last_message: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          sender_id: '550e8400-e29b-41d4-a716-446655440002',
          recipient_id: '550e8400-e29b-41d4-a716-446655440000',
          content: 'Last message',
          read_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        unread_count: 5
      }

      const result = conversationSchema.safeParse(validConversation)
      expect(result.success).toBe(true)
    })

    it('should reject negative unread_count', () => {
      const invalidConversation = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Test User',
          avatar_url: null
        },
        last_message: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          sender_id: '550e8400-e29b-41d4-a716-446655440002',
          recipient_id: '550e8400-e29b-41d4-a716-446655440000',
          content: 'Last message',
          read_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        unread_count: -1
      }

      const result = conversationSchema.safeParse(invalidConversation)
      expect(result.success).toBe(false)
    })
  })

  describe('sendMessageRequestSchema', () => {
    it('should validate correct send message request', () => {
      const validRequest = {
        recipient_id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'This is a valid message'
      }

      const result = sendMessageRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject empty content', () => {
      const invalidRequest = {
        recipient_id: '550e8400-e29b-41d4-a716-446655440000',
        content: ''
      }

      const result = sendMessageRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('vacío')
      }
    })

    it('should reject content exceeding 5000 characters', () => {
      const invalidRequest = {
        recipient_id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'a'.repeat(5001)
      }

      const result = sendMessageRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5000')
      }
    })

    it('should reject invalid recipient_id UUID', () => {
      const invalidRequest = {
        recipient_id: 'not-a-uuid',
        content: 'Valid message'
      }

      const result = sendMessageRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('markAsReadRequestSchema', () => {
    it('should validate correct mark as read request', () => {
      const validRequest = {
        message_ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001'
        ]
      }

      const result = markAsReadRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject empty message_ids array', () => {
      const invalidRequest = {
        message_ids: []
      }

      const result = markAsReadRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos un mensaje')
      }
    })

    it('should reject invalid UUID in message_ids', () => {
      const invalidRequest = {
        message_ids: ['not-a-uuid']
      }

      const result = markAsReadRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('getConversationRequestSchema', () => {
    it('should validate correct get conversation request', () => {
      const validRequest = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 20,
        offset: 0
      }

      const result = getConversationRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should validate request without pagination', () => {
      const validRequest = {
        user_id: '550e8400-e29b-41d4-a716-446655440000'
      }

      const result = getConversationRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject negative offset', () => {
      const invalidRequest = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        offset: -1
      }

      const result = getConversationRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject zero or negative limit', () => {
      const invalidRequest = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        limit: 0
      }

      const result = getConversationRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('Response Schemas', () => {
    it('should validate getConversationsResponseSchema', () => {
      const validResponse = {
        conversations: [],
        total: 0
      }

      const result = getConversationsResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate getConversationMessagesResponseSchema', () => {
      const validResponse = {
        messages: [],
        total: 0
      }

      const result = getConversationMessagesResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should validate markAsReadResponseSchema', () => {
      const validResponse = {
        updated_count: 5
      }

      const result = markAsReadResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should reject negative updated_count', () => {
      const invalidResponse = {
        updated_count: -1
      }

      const result = markAsReadResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })

    it('should validate getUnreadCountResponseSchema', () => {
      const validResponse = {
        unread_count: 10
      }

      const result = getUnreadCountResponseSchema.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should reject negative unread_count', () => {
      const invalidResponse = {
        unread_count: -1
      }

      const result = getUnreadCountResponseSchema.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })
})
