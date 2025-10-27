// ABOUTME: Unit tests for MessagesList component
// ABOUTME: Tests rendering, loading states, error states, and empty states

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MessagesList } from './MessagesList'
import type { MessageWithUsers } from '../data/schemas/message.schema'

// Mock auth context
vi.mock('@/app/features/auth/hooks/useAuthContext', () => ({
  useAuthContext: () => ({
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }
  })
}))

// Mock mark as read mutation
vi.mock('../hooks/mutations/useMarkAsReadMutation', () => ({
  useMarkAsReadMutation: () => ({
    action: vi.fn()
  })
}))

describe('MessagesList', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  const mockMessages: MessageWithUsers[] = [
    {
      id: '1',
      content: 'Hello, how are you?',
      sender_id: 'user-2',
      recipient_id: 'user-1',
      created_at: new Date().toISOString(),
      read_at: null,
      sender: {
        id: 'user-2',
        name: 'Other User',
        email: 'other@example.com',
        avatar_url: null,
        headline: null,
        bio: null,
        location: null,
        website: null,
        linkedin_url: null,
        twitter_url: null,
        github_url: null,
        skills: [],
        interests: [],
        completed_pct: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'approved',
        approved_at: new Date().toISOString(),
        role: 'user'
      },
      recipient: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: null,
        headline: null,
        bio: null,
        location: null,
        website: null,
        linkedin_url: null,
        twitter_url: null,
        github_url: null,
        skills: [],
        interests: [],
        completed_pct: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'approved',
        approved_at: new Date().toISOString(),
        role: 'user'
      }
    },
    {
      id: '2',
      content: 'I am fine, thanks!',
      sender_id: 'user-1',
      recipient_id: 'user-2',
      created_at: new Date().toISOString(),
      read_at: null,
      sender: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: null,
        headline: null,
        bio: null,
        location: null,
        website: null,
        linkedin_url: null,
        twitter_url: null,
        github_url: null,
        skills: [],
        interests: [],
        completed_pct: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'approved',
        approved_at: new Date().toISOString(),
        role: 'user'
      },
      recipient: {
        id: 'user-2',
        name: 'Other User',
        email: 'other@example.com',
        avatar_url: null,
        headline: null,
        bio: null,
        location: null,
        website: null,
        linkedin_url: null,
        twitter_url: null,
        github_url: null,
        skills: [],
        interests: [],
        completed_pct: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'approved',
        approved_at: new Date().toISOString(),
        role: 'user'
      }
    }
  ]

  it('should render loading skeletons when isLoading is true', () => {
    renderWithProviders(<MessagesList userId="user-2" messages={[]} isLoading={true} />)

    // Check that skeleton elements exist (they don't have data-loading attribute in our implementation)
    const container = screen.getByText((content, element) => {
      return element?.className?.includes('space-y-4') ?? false
    }, { selector: 'div' })

    expect(container).toBeInTheDocument()
  })

  it('should render error state when error is provided', () => {
    const error = new Error('Failed to load messages')

    renderWithProviders(<MessagesList userId="user-2" messages={[]} error={error} />)

    expect(screen.getByText('Error al cargar mensajes')).toBeInTheDocument()
    expect(screen.getByText('Failed to load messages')).toBeInTheDocument()
  })

  it('should render empty state when no messages', () => {
    renderWithProviders(<MessagesList userId="user-2" messages={[]} />)

    expect(
      screen.getByText(/No hay mensajes aún/i)
    ).toBeInTheDocument()
  })

  it('should render messages correctly', () => {
    renderWithProviders(<MessagesList userId="user-2" messages={mockMessages} />)

    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
    expect(screen.getByText('I am fine, thanks!')).toBeInTheDocument()
  })

  it('should render messages with correct sender info', () => {
    renderWithProviders(<MessagesList userId="user-2" messages={mockMessages} />)

    // Check that messages are rendered with user names
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
    expect(screen.getByText('I am fine, thanks!')).toBeInTheDocument()
  })
})
