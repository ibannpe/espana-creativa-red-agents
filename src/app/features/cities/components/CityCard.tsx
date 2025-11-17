// ABOUTME: City card component with background image and gradient overlay
// ABOUTME: Displays city name, description, and opportunity count with hover effects

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CityWithStats } from '../data/schemas/city.schema'
import { cn } from '@/lib/utils'

interface CityCardProps {
  city: CityWithStats
  className?: string
}

// Gradientes de respaldo únicos para cada ciudad
const cityGradients: Record<string, string> = {
  'cordoba': 'linear-gradient(135deg, #d4a574 0%, #8b6f47 100%)',
  'tenerife': 'linear-gradient(135deg, #87ceeb 0%, #4682b4 100%)',
  'quinto': 'linear-gradient(135deg, #c4b5a0 0%, #967259 100%)',
  'denia': 'linear-gradient(135deg, #40e0d0 0%, #1ca598 100%)',
  'ribeira-sacra': 'linear-gradient(135deg, #3a7d44 0%, #1b5e20 100%)',
  'mondonedo': 'linear-gradient(135deg, #b39ddb 0%, #7e57c2 100%)',
}

export function CityCard({ city, className }: CityCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const fallbackGradient = cityGradients[city.slug] || 'linear-gradient(135deg, #9ca3af 0%, #4b5563 100%)'

  return (
    <Link to={`/opportunities/${city.slug}`}>
      <Card
        className={cn(
          "relative h-[280px] overflow-hidden cursor-pointer group",
          "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
          "rounded-xl border border-border",
          className
        )}
        role="button"
        tabIndex={0}
        aria-label={`Ver oportunidades en ${city.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            window.location.href = `/opportunities/${city.slug}`
          }
        }}
      >
        {/* Gradient Background - Always visible */}
        <div
          className="absolute inset-0 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: fallbackGradient,
          }}
          aria-hidden="true"
        />

        {/* Image Layer - Shows when loaded successfully */}
        {!imageError && (
          <img
            src={city.image_url}
            alt={`${city.name} landscape`}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              console.log(`Error loading image for ${city.name}:`, city.image_url)
              setImageError(true)
            }}
            loading="eager"
            aria-hidden="true"
          />
        )}

        {/* Dark Overlay for text readability */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6">
          {/* Top Badge - Opportunities Count */}
          <div className="flex justify-end">
            {city.active_opportunities_count > 0 && (
              <Badge
                variant="secondary"
                className="bg-white/90 text-foreground backdrop-blur-sm"
              >
                <Briefcase className="h-3 w-3 mr-1" />
                {city.active_opportunities_count}{' '}
                {city.active_opportunities_count === 1 ? 'oportunidad' : 'oportunidades'}
              </Badge>
            )}
          </div>

          {/* Bottom Content */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5" />
              <h3 className="text-2xl font-bold">{city.name}</h3>
            </div>
            {city.description && (
              <p className="text-white/90 text-sm line-clamp-2">
                {city.description}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
