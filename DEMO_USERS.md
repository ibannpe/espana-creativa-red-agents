# Usuarios Demo para Testing E2E

Este documento contiene las credenciales de usuarios de prueba con perfiles completos para realizar testing end-to-end en la plataforma España Creativa Red.

## 👩‍🏫 Usuario Mentor

**Perfil:**
- **Nombre:** Ana García López
- **Email:** `mentor1@demo.espanacreativa.com`
- **Password:** `DemoPass123!`
- **Rol:** Mentor (también tiene rol de emprendedor)
- **Ubicación:** Madrid, España
- **Completitud del perfil:** 80%

**Características:**
- 6 habilidades definidas: Estrategia Empresarial, Marketing Digital, Transformación Digital, Mentoring, Growth Hacking, E-commerce
- 5 intereses: Innovación, Sostenibilidad, Educación, Tecnología, Emprendimiento Social
- Bio completa sobre experiencia en transformación digital
- LinkedIn y sitio web configurados

**URL del perfil:**
```
http://localhost:8080/profile/617fba2f-6ab3-4291-930f-85fe57f95769
```

---

## 👨‍💼 Usuario Emprendedor

**Perfil:**
- **Nombre:** Carlos Ruiz Martínez
- **Email:** `emprendedor1@demo.espanacreativa.com`
- **Password:** `DemoPass456!`
- **Rol:** Emprendedor
- **Ubicación:** Valencia, España
- **Completitud del perfil:** 80%

**Características:**
- 5 habilidades: Agricultura Sostenible, IoT, Desarrollo de Producto, Python, Data Analysis
- 5 intereses: Sostenibilidad, AgriTech, Innovación, Impacto Social, Tecnología Verde
- Fundador de TechVerde (startup de agricultura sostenible)
- Busca mentores en fundraising y expansión internacional

**URL del perfil:**
```
http://localhost:8080/profile/cef93075-c09e-4d62-9ebb-b22262a7a1f3
```

---

## 🧪 Casos de Uso para Testing

### Escenarios de Login
1. Login como mentor → Ver dashboard de mentor
2. Login como emprendedor → Ver dashboard de emprendedor
3. Alternar entre ambos usuarios para probar mensajería

### Escenarios de Red/Conexiones
1. Como emprendedor, buscar al mentor
2. Solicitar conexión
3. Como mentor, aceptar la conexión
4. Verificar que aparecen en redes mutuas

### Escenarios de Mensajería
1. Enviar mensaje del emprendedor al mentor
2. Responder como mentor
3. Verificar notificaciones

### Escenarios de Oportunidades
1. Como mentor, crear una oportunidad
2. Como emprendedor, ver y aplicar a la oportunidad
3. Verificar notificaciones y seguimiento

---

## 🔧 Scripts Útiles

### Verificar credenciales
```bash
node scripts/verify-demo-credentials.mjs
```

### Resetear contraseñas
```bash
node scripts/reset-demo-passwords.mjs
```

### Ver perfiles completos
```bash
PGPASSWORD='E23lST9WncCdUGpu' /opt/homebrew/opt/postgresql@16/bin/psql \
  "postgresql://postgres.jbkzymvswvnkrxriyzdx:E23lST9WncCdUGpu@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?gssencmode=disable" \
  -c "SELECT email, name, bio, location, skills, interests FROM users WHERE email LIKE '%demo%';"
```

---

## ⚠️ Notas Importantes

1. **Estos usuarios son SOLO para desarrollo local y testing**
2. No usar estas credenciales en producción
3. Las contraseñas están versionadas en este repositorio para facilitar testing
4. Los perfiles tienen datos ficticios pero realistas
5. Ambos usuarios están verificados y pueden acceder inmediatamente

---

**Última actualización:** 2025-11-04
