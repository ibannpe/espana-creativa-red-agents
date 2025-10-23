// ABOUTME: Unit tests for AdminPendingList component
// ABOUTME: Tests table rendering, filtering, pagination, and approve/reject actions

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminPendingList } from './AdminPendingList'
import * as pendingQuery from '../hooks/queries/useGetPendingSignupsQuery'
import * as countQuery from '../hooks/queries/useGetPendingCountQuery'
import * as approveMutation from '../hooks/mutations/useApproveSignupMutation'
import * as rejectMutation from '../hooks/mutations/useRejectSignupMutation'

// Mock all hooks
vi.mock('../hooks/queries/useGetPendingSignupsQuery')
vi.mock('../hooks/queries/useGetPendingCountQuery')
vi.mock('../hooks/mutations/useApproveSignupMutation')
vi.mock('../hooks/mutations/useRejectSignupMutation')

describe('AdminPendingList', () => {
  let queryClient: QueryClient
  const mockApprove = vi.fn()
  const mockReject = vi.fn()
  const mockRefetch = vi.fn()

  const mockPendingSignups = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test1@example.com',
      name: 'Test',
      surname: 'User',
      status: 'pending' as const,
      createdAt: '2024-01-01T00:00:00Z',
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      ipAddress: null,
      userAgent: null
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440000',
      email: 'test2@example.com',
      name: 'Another',
      surname: null,
      status: 'pending' as const,
      createdAt: '2024-01-02T00:00:00Z',
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      ipAddress: null,
      userAgent: null
    }
  ]

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    vi.clearAllMocks()
    global.confirm = vi.fn(() => true)

    // Default mock implementations
    vi.mocked(pendingQuery.useGetPendingSignupsQuery).mockReturnValue({
      data: {
        success: true,
        signups: mockPendingSignups,
        total: 2,
        limit: 20,
        offset: 0
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as any)

    vi.mocked(countQuery.useGetPendingCountQuery).mockReturnValue({
      data: { success: true, count: 2 }
    } as any)

    vi.mocked(approveMutation.useApproveSignupMutation).mockReturnValue({
      action: mockApprove,
      isLoading: false,
      error: null,
      isSuccess: false,
      data: undefined
    })

    vi.mocked(rejectMutation.useRejectSignupMutation).mockReturnValue({
      action: mockReject,
      isLoading: false,
      error: null,
      isSuccess: false,
      data: undefined
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should render signup list with table', () => {
    render(<AdminPendingList />, { wrapper })

    expect(screen.getByRole('heading', { name: /Gestión de Solicitudes/i })).toBeInTheDocument()
    expect(screen.getByText('test1@example.com')).toBeInTheDocument()
    expect(screen.getByText('test2@example.com')).toBeInTheDocument()
  })

  it('should display pending count badge', () => {
    render(<AdminPendingList />, { wrapper })

    expect(screen.getByText('2 pendientes')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    vi.mocked(pendingQuery.useGetPendingSignupsQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: mockRefetch
    } as any)

    render(<AdminPendingList />, { wrapper })

    expect(screen.getByText(/Cargando solicitudes/i)).toBeInTheDocument()
  })

  it('should show error state', () => {
    vi.mocked(pendingQuery.useGetPendingSignupsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch
    } as any)

    render(<AdminPendingList />, { wrapper })

    expect(screen.getByText(/Error al cargar solicitudes/i)).toBeInTheDocument()
  })

  it('should show approve and reject buttons for pending signups', () => {
    render(<AdminPendingList />, { wrapper })

    const approveButtons = screen.getAllByRole('button', { name: /Aprobar/i })
    const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i })

    expect(approveButtons).toHaveLength(2)
    expect(rejectButtons).toHaveLength(2)
  })

  it('should call approve mutation when approve button is clicked', async () => {
    const user = userEvent.setup()
    render(<AdminPendingList />, { wrapper })

    const approveButtons = screen.getAllByRole('button', { name: /Aprobar/i })
    await user.click(approveButtons[0])

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith(
        { token: '550e8400-e29b-41d4-a716-446655440000' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    })
  })

  it('should call reject mutation when reject button is clicked', async () => {
    const user = userEvent.setup()
    render(<AdminPendingList />, { wrapper })

    const rejectButtons = screen.getAllByRole('button', { name: /Rechazar/i })
    await user.click(rejectButtons[0])

    await waitFor(() => {
      expect(mockReject).toHaveBeenCalledWith(
        { token: '550e8400-e29b-41d4-a716-446655440000' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    })
  })

  it('should filter by approved status', async () => {
    const user = userEvent.setup()
    render(<AdminPendingList />, { wrapper })

    const approvedButton = screen.getByRole('button', { name: /Aprobadas/i })
    await user.click(approvedButton)

    expect(pendingQuery.useGetPendingSignupsQuery).toHaveBeenCalledWith({
      status: 'approved',
      limit: 20,
      offset: 0
    })
  })

  it('should filter by rejected status', async () => {
    const user = userEvent.setup()
    render(<AdminPendingList />, { wrapper })

    const rejectedButton = screen.getByRole('button', { name: /Rechazadas/i })
    await user.click(rejectedButton)

    expect(pendingQuery.useGetPendingSignupsQuery).toHaveBeenCalledWith({
      status: 'rejected',
      limit: 20,
      offset: 0
    })
  })

  it('should show empty state when no signups', () => {
    vi.mocked(pendingQuery.useGetPendingSignupsQuery).mockReturnValue({
      data: {
        success: true,
        signups: [],
        total: 0,
        limit: 20,
        offset: 0
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as any)

    render(<AdminPendingList />, { wrapper })

    expect(screen.getByText(/No hay solicitudes pending/i)).toBeInTheDocument()
  })

  it('should not show action buttons for non-pending signups', async () => {
    const user = userEvent.setup()

    // Mock to return approved signups when status filter changes
    vi.mocked(pendingQuery.useGetPendingSignupsQuery).mockReturnValue({
      data: {
        success: true,
        signups: [{
          ...mockPendingSignups[0],
          status: 'approved'
        }],
        total: 1,
        limit: 20,
        offset: 0
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch
    } as any)

    render(<AdminPendingList />, { wrapper })

    // Click on "Aprobadas" filter to show approved signups
    const approvedButton = screen.getByRole('button', { name: /Aprobadas/i })
    await user.click(approvedButton)

    // Action buttons should not be present for approved signups
    expect(screen.queryByRole('button', { name: /Aprobar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rechazar/i })).not.toBeInTheDocument()
  })
})
