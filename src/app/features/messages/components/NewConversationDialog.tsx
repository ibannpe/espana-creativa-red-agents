// ABOUTME: Dialog component for starting a new conversation
// ABOUTME: Displays list of connections to select a user to message

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Plus, UserPlus } from 'lucide-react'
import { useConnectionsQuery } from '@/app/features/network/hooks/queries/useConnectionsQuery'

interface NewConversationDialogProps {
  children?: React.ReactNode
}

export function NewConversationDialog({ children }: NewConversationDialogProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // Fetch accepted connections
  const { data: connections, isLoading } = useConnectionsQuery(
    { status: 'accepted' },
    { enabled: open }
  )

  // Filter connections by search query
  const filteredConnections = connections?.filter((conn) =>
    conn.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectUser = (userId: string) => {
    setOpen(false)
    setSearchQuery('')
    navigate(`/messages/${userId}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo mensaje
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva conversación</DialogTitle>
          <DialogDescription>
            Selecciona una persona de tu red para iniciar una conversación
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar en tu red..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Connections List */}
        <div className="h-[400px] overflow-y-auto pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : filteredConnections && filteredConnections.length > 0 ? (
            <div className="space-y-2">
              {filteredConnections.map((connection) => (
                <div
                  key={connection.user.id}
                  onClick={() => handleSelectUser(connection.user.id)}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelectUser(connection.user.id)
                    }
                  }}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={connection.user.avatar_url || undefined}
                      alt={connection.user.name}
                    />
                    <AvatarFallback>
                      {connection.user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{connection.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {connection.user.headline || 'Miembro de España Creativa'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Search className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No se encontraron resultados para "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <UserPlus className="h-12 w-12 text-muted-foreground" />
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">No tienes conexiones aún</p>
                <p className="text-xs text-muted-foreground">
                  Conéctate con otros miembros para empezar a chatear
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false)
                  navigate('/network')
                }}
              >
                Explorar red
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
