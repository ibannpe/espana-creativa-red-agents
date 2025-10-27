// ABOUTME: Messages page component with real-time messaging functionality
// ABOUTME: Integrates conversations list, message display, and message input with React Query hooks

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navigation } from '@/components/layout/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Search, Plus, ArrowLeft } from 'lucide-react'
import { ConversationList } from '../components/ConversationList'
import { MessagesList } from '../components/MessagesList'
import { MessageInput } from '../components/MessageInput'
import { NewConversationDialog } from '../components/NewConversationDialog'
import { useConversationsQuery } from '../hooks/queries/useConversationsQuery'
import { useConversationMessagesQuery } from '../hooks/queries/useConversationMessagesQuery'
import { useRealtimeConversations } from '../hooks/useRealtimeConversations'
import { useRealtimeMessages } from '../hooks/useRealtimeMessages'
import { useUnreadNotifications } from '../hooks/useUnreadNotifications'

export function MessagesPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  // Enable real-time subscriptions
  useRealtimeConversations() // Listen for new messages in all conversations
  useRealtimeMessages(userId) // Listen for new messages in active conversation
  useUnreadNotifications() // Listen for unread count updates

  // Query conversations list
  const { data: conversationsData } = useConversationsQuery()

  // Query messages for selected conversation
  const { data: messagesData } = useConversationMessagesQuery(
    { user_id: userId || '' },
    { enabled: !!userId }
  )

  // Find selected conversation user
  const selectedConversation = conversationsData?.conversations.find(
    (conv) => conv.user.id === userId
  )

  const handleSelectConversation = (selectedUserId: string) => {
    navigate(`/messages/${selectedUserId}`)
  }

  const handleBackToList = () => {
    navigate('/messages')
  }

  // Filter conversations by search query
  const filteredConversations = conversationsData?.conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <NewConversationDialog />
          </div>
        </div>

        {/* Desktop Layout: 3 column grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Column 1: Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Conversaciones</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversaciones..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedUserId={userId}
              />
            </CardContent>
          </Card>

          {/* Columns 2-3: Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {userId && selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={selectedConversation.user.avatar_url || undefined}
                        alt={selectedConversation.user.name}
                      />
                      <AvatarFallback>
                        {selectedConversation.user.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.user.name}</CardTitle>
                      <CardDescription>
                        {selectedConversation.user.headline || 'Miembro de España Creativa'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <MessagesList userId={userId} messages={messagesData?.messages || []} />
                </CardContent>

                {/* Message Input */}
                <CardContent className="border-t p-4">
                  <MessageInput recipientId={userId} />
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecciona una conversación para empezar a chatear
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Mobile Layout: Stack with conditional rendering */}
        <div className="lg:hidden">
          {!userId ? (
            // Show conversations list
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversaciones</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar conversaciones..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ConversationList
                  onSelectConversation={handleSelectConversation}
                  selectedUserId={userId}
                />
              </CardContent>
            </Card>
          ) : (
            // Show chat
            <Card className="min-h-[calc(100vh-200px)] flex flex-col">
              {selectedConversation && (
                <>
                  {/* Mobile Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToList}
                        className="mr-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={selectedConversation.user.avatar_url || undefined}
                          alt={selectedConversation.user.name}
                        />
                        <AvatarFallback>
                          {selectedConversation.user.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedConversation.user.name}
                        </CardTitle>
                        <CardDescription>
                          {selectedConversation.user.headline || 'Miembro de España Creativa'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages Area */}
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <MessagesList userId={userId} messages={messagesData?.messages || []} />
                  </CardContent>

                  {/* Message Input */}
                  <CardContent className="border-t p-4">
                    <MessageInput recipientId={userId} />
                  </CardContent>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
