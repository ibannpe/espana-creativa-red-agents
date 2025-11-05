# Configuración de Reset de Contraseña en Producción

## Problema

Cuando los usuarios hacen click en el enlace de "recuperar contraseña" que llega por email, son redirigidos a `localhost:3000` en lugar de la URL de producción.

## Causa

El enlace de reset de contraseña es generado por Supabase Auth, y la URL de redirección depende de dos configuraciones:

1. **Configuración en Supabase Dashboard** (URLs permitidas)
2. **Variable de entorno `APP_URL`** en el backend

## Solución Completa

### 1. Configurar URLs en Supabase Dashboard

**Paso 1.1: Acceder a la configuración de autenticación**

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/jbkzymvswvnkrxriyzdx
2. En el menú lateral, ve a **Authentication** → **URL Configuration**

**Paso 1.2: Configurar Site URL**

En el campo **Site URL**, ingresa la URL de tu aplicación en producción:
```
https://tu-dominio.vercel.app
```

**Paso 1.3: Configurar Redirect URLs**

En la sección **Redirect URLs**, agrega las siguientes URLs (una por línea):

```
http://localhost:8080/auth/reset-password
https://tu-dominio.vercel.app/auth/reset-password
```

**Paso 1.4: Guardar cambios**

Haz click en **Save** para guardar la configuración.

### 2. Configurar Variables de Entorno en Vercel (Backend)

**Paso 2.1: Acceder a configuración del proyecto**

1. Ve a tu proyecto backend en Vercel
2. Ve a **Settings** → **Environment Variables**

**Paso 2.2: Agregar/Actualizar la variable APP_URL**

Agrega o actualiza la variable `APP_URL` con el valor de tu URL de producción:

```
Name: APP_URL
Value: https://tu-dominio.vercel.app
Environment: Production
```

**Importante:** Si ya existe la variable `FRONTEND_URL`, el código también la usará como fallback.

**Paso 2.3: Redesplegar**

Después de agregar/modificar las variables de entorno, es necesario hacer un nuevo despliegue para que los cambios surtan efecto.

### 3. Verificar la Configuración

**Paso 3.1: Probar el flujo completo**

1. Ve a tu aplicación en producción
2. Haz click en "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Verifica el email recibido
5. Haz click en el enlace
6. Verifica que te redirija a `https://tu-dominio.vercel.app/auth/reset-password`

**Paso 3.2: Revisar logs del backend**

En los logs del backend de Vercel, deberías ver:

```
[SupabaseAuthService] Sending password reset email with redirectTo: https://tu-dominio.vercel.app/auth/reset-password
[SupabaseAuthService] Password reset email sent successfully
```

## Mejoras Implementadas en el Código

### Backend: `server/infrastructure/adapters/services/SupabaseAuthService.ts:174-198`

```typescript
async sendPasswordResetEmail(email: string): Promise<{ error: Error | null }> {
  try {
    // Determine the correct app URL based on environment
    // Priority: APP_URL env var > FRONTEND_URL env var > localhost fallback
    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:8080'
    const redirectUrl = `${appUrl}/auth/reset-password`

    console.log('[SupabaseAuthService] Sending password reset email with redirectTo:', redirectUrl)

    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    })

    if (error) {
      console.error('[SupabaseAuthService] Error sending password reset email:', error)
      return { error }
    }

    console.log('[SupabaseAuthService] Password reset email sent successfully')
    return { error: null }
  } catch (error) {
    console.error('[SupabaseAuthService] Exception sending password reset email:', error)
    return { error: error as Error }
  }
}
```

**Características:**
- ✅ Usa `APP_URL` o `FRONTEND_URL` según disponibilidad
- ✅ Logging detallado para debugging
- ✅ Fallback a localhost para desarrollo local
- ✅ Manejo de errores mejorado

## Archivo .env Local Corregido

```bash
# Email configuration
ADMIN_EMAILS=maskemaky@gmail.com,iban.perezmi@gmail.com
APP_URL=http://localhost:8080  # ✅ Puerto correcto para desarrollo local
```

## Checklist de Deployment

Para evitar este problema en futuros deployments:

- [ ] Configurar Site URL en Supabase Dashboard
- [ ] Agregar todas las Redirect URLs en Supabase Dashboard
- [ ] Configurar `APP_URL` en variables de entorno del backend de producción
- [ ] Verificar que `APP_URL` apunte a la URL correcta (no localhost)
- [ ] Redesplegar el backend después de cambiar variables de entorno
- [ ] Probar el flujo completo de reset de contraseña
- [ ] Verificar los logs del backend

## Troubleshooting

### El enlace sigue redirigiendo a localhost

**Posibles causas:**

1. **No se guardaron los cambios en Supabase Dashboard**
   - Verifica que hayas hecho click en "Save"
   - Revisa que las URLs estén en la lista de Redirect URLs

2. **La variable de entorno no se aplicó**
   - Verifica que `APP_URL` exista en las variables de entorno de Vercel
   - Asegúrate de haber redesplegado después del cambio
   - Revisa los logs del backend para ver qué URL se está usando

3. **El email fue enviado antes de hacer los cambios**
   - Los enlaces de reset tienen un token que se genera al momento de enviar el email
   - Solicita un nuevo email de reset después de hacer los cambios

### Cómo verificar qué URL se está usando

1. Revisa los logs del backend en Vercel
2. Busca la línea: `[SupabaseAuthService] Sending password reset email with redirectTo:`
3. Verifica que la URL sea la correcta

### El token del enlace ya expiró

Los tokens de reset de contraseña tienen una duración limitada (configurada en Supabase, generalmente 1 hora).

Si el token expiró:
1. Solicita un nuevo email de reset
2. Completa el proceso dentro del tiempo límite

## Configuración Recomendada para Producción

```bash
# Variables de entorno en Vercel (Backend)
APP_URL=https://tu-dominio.vercel.app
FRONTEND_URL=https://tu-dominio.vercel.app
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
RESEND_API_KEY=tu-resend-api-key
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Referencias

- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- Código: `server/infrastructure/adapters/services/SupabaseAuthService.ts:174-198`
