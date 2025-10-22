// ABOUTME: Unit tests for PendingApprovalPage component
// ABOUTME: Tests rendering of informational content and user interactions

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PendingApprovalPage } from './PendingApprovalPage'

describe('PendingApprovalPage', () => {
  it('should render main heading', () => {
    render(<PendingApprovalPage />)

    expect(screen.getByRole('heading', { name: /Solicitud en Revisión/i })).toBeInTheDocument()
  })

  it('should display timeline information', () => {
    render(<PendingApprovalPage />)

    expect(screen.getByText(/24-48 horas/i)).toBeInTheDocument()
    expect(screen.getByText(/Tiempo de Respuesta/i)).toBeInTheDocument()
  })

  it('should display email instructions', () => {
    render(<PendingApprovalPage />)

    expect(screen.getByText(/Revisa tu Email/i)).toBeInTheDocument()
    expect(screen.getByText(/enlace mágico/i)).toBeInTheDocument()
    expect(screen.getByText(/1 hora/i)).toBeInTheDocument()
  })

  it('should display next steps information', () => {
    render(<PendingApprovalPage />)

    expect(screen.getByText(/¿Qué sigue?/i)).toBeInTheDocument()
    expect(screen.getByText(/Recibirás un email de confirmación/i)).toBeInTheDocument()
    expect(screen.getByText(/Haz clic en el enlace para crear tu cuenta/i)).toBeInTheDocument()
    expect(screen.getByText(/Completa tu perfil/i)).toBeInTheDocument()
  })

  it('should display contact email', () => {
    render(<PendingApprovalPage />)

    const contactLink = screen.getByRole('link', { name: /info@espanacreativa.org/i })
    expect(contactLink).toBeInTheDocument()
    expect(contactLink).toHaveAttribute('href', 'mailto:info@espanacreativa.org')
  })

  it('should render return to home button', () => {
    render(<PendingApprovalPage />)

    const button = screen.getByRole('button', { name: /Volver al Inicio/i })
    expect(button).toBeInTheDocument()
  })

  it('should navigate to home page when button is clicked', async () => {
    const user = userEvent.setup()

    // Mock window.location.href
    delete (window as any).location
    window.location = { href: '' } as any

    render(<PendingApprovalPage />)

    const button = screen.getByRole('button', { name: /Volver al Inicio/i })
    await user.click(button)

    expect(window.location.href).toBe('/')
  })

  it('should display all informational icons', () => {
    const { container } = render(<PendingApprovalPage />)

    // Check for SVG icons
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('should have proper visual structure with info cards', () => {
    const { container } = render(<PendingApprovalPage />)

    // Check for colored info cards
    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument()
    expect(container.querySelector('.bg-green-50')).toBeInTheDocument()
    expect(container.querySelector('.bg-purple-50')).toBeInTheDocument()
  })

  it('should display warning icon', () => {
    const { container } = render(<PendingApprovalPage />)

    // Clock icon should be present
    const clockIcon = container.querySelector('.bg-yellow-100')
    expect(clockIcon).toBeInTheDocument()
  })
})
