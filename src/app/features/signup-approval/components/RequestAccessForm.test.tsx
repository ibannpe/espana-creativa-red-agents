// ABOUTME: Unit tests for RequestAccessForm component
// ABOUTME: Tests form submission, validation, success/error states, and user interactions

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RequestAccessForm } from './RequestAccessForm'
import * as submitHook from '../hooks/mutations/useSubmitSignupRequestMutation'

// Mock the mutation hook
vi.mock('../hooks/mutations/useSubmitSignupRequestMutation')

describe('RequestAccessForm', () => {
  let queryClient: QueryClient
  const mockAction = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    vi.clearAllMocks()

    // Default mock implementation
    vi.mocked(submitHook.useSubmitSignupRequestMutation).mockReturnValue({
      action: mockAction,
      isLoading: false,
      error: null,
      isSuccess: false,
      data: undefined
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should render form with all required fields', () => {
    render(<RequestAccessForm />, { wrapper })

    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Apellidos/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar Solicitud/i })).toBeInTheDocument()
  })

  it('should show required field indicators', () => {
    render(<RequestAccessForm />, { wrapper })

    // Name and Email should have asterisks
    const labels = screen.getAllByText('*')
    expect(labels).toHaveLength(2)
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<RequestAccessForm />, { wrapper })

    await user.type(screen.getByLabelText(/Nombre/i), 'Test User')
    await user.type(screen.getByLabelText(/Apellidos/i), 'Surname')
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com')

    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledWith({
        name: 'Test User',
        surname: 'Surname',
        email: 'test@example.com'
      })
    })
  })

  it('should submit form without optional surname', async () => {
    const user = userEvent.setup()
    render(<RequestAccessForm />, { wrapper })

    await user.type(screen.getByLabelText(/Nombre/i), 'Test User')
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com')

    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledWith({
        name: 'Test User',
        surname: '',
        email: 'test@example.com'
      })
    })
  })

  it('should prevent submission with invalid email (browser validation)', async () => {
    const user = userEvent.setup()
    render(<RequestAccessForm />, { wrapper })

    await user.type(screen.getByLabelText(/Nombre/i), 'Test User')
    const emailInput = screen.getByLabelText(/Email/i) as HTMLInputElement
    await user.type(emailInput, 'invalid-email')

    // Browser validation will prevent submission
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    // Form should not submit with invalid email due to HTML5 validation
    expect(mockAction).not.toHaveBeenCalled()
  })

  it('should show validation error for short name', async () => {
    const user = userEvent.setup()
    render(<RequestAccessForm />, { wrapper })

    await user.type(screen.getByLabelText(/Nombre/i), 'A')
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com')

    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    await waitFor(() => {
      expect(screen.getByText(/al menos 2 caracteres/i)).toBeInTheDocument()
    })

    expect(mockAction).not.toHaveBeenCalled()
  })

  it('should display success message after successful submission', () => {
    vi.mocked(submitHook.useSubmitSignupRequestMutation).mockReturnValue({
      action: mockAction,
      isLoading: false,
      error: null,
      isSuccess: true,
      data: {
        success: true,
        pendingSignupId: '550e8400-e29b-41d4-a716-446655440000',
        message: 'Signup request submitted successfully'
      }
    })

    render(<RequestAccessForm />, { wrapper })

    expect(screen.getByText(/¡Solicitud Enviada!/i)).toBeInTheDocument()
    expect(screen.getByText(/Signup request submitted successfully/i)).toBeInTheDocument()
    expect(screen.getByText(/24-48 horas/i)).toBeInTheDocument()
  })

  it('should display error message on submission failure', () => {
    vi.mocked(submitHook.useSubmitSignupRequestMutation).mockReturnValue({
      action: mockAction,
      isLoading: false,
      error: new Error('Email already exists'),
      isSuccess: false,
      data: undefined
    })

    render(<RequestAccessForm />, { wrapper })

    expect(screen.getByText(/Email already exists/i)).toBeInTheDocument()
  })

  it('should disable form fields while loading', () => {
    vi.mocked(submitHook.useSubmitSignupRequestMutation).mockReturnValue({
      action: mockAction,
      isLoading: true,
      error: null,
      isSuccess: false,
      data: undefined
    })

    render(<RequestAccessForm />, { wrapper })

    expect(screen.getByLabelText(/Nombre/i)).toBeDisabled()
    expect(screen.getByLabelText(/Apellidos/i)).toBeDisabled()
    expect(screen.getByLabelText(/Email/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /Enviando solicitud.../i })).toBeDisabled()
  })

  it('should show login link', () => {
    render(<RequestAccessForm />, { wrapper })

    const loginLink = screen.getByRole('link', { name: /Inicia sesión aquí/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/auth/login')
  })

  it('should clear error message on new submission attempt', async () => {
    const user = userEvent.setup()

    // First render with error
    vi.mocked(submitHook.useSubmitSignupRequestMutation).mockReturnValue({
      action: mockAction,
      isLoading: false,
      error: new Error('Previous error'),
      isSuccess: false,
      data: undefined
    })

    const { rerender } = render(<RequestAccessForm />, { wrapper })

    expect(screen.getByText(/Previous error/i)).toBeInTheDocument()

    // Update mock to clear error
    vi.mocked(submitHook.useSubmitSignupRequestMutation).mockReturnValue({
      action: mockAction,
      isLoading: false,
      error: null,
      isSuccess: false,
      data: undefined
    })

    rerender(<RequestAccessForm />)

    await user.type(screen.getByLabelText(/Nombre/i), 'Test')
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: /Enviar Solicitud/i }))

    // Local error should be cleared when form is submitted
    expect(screen.queryByText(/Previous error/i)).not.toBeInTheDocument()
  })
})
