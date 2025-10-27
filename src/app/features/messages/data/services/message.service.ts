// ABOUTME: Message service for managing messages with Axios and Zod validation
// ABOUTME: Handles sending, reading, and retrieving messages and conversations

import { axiosInstance } from '@/lib/axios'
import {
  type SendMessageRequest,
  type MarkAsReadRequest,
  type GetConversationRequest,
  type GetConversationsResponse,
  type GetConversationMessagesResponse,
  type SendMessageResponse,
  type MarkAsReadResponse,
  type GetUnreadCountResponse,
  getConversationsResponseSchema,
  getConversationMessagesResponseSchema,
  sendMessageResponseSchema,
  markAsReadResponseSchema,
  getUnreadCountResponseSchema
} from '../schemas/message.schema'

export const messageService = {
  /**
   * Get all conversations for current user
   * Returns list of users with last message and unread count
   */
  async getConversations(): Promise<GetConversationsResponse> {
    const response = await axiosInstance.get('/messages/conversations')
    return getConversationsResponseSchema.parse(response.data)
  },

  /**
   * Get messages in a conversation with a specific user
   */
  async getConversationMessages(params: GetConversationRequest): Promise<GetConversationMessagesResponse> {
    const response = await axiosInstance.get(`/messages/conversation/${params.user_id}`, {
      params: {
        limit: params.limit,
        offset: params.offset
      }
    })
    return getConversationMessagesResponseSchema.parse(response.data)
  },

  /**
   * Send a new message to a user
   */
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await axiosInstance.post('/messages', data)
    return sendMessageResponseSchema.parse(response.data)
  },

  /**
   * Mark messages as read
   */
  async markAsRead(data: MarkAsReadRequest): Promise<MarkAsReadResponse> {
    const response = await axiosInstance.put('/messages/read', data)
    return markAsReadResponseSchema.parse(response.data)
  },

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    await axiosInstance.delete(`/messages/${id}`)
  },

  /**
   * Get total unread message count for current user
   */
  async getUnreadCount(): Promise<GetUnreadCountResponse> {
    const response = await axiosInstance.get('/messages/unread-count')
    return getUnreadCountResponseSchema.parse(response.data)
  }
}
