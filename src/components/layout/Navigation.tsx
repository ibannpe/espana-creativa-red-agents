import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { useUserRoles } from '@/app/features/auth/hooks/useUserRoles'
import { useUnreadCountQuery } from '@/app/features/messages/hooks/queries/useUnreadCountQuery'
import { useUnreadNotifications } from '@/app/features/messages/hooks/useUnreadNotifications'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  MessageSquare,
  Briefcase,
  Calendar,
  User,
  Settings,
  LogOut,
  Home,
  Shield
} from 'lucide-react'

export function Navigation() {
  const { user, signOut, isSigningOut } = useAuthContext()
  const { isAdmin } = useUserRoles()
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  // Real-time unread message count
  useUnreadNotifications() // Subscribe to real-time updates
  const { data: unreadData } = useUnreadCountQuery()
  const unreadCount = unreadData?.unread_count || 0

  const handleSignOut = () => {
    signOut()
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/network', label: 'Mi Red', icon: Users },
    { href: '/opportunities', label: 'Oportunidades', icon: Briefcase },
    { href: '/messages', label: 'Mensajes', icon: MessageSquare },
    { href: '/projects', label: 'Programas', icon: Calendar },
  ]

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  if (!user) return null

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              España Creativa Red
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const showBadge = item.href === '/messages' && unreadCount > 0
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                      isActive(item.href)
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span className="text-sm font-medium text-gray-700">
                {user.completed_pct}% completado
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-50">
                  <Avatar className="h-10 w-10 ring-2 ring-gray-100">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="font-semibold text-gray-900">{user.name || 'Usuario'}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center rounded-md p-2 hover:bg-gray-50">
                    <User className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="font-medium">Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center rounded-md p-2 hover:bg-gray-50">
                    <Settings className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="font-medium">Configuración</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem asChild>
                      <Link to="/gestion" className="flex items-center rounded-md p-2 hover:bg-primary/10 bg-primary/5">
                        <Shield className="mr-3 h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">Gestión</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center rounded-md p-2 text-red-600 hover:bg-red-50 focus:bg-red-50"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-sm">
        <div className="flex justify-around py-3">
          {navItems.slice(0, 4).map((item) => {
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