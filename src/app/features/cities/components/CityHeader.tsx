// ABOUTME: Header component for city opportunities page
// ABOUTME: Displays city image banner with name and breadcrumb navigation

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CityWithStats } from '../data/schemas/city.schema'

interface CityHeaderProps {
  city: CityWithStats
}

export function CityHeader({ city }: CityHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/opportunities">Oportunidades</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{city.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* City Banner */}
      <div className="relative h-[200px] rounded-2xl overflow-hidden shadow-sm">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${city.image_url})`,
          }}
          aria-hidden="true"
        />

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-end p-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-white">
              <MapPin className="h-6 w-6" />
              <h1 className="text-4xl font-bold">{city.name}</h1>
            </div>
            {city.description && (
              <p className="text-white/90 text-lg max-w-3xl">
                {city.description}
              </p>
            )}
            {city.active_opportunities_count > 0 && (
              <p className="text-white/80 text-sm">
                {city.active_opportunities_count}{' '}
                {city.active_opportunities_count === 1
                  ? 'oportunidad activa'
                  : 'oportunidades activas'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
