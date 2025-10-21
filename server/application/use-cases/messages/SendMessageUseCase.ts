// ABOUTME: Use case for sending a new message to another user
// ABOUTME: Validates that sender and recipient are different users

import { v4 as uuidv4 } from 'uuid'
import { Message } from '../../../domain/entities/Message'
import { MessageRepository } from '../../ports/MessageRepository'

export interface SendMessageDTO {
  senderId: string
  recipientId: string
  content: string
}

/**
 * SendMessageUseCase
 *
 * Sends a new message from one user to another.
 * Validates business rules via domain entity.
 */
export class SendMessageUseCase {
  constructor(private messageRepository: MessageRepository) {}

  async execute(dto: SendMessageDTO): Promise<Message> {
    // Create new message using domain entity
    const message = Message.createNew(
      uuidv4(),
      dto.senderId,
      dto.recipientId,
      dto.content
    )

    // Persist
    return await this.messageRepository.create(message)
  }
}
