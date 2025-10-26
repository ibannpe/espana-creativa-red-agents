# Contexto de Sesión: Configuración de Producción

**Fecha**: 2025-10-26
**Objetivo**: Configurar correctamente las variables de entorno para que la aplicación funcione en producción

## Problema Reportado

**Síntomas en Producción** (`https://espanacreativa.infinitofit.com`):
1. Error de CORS al intentar hacer requests a `localhost:3001`
2. Error 401 en `/api/auth/me`
3. Mensaje: "No se pudieron cargar los nuevos miembros. Por favor, intenta de nuevo más tarde."
4. La aplicación intenta conectarse a `http://localhost:3001` en lugar del backend de producción

**Errores en Consola**:
```
Access to XMLHttpRequest at 'http://localhost:3001/api/users/recent?days=30&limit=5'
from origin 'https://espanacreativa.infinitofit.com' has been blocked by CORS policy
```

## Causa Raíz

La variable de entorno `VITE_API_URL` no está configurada correctamente en la plataforma de deployment del frontend, causando que la aplicación use la URL de desarrollo local en producción.

## URLs de Deployment

- **Frontend**: `https://espanacreativa.infinitofit.com` (Vercel/Netlify)
- **Backend**: `https://espana-creativa-red-agents-production.up.railway.app` (Railway)
- **Base de Datos**: Supabase (`https://jbkzymvswvnkrxriyzdx.supabase.co`)

## Solución: Configuración de Variables de Entorno

### 1. Frontend (Vercel/Netlify)

**Variables de entorno a configurar**:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia3p5bXZzd3Zua3J4cml5emR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjA2NjEsImV4cCI6MjA2OTI5NjY2MX0.AAj-OKJlCyH7JJDo3bEnjYsJPHAA4f-z3EHxbbVCJhg

# Backend API Configuration
VITE_API_URL=https://espana-creativa-red-agents-production.up.railway.app
```

**IMPORTANTE**: Después de agregar estas variables, **redeploy el frontend**.

**Cómo agregar variables en Vercel**:
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega cada variable con su valor
4. Redeploy desde Deployments → ... → Redeploy

**Cómo agregar variables en Netlify**:
1. Ve a tu sitio en Netlify Dashboard
2. Site settings → Environment variables
3. Add a variable (para cada una)
4. Trigger deploy desde Deploys → Trigger deploy

### 2. Backend (Railway)

**Variables de entorno a configurar**:

```bash
# Frontend URL (para CORS)
FRONTEND_URL=https://espanacreativa.infinitofit.com

# Supabase Configuration
SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[OBTENER DE SUPABASE DASHBOARD]

# Email Service
RESEND_API_KEY=[TU RESEND API KEY]

# Node Environment
NODE_ENV=production
PORT=3001
```

**Cómo obtener SUPABASE_SERVICE_ROLE_KEY**:
1. Ve a Supabase Dashboard
2. Project Settings → API
3. Copia el valor de "service_role" (Project API keys)

**Cómo agregar variables en Railway**:
1. Ve a tu proyecto en Railway Dashboard
2. Click en el servicio backend
3. Variables tab
4. Add Variable (para cada una)
5. Railway redeployará automáticamente

### 3. Verificación de Configuración

**Archivo afectado**: `src/lib/axios.ts`

```typescript
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api'
})
```

**Lógica**:
- En desarrollo: `VITE_API_URL` no está definido → usa `/api` (proxy de Vite)
- En producción: `VITE_API_URL` = `https://espana-creativa-red-agents-production.up.railway.app` → usa esta URL + `/api`

**Archivo de CORS en backend**: `server/index.ts` (líneas 37-60)

```typescript
const allowedOrigins = process.env.FRONTEND_URL
  ? [...developmentOrigins, process.env.FRONTEND_URL]
  : developmentOrigins

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))
```

**Lógica**:
- En desarrollo: Solo permite localhost origins
- En producción: Agrega `https://espanacreativa.infinitofit.com` a los origins permitidos

