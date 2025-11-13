// ABOUTME: City card component with background image and gradient overlay
// ABOUTME: Displays city name, description, and opportunity count with hover effects

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

export function CityCard({ city, className }: CityCardProps) {
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
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundImage: `url(${city.image_url})`,
          }}
          aria-hidden="true"
        />

        {/* Gradient Overlay */}
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
