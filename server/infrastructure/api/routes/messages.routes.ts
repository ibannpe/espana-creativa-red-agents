// ABOUTME: Messages HTTP routes for private messaging between users
// ABOUTME: Thin adapter layer delegating to message use cases with authentication middleware

import { Router, Response, NextFunction } from 'express'
import { Container } from '../../di/Container'
import { AuthenticatedRequest } from '../middleware/auth.middleware'

export const createMessagesRoutes = (): Router => {
  const router = Router()

  // All routes require authentication (applied in server/index.ts)

  // GET /api/messages/conversations - List all conversations with unread counts
  router.get('/conversations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id

      const getConversationsUseCase = Container.getGetConversationsUseCase()
      const conversations = await getConversationsUseCase.execute({ userId })

      return res.status(200).json({
        conversations: conversations.map(conv => ({
          user: {
            id: conv.user.id,
            name: conv.user.name,
            email: conv.user.email || '',
            avatar_url: conv.user.avatar_url
          },
          last_message: conv.lastMessage ? {
            id: conv.lastMessage.id,
            sender_id: conv.lastMessage.senderId,
            recipient_id: conv.lastMessage.recipientId,
            content: conv.lastMessage.content,
            read_at: conv.lastMessage.readAt?.toISOString() || null,
            created_at: conv.lastMessage.createdAt.toISOString()
          } : null,
          unread_count: conv.unreadCount
        })),
        total: conversations.length
      })
    } catch (error) {
      next(error)
    }
  })

  // GET /api/messages/conversations/:userId - Get all messages with a specific user
  router.get('/conversations/:userId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user.id
      const otherUserId = req.params.userId

      if (!otherUserId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      // Parse pagination parameters
      const limit = parseInt(req.query.limit as string) || 50
      const offset = parseInt(req.query.offset as string) || 0

      const getConversationMessagesUseCase = Container.getGetConversationMessagesUseCase()
      const messagesWithUsers = await getConversationMessagesUseCase.execute({
        userId: currentUserId,
        otherUserId,
        limit,
        offset
      })

      return res.status(200).json({
        messages: messagesWithUsers.map(msgWithUser => ({
          id: msgWithUser.message.id,
          sender_id: msgWithUser.message.senderId,
          recipient_id: msgWithUser.message.recipientId,
          content: msgWithUser.message.content,
          read_at: msgWithUser.message.readAt?.toISOString() || null,
          created_at: msgWithUser.message.createdAt.toISOString(),
          updated_at: msgWithUser.message.updatedAt.toISOString(),
          sender: msgWithUser.sender,
          recipient: msgWithUser.recipient
        })),
        total: messagesWithUsers.length
      })
    } catch (error) {
      next(error)
    }
  })

  // POST /api/messages - Send a new message
  router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const senderId = req.user.id
      const { recipient_id, content } = req.body

      if (!recipient_id) {
        return res.status(400).json({ error: 'Recipient ID is required' })
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' })
      }

      if (content.length > 5000) {
        return res.status(400).json({ error: 'Message content too long (max 5000 characters)' })
      }

      const sendMessageUseCase = Container.getSendMessageUseCase()
      const message = await sendMessageUseCase.execute({
        senderId,
        recipientId: recipient_id,
        content: content.trim()
      })

      // Get user information for sender and recipient
      const getUserProfileUseCase = Container.getGetUserProfileUseCase()
      const [senderResult, recipientResult] = await Promise.all([
        getUserProfileUseCase.execute({ userId: message.senderId }),
        getUserProfileUseCase.execute({ userId: message.recipientId })
      ])

      const sender = senderResult.user
      const recipient = recipientResult.user

      if (!sender || !recipient) {
        return res.status(404).json({ error: 'User not found' })
      }

      return res.status(201).json({
        message: {
          id: message.id,
          sender_id: message.senderId,
          recipient_id: message.recipientId,
          content: message.content,
          read_at: null,
          created_at: message.createdAt.toISOString(),
          updated_at: message.updatedAt.toISOString(),
          sender: {
            id: sender.getId().getValue(),
            name: sender.getName(),
            email: sender.getEmail().getValue(),
            avatar_url: sender.getAvatarUrl()
          },
          recipient: {
            id: recipient.getId().getValue(),
            name: recipient.getName(),
            email: recipient.getEmail().getValue(),
            avatar_url: recipient.getAvatarUrl()
          }
        }
      })
    } catch (error: any) {
      if (error.message.includes('yourself')) {
        return res.status(400).json({ error: error.message })
      }
      if (error.message.includes('must be at least')) {
        return res.status(400).json({ error: error.message })
      }
      next(error)
    }
  })

  // PUT /api/messages/read - Mark messages as read (bulk operation)
  router.put('/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log('[messages.routes.ts] PUT /read - Request received')
    console.log('[messages.routes.ts] User:', req.user?.id)
    console.log('[messages.routes.ts] Body:', JSON.stringify(req.body, null, 2))

    try {
      const userId = req.user.id
      const { message_ids } = req.body

      console.log('[messages.routes.ts] userId:', userId)
      console.log('[messages.routes.ts] message_ids:', message_ids)

      if (!message_ids || !Array.isArray(message_ids) || message_ids.length === 0) {
        console.log('[messages.routes.ts] Validation failed: message_ids invalid')
        return res.status(400).json({ error: 'Message IDs array is required' })
      }

      // Validate all message IDs are strings
      if (!message_ids.every(id => typeof id === 'string')) {
        console.log('[messages.routes.ts] Validation failed: some IDs are not strings')
        return res.status(400).json({ error: 'All message IDs must be strings' })
      }

      console.log('[messages.routes.ts] Calling markMessagesAsReadUseCase with:', { userId, messageIds: message_ids })
      const markMessagesAsReadUseCase = Container.getMarkMessagesAsReadUseCase()
      const updatedCount = await markMessagesAsReadUseCase.execute({
        userId,
        messageIds: message_ids
      })

      console.log('[messages.routes.ts] Success! Updated count:', updatedCount)
      return res.status(200).json({
        updated_count: updatedCount
      })
    } catch (error: any) {
      console.error('[messages.routes.ts] Error:', error)
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message })
      }
      next(error)
    }
  })

  // DELETE /api/messages/:id - Delete a message (only sender can delete)
  router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id
      const messageId = req.params.id

      if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' })
      }

      const deleteMessageUseCase = Container.getDeleteMessageUseCase()
      await deleteMessageUseCase.execute({
        messageId,
        userId
      })

      return res.status(204).send()
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: 'You can only delete your own messages' })
      }
      next(error)
    }
  })

  // GET /api/messages/unread-count - Get total unread message count
  router.get('/unread-count', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id

      const getUnreadCountUseCase = Container.getGetUnreadCountUseCase()
      const count = await getUnreadCountUseCase.execute({ userId })

      return res.status(200).json({
        unread_count: count
      })
    } catch (error) {
      next(error)
    }
  })

  return router
}