## Checklist de Deployment

### Pre-deployment
- [x] Verificar que el código funciona en local
- [x] Identificar problema de variables de entorno

### Frontend (Vercel/Netlify)
- [ ] Agregar `VITE_SUPABASE_URL`
- [ ] Agregar `VITE_SUPABASE_ANON_KEY`
- [ ] Agregar `VITE_API_URL` apuntando a Railway
- [ ] Redeploy frontend
- [ ] Verificar que el build completa sin errores

### Backend (Railway)
- [ ] Agregar `FRONTEND_URL`
- [ ] Agregar `SUPABASE_URL`
- [ ] Agregar `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Agregar `RESEND_API_KEY` (si existe)
- [ ] Agregar `NODE_ENV=production`
- [ ] Agregar `PORT=3001`
- [ ] Verificar que el deploy completa sin errores
- [ ] Verificar logs de Railway para confirmar que el servidor inicia correctamente

### Post-deployment
- [ ] Abrir `https://espanacreativa.infinitofit.com` en el navegador
- [ ] Abrir DevTools → Console
- [ ] Verificar que NO hay errores de CORS
- [ ] Verificar que las peticiones van a `https://espana-creativa-red-agents-production.up.railway.app/api/*`
- [ ] Probar login
- [ ] Probar carga de "Nuevos miembros"
- [ ] Probar sistema de conexiones completo

## Comandos Útiles para Debugging

**Ver variables de entorno en Railway**:
```bash
railway variables
```

**Ver logs del backend en Railway**:
```bash
railway logs
```

**Verificar que el backend está respondiendo**:
```bash
curl https://espana-creativa-red-agents-production.up.railway.app/health
```

**Verificar configuración de CORS**:
```bash
curl -H "Origin: https://espanacreativa.infinitofit.com" \
  --verbose \
  https://espana-creativa-red-agents-production.up.railway.app/api/auth/me
```

## Archivos de Configuración Relevantes

### Frontend
- `src/lib/axios.ts` - Configuración de Axios con baseURL dinámica
- `src/lib/supabase.ts` - Cliente de Supabase
- `vite.config.ts` - Configuración de proxy (solo para desarrollo)

### Backend
- `server/index.ts` - Configuración de CORS y servidor Express
- `.env` - Variables de entorno (solo para desarrollo local)

## Notas Adicionales

### MCPs a Instalar
- **Vercel MCP**: Para gestionar deployments y variables de entorno de Vercel desde Claude Code
- **Supabase MCP**: Para gestionar base de datos y configuración de Supabase desde Claude Code

### Problemas Conocidos Resueltos

1. **✅ Sistema de Conexiones**: Funcionando correctamente en local (verificado E2E)
2. **✅ Autenticación**: Funcionando en local
3. **✅ Sidebar "Mi Red"**: Implementado estilo LinkedIn
4. **⏳ Variables de entorno en producción**: Pendiente de configurar

### Estado Actual

**Local (Desarrollo)**: ✅ TODO FUNCIONA
- Sistema de conexiones completo
- Autenticación
- Dashboard
- Búsqueda de usuarios
- Sidebar "Gestionar mi red"

**Producción**: ❌ REQUIERE CONFIGURACIÓN
- Frontend desplegado en Vercel/Netlify
- Backend desplegado en Railway
- Variables de entorno NO configuradas
- Causando errores de CORS y 401

## Próximos Pasos

1. **Instalar MCPs** (Vercel + Supabase)
2. **Configurar variables de entorno** usando los MCPs o manualmente
3. **Redeploy** frontend y backend
4. **Verificar** que todo funciona en producción
5. **Testing E2E** en producción

## Referencias

- [Documentación de Vite - Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Railway Documentation - Environment Variables](https://docs.railway.app/develop/variables)
- [Vercel Documentation - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Netlify Documentation - Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

**Última actualización**: 2025-10-26
**Estado**: Pendiente de configurar variables de entorno en producción
