import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

console.log('🔧 Inicializando Supabase client', { 
  url: supabaseUrl?.substring(0, 30) + '...', 
  hasKey: !!supabaseAnonKey 
});

// Crear cliente Supabase SIN interceptores que puedan causar problemas
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: false, // Desactivar debug por ahora
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'x-client-info': 'espana-creativa-red'
    }
  }
})

console.log('✅ Cliente Supabase creado exitosamente');