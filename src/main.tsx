// ABOUTME: Application entry point with global providers and routing setup
// ABOUTME: Wraps app with QueryProvider and AuthProvider for React Query and auth state management

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryProvider } from './app/providers/QueryProvider'
import { AuthProvider } from './app/features/auth/hooks/useAuthContext'
import './index.css'
import App from './App.tsx'
import './lib/client-logger' // Inicializar logger del cliente

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </StrictMode>,
)
