// ABOUTME: Unit tests for SendMessageUseCase
// ABOUTME: Tests message sending with mocked repository and validation rules

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SendMessageUseCase } from './SendMessageUseCase'
import { Message } from '../../../domain/entities/Message'
import { MessageRepository } from '../../ports/MessageRepository'

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase
  let mockMessageRepository: MessageRepository

  beforeEach(() => {
    // Create mock repository
    mockMessageRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findConversation: vi.fn(),
      getConversations: vi.fn(),
      markAsRead: vi.fn(),
      delete: vi.fn(),
      getUnreadCount: vi.fn()
    } as unknown as MessageRepository

    useCase = new SendMessageUseCase(mockMessageRepository)
  })

  describe('execute', () => {
    it('should create and save a new message successfully', async () => {
      const dto = {
        senderId: '550e8400-e29b-41d4-a716-446655440000',
        recipientId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        content: 'Hello, this is a test message'
      }

      // Mock repository to return the created message
      vi.mocked(mockMessageRepository.create).mockImplementation(async (msg) => msg)

      const result = await useCase.execute(dto)

      // Verify message was created with correct properties
      expect(result.senderId).toBe(dto.senderId)
      expect(result.recipientId).toBe(dto.recipientId)
      expect(result.content).toBe(dto.content)
      expect(result.readAt).toBeNull()

      // Verify repository was called
      expect(mockMessageRepository.create).toHaveBeenCalledTimes(1)
      expect(mockMessageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: dto.senderId,
          recipientId: dto.recipientId,
          content: dto.content
        })
      )
    })

    it('should generate a unique ID for the message', async () => {
      const dto = {
        senderId: '550e8400-e29b-41d4-a716-446655440000',
        recipientId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        content: 'Test message'
      }

      vi.mocked(mockMessageRepository.create).mockImplementation(async (msg) => msg)

      const result = await useCase.execute(dto)

      // Verify ID is a valid UUID format
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should throw error when sender equals recipient', async () => {
      const dto = {
        senderId: '550e8400-e29b-41d4-a716-446655440000',
        recipientId: '550e8400-e29b-41d4-a716-446655440000', // Same as sender
        content: 'Test message'
      }

      await expect(useCase.execute(dto)).rejects.toThrow('Cannot send message to yourself')
    })

    it('should throw error for empty content', async () => {
      const dto = {
        senderId: '550e8400-e29b-41d4-a716-446655440000',
        recipientId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        content: ''
      }

      await expect(useCase.execute(dto)).rejects.toThrow('Message content cannot be empty')
    })

    it('should throw error for whitespace-only content', async () => {
      const dto = {
        senderId: '550e8400-e29b-41d4-a716-446655440000',
        recipientId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        content: '   '
      }

      await expect(useCase.execute(dto)).rejects.toThrow('Message content cannot be empty')
    })

    it('should throw error for content exceeding 5000 characters', async () => {
      const longContent = 'a'.repeat(5001)
      const dto = {
        senderId: '550e8400-e29b-41d4-a716-446655440000',
        recipientId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        content: longContent
      }

      await expect(useCase.execute(dto)).rejects.toThrow('Message content cannot exceed 5000 characters')
    })

    it('should accept content with exactly 5000 characters', async () => {
      const maxContent = 'a'.repeat(5000)
      const dto = {
        senderId: '550e8400-e29b-41d4-a716-446655440000',
        recipientId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        content: maxContent
      }

      vi.mocked(mockMessageRepository.create).mockImplementation(async (msg) => msg)

      const result = await useCase.execute(dto)

      expect(result.content).toBe(maxContent)
      expect(mockMessageRepository.create).toHaveBeenCalled()
    })

    it('should propagate repository errors', async () => {
      const dto = {
        senderId: '550e8400-e29b-41d4-a716-446655440000',
        recipientId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        content: 'Test message'
      }

      const repositoryError = new Error('Database connection failed')
      vi.mocked(mockMessageRepository.create).mockRejectedValue(repositoryError)

      await expect(useCase.execute(dto)).rejects.toThrow('Database connection failed')
    })
  })
})
