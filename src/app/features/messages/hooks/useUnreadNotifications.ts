// ABOUTME: Hook for real-time unread message count updates
// ABOUTME: Subscribes to INSERT and UPDATE events on messages table to update badge counter

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

/**
 * Hook to subscribe to real-time updates for unread message count
 *
 * Listens to:
 * - INSERT events when user receives new messages
 * - UPDATE events when messages are marked as read
 *
 * Invalidates unread-count query to update badge in Navigation
 *
 * @returns void
 */
export function useUnreadNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()

  useEffect(() => {
    if (!user?.id) {
      return
    }

    // Create a channel for unread count updates
    const channel = supabase
      .channel('unread-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          // Invalidate unread count when new message arrives
          queryClient.invalidateQueries({ queryKey: ['unread-count'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          // Invalidate unread count when messages are marked as read
          queryClient.invalidateQueries({ queryKey: ['unread-count'] })
        }
      )
      .subscribe()

    // Cleanup: unsubscribe when component unmounts or user changes
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])
}
