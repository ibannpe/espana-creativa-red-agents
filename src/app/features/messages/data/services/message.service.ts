// ABOUTME: Message service for managing messages with Axios and Zod validation
// ABOUTME: Handles sending, reading, and retrieving messages and conversations

import axios from 'axios'
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const messageService = {
  /**
   * Get all conversations for current user
   * Returns list of users with last message and unread count
   */
  async getConversations(): Promise<GetConversationsResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/messages/conversations`)
    return getConversationsResponseSchema.parse(response.data)
  },

  /**
   * Get messages in a conversation with a specific user
   */
  async getConversationMessages(params: GetConversationRequest): Promise<GetConversationMessagesResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/messages/conversation/${params.user_id}`, {
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
    const response = await axios.post(`${API_BASE_URL}/api/messages`, data)
    return sendMessageResponseSchema.parse(response.data)
  },

  /**
   * Mark messages as read
   */
  async markAsRead(data: MarkAsReadRequest): Promise<MarkAsReadResponse> {
    const response = await axios.put(`${API_BASE_URL}/api/messages/read`, data)
    return markAsReadResponseSchema.parse(response.data)
  },

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/messages/${id}`)
  },

  /**
   * Get total unread message count for current user
   */
  async getUnreadCount(): Promise<GetUnreadCountResponse> {
    const response = await axios.get(`${API_BASE_URL}/api/messages/unread-count`)
    return getUnreadCountResponseSchema.parse(response.data)
  }
}
