# 🔧 Solución: Email de Solicitud de Registro No Llega al Administrador

## 🐛 Problema Identificado

El formulario de solicitud de registro funciona correctamente, pero el email de notificación **NO llega al administrador**.

### Causa del problema

El servicio de email (`ResendEmailService.ts:167`) intenta leer la variable de entorno `ADMIN_EMAILS`:

```typescript
const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').filter(e => e.trim())
```

**¿Qué sucede si `ADMIN_EMAILS` no está configurada?**

1. `process.env.ADMIN_EMAILS` → `undefined`
2. `(undefined || '')` → `''` (string vacío)
3. `''.split(',')` → `['']` (array con un string vacío)
4. `.filter(e => e.trim())` → `[]` (array vacío)
5. `adminEmails = []` → **NO se envía ningún email**

**Verificación:**

```bash
# En railway.env (archivo local) SÍ está configurado:
ADMIN_EMAILS=maskemaky@gmail.com,iban.perezmi@gmail.com

# Pero en Railway (producción) NO está configurado
```

---

## ✅ Solución: Configurar ADMIN_EMAILS en Railway

### PASO 1: Acceder a Railway Dashboard

1. Ve a: https://railway.app/
2. Inicia sesión
3. Selecciona tu proyecto: **espana-creativa-red-agents**

### PASO 2: Configurar Variable de Entorno

1. En Railway Dashboard → Tu proyecto
2. Clic en la pestaña **"Variables"**
3. Clic en **"+ New Variable"**
4. Agrega la variable:

```
Variable name: ADMIN_EMAILS
Value: maskemaky@gmail.com,iban.perezmi@gmail.com
```

**IMPORTANTE:** Separa múltiples emails con comas, SIN espacios:

```
✅ Correcto:   email1@example.com,email2@example.com
❌ Incorrecto: email1@example.com, email2@example.com  (con espacio después de la coma)
```

5. Clic en **"Add"**

### PASO 3: Verificar Otras Variables Requeridas

Asegúrate de que Railway también tenga configuradas:

```bash
# Email service (CRÍTICO)
RESEND_API_KEY=re_...

# Frontend URL (CRÍTICO - para enlaces en emails)
APP_URL=https://espana-creativa-red-agents.vercel.app
FRONTEND_URL=https://espana-creativa-red-agents.vercel.app

# Supabase (CRÍTICO)
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

### PASO 4: Redeploy en Railway

Railway debería hacer redeploy automáticamente al agregar la variable.

**Si NO hace redeploy:**

1. Railway Dashboard → Deployments
2. Clic en los 3 puntos (...) del último deployment
3. Selecciona **"Redeploy"**

### PASO 5: Verificar en Logs de Railway

Después del redeploy, ve a:

Railway Dashboard → Deployments → Logs

Busca esta línea al inicio del servidor:

```
🚀 API Server running on http://localhost:3001
```

---

## 🔬 Cómo Probar que Funciona

### Opción 1: Probar Solicitud de Registro Real

1. Ve a: https://espana-creativa-red-agents.vercel.app/auth
2. Clic en "Solicitar Acceso"
3. Rellena el formulario con un email de prueba (ej: `test-signup@example.com`)
4. Envía la solicitud

**Verifica:**

1. **En la aplicación:** Debería mostrar mensaje de éxito
2. **En Railway Logs:** Busca líneas que mencionen "Admin notification" o "Resend email"
3. **En tu email:** Deberías recibir un email en `maskemaky@gmail.com` y `iban.perezmi@gmail.com`

### Opción 2: Usar el Script de Prueba

He creado un script de prueba que puedes ejecutar localmente.

**Antes de ejecutar:**

1. Crea un archivo `.env` temporal con tus credenciales:

```bash
# .env (temporal para pruebas)
RESEND_API_KEY=re_tu_api_key_real
ADMIN_EMAILS=maskemaky@gmail.com,iban.perezmi@gmail.com
APP_URL=https://espana-creativa-red-agents.vercel.app
```

2. Ejecuta el script:

```bash
yarn test:admin-email
```

O directamente:

```bash
node test-admin-email.mjs
```

**Debería:**
1. Enviar un email de prueba a los administradores
2. Mostrar en consola si el envío fue exitoso o falló
3. Los administradores recibirán un email de prueba

---

## 📧 Estructura del Email al Administrador

El email que reciben los administradores tiene este formato:

**Asunto:** "Nueva solicitud de registro - España Creativa"

**Contenido:**
```
Nueva solicitud de registro

Email: test@example.com
Nombre: Test User
Fecha: 24/10/2025

[Botón: Aprobar] [Botón: Rechazar]
```

Los botones apuntan a:
- Aprobar: `https://espana-creativa-red-agents.vercel.app/admin/signup-approval/approve/{token}`
- Rechazar: `https://espana-creativa-red-agents.vercel.app/admin/signup-approval/reject/{token}`

---

## 🆘 Troubleshooting

