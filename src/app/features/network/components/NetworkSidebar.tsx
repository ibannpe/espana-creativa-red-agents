// ABOUTME: Sidebar component displaying network management stats similar to LinkedIn
// ABOUTME: Shows connections count, pending requests, and groups/events placeholders

import { Link } from 'react-router-dom'
import { useNetworkStatsQuery } from '../hooks/queries/useNetworkStatsQuery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  UserPlus,
  UsersIcon,
  Calendar,
  Mail
} from 'lucide-react'

interface SidebarItemProps {
  icon: React.ElementType
  label: string
  count?: number
  isLoading?: boolean
  href?: string
}

function SidebarItem({ icon: Icon, label, count, isLoading, href }: SidebarItemProps) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        <span className="text-sm font-semibold text-foreground">
          {count?.toLocaleString('es-ES') || 0}
        </span>
      )}
    </>
  )

  const className = "w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button className={className} disabled>
      {content}
    </button>
  )
}

export function NetworkSidebar() {
  const { data: stats, isLoading } = useNetworkStatsQuery()

  // Calculate total pending (received + sent)
  const totalPending = stats
    ? (stats.pending_requests || 0) + (stats.sent_requests || 0)
    : undefined

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Gestionar mi red</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-2 pb-4">
        <div className="space-y-1">
          {/* Mi red - Total connections */}
          <SidebarItem
            icon={Users}
            label="Mi red"
            count={stats?.total_connections}
            isLoading={isLoading}
            href="/network/my-network"
          />

          {/* Solicitudes pendientes - Pending requests (received + sent) */}
          <SidebarItem
            icon={UserPlus}
            label="Siguiendo y seguidores"
            count={totalPending}
            isLoading={isLoading}
            href="/network/followers"
          />

          {/* Grupos - Placeholder (future feature) */}
          <SidebarItem
            icon={UsersIcon}
            label="Grupos"
            count={0}
            isLoading={false}
          />

          {/* Eventos - Placeholder (future feature) */}
          <SidebarItem
            icon={Calendar}
            label="Eventos"
            count={0}
            isLoading={false}
          />

          {/* Newsletters - Placeholder (future feature) */}
          <SidebarItem
            icon={Mail}
            label="Newsletters"
            count={0}
            isLoading={false}
          />
        </div>
      </CardContent>
    </Card>
  )
}
