# ⚡ SOLUCIÓN RÁPIDA: Email de Administrador No Llega

## 🐛 Problema

El formulario de solicitud de registro funciona, pero **NO se envía email al administrador**.

## ✅ Solución en 3 Pasos

### PASO 1: Configurar ADMIN_EMAILS en Railway 🚀

1. Ve a: https://railway.app/
2. Inicia sesión → Tu proyecto: **espana-creativa-red-agents**
3. Clic en **"Variables"**
4. Clic en **"+ New Variable"**
5. Agrega:

```
Variable name: ADMIN_EMAILS
Value: maskemaky@gmail.com,iban.perezmi@gmail.com
```

6. Clic en **"Add"**
7. Railway hará redeploy automáticamente (espera 1-2 minutos)

**IMPORTANTE:** NO pongas espacios después de las comas:
- ✅ Correcto: `email1@x.com,email2@x.com`
- ❌ Incorrecto: `email1@x.com, email2@x.com`

---

### PASO 2: Verificar Otras Variables en Railway

Asegúrate de que también estén configuradas:

```bash
RESEND_API_KEY=re_...
APP_URL=https://espana-creativa-red-agents.vercel.app
FRONTEND_URL=https://espana-creativa-red-agents.vercel.app
VITE_SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_URL=https://jbkzymvswvnkrxriyzdx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
```

**¿Falta alguna?** Agrégala siguiendo el mismo proceso del PASO 1.

---

### PASO 3: Probar Solicitud de Registro

Después de que Railway termine el redeploy:

1. Ve a: https://espana-creativa-red-agents.vercel.app/auth
2. Clic en "Solicitar Acceso"
3. Rellena el formulario:
   - Email: `test-signup-$(date +%s)@example.com` (usa un email de prueba único)
   - Nombre: Test
   - Apellido: Usuario
4. Envía la solicitud

**Deberías recibir un email en:**
- maskemaky@gmail.com
- iban.perezmi@gmail.com

**Asunto del email:**
"Nueva solicitud de registro - España Creativa"

**Contenido:**
- Email del solicitante
- Nombre del solicitante
- Botones: [Aprobar] [Rechazar]

---

## 🧪 ALTERNATIVA: Probar Localmente Primero

Si quieres probar que el email funciona ANTES de configurar Railway:

### 1. Crea archivo .env temporal

```bash
# .env
RESEND_API_KEY=re_tu_api_key_real
ADMIN_EMAILS=maskemaky@gmail.com,iban.perezmi@gmail.com
APP_URL=https://espana-creativa-red-agents.vercel.app
```

### 2. Ejecuta el script de prueba

```bash
yarn test:admin-email
```

### 3. Verifica el resultado

**Si funciona:**
```
✅ Todos los emails se enviaron correctamente!
   Revisa la bandeja de entrada de los administradores.
```

**Si falla:**
```
❌ Error enviando a xxx@xxx.com: Invalid API key
```
→ Verifica que `RESEND_API_KEY` sea correcta.

---

## 📋 Checklist Rápido

Antes de probar en producción:

- [ ] `ADMIN_EMAILS` configurada en Railway
- [ ] `RESEND_API_KEY` configurada en Railway
- [ ] `APP_URL` apunta a Vercel (NO a Railway)
- [ ] Railway hizo redeploy (espera 1-2 minutos)
- [ ] Probado con formulario de solicitud real
- [ ] Email llegó a ambos administradores

---

## 🆘 Si Sigue Sin Funcionar

### 1. Verifica Railway Logs

```
Railway Dashboard → Deployments → Logs
```

Busca errores relacionados con "email" o "admin notification".

### 2. Verifica que RESEND_API_KEY sea válida

```bash
# Test rápido con curl:
curl https://api.resend.com/emails \
  -H "Authorization: Bearer TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@infinitofit.com",
    "to": "maskemaky@gmail.com",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

**Si responde con `{"id":"..."}` → API key es válida ✅**
**Si responde con error → API key es inválida ❌**

### 3. Revisa carpeta de spam

Los emails podrían estar en spam/correo no deseado.

### 4. Verifica dominio en Resend

Ve a: https://resend.com/domains

Asegúrate de que `infinitofit.com` esté **verificado**.

---

## 🎯 Resultado Esperado

Después de configurar `ADMIN_EMAILS`:

```
Usuario envía solicitud
    ↓
✅ Solicitud guardada en base de datos
    ↓
✅ Email enviado a maskemaky@gmail.com
✅ Email enviado a iban.perezmi@gmail.com
    ↓
Administradores reciben email
    ↓
Administradores pueden aprobar/rechazar desde el email
```

---

## 📖 Documentación Completa

Para más detalles, lee:
- **FIX_ADMIN_EMAIL_NOT_SENT.md** - Guía completa con troubleshooting

---

**TL;DR:** Agrega `ADMIN_EMAILS=maskemaky@gmail.com,iban.perezmi@gmail.com` en Railway → Variables y espera redeploy. ¡Listo!
