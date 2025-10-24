# 🔧 Solución al Error 405 Method Not Allowed

## 🐛 Problema Identificado

El error 405 se debía a **configuración incorrecta de headers CORS en vercel.json**.

### ¿Por qué sucedía?

```json
// ❌ vercel.json ANTES (INCORRECTO)
{
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://espana-creativa-red-agents-production.up.railway.app"
        }
      ]
    }
  ]
}
```

**Problemas:**
1. Los **rewrites de Vercel** hacen que las peticiones aparezcan como del **mismo origen** → NO necesitas CORS en vercel.json
2. El backend (Railway) ya maneja CORS correctamente en `server/index.ts`
3. Los headers en vercel.json **sobrescribían** la respuesta del servidor
4. `Access-Control-Allow-Origin` apuntaba a Railway en lugar de Vercel, causando el rechazo del navegador

### Flujo Correcto

```
Usuario en Vercel
    ↓
POST /api/auth/signin
    ↓
Vercel rewrite
    ↓
Railway recibe: POST /api/auth/signin
    ↓
Railway responde con headers CORS correctos:
  Access-Control-Allow-Origin: https://espana-creativa-red-agents.vercel.app
  Access-Control-Allow-Credentials: true
    ↓
Vercel devuelve la respuesta al navegador
    ↓
✅ Navegador acepta la respuesta
```

---

## ✅ Solución Aplicada

He eliminado completamente la sección `headers` de `vercel.json`:

```json
// ✅ vercel.json AHORA (CORRECTO)
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "yarn build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://espana-creativa-red-agents-production.up.railway.app/api/:path*"
    }
  ]
}
```

**Commit creado:**
```
748607b - fix: eliminar headers CORS de vercel.json - el backend ya maneja CORS correctamente
```

---

## 🚀 Pasos Siguientes (TÚ DEBES HACER)

### PASO 1: Push de los cambios

```bash
git push
```

### PASO 2: Verificar Variables en Railway ⚠️ CRÍTICO

Ve a Railway Dashboard → Tu proyecto → Variables

**Variables REQUERIDAS:**

```bash
# Frontend URL (debe apuntar a Vercel)
FRONTEND_URL=https://espana-creativa-red-agents.vercel.app

# Alias alternativo (algunos códigos usan APP_URL)
APP_URL=https://espana-creativa-red-agents.vercel.app

# Supabase (obligatorias)
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>

# Email (obligatoria)
RESEND_API_KEY=<tu-resend-api-key>

# Puerto (opcional - Railway lo asigna automáticamente)
PORT=3001
```

**IMPORTANTE:**
- `FRONTEND_URL` DEBE apuntar a **Vercel**, NO a Railway
- `SUPABASE_SERVICE_ROLE_KEY` es la clave de servicio, NO la anon key

### PASO 3: Verificar Configuración CORS en Backend

Conecta a Railway y verifica los logs:

```bash
# En Railway Dashboard → Deploy Logs
# Busca esta línea:
CORS configured for origins: http://localhost:8080, ..., https://espana-creativa-red-agents.vercel.app
```

Si **NO** aparece tu dominio de Vercel en los logs, significa que `FRONTEND_URL` NO está configurada correctamente.

### PASO 4: Redeploy en Vercel

Después de hacer `git push`, Vercel automáticamente hará redeploy.

**O manualmente:**
1. Ve a Vercel Dashboard
2. Deployments
3. Clic en los 3 puntos (...) del último deployment
4. "Redeploy"

### PASO 5: Limpiar Caché del Navegador

Después del redeploy:

1. Abre DevTools (F12)
2. Clic derecho en el botón Reload
3. Selecciona **"Empty Cache and Hard Reload"**

### PASO 6: Probar Login

Intenta iniciar sesión y verifica en DevTools > Network:

**Headers esperados en la respuesta:**

```
Status: 200 OK
Access-Control-Allow-Origin: https://espana-creativa-red-agents.vercel.app
Access-Control-Allow-Credentials: true
```

---

## 🔬 Cómo Verificar que Funciona

### En DevTools > Network > signin

#### Request (debería verse así):

```
URL: https://espana-creativa-red-agents.vercel.app/api/auth/signin
Method: POST
Status: 200
```

**NO debería ser:**
```
❌ https://espana-creativa-red-agents-production.up.railway.app/api/auth/signin
```

El navegador debe ver la URL de **Vercel**, no de Railway directamente.

#### Response Headers (deberían incluir):

```
Access-Control-Allow-Origin: https://espana-creativa-red-agents.vercel.app
Access-Control-Allow-Credentials: true
```

**NO debería ser:**
```
❌ Access-Control-Allow-Origin: https://espana-creativa-red-agents-production.up.railway.app
```

---

## 📋 Resumen de Configuración Correcta

### Vercel (Frontend)

**Variables de Entorno:**
```bash
# Solo estas 2 variables (NO incluir VITE_API_URL)
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://espana-creativa-red-agents-production.up.railway.app/api/:path*"
    }
  ]
}
```

**❌ NO incluir:**
- Headers CORS en vercel.json
- Variable `VITE_API_URL`

### Railway (Backend)

**Variables de Entorno:**
```bash
# URLs del frontend (apuntar a Vercel)
FRONTEND_URL=https://espana-creativa-red-agents.vercel.app
APP_URL=https://espana-creativa-red-agents.vercel.app

# Supabase
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Email
RESEND_API_KEY=<resend-api-key>

# Puerto (opcional)
PORT=3001
```

**CORS en código (server/index.ts:51-60):**
```typescript
const allowedOrigins = process.env.FRONTEND_URL
  ? [...developmentOrigins, process.env.FRONTEND_URL]
  : developmentOrigins

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))
```

✅ **Configuración automática:** Si `FRONTEND_URL` está configurada, el backend automáticamente permite CORS desde Vercel.

---

## 🆘 Si Sigue Sin Funcionar

### Problema: Error 405 persiste

**Verificar:**
1. ¿Hiciste `git push` y el código se actualizó en Vercel?
2. ¿Limpiaste el caché del navegador?
3. ¿Railway tiene `FRONTEND_URL` configurada correctamente?

### Problema: Error 401 Unauthorized

**Verificar:**
1. ¿Estás usando credenciales correctas?
2. ¿Supabase está configurado correctamente?
3. ¿El usuario existe en la base de datos?

### Problema: Error de CORS (Access-Control-Allow-Origin)

**Verificar:**
1. Railway logs: ¿Aparece Vercel en `CORS configured for origins`?
2. ¿`FRONTEND_URL` en Railway apunta a Vercel?
3. ¿Eliminaste los headers CORS de vercel.json?

---

## 📝 Checklist Final

Antes de probar el login, verifica:

- [ ] `git push` ejecutado
- [ ] Vercel redeploy completado
- [ ] `FRONTEND_URL` en Railway apunta a Vercel
- [ ] Railway logs muestran Vercel en CORS origins
- [ ] No hay headers CORS en vercel.json
- [ ] No hay variable `VITE_API_URL` en Vercel
- [ ] Caché del navegador limpiado

---

## 🎯 Resultado Esperado

Después de seguir todos los pasos, el login debería funcionar correctamente:

```
✅ POST /api/auth/signin → 200 OK
✅ Usuario autenticado
✅ Redirección al dashboard
```

---

**Autor:** Claude Code
**Fecha:** 2025-10-24
**Commit:** 748607b
