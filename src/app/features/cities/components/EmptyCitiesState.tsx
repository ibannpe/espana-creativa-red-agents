// ABOUTME: Empty state component when no cities are available
// ABOUTME: Displays informative message with icon

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { MapPin } from 'lucide-react'

export function EmptyCitiesState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Alert className="max-w-md">
        <MapPin className="h-4 w-4" />
        <AlertTitle>No hay ciudades disponibles</AlertTitle>
        <AlertDescription>
          Actualmente no hay ciudades configuradas. Contacta con un administrador
          para añadir nuevas ciudades.
        </AlertDescription>
      </Alert>
    </div>
  )
}