### Problema: Email sigue sin llegar después de configurar ADMIN_EMAILS

**Verificaciones:**

1. **¿Railway hizo redeploy?**
   ```
   Ve a Railway → Deployments
   Verifica que el último deployment sea después de agregar la variable
   ```

2. **¿RESEND_API_KEY es válida?**
   ```bash
   # Prueba con curl:
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer re_tu_api_key" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "España Creativa <send@infinitofit.com>",
       "to": "maskemaky@gmail.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

   **Respuesta esperada:**
   ```json
   {"id":"..."}
   ```

   **Si falla:**
   ```json
   {"error": "Invalid API key"}
   ```
   → La API key es incorrecta o ha expirado

3. **¿Los emails están en la carpeta de spam?**
   ```
   Revisa la carpeta de spam/correo no deseado
   ```

4. **¿Resend tiene configurado el dominio?**
   ```
   Ve a Resend Dashboard → Domains
   Verifica que infinitofit.com esté verificado
   ```

### Problema: Error "Failed to send admin notification" en logs

**Causas posibles:**

1. **RESEND_API_KEY inválida o expirada**
   - Solución: Genera una nueva API key en Resend Dashboard

2. **Dominio no verificado en Resend**
   - Solución: Verifica el dominio `infinitofit.com` en Resend

3. **Rate limit excedido en Resend**
   - Solución: Espera o upgrade de plan en Resend

4. **ADMIN_EMAILS con formato incorrecto**
   - Solución: Verifica que sea `email1@x.com,email2@x.com` (sin espacios)

### Problema: Email llega pero los enlaces no funcionan

**Causa:** `APP_URL` no está configurada correctamente en Railway

**Solución:**

Verifica que en Railway:
```bash
APP_URL=https://espana-creativa-red-agents.vercel.app
```

**NO debería ser:**
```bash
❌ APP_URL=http://localhost:8080
❌ APP_URL=https://espana-creativa-red-agents-production.up.railway.app
```

---

## 📊 Flujo Completo del Email de Solicitud

```
Usuario rellena formulario
    ↓
POST /api/signup-approval/request
    ↓
SubmitSignupRequestUseCase.execute()
    ↓
Valida email y nombre
    ↓
Verifica que no exista solicitud previa
    ↓
Verifica rate limits
    ↓
Crea PendingSignup en base de datos ✅
    ↓
Llama a emailService.sendAdminSignupNotification()
    ↓
Lee ADMIN_EMAILS de process.env
    ↓
¿ADMIN_EMAILS configurado?
    │
    ├─ NO → adminEmails = [] → NO envía emails ❌
    │
    └─ SÍ → adminEmails = ['email1', 'email2']
            ↓
            Para cada email en adminEmails:
              ↓
              resend.emails.send({
                from: 'España Creativa <send@infinitofit.com>',
                to: email,
                subject: 'Nueva solicitud de registro',
                html: ... (template con botones)
              })
              ↓
            ✅ Emails enviados
```

---

## 📝 Checklist de Configuración en Railway

Antes de probar, verifica que Railway tenga:

- [ ] `ADMIN_EMAILS=maskemaky@gmail.com,iban.perezmi@gmail.com`
- [ ] `RESEND_API_KEY=re_...` (API key válida)
- [ ] `APP_URL=https://espana-creativa-red-agents.vercel.app`
- [ ] `FRONTEND_URL=https://espana-creativa-red-agents.vercel.app`
- [ ] `VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co`
- [ ] `SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- [ ] Railway hizo redeploy después de agregar ADMIN_EMAILS

---

## 🎯 Resultado Esperado

Después de configurar `ADMIN_EMAILS` y redeploy:

```
Usuario envía solicitud
    ↓
✅ Solicitud guardada en base de datos
    ↓
✅ Email enviado a maskemaky@gmail.com
✅ Email enviado a iban.perezmi@gmail.com
    ↓
Administradores reciben email con botones "Aprobar" y "Rechazar"
    ↓
✅ Pueden aprobar/rechazar desde el email
```

---

## 📚 Variables de Entorno Completas para Railway

```bash
# =============================================================================
# RAILWAY - VARIABLES DE ENTORNO COMPLETAS
# =============================================================================

# EMAIL
RESEND_API_KEY=re_tu_api_key_real
ADMIN_EMAILS=maskemaky@gmail.com,iban.perezmi@gmail.com

# URLS
APP_URL=https://espana-creativa-red-agents.vercel.app
FRONTEND_URL=https://espana-creativa-red-agents.vercel.app

# SUPABASE
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>

# RATE LIMITING (opcional)
RATE_LIMIT_SIGNUPS_PER_HOUR=100
RATE_LIMIT_SIGNUPS_PER_DAY=50

# PORT (opcional - Railway lo asigna automáticamente)
PORT=3001
```

---

**Autor:** Claude Code
**Fecha:** 2025-10-24
**Prioridad:** 🔴 CRÍTICA - Email de administrador no funciona sin ADMIN_EMAILS
