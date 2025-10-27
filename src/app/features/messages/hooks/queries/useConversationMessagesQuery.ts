// ABOUTME: React Query hook for fetching messages in a specific conversation
// ABOUTME: Returns paginated messages between current user and another user

import { useQuery } from '@tanstack/react-query'
import { messageService } from '../../data/services/message.service'
import type { GetConversationMessagesResponse, GetConversationRequest } from '../../data/schemas/message.schema'

/**
 * Query hook to fetch messages in a conversation with a specific user
 *
 * @param params - User ID and pagination params
 * @param options - React Query options
 * @returns Query result with array of messages
 */
export const useConversationMessagesQuery = (
  params: GetConversationRequest,
  options?: { enabled?: boolean }
) => {
  return useQuery<GetConversationMessagesResponse, Error>({
    queryKey: ['conversation-messages', params.user_id, params.limit, params.offset],
    queryFn: async () => {
      return await messageService.getConversationMessages(params)
    },
    enabled: options?.enabled !== false && !!params.user_id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000 // 5 minutes
    // refetchInterval removed - using Realtime instead
  })
}
