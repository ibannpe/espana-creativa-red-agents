// ABOUTME: Unit tests for message service with mocked axios
// ABOUTME: Tests API communication and response validation with Zod schemas

import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { messageService } from './message.service'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('Message Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConversations', () => {
    it('should call GET /api/messages/conversations and return conversations', async () => {
      const mockResponse = {
        data: {
          conversations: [
            {
              user: {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Test User',
                avatar_url: null
              },
              last_message: {
                id: '550e8400-e29b-41d4-a716-446655440001',
                sender_id: '550e8400-e29b-41d4-a716-446655440002',
                recipient_id: '550e8400-e29b-41d4-a716-446655440000',
                content: 'Hello',
                read_at: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              unread_count: 3
            }
          ],
          total: 1
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await messageService.getConversations()

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/messages/conversations')
      expect(result.conversations).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should throw error on invalid response schema', async () => {
      const invalidResponse = {
        data: {
          conversations: [
            {
              user: { id: 'invalid-uuid', name: 'Test' }
              // Missing required fields
            }
          ]
        }
      }

      mockedAxios.get.mockResolvedValue(invalidResponse)

      await expect(messageService.getConversations()).rejects.toThrow()
    })
  })

  describe('getConversationMessages', () => {
    it('should call GET /api/messages/conversation/:userId with pagination', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const mockResponse = {
        data: {
          messages: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              sender_id: '550e8400-e29b-41d4-a716-446655440002',
              recipient_id: userId,
              content: 'Test message',
              read_at: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              sender: {
                id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'Sender',
                avatar_url: null
              },
              recipient: {
                id: userId,
                name: 'Recipient',
                avatar_url: null
              }
            }
          ],
          total: 1
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await messageService.getConversationMessages({
        user_id: userId,
        limit: 20,
        offset: 0
      })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://localhost:3001/api/messages/conversation/${userId}`,
        {
          params: {
            limit: 20,
            offset: 0
          }
        }
      )
      expect(result.messages).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should work without pagination params', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const mockResponse = {
        data: {
          messages: [],
          total: 0
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      await messageService.getConversationMessages({ user_id: userId })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://localhost:3001/api/messages/conversation/${userId}`,
        {
          params: {
            limit: undefined,
            offset: undefined
          }
        }
      )
    })
  })

  describe('sendMessage', () => {
    it('should call POST /api/messages and return created message', async () => {
      const sendData = {
        recipient_id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Hello, this is a test message'
      }

      const mockResponse = {
        data: {
          message: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            sender_id: '550e8400-e29b-41d4-a716-446655440002',
            recipient_id: sendData.recipient_id,
            content: sendData.content,
            read_at: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            sender: {
              id: '550e8400-e29b-41d4-a716-446655440002',
              name: 'Sender',
              avatar_url: null
            },
            recipient: {
              id: sendData.recipient_id,
              name: 'Recipient',
              avatar_url: null
            }
          }
        }
      }

      mockedAxios.post.mockResolvedValue(mockResponse)

      const result = await messageService.sendMessage(sendData)

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3001/api/messages', sendData)
      expect(result.message.content).toBe(sendData.content)
      expect(result.message.recipient_id).toBe(sendData.recipient_id)
    })

    it('should handle API errors', async () => {
      const sendData = {
        recipient_id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Test'
      }

      mockedAxios.post.mockRejectedValue(new Error('Network error'))

      await expect(messageService.sendMessage(sendData)).rejects.toThrow('Network error')
    })
  })

  describe('markAsRead', () => {
    it('should call PUT /api/messages/read and return updated count', async () => {
      const markData = {
        message_ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001'
        ]
      }

      const mockResponse = {
        data: {
          updated_count: 2
        }
      }

      mockedAxios.put.mockResolvedValue(mockResponse)

      const result = await messageService.markAsRead(markData)

      expect(mockedAxios.put).toHaveBeenCalledWith('http://localhost:3001/api/messages/read', markData)
      expect(result.updated_count).toBe(2)
    })
  })

  describe('deleteMessage', () => {
    it('should call DELETE /api/messages/:id', async () => {
      const messageId = '550e8400-e29b-41d4-a716-446655440000'

      mockedAxios.delete.mockResolvedValue({})

      await messageService.deleteMessage(messageId)

      expect(mockedAxios.delete).toHaveBeenCalledWith(`http://localhost:3001/api/messages/${messageId}`)
    })

    it('should handle deletion errors', async () => {
      const messageId = '550e8400-e29b-41d4-a716-446655440000'

      mockedAxios.delete.mockRejectedValue(new Error('Not found'))

      await expect(messageService.deleteMessage(messageId)).rejects.toThrow('Not found')
    })
  })

  describe('getUnreadCount', () => {
    it('should call GET /api/messages/unread-count and return count', async () => {
      const mockResponse = {
        data: {
          unread_count: 5
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await messageService.getUnreadCount()

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/messages/unread-count')
      expect(result.unread_count).toBe(5)
    })

    it('should return zero unread count', async () => {
      const mockResponse = {
        data: {
          unread_count: 0
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const result = await messageService.getUnreadCount()

      expect(result.unread_count).toBe(0)
    })
  })
})
