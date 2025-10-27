// ABOUTME: Hook for real-time messages updates in a specific conversation
// ABOUTME: Subscribes to INSERT events on messages table for current conversation

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

/**
 * Hook to subscribe to real-time updates for messages in a conversation
 *
 * Listens to INSERT events on messages table for messages between current user and specified user
 * When a new message arrives, invalidates the conversation-messages query
 *
 * @param userId - ID of the other user in the conversation
 * @returns void
 */
export function useRealtimeMessages(userId: string | undefined) {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()

  useEffect(() => {
    if (!user?.id || !userId) {
      return
    }

    // Create a channel for this specific conversation
    const channel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id},sender_id=eq.${userId}`
        },
        () => {
          // Invalidate messages query when new message from other user arrives
          queryClient.invalidateQueries({
            queryKey: ['conversation-messages', userId]
          })

          // Also invalidate unread count
          queryClient.invalidateQueries({
            queryKey: ['unread-count']
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id},recipient_id=eq.${userId}`
        },
        () => {
          // Invalidate messages query when current user sends message
          queryClient.invalidateQueries({
            queryKey: ['conversation-messages', userId]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id},sender_id=eq.${userId}`
        },
        () => {
          // Invalidate when message is marked as read
          queryClient.invalidateQueries({
            queryKey: ['conversation-messages', userId]
          })

          queryClient.invalidateQueries({
            queryKey: ['unread-count']
          })
        }
      )
      .subscribe()

    // Cleanup: unsubscribe when component unmounts or userId changes
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, userId, queryClient])
}
