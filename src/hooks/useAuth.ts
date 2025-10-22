/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 *
 * **PLEASE USE useAuthContext INSTEAD**
 *
 * Migration guide:
 * ```typescript
 * // OLD (deprecated)
 * import { useAuth } from '@/hooks/useAuth'
 * const { user, loading, signIn, signOut, signUp } = useAuth()
 *
 * // NEW (recommended)
 * import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'
 * const { user, isLoading, signIn, signOut, signUp } = useAuthContext()
 * ```
 *
 * Key differences:
 * - `loading` is now `isLoading`
 * - Better integration with React Query
 * - Automatic cache management
 * - Backend API integration
 *
 * @see src/app/features/auth/hooks/useAuthContext.tsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { sendWelcomeEmailClient } from '@/lib/email-client';
import { getCurrentUser } from '@/lib/auth';
import { User } from '@/types';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: { name?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
}

// Simple retry logic
let retryCount = 0;
const maxRetries = 2;

export const useAuth = (): AuthContextType => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    console.log('🔐 Auth hook iniciando');

    const initAuth = async () => {
      if (!mounted) return;
      
      try {
        console.log('📡 Obteniendo sesión...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error obteniendo sesión:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }

        console.log('📡 Sesión obtenida:', { hasSession: !!session, userId: session?.user?.id });
        
        if (mounted) {
          setSession(session);
          
          if (session?.user) {
            console.log('👤 Cargando datos de usuario...');
            try {
              const fullUser = await getCurrentUser();
              if (mounted) {
                setUser(fullUser);
                console.log('✅ Usuario cargado:', { id: fullUser?.id, email: fullUser?.email });
              }
            } catch (userError) {
              console.error('❌ Error cargando usuario:', userError);
              if (mounted) setUser(null);
            }
          } else {
            console.log('🚪 No hay usuario autenticado');
            setUser(null);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error general en initAuth:', error);
        
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Timeout de seguridad más generoso
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⏰ TIMEOUT: Forzando fin de carga después de 5s');
        setLoading(false);
      }
    }, 5000);

    // Inicializar auth
    initAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔔 Auth cambió:', event, { hasSession: !!session });
        
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Login exitoso, cargando usuario...');
          try {
            const fullUser = await getCurrentUser();
            if (mounted) {
              setUser(fullUser);
              console.log('✅ Usuario establecido después de login');
            }
          } catch (error) {
            console.error('❌ Error cargando usuario después de login:', error);
            if (mounted) setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 Logout - limpiando estado');
          if (mounted) {
            setUser(null);
            navigate('/auth', { replace: true }); // Redirect to login after logout
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          // Mantener usuario actual, solo actualizar session
        }
        
        // Asegurarse de que loading sea false después de cualquier cambio
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate]); // Include navigate in dependencies

  const signUp = async (email: string, password: string, userData?: { name?: string }) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData || {}
        }
      });
      
      if (error) {
        toast({
          title: "Error al registrarse",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Send welcome email
        if (userData?.name) {
          try {
            const emailResult = await sendWelcomeEmailClient(email, userData.name);
            if (emailResult.success) {
              console.log('Welcome email sent successfully');
            } else {
              console.error('Failed to send welcome email:', emailResult.error);
              // Don't show error to user, just log it
            }
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Don't show error to user, just log it
          }
        }
        
        toast({
          title: "¡Registro exitoso!",
          description: "Por favor verifica tu email para completar el registro."
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al registrarse. Inténtalo de nuevo.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente."
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al iniciar sesión. Inténtalo de nuevo.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente."
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cerrar sesión.",
        variant: "destructive"
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: "Error al iniciar sesión con Google",
          description: error.message,
          variant: "destructive"
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al iniciar sesión con Google.",
        variant: "destructive"
      });
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle
  };
};