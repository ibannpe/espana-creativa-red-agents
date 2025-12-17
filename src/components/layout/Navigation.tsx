import { Link, useLocation } from 'react-router-dom'
import { useUnreadCountQuery } from '@/app/features/messages/hooks/queries/useUnreadCountQuery'
import { useUnreadNotifications } from '@/app/features/messages/hooks/useUnreadNotifications'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  MessageSquare,
  Briefcase,
  Calendar,
  Home
} from 'lucide-react'

export function Navigation() {
  const location = useLocation()

  // Real-time unread message count
  useUnreadNotifications() // Subscribe to real-time updates
  const { data: unreadData } = useUnreadCountQuery()
  const unreadCount = unreadData?.unread_count || 0

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/network', label: 'Mi Red', icon: Users },
    { href: '/opportunities', label: 'Oportunidades Red', icon: Briefcase },
    { href: '/messages', label: 'Mensajes', icon: MessageSquare },
    { href: '/proyectos', label: 'Proyectos', icon: Calendar },
  ]

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-14">
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const showBadge = item.href === '/messages' && unreadCount > 0
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 relative border-b-2 ${
                    isActive(item.href)
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                  {showBadge && (
                    <Badge
                      variant="destructive"
                      className="ml-2 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-sm">
        <div className="flex justify-around py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const showBadge = item.href === '/messages' && unreadCount > 0
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 relative ${
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 mb-1 ${active ? 'text-primary' : ''}`} />
                  {showBadge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </div>
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}