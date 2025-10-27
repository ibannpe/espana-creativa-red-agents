// ABOUTME: Main application component with routing and global providers
// ABOUTME: Uses new feature-based architecture with React Query, AuthContext, and admin-approval signup

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthPage } from '@/components/auth/AuthPage'
import { SetPasswordPage } from '@/components/auth/SetPasswordPage'
import { ProtectedRoute } from '@/app/features/auth/components/ProtectedRoute'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { PendingApprovalPage } from '@/app/features/signup-approval/components/PendingApprovalPage'
import { AdminPendingList } from '@/app/features/signup-approval/components/AdminPendingList'
import { ApprovalActionPage } from '@/app/features/signup-approval/components/ApprovalActionPage'
import Dashboard from '@/components/dashboard/Dashboard'
import { NetworkPage } from '@/components/pages/NetworkPage'
import { MyNetworkPage } from '@/components/pages/MyNetworkPage'
import { FollowersPage } from '@/components/pages/FollowersPage'
import { MessagesPage } from '@/app/features/messages/pages/MessagesPage'
import { OpportunitiesPage } from '@/components/pages/OpportunitiesPage'
import { ProgramsPage } from '@/components/pages/ProgramsPage'
import { ProfilePage } from '@/components/pages/ProfilePage'
import { UserProfileViewPage } from '@/components/pages/UserProfileViewPage'
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from '@/components/ErrorBoundary'

function App() {
  const { user, isLoading } = useAuthContext()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/auth"
          element={!user ? <AuthPage /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/auth/pending"
          element={<PendingApprovalPage />}
        />
        <Route
          path="/auth/set-password/:token"
          element={<SetPasswordPage />}
        />
        <Route
          path="/admin/signup-approval/:action/:token"
          element={<ApprovalActionPage />}
        />
        <Route
          path="/admin/pending-signups"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                  <AdminPendingList />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/network"
          element={
            <ProtectedRoute>
              <NetworkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/network/my-network"
          element={
            <ProtectedRoute>
              <MyNetworkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/network/followers"
          element={
            <ProtectedRoute>
              <FollowersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:userId"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/opportunities"
          element={
            <ProtectedRoute>
              <OpportunitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs"
          element={
            <ProtectedRoute>
              <ProgramsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProgramsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:userId"
          element={
            <ProtectedRoute>
              <UserProfileViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/auth"} />}
        />
      </Routes>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
