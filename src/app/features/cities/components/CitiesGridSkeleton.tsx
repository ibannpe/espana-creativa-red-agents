// ABOUTME: Skeleton loading state for cities grid
// ABOUTME: Shows placeholder cards while fetching city data

import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

interface CitiesGridSkeletonProps {
  count?: number
}

export function CitiesGridSkeleton({ count = 6 }: CitiesGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="relative h-[280px] overflow-hidden rounded-xl"
        >
          {/* Background skeleton */}
          <Skeleton className="absolute inset-0" />

          {/* Content skeleton */}
          <div className="relative h-full flex flex-col justify-between p-6">
            {/* Top badge skeleton */}
            <div className="flex justify-end">
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>

            {/* Bottom content skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
