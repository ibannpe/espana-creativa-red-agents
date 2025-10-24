# 🚀 Guía de Despliegue - España Creativa Red

Esta guía proporciona instrucciones paso a paso para desplegar la aplicación en Vercel (Frontend) y Railway (Backend).

## 📋 Tabla de Contenidos

1. [Prerrequisitos](#prerrequisitos)
2. [Cambios Realizados en el Código](#cambios-realizados-en-el-código)
3. [Despliegue del Backend (Railway)](#despliegue-del-backend-railway)
4. [Despliegue del Frontend (Vercel)](#despliegue-del-frontend-vercel)
5. [Configuración Final](#configuración-final)
6. [Verificación del Despliegue](#verificación-del-despliegue)
7. [Troubleshooting](#troubleshooting)

---

## 🔑 Prerrequisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Railway](https://railway.app)
- Repositorio Git conectado (GitHub, GitLab, o Bitbucket)
- Acceso a las claves de Supabase
- API Key de Resend para envío de emails

---

## ✅ Cambios Realizados en el Código

Los siguientes archivos han sido modificados para soportar despliegue en producción:

### Frontend

1. **`vite.config.ts`** - Proxy condicional (solo en desarrollo)
2. **`src/lib/axios.ts`** - baseURL dinámica según entorno
3. **`src/lib/logger.ts`** - URL del backend desde variable de entorno
4. **`vercel.json`** - Configuración de rewrites para Vercel ⚠️ **REQUIERE ACTUALIZACIÓN**

### Backend

5. **`server/index.ts`** - CORS dinámico con FRONTEND_URL

### Documentación

6. **`.env.example`** - Documentación completa de variables de entorno
7. **`DEPLOYMENT.md`** (este archivo) - Guía de despliegue

---

## 🚂 Despliegue del Backend (Railway)

### Paso 1: Crear Proyecto en Railway

1. Ve a [Railway](https://railway.app) e inicia sesión
2. Clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta y selecciona tu repositorio `espana-creativa-red-agents`
5. Railway detectará automáticamente que es una aplicación Node.js

### Paso 2: Configurar Variables de Entorno en Railway

Ve a la pestaña **"Variables"** en Railway y añade las siguientes variables:

```bash
# Supabase
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend Email
RESEND_API_KEY=re_TNbjDVdy_NLyBamZe4tEAeYtQT1nfFBsG

# URLs (se actualizarán después)
FRONTEND_URL=https://tu-app.vercel.app
APP_URL=https://tu-app.vercel.app

# Admin Emails
ADMIN_EMAILS=maskemaky@gmail.com,iban.perezmi@gmail.com

# Rate Limits
RATE_LIMIT_SIGNUPS_PER_HOUR=100
RATE_LIMIT_SIGNUPS_PER_DAY=50

# Puerto (Railway lo asigna automáticamente)
PORT=3001
```

⚠️ **IMPORTANTE:** `FRONTEND_URL` y `APP_URL` deben actualizarse después de desplegar en Vercel.

### Paso 3: Verificar el Build Command

Railway debería detectar automáticamente:
- **Build Command:** `yarn install`
- **Start Command:** `yarn dev:server` o `node --loader tsx server/index.ts`

Si no lo detecta, configúralo manualmente en **Settings > Build & Deploy**.

### Paso 4: Desplegar y Obtener URL

1. Railway comenzará el despliegue automáticamente
2. Una vez completado, ve a **Settings > Domains**
3. Genera un dominio público (ej: `espana-creativa-api.railway.app`)
4. **Copia esta URL**, la necesitarás para Vercel

### Paso 5: Verificar Salud del Backend

Prueba el endpoint de salud:

```bash
curl https://TU-BACKEND-URL.railway.app/health
```

Deberías recibir:

```json
{
  "status": "OK",
  "timestamp": "2025-10-24T...",
  "architecture": "hexagonal"
}
```

---

## 🔷 Despliegue del Frontend (Vercel)

### Paso 1: Actualizar `vercel.json`

**⚠️ MUY IMPORTANTE:** Antes de desplegar en Vercel, actualiza el archivo `vercel.json` con la URL real de Railway:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://TU-BACKEND-RAILWAY.railway.app/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://TU-BACKEND-RAILWAY.railway.app"
        }
      ]
    }
  ]
}
```

Reemplaza `YOUR-RAILWAY-APP-URL.railway.app` por la URL real obtenida en el Paso 4 del Backend.

### Paso 2: Hacer Commit del Cambio

```bash
git add vercel.json
git commit -m "chore: update vercel.json with Railway backend URL"
git push
```

### Paso 3: Crear Proyecto en Vercel

1. Ve a [Vercel](https://vercel.com) e inicia sesión
2. Clic en **"Add New Project"**
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Vite

### Paso 4: Configurar Variables de Entorno en Vercel

En la sección **"Environment Variables"**, añade:

```bash
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=https://TU-BACKEND-RAILWAY.railway.app
```

⚠️ **IMPORTANTE:** Reemplaza `TU-BACKEND-RAILWAY.railway.app` con la URL real de Railway.

**NOTA:** No incluyas variables sin prefijo `VITE_` (como `RESEND_API_KEY`), ya que no serán accesibles en el cliente y podrían exponer información sensible.

### Paso 5: Configurar Build Settings

Vercel debería autodetectar:
- **Framework Preset:** Vite
- **Build Command:** `yarn build`
- **Output Directory:** `dist`
- **Install Command:** `yarn install`

Si no, configúralos manualmente.

### Paso 6: Desplegar

1. Clic en **"Deploy"**
2. Espera a que finalice el despliegue
3. Vercel te dará una URL (ej: `https://espana-creativa.vercel.app`)
4. **Copia esta URL**, la necesitarás para actualizar Railway

---

## 🔄 Configuración Final

### Paso 7: Actualizar Variables en Railway

Vuelve a Railway y actualiza estas variables con la URL real de Vercel:

```bash
FRONTEND_URL=https://tu-app.vercel.app
APP_URL=https://tu-app.vercel.app
```

Railway redesplegará automáticamente con la nueva configuración.

### Paso 8: Verificar CORS

Los logs de Railway deberían mostrar:

```
CORS configured for origins: http://localhost:8080, ..., https://tu-app.vercel.app
```

---

## ✅ Verificación del Despliegue

### Checklist de Validación

Verifica que todo funcione correctamente:

- [ ] **Frontend carga:** Visita la URL de Vercel
- [ ] **Backend responde:** `curl https://tu-backend.railway.app/health`
- [ ] **Sin errores CORS:** Abre la consola del navegador (no debe haber errores rojos)
- [ ] **Login funciona:** Prueba iniciar sesión con un usuario existente
- [ ] **Registro funciona:** Crea una cuenta nueva
- [ ] **Emails se envían:** Verifica que llegue el email de bienvenida
- [ ] **URLs correctas en emails:** Los enlaces deben apuntar a Vercel, no a localhost
- [ ] **API calls funcionan:** Prueba crear/editar perfil, enviar mensajes, etc.

### Comandos de Verificación

```bash
# Verificar salud del backend
curl https://tu-backend.railway.app/health

# Verificar que el frontend resuelve
curl -I https://tu-app.vercel.app

# Probar endpoint de auth (debe devolver 401 si no hay sesión)
curl https://tu-backend.railway.app/api/auth/me
```

---

## 🔧 Troubleshooting

### Error: CORS Blocked

**Síntoma:** Error en consola del navegador:
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Solución:**
1. Verifica que `FRONTEND_URL` en Railway tenga la URL correcta de Vercel
2. Redeploy el backend en Railway
3. Verifica los logs del backend para confirmar que CORS está configurado correctamente

### Error: API calls returning 404

**Síntoma:** Las llamadas a `/api/*` devuelven 404

**Solución:**
1. Verifica que `vercel.json` tenga la URL correcta de Railway
2. Verifica que `VITE_API_URL` esté configurada en Vercel
3. Redeploy en Vercel después de actualizar `vercel.json`

### Error: Emails not sending

**Síntoma:** Los emails no llegan

**Solución:**
1. Verifica que `RESEND_API_KEY` esté configurada en Railway
2. Verifica que `APP_URL` apunte a Vercel (no localhost)
3. Revisa los logs de Railway para ver errores de Resend

### Error: Authentication not working

**Síntoma:** No puedes hacer login o el usuario no persiste

**Solución:**
1. Verifica que las claves de Supabase estén correctas en ambos servicios
2. Verifica que `credentials: true` esté en axios y CORS
3. Verifica que las cookies se estén enviando correctamente

---

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Railway](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [Resend Docs](https://resend.com/docs)

---

## 🎯 Próximos Pasos

Después de completar el despliegue:

1. Configura dominios personalizados (opcional)
2. Configura monitoreo y logs
3. Implementa CI/CD automático con GitHub Actions
4. Configura backups de la base de datos
5. Implementa rate limiting adicional en producción

---

¿Tienes problemas? Revisa la sección de [Troubleshooting](#troubleshooting) o contacta al equipo de desarrollo.
