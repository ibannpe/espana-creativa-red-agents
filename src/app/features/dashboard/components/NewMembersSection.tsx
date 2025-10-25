// ABOUTME: Container component for new members section in dashboard
// ABOUTME: Fetches recent users, handles states (loading, error, empty), renders cards

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserX } from 'lucide-react'
import { useRecentUsersQuery } from '../hooks/queries/useRecentUsersQuery'
import { NewMemberCard } from './NewMemberCard'

export function NewMembersSection() {
  const { data: users, isLoading, error } = useRecentUsersQuery({ days: 30, limit: 5 })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Nuevos miembros
        </CardTitle>
        <CardDescription>
          Conecta con los últimos miembros que se han unido
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertDescription>
              No se pudieron cargar los nuevos miembros. Por favor, intenta de nuevo más tarde.
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && users && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserX className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay nuevos miembros aún
            </p>
          </div>
        )}

        {/* Success State - List of Users */}
        {!isLoading && !error && users && users.length > 0 && (
          <div className="space-y-2">
            {users.map((user) => (
              <NewMemberCard key={user.id} user={user} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
