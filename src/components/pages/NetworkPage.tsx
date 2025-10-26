import { Navigation } from '@/components/layout/Navigation'
import { UserSearch } from '@/components/network/UserSearch'
import { ConnectionsSection } from '@/app/features/network/components/ConnectionsSection'
import { NetworkSidebar } from '@/app/features/network/components/NetworkSidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Users, Search } from 'lucide-react'

export function NetworkPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Red</h1>
              <p className="text-muted-foreground">
                Conecta con emprendedores y mentores de España Creativa
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout: Main content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Takes 2/3 of space on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Buscar Miembros
                </CardTitle>
                <CardDescription>
                  Encuentra emprendedores, mentores y colaboradores por nombre, ubicación o habilidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorBoundary>
                  <UserSearch />
                </ErrorBoundary>
              </CardContent>
            </Card>

            {/* Connections Section */}
            <ErrorBoundary>
              <ConnectionsSection />
            </ErrorBoundary>
          </div>

          {/* Sidebar - Takes 1/3 of space on large screens, full width on mobile */}
          <div className="lg:col-span-1">
            <ErrorBoundary>
              <NetworkSidebar />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  )
}