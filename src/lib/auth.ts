/**
 * @deprecated These auth functions are deprecated and will be removed in a future version.
 *
 * **PLEASE USE authService INSTEAD**
 *
 * Migration guide:
 * ```typescript
 * // OLD (deprecated)
 * import { signIn, signOut } from '@/lib/auth'
 *
 * // NEW (recommended)
 * import { authService } from '@/app/features/auth/data/services/auth.service'
 * // Use within React Query hooks via useAuthContext
 * ```
 *
 * @see src/app/features/auth/data/services/auth.service.ts
 * @see src/app/features/auth/hooks/useAuthContext.tsx
 */

import { supabase } from './supabase'
import { User, Role } from '@/types'

export async function signUp(email: string, password: string, name: string) {
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name
      },
      // TODO: Reactivar confirmación de email más tarde
      // emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  // Send welcome email if signup successful
  if (data.user && !error) {
    try {
      // Call API route to send welcome email
      await fetch('/api/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name })
      })
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError)
      // Don't fail the signup if email fails
    }
  }
  
  return { data, error }
}

export async function signIn(email: string, password: string) {
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  return { data, error }
}

export async function signInWithGoogle() {
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  return { data, error }
}

export async function signOut() {
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser(): Promise<User | null> {
  const startTime = Date.now();
  console.log('🔍 getCurrentUser: INICIANDO...');
  
  try {
    // Step 1: Get auth user con timeout
    console.log('📡 Step 1: Obteniendo usuario de auth...');
    
    const authPromise = supabase.auth.getUser();
    const authTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getUser timeout')), 10000)
    );
    
    const { data: { user }, error } = await Promise.race([authPromise, authTimeout]) as any;
    console.log(`⏱️ Step 1 completado en ${Date.now() - startTime}ms`);
    
    if (error) {
      console.error('❌ getCurrentUser: Error auth:', error);
      return null;
    }
    
    if (!user) {
      console.log('🚫 getCurrentUser: No hay usuario auth');
      return null;
    }
    
    console.log('✅ Step 1: Usuario auth encontrado:', { id: user.id, email: user.email });
    
    // Step 2: Try to get user profile con timeout más agresivo
    console.log('📡 Step 2: Buscando perfil en BD...');
    const profileStart = Date.now();
    
    const createBasicUser = () => ({
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || '',
      avatar_url: user.user_metadata?.avatar_url || null,
      bio: null,
      location: null,
      linkedin_url: null,
      website_url: null,
      skills: [],
      interests: [],
      roles: [],
      completed_pct: 30,
      created_at: user.created_at,
      updated_at: new Date().toISOString()
    });
    
    try {
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      const profileTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('profile query timeout')), 5000)
      );
      
      const { data: profile, error: profileError } = await Promise.race([
        profilePromise, 
        profileTimeout
      ]) as any;
      
      console.log(`⏱️ Step 2 completado en ${Date.now() - profileStart}ms`);
      
      // Si hay error o no existe perfil, crear usuario básico
      if (profileError || !profile) {
        console.log('⚠️ No se encontró perfil, usando usuario básico:', profileError?.message);
        const basicUser = createBasicUser();
        console.log(`✅ getCurrentUser completado en ${Date.now() - startTime}ms (usuario básico)`);
        return basicUser;
      }
      
      // Return profile with roles
      const fullUser = {
        ...profile,
        roles: []
      };
      console.log(`✅ getCurrentUser completado en ${Date.now() - startTime}ms (perfil completo)`);
      return fullUser;
      
    } catch (dbError) {
      console.warn('⚠️ Timeout/Error en BD, usando fallback:', dbError.message);
      const basicUser = createBasicUser();
      console.log(`✅ getCurrentUser completado en ${Date.now() - startTime}ms (fallback rápido)`);
      return basicUser;
    }
    
  } catch (error) {
    console.error('❌ getCurrentUser: Error general:', error.message);
    console.log(`❌ getCurrentUser falló en ${Date.now() - startTime}ms`);
    return null;
  }
}

export async function resetPassword(email: string) {
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })
  
  return { data, error }
}