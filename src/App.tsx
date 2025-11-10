// ABOUTME: Main application component with routing and global providers
// ABOUTME: Uses new feature-based architecture with React Query, AuthContext, and admin-approval signup

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthPage } from '@/components/auth/AuthPage'
import { SetPasswordPage } from '@/components/auth/SetPasswordPage'
import { ResetPasswordPage } from '@/components/pages/ResetPasswordPage'
import { ProtectedRoute } from '@/app/features/auth/components/ProtectedRoute'
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
import { PendingApprovalPage } from '@/app/features/signup-approval/components/PendingApprovalPage'
import { AdminSignupApprovalPage } from '@/app/features/signup-approval/pages/AdminSignupApprovalPage'
import { ApprovalActionPage } from '@/app/features/signup-approval/components/ApprovalActionPage'
import Dashboard from '@/components/dashboard/Dashboard'
import { NetworkPage } from '@/components/pages/NetworkPage'
import { MyNetworkPage } from '@/components/pages/MyNetworkPage'
import { FollowersPage } from '@/components/pages/FollowersPage'
import { MessagesPage } from '@/app/features/messages/pages/MessagesPage'
import { OpportunitiesPage } from '@/components/pages/OpportunitiesPage'
import { OpportunityDetailPage } from '@/components/pages/OpportunityDetailPage'
import { ProjectsPage } from '@/components/pages/ProjectsPage'
import { ProfilePage } from '@/components/pages/ProfilePage'
import { UserProfileViewPage } from '@/components/pages/UserProfileViewPage'
import { GestionPage } from '@/components/pages/GestionPage'
import { AdminUsersPage } from '@/app/features/admin-management/users/pages/AdminUsersPage'
import { AdminStatisticsPage } from '@/app/features/admin-management/statistics/pages/AdminStatisticsPage'
import { AdminConfigPage } from '@/app/features/admin-management/config/pages/AdminConfigPage'
import PrivacyPage from '@/components/pages/PrivacyPage'
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
          path="/auth/reset-password"
          element={<ResetPasswordPage />}
        />
        <Route
          path="/admin/signup-approval/:action/:token"
          element={<ApprovalActionPage />}
        />
        <Route
          path="/signup-approval"
          element={
            <ProtectedRoute>
              <AdminSignupApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/pending-signups"
          element={
            <ProtectedRoute>
              <AdminSignupApprovalPage />
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
          path="/opportunities/:opportunityId"
          element={
            <ProtectedRoute>
              <OpportunityDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proyectos"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        {/* Redirects for backwards compatibility */}
        <Route path="/programs" element={<Navigate to="/proyectos" replace />} />
        <Route path="/projects" element={<Navigate to="/proyectos" replace />} />
        <Route path="/my-programs" element={<Navigate to="/proyectos" replace />} />
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
          path="/gestion"
          element={
            <ProtectedRoute>
              <GestionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion/usuarios"
          element={
            <ProtectedRoute>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion/estadisticas"
          element={
            <ProtectedRoute>
              <AdminStatisticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gestion/configuracion"
          element={
            <ProtectedRoute>
              <AdminConfigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacidad"
          element={<PrivacyPage />}
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
