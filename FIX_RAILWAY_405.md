# 🔧 Solución Definitiva al Error 405 - Railway Start Command

## 🐛 Problema Real Identificado

El error 405 no era de CORS (ese ya estaba resuelto). El problema real era que **Railway NO sabía cómo iniciar el servidor**.

### ¿Por qué?

Railway detecta automáticamente proyectos Node.js y ejecuta `npm start` (o `yarn start`) por defecto.

**PERO:** El `package.json` NO tenía definido el script `"start"`.

Esto causaba que Railway:
1. Instalara las dependencias correctamente
2. Intentara ejecutar `yarn start`
3. Fallara porque no existía ese script
4. **Resultado:** El servidor nunca se iniciaba → todas las peticiones fallaban con 405

---

## ✅ Solución Aplicada

He realizado 3 cambios críticos:

### 1. Agregado script "start" en package.json

```json
{
  "scripts": {
    "start": "tsx server/index.ts",  // ← NUEVO
    "dev:server": "tsx watch server/index.ts"
  }
}
```

**¿Qué hace?**
- Ejecuta el servidor TypeScript directamente usando `tsx` (sin watch mode)
- Railway ahora puede ejecutar `yarn start` exitosamente

### 2. Movido tsx a dependencias de producción

```json
{
  "dependencies": {
    "tsx": "^4.20.3",  // ← Movido desde devDependencies
    ...
  }
}
```

**¿Por qué?**
- `tsx` es necesario para ejecutar TypeScript en producción
- Railway NO instala devDependencies en producción
- Sin tsx → el comando `tsx server/index.ts` falla

### 3. Creado archivos de configuración de Railway

**Procfile:**
```
web: yarn start
```

**nixpacks.toml:**
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["yarn install"]

[start]
cmd = "yarn start"
```

**¿Por qué?**
- Asegura que Railway use Node.js 20
- Define explícitamente el comando de inicio
- Previene problemas de auto-detección

---

## 🚀 Pasos Siguientes (TÚ DEBES HACER)

### PASO 1: Push de los cambios

```bash
git push
```

### PASO 2: Redeploy en Railway

Railway debería detectar el push automáticamente y hacer redeploy.

**Si NO hace redeploy automático:**
1. Ve a Railway Dashboard
2. Tu proyecto → Deployments
3. Clic en "Deploy Now" o los 3 puntos → "Redeploy"

### PASO 3: Verificar Logs de Railway

**IMPORTANTE:** Ve a Railway → Deployments → Build Logs

Deberías ver:

```
✅ Installing dependencies...
✅ yarn install
✅ Starting server...
✅ yarn start
✅ 🚀 API Server running on http://localhost:3001
✅ 🏗️  Architecture: Hexagonal (Domain-Driven Design)
```

**SI ves errores**, copia los logs y compártelos.

### PASO 4: Verificar Variables de Entorno en Railway

Asegúrate de que estas variables existan:

```bash
# Frontend (CRÍTICO - debe apuntar a Vercel)
FRONTEND_URL=https://espana-creativa-red-agents.vercel.app

# Supabase (CRÍTICO)
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>

# Email (CRÍTICO)
RESEND_API_KEY=<tu-resend-api-key>

# Puerto (opcional - Railway lo asigna automáticamente)
PORT=3001
```

### PASO 5: Probar Login

Después del redeploy de Railway:

1. Limpia caché del navegador (F12 → Clic derecho en Reload → "Empty Cache and Hard Reload")
2. Intenta iniciar sesión en: https://espana-creativa-red-agents.vercel.app
3. Verifica en DevTools > Network > signin:

**Debería verse así:**

```
Request URL: https://espana-creativa-red-agents.vercel.app/api/auth/signin
Status: 200 OK  ← CAMBIADO de 405 a 200
```

---

## 🔬 Cómo Verificar que Funciona

### Test 1: Health Check

Ejecuta en tu terminal:

```bash
curl https://espana-creativa-red-agents-production.up.railway.app/health
```

**Debería responder:**

```json
{
  "status": "OK",
  "timestamp": "2025-10-24T...",
  "architecture": "hexagonal"
}
```

Si esto falla → El servidor NO está corriendo → Revisa los logs de Railway.

### Test 2: Auth Endpoint

```bash
curl -X POST https://espana-creativa-red-agents-production.up.railway.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Debería responder:**

```json
{
  "error": "Invalid credentials"
}
```

O si las credenciales son correctas:

```json
{
  "user": { ... },
  "session": { ... }
}
```

**NO debería responder:**
```
❌ 405 Method Not Allowed
```

---

## 📊 Comparación: Antes vs Después

### ANTES (error)

```
Railway:
  → yarn install ✅
  → yarn start ❌ (script no existe)
  → Servidor NO inicia
  → Todas las peticiones → 405 Method Not Allowed
```

### DESPUÉS (correcto)

```
Railway:
  → yarn install ✅
  → yarn start ✅ (ejecuta tsx server/index.ts)
  → Servidor inicia correctamente ✅
  → Peticiones POST /api/auth/signin → 200 OK ✅
```

---

## 🆘 Troubleshooting

### Problema: Sigue apareciendo 405

**Verifica:**
1. ¿Railway hizo redeploy después del push?
2. ¿Los logs de Railway muestran "API Server running"?
3. ¿El health check responde correctamente?

**Solución:**
```bash
# Test manual del health check
curl https://espana-creativa-red-agents-production.up.railway.app/health
```

Si esto falla, el servidor NO está corriendo. Revisa los logs de Railway.

### Problema: Error de "tsx: command not found"

**Causa:** Railway no instaló tsx correctamente.

**Solución:**
1. Verifica que tsx esté en `dependencies` (NO en devDependencies)
2. Verifica los logs de build de Railway
3. Force redeploy en Railway

### Problema: Error de variables de entorno

**Síntoma:** Servidor inicia pero responde con errores 500

**Solución:**
Verifica que todas las variables de entorno estén configuradas en Railway:
- `FRONTEND_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

---

## 📝 Checklist Final

Antes de reportar que no funciona, verifica:

- [ ] `git push` ejecutado
- [ ] Railway hizo redeploy automáticamente (o redeploy manual)
- [ ] Logs de Railway muestran "🚀 API Server running on http://localhost:3001"
- [ ] Health check responde: `curl https://espana-creativa-red-agents-production.up.railway.app/health`
- [ ] Variables de entorno configuradas en Railway
- [ ] Caché del navegador limpiado

---

## 🎯 Resultado Esperado

Después de seguir todos los pasos:

```
✅ Railway → Servidor corriendo en puerto 3001
✅ Vercel → Rewrite /api/* → Railway
✅ POST /api/auth/signin → 200 OK
✅ Usuario autenticado correctamente
✅ Redirección al dashboard
```

---

## 📚 Archivos Modificados

```
package.json        - Agregado script "start", movido tsx a dependencies
Procfile            - Nuevo archivo para Railway
nixpacks.toml       - Nuevo archivo de configuración Railway
```

---

## 🔗 Recursos Adicionales

- Railway Docs: https://docs.railway.app/
- Nixpacks Docs: https://nixpacks.com/docs
- TSX Docs: https://github.com/esbuild-kit/tsx

---

**Autor:** Claude Code
**Fecha:** 2025-10-24
**Commit:** 3630b53
