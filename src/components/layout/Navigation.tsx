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
import { useAuth } from '@/hooks/useAuth'
import { 
  Users, 
  MessageSquare, 
  Briefcase, 
  Calendar, 
  User, 
  Settings, 
  LogOut,
  Home
} from 'lucide-react'

export function Navigation() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await signOut()
    setLoading(false)
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
            <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
              España Creativa Red
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
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
                    <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-white font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-white font-semibold">
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
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  disabled={loading}
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
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${active ? 'text-primary' : ''}`} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}