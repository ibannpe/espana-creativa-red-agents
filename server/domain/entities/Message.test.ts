// ABOUTME: Unit tests for Message domain entity
// ABOUTME: Tests message creation, validation, read status, and business rules

import { describe, it, expect } from 'vitest'
import { Message, MessageProps } from './Message'

describe('Message Entity', () => {
  const validMessageProps: MessageProps = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    senderId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    recipientId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    content: 'Hello, this is a test message',
    readAt: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  }

  describe('create', () => {
    it('should create a Message with valid props', () => {
      const message = Message.create(validMessageProps)

      expect(message.id).toBe(validMessageProps.id)
      expect(message.senderId).toBe(validMessageProps.senderId)
      expect(message.recipientId).toBe(validMessageProps.recipientId)
      expect(message.content).toBe(validMessageProps.content)
      expect(message.readAt).toBeNull()
    })

    it('should throw error for empty ID', () => {
      expect(() => {
        Message.create({ ...validMessageProps, id: '' })
      }).toThrow('Message ID cannot be empty')
    })

    it('should throw error for empty sender ID', () => {
      expect(() => {
        Message.create({ ...validMessageProps, senderId: '' })
      }).toThrow('Sender ID cannot be empty')
    })

    it('should throw error for empty recipient ID', () => {
      expect(() => {
        Message.create({ ...validMessageProps, recipientId: '' })
      }).toThrow('Recipient ID cannot be empty')
    })

    it('should throw error when sender equals recipient', () => {
      expect(() => {
        Message.create({
          ...validMessageProps,
          senderId: validMessageProps.recipientId,
          recipientId: validMessageProps.recipientId
        })
      }).toThrow('Cannot send message to yourself')
    })

    it('should throw error for empty content', () => {
      expect(() => {
        Message.create({ ...validMessageProps, content: '' })
      }).toThrow('Message content cannot be empty')
    })

    it('should throw error for whitespace-only content', () => {
      expect(() => {
        Message.create({ ...validMessageProps, content: '   ' })
      }).toThrow('Message content cannot be empty')
    })

    it('should throw error for content exceeding 5000 characters', () => {
      const longContent = 'a'.repeat(5001)

      expect(() => {
        Message.create({ ...validMessageProps, content: longContent })
      }).toThrow('Message content cannot exceed 5000 characters')
    })

    it('should accept content with exactly 5000 characters', () => {
      const maxContent = 'a'.repeat(5000)

      expect(() => {
        Message.create({ ...validMessageProps, content: maxContent })
      }).not.toThrow()
    })

    it('should throw error when createdAt is after updatedAt', () => {
      expect(() => {
        Message.create({
          ...validMessageProps,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-01')
        })
      }).toThrow('Created date cannot be after updated date')
    })

    it('should throw error when readAt is before createdAt', () => {
      expect(() => {
        Message.create({
          ...validMessageProps,
          readAt: new Date('2023-12-31'),
          createdAt: new Date('2024-01-01')
        })
      }).toThrow('Read date cannot be before created date')
    })
  })

  describe('createNew', () => {
    it('should create new message with current timestamps', () => {
      const before = new Date()
      const message = Message.createNew(
        '123',
        'sender-id',
        'recipient-id',
        'Test message'
      )
      const after = new Date()

      expect(message.id).toBe('123')
      expect(message.senderId).toBe('sender-id')
      expect(message.recipientId).toBe('recipient-id')
      expect(message.content).toBe('Test message')
      expect(message.readAt).toBeNull()
      expect(message.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(message.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
      expect(message.updatedAt.getTime()).toBe(message.createdAt.getTime())
    })

    it('should create new unread message', () => {
      const message = Message.createNew('1', 'sender', 'recipient', 'Content')

      expect(message.isUnread()).toBe(true)
      expect(message.isRead()).toBe(false)
    })
  })

  describe('markAsRead', () => {
    it('should mark unread message as read', () => {
      const message = Message.create(validMessageProps)

      expect(message.isUnread()).toBe(true)

      message.markAsRead()

      expect(message.isRead()).toBe(true)
      expect(message.readAt).not.toBeNull()
    })

    it('should update updatedAt when marked as read', () => {
      const message = Message.create(validMessageProps)
      const originalUpdatedAt = message.updatedAt

      message.markAsRead()

      expect(message.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })

    it('should be no-op when message is already read', () => {
      const readAt = new Date('2024-01-01T12:00:00Z')
      const message = Message.create({
        ...validMessageProps,
        readAt
      })

      message.markAsRead()

      expect(message.readAt).toBe(readAt)
    })
  })

  describe('isUnread / isRead', () => {
    it('should return true for unread message', () => {
      const message = Message.create(validMessageProps)

      expect(message.isUnread()).toBe(true)
      expect(message.isRead()).toBe(false)
    })

    it('should return true for read message', () => {
      const message = Message.create({
        ...validMessageProps,
        readAt: new Date()
      })

      expect(message.isUnread()).toBe(false)
      expect(message.isRead()).toBe(true)
    })
  })

  describe('user relationship checks', () => {
    it('should identify sender correctly', () => {
      const message = Message.create(validMessageProps)

      expect(message.isSender(validMessageProps.senderId)).toBe(true)
      expect(message.isSender(validMessageProps.recipientId)).toBe(false)
      expect(message.isSender('other-user-id')).toBe(false)
    })

    it('should identify recipient correctly', () => {
      const message = Message.create(validMessageProps)

      expect(message.isRecipient(validMessageProps.recipientId)).toBe(true)
      expect(message.isRecipient(validMessageProps.senderId)).toBe(false)
      expect(message.isRecipient('other-user-id')).toBe(false)
    })

    it('should identify involved users', () => {
      const message = Message.create(validMessageProps)

      expect(message.involvesUser(validMessageProps.senderId)).toBe(true)
      expect(message.involvesUser(validMessageProps.recipientId)).toBe(true)
      expect(message.involvesUser('other-user-id')).toBe(false)
    })

    it('should get other user in conversation', () => {
      const message = Message.create(validMessageProps)

      expect(message.getOtherUser(validMessageProps.senderId)).toBe(validMessageProps.recipientId)
      expect(message.getOtherUser(validMessageProps.recipientId)).toBe(validMessageProps.senderId)
      expect(message.getOtherUser('other-user-id')).toBeNull()
    })
  })

  describe('toObject', () => {
    it('should convert Message to plain object', () => {
      const message = Message.create(validMessageProps)

      const obj = message.toObject()

      expect(obj).toEqual({
        id: validMessageProps.id,
        senderId: validMessageProps.senderId,
        recipientId: validMessageProps.recipientId,
        content: validMessageProps.content,
        readAt: null,
        createdAt: validMessageProps.createdAt,
        updatedAt: validMessageProps.updatedAt
      })
    })

    it('should include readAt when message is read', () => {
      const readAt = new Date()
      const message = Message.create({
        ...validMessageProps,
        readAt
      })

      const obj = message.toObject()

      expect(obj.readAt).toBe(readAt)
    })
  })
})
