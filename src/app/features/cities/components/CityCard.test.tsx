// ABOUTME: Unit tests for CityCard component
// ABOUTME: Tests rendering, navigation, keyboard accessibility, and interactions

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { CityCard } from './CityCard'
import type { CityWithStats } from '../data/schemas/city.schema'

// Mock react-router-dom Link
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ to, children, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    )
  }
})

describe('CityCard', () => {
  const mockCity: CityWithStats = {
    id: 1,
    name: 'Madrid',
    slug: 'madrid',
    image_url: 'https://example.com/madrid.jpg',
    description: 'Capital de España',
    active: true,
    display_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    opportunities_count: 10,
    active_opportunities_count: 5
  }

  const renderCityCard = (city: CityWithStats = mockCity, className?: string) => {
    return render(
      <BrowserRouter>
        <CityCard city={city} className={className} />
      </BrowserRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render city name', () => {
      renderCityCard()
      expect(screen.getByText('Madrid')).toBeInTheDocument()
    })

    it('should render city description when provided', () => {
      renderCityCard()
      expect(screen.getByText('Capital de España')).toBeInTheDocument()
    })

    it('should not render description when null', () => {
      const cityWithoutDescription: CityWithStats = {
        ...mockCity,
        description: null
      }
      renderCityCard(cityWithoutDescription)
      expect(screen.queryByText('Capital de España')).not.toBeInTheDocument()
    })

    it('should render opportunities count badge', () => {
      renderCityCard()
      expect(screen.getByText(/5/)).toBeInTheDocument()
      expect(screen.getByText(/oportunidades/)).toBeInTheDocument()
    })

    it('should render singular "oportunidad" when count is 1', () => {
      const cityWithOneOpportunity: CityWithStats = {
        ...mockCity,
        active_opportunities_count: 1
      }
      renderCityCard(cityWithOneOpportunity)
      expect(screen.getByText(/1/)).toBeInTheDocument()
      expect(screen.getByText(/oportunidad/)).toBeInTheDocument()
    })

    it('should not render opportunities badge when count is 0', () => {
      const cityWithoutOpportunities: CityWithStats = {
        ...mockCity,
        active_opportunities_count: 0
      }
      renderCityCard(cityWithoutOpportunities)
      expect(screen.queryByText(/oportunidades/)).not.toBeInTheDocument()
    })

    it('should render background image with correct URL', () => {
      const { container } = renderCityCard()
      const backgroundDiv = container.querySelector('[style*="background-image"]')
      expect(backgroundDiv).toBeInTheDocument()
      expect(backgroundDiv?.getAttribute('style')).toContain('https://example.com/madrid.jpg')
    })

    it('should apply custom className when provided', () => {
      const { container } = renderCityCard(mockCity, 'custom-class')
      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should render link to city opportunities page', () => {
      renderCityCard()
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/opportunities/madrid')
    })

    it('should use city slug in URL', () => {
      const cityWithDifferentSlug: CityWithStats = {
        ...mockCity,
        name: 'Barcelona',
        slug: 'barcelona'
      }
      renderCityCard(cityWithDifferentSlug)
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/opportunities/barcelona')
    })

    it('should navigate on click', async () => {
      const user = userEvent.setup()
      renderCityCard()

      const link = screen.getByRole('link')
      await user.click(link)

      // Link should maintain href
      expect(link).toHaveAttribute('href', '/opportunities/madrid')
    })
  })

  describe('Accessibility', () => {
    it('should have role="button" on card', () => {
      renderCityCard()
      const card = screen.getByRole('button', { name: /Ver oportunidades en Madrid/i })
      expect(card).toBeInTheDocument()
    })

    it('should have proper aria-label', () => {
      renderCityCard()
      const card = screen.getByLabelText('Ver oportunidades en Madrid')
      expect(card).toBeInTheDocument()
    })

    it('should be keyboard accessible with tabIndex', () => {
      renderCityCard()
      const card = screen.getByRole('button', { name: /Ver oportunidades en Madrid/i })
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('should navigate on Enter key press', () => {
      // Mock window.location.href
      const originalLocation = window.location.href
      delete (window as any).location
      window.location = { ...window.location, href: '' } as any

      renderCityCard()
      const card = screen.getByRole('button', { name: /Ver oportunidades en Madrid/i })

      // Simulate Enter key press
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

      expect(window.location.href).toBe('/opportunities/madrid')

      // Restore original location
      window.location.href = originalLocation
    })

    it('should navigate on Space key press', () => {
      // Mock window.location.href
      const originalLocation = window.location.href
      delete (window as any).location
      window.location = { ...window.location, href: '' } as any

      renderCityCard()
      const card = screen.getByRole('button', { name: /Ver oportunidades en Madrid/i })

      // Simulate Space key press
      card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))

      expect(window.location.href).toBe('/opportunities/madrid')

      // Restore original location
      window.location.href = originalLocation
    })

    it('should not navigate on other key presses', () => {
      // Mock window.location.href
      const originalLocation = window.location.href
      delete (window as any).location
      window.location = { ...window.location, href: originalLocation } as any

      renderCityCard()
      const card = screen.getByRole('button', { name: /Ver oportunidades en Madrid/i })

      // Simulate Tab key press
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

      expect(window.location.href).toBe(originalLocation)
    })

    it('should have proper icon decorations marked as aria-hidden', () => {
      const { container } = renderCityCard()
      const backgroundDiv = container.querySelector('[aria-hidden="true"]')
      expect(backgroundDiv).toBeInTheDocument()
    })
  })

  describe('Visual States', () => {
    it('should have hover effect classes', () => {
      const { container } = renderCityCard()
      const card = container.querySelector('.hover\\:shadow-lg')
      expect(card).toBeInTheDocument()
    })

    it('should have transition classes', () => {
      const { container } = renderCityCard()
      const card = container.querySelector('.transition-all')
      expect(card).toBeInTheDocument()
    })

    it('should have group hover classes for image zoom', () => {
      const { container } = renderCityCard()
      const backgroundDiv = container.querySelector('.group-hover\\:scale-110')
      expect(backgroundDiv).toBeInTheDocument()
    })
  })

  describe('Multiple Cities', () => {
    it('should render different cities correctly', () => {
      const madrid: CityWithStats = mockCity
      const barcelona: CityWithStats = {
        ...mockCity,
        id: 2,
        name: 'Barcelona',
        slug: 'barcelona',
        description: 'Ciudad condal',
        active_opportunities_count: 3
      }

      const { rerender } = renderCityCard(madrid)
      expect(screen.getByText('Madrid')).toBeInTheDocument()
      expect(screen.getByText('Capital de España')).toBeInTheDocument()

      rerender(
        <BrowserRouter>
          <CityCard city={barcelona} />
        </BrowserRouter>
      )
      expect(screen.getByText('Barcelona')).toBeInTheDocument()
      expect(screen.getByText('Ciudad condal')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long city names', () => {
      const cityWithLongName: CityWithStats = {
        ...mockCity,
        name: 'Ciudad con un nombre extremadamente largo que debería truncarse',
        slug: 'ciudad-larga'
      }
      renderCityCard(cityWithLongName)
      expect(screen.getByText(/Ciudad con un nombre extremadamente largo/)).toBeInTheDocument()
    })

    it('should handle very long descriptions', () => {
      const cityWithLongDescription: CityWithStats = {
        ...mockCity,
        description: 'Esta es una descripción muy larga que debería ser truncada con line-clamp-2. ' +
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
          'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      }
      renderCityCard(cityWithLongDescription)
      const description = screen.getByText(/Esta es una descripción muy larga/)
      expect(description).toHaveClass('line-clamp-2')
    })

    it('should handle high opportunity counts', () => {
      const cityWithManyOpportunities: CityWithStats = {
        ...mockCity,
        active_opportunities_count: 999
      }
      renderCityCard(cityWithManyOpportunities)
      expect(screen.getByText(/999/)).toBeInTheDocument()
      expect(screen.getByText(/oportunidades/)).toBeInTheDocument()
    })

    it('should handle slug with multiple hyphens', () => {
      const cityWithComplexSlug: CityWithStats = {
        ...mockCity,
        name: 'Palma de Mallorca',
        slug: 'palma-de-mallorca'
      }
      renderCityCard(cityWithComplexSlug)
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '/opportunities/palma-de-mallorca')
    })
  })
})
