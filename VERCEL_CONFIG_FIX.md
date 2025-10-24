# 🔧 Solución al Error 404 en Login

## 🐛 Problema Identificado

La URL del backend se está construyendo incorrectamente:
```
❌ https://espana-creativa-red-agents.vercel.app/espana-creativa-red-agents-production.up.railway.app/api/auth/signin
```

Debería ser:
```
✅ https://espana-creativa-red-agents-production.up.railway.app/api/auth/signin
```

---

## 🔍 Causas del Problema

### 1. Errores en `vercel.json` (CORREGIDOS)

- ❌ **Doble barra:** `//api/:path*`
- ❌ **Barra final:** `...railway.app/`

✅ **SOLUCIÓN APLICADA:** Ya he corregido estos errores en el código local.

### 2. Variable `VITE_API_URL` en Vercel (VERIFICAR)

**IMPORTANTE:** Si configuraste `VITE_API_URL` en Vercel, axios intentará usar esa URL directamente en lugar del rewrite, causando el problema.

---

## ✅ Solución Paso a Paso

### Paso 1: Verificar Variables en Vercel

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. **Busca:** `VITE_API_URL`

**Si existe esta variable:**

#### Opción A: Eliminar la variable (RECOMENDADO para Vercel)
```bash
1. Borra la variable VITE_API_URL completamente
2. Deja solo:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
```

**¿Por qué?** Porque el `vercel.json` ya maneja el rewrite de `/api` a Railway. No necesitas configurar la URL del backend.

#### Opción B: Configurar correctamente (alternativa)
```bash
VITE_API_URL=   (dejar vacío)
```

---

### Paso 2: Commit y Push del `vercel.json` Corregido

```bash
git add vercel.json
git commit -m "fix: corregir URLs en vercel.json (eliminar doble barra y barra final)"
git push
```

---

### Paso 3: Redeploy en Vercel

Vercel detectará automáticamente el push y redesplegará.

**O manualmente:**
1. Ve a tu proyecto en Vercel
2. Pestaña "Deployments"
3. Botón con tres puntos (...) en el último deployment
4. "Redeploy"

---

### Paso 4: Limpiar Caché del Navegador

Después del redeploy:
```
1. Abre DevTools (F12)
2. Haz clic derecho en el botón Reload
3. Selecciona "Empty Cache and Hard Reload"
```

---

## 📋 Configuración Correcta de Variables

### VERCEL (Frontend)
```bash
# Solo estas 2 variables (NO incluir VITE_API_URL)
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### RAILWAY (Backend)
```bash
# Asegúrate de que estas 2 estén configuradas con la URL de Vercel
FRONTEND_URL=https://espana-creativa-red-agents.vercel.app
APP_URL=https://espana-creativa-red-agents.vercel.app
```

---

## 🔬 Verificación

Después de los cambios, verifica en DevTools:

1. **Network tab:** Las llamadas a `/api/auth/signin` deben ir a:
   ```
   https://espana-creativa-red-agents-production.up.railway.app/api/auth/signin
   ```

2. **Console:** No debe haber errores 404

3. **Response:** Debe devolver 200 o 401 (si las credenciales son incorrectas)

---

## 🚨 Si Persiste el Error

### Verificar Backend en Railway

Prueba directamente el backend:
```bash
curl https://espana-creativa-red-agents-production.up.railway.app/health
```

Debe responder:
```json
{
  "status": "OK",
  "timestamp": "...",
  "architecture": "hexagonal"
}
```

### Verificar CORS en Railway

Revisa los logs de Railway:
```
CORS configured for origins: ..., https://espana-creativa-red-agents.vercel.app
```

Si la URL de Vercel NO aparece en los logs, actualiza estas variables en Railway:
- `FRONTEND_URL`
- `APP_URL`

---

## 📝 Resumen de Cambios Necesarios

- [x] Corregir `vercel.json` (ya hecho en local)
- [ ] Verificar/eliminar `VITE_API_URL` en Vercel
- [ ] Commit y push
- [ ] Redeploy en Vercel
- [ ] Limpiar caché del navegador
- [ ] Probar login nuevamente

---

¿Necesitas ayuda con algún paso? Avísame.
