import { useState } from 'react'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Search, Plus } from 'lucide-react'

export function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null)

  // Mock data para conversaciones
  const conversations = [
    {
      id: 1,
      name: 'María García',
      avatar: '',
      lastMessage: 'Hola, me interesa tu proyecto de fintech...',
      time: '10:30',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Carlos López',
      avatar: '',
      lastMessage: '¿Podemos hacer una videollamada mañana?',
      time: '09:15',
      unread: 0,
      online: false
    },
    {
      id: 3,
      name: 'Ana Martín',
      avatar: '',
      lastMessage: 'Gracias por la información del programa',
      time: 'Ayer',
      unread: 1,
      online: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Mensajes</h1>
                <p className="text-muted-foreground">
                  Chatea con otros miembros de la comunidad
                </p>
              </div>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo mensaje
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Lista de conversaciones */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversaciones</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar conversaciones..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedChat === conversation.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedChat(conversation.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback>
                            {conversation.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm truncate">{conversation.name}</p>
                          <span className="text-xs text-muted-foreground">{conversation.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unread > 0 && (
                        <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Área de chat */}
          <Card className="lg:col-span-2">
            {selectedChat ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {conversations.find(c => c.id === selectedChat)?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {conversations.find(c => c.id === selectedChat)?.name}
                      </CardTitle>
                      <CardDescription>
                        {conversations.find(c => c.id === selectedChat)?.online ? 'En línea' : 'Desconectado'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between p-4 h-full">
                  <div className="flex-1 space-y-4 mb-4">
                    {/* Mensajes de ejemplo */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                        <p className="text-sm">Hola, vi tu perfil y me parece muy interesante tu proyecto</p>
                        <span className="text-xs opacity-70">10:25</span>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg max-w-xs">
                        <p className="text-sm">¡Hola! Gracias por contactarme. ¿Te gustaría que hablemos sobre ello?</p>
                        <span className="text-xs text-muted-foreground">10:30</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Input placeholder="Escribe tu mensaje..." className="flex-1" />
                    <Button>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Selecciona una conversación para empezar a chatear</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}