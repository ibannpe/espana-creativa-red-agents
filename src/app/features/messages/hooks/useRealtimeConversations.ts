// ABOUTME: Hook for real-time conversations updates using Supabase Realtime
// ABOUTME: Subscribes to INSERT events on messages table and invalidates conversations query

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

/**
 * Hook to subscribe to real-time updates for conversations list
 *
 * Listens to INSERT events on messages table where current user is sender or recipient
 * When a new message arrives, invalidates the conversations query to trigger re-fetch
 *
 * @returns void
 */
export function useRealtimeConversations() {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()

  useEffect(() => {
    if (!user?.id) {
      return
    }

    // Create a channel for conversations updates
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          // Invalidate conversations query when new message arrives
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        () => {
          // Invalidate conversations query when user sends a message
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    // Cleanup: unsubscribe when component unmounts or user changes
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])
}
