# Guía de Depuración en Producción con Vercel

## Información del Proyecto

- **Proyecto Vercel**: `espana-creativa-red-agents`
- **URL de Producción**: https://espana-creativa-red-agents-22ymd8glb-ipms-projects-f53884bc.vercel.app
- **Team**: ipms-projects-f53884bc
- **Project ID**: prj_RSWto1Z59qoQ0zV2v6OpwCO45SjT

## 1. Comandos Básicos de Depuración

### Ver Logs del Último Deployment

```bash
# Ver logs de build del último deployment
vercel inspect espana-creativa-red-agents-22ymd8glb-ipms-projects-f53884bc.vercel.app --logs

# Ver logs con timeout personalizado (útil para builds lentos)
vercel inspect espana-creativa-red-agents-22ymd8glb-ipms-projects-f53884bc.vercel.app --logs --timeout 60s

# Ver logs de runtime (después del deployment)
vercel logs espana-creativa-red-agents-22ymd8glb-ipms-projects-f53884bc.vercel.app
```

### Listar Todos los Deployments

```bash
# Listar deployments recientes
vercel ls

# Ver detalles de un deployment específico
vercel inspect <deployment-url>
```

### Redesplegar

```bash
# Redesplegar el último deployment (útil si hay problemas temporales)
vercel redeploy espana-creativa-red-agents-22ymd8glb-ipms-projects-f53884bc.vercel.app

# Redesplegar a producción
vercel --prod
```

## 2. Gestión de Variables de Entorno

### Listar Variables de Entorno

```bash
vercel env ls
```

**Variables Actuales en Vercel**:
- `VITE_API_URL` - Development, Preview, Production
- `APP_URL` - Production
- `VITE_SUPABASE_URL` - Production, Preview, Development
- `VITE_SUPABASE_ANON_KEY` - Production, Preview, Development
- `SUPABASE_SERVICE_ROLE_KEY` - Production, Preview, Development
- `RATE_LIMIT_SIGNUPS_PER_HOUR` - Production, Preview, Development
- `RATE_LIMIT_SIGNUPS_PER_DAY` - Production, Preview, Development
- `ADMIN_EMAILS` - Production, Preview, Development

### Sincronizar Variables de Entorno Localmente

```bash
# Descargar variables de entorno de Vercel a .env.local
vercel env pull .env.local

# Esto creará un archivo .env.local con todas las variables de producción
```

### Agregar/Modificar Variables de Entorno

```bash
# Agregar nueva variable de entorno
vercel env add NOMBRE_VARIABLE

# Eliminar variable de entorno
vercel env rm NOMBRE_VARIABLE
```

## 3. Depuración de Problemas Comunes

### Problema: La aplicación no carga o muestra pantalla blanca

**Diagnóstico**:
1. Verificar logs del navegador (Console de DevTools)
2. Verificar que las variables de entorno estén configuradas
3. Revisar los logs de build para errores

```bash
# Ver logs de build
vercel inspect <deployment-url> --logs

# Verificar que el build se completó correctamente
# El output debe mostrar "✓ built in X.XXs"
```

### Problema: Error 404 en rutas de la aplicación

**Causa**: Vercel no está configurado para SPA routing (React Router).

**Solución**: Verificar que existe `vercel.json` con rewrites:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Problema: Error de CORS o API no responde

**Diagnóstico**:
1. Verificar que `VITE_API_URL` está configurada correctamente
2. Revisar si el backend está desplegado y accesible

```bash
# Verificar variable de entorno
vercel env ls

# Probar el endpoint de API directamente
curl -I https://tu-backend-url.com/health
```

### Problema: Supabase no conecta

**Diagnóstico**:
1. Verificar que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configuradas
2. Verificar que las URLs sean correctas

```bash
# Descargar variables para verificar localmente
vercel env pull .env.local

# Revisar el archivo .env.local
cat .env.local
```

## 4. Depuración Avanzada

### Ver Logs en Tiempo Real

```bash
# Ver logs en tiempo real (requiere deployment activo)
vercel logs --follow

# Ver logs de un deployment específico
vercel logs <deployment-url> --follow
```

### Inspeccionar Build Cache

```bash
# Ver información sobre el cache usado
vercel inspect <deployment-url> --logs | grep -i cache
```

### Verificar Bundle Size

El último build muestra:
- **index.js**: 740.76 kB (gzip: 216.62 kB) ⚠️ **Muy grande**
- **index.css**: 74.11 kB (gzip: 12.46 kB)

**Recomendación**: Considerar code-splitting para reducir el tamaño del bundle.

```bash
# Ver advertencias de bundle size en los logs
vercel inspect <deployment-url> --logs | grep -i "chunk"
```

### Configurar Source Maps para Depuración

Agregar en `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    sourcemap: true, // Habilita source maps en producción
  }
})
```

Luego redesplegar:

```bash
vercel --prod
```

## 5. Monitoreo Continuo

### Dashboard de Vercel

Accede al dashboard para:
- Ver métricas de rendimiento
- Analytics de uso
- Logs históricos
- Errores de runtime

URL: https://vercel.com/ipms-projects-f53884bc/espana-creativa-red-agents

### Configurar Notificaciones

1. Ve a Project Settings en Vercel Dashboard
2. Configura notificaciones para:
   - Deployment failures
   - Build errors
   - Runtime errors

## 6. Workflow de Depuración Recomendado

Cuando encuentres un error en producción:

1. **Reproducir localmente**:
   ```bash
   # Sincronizar variables de entorno
   vercel env pull .env.local

   # Ejecutar build de producción localmente
   yarn build
   yarn preview
   ```

2. **Revisar logs de Vercel**:
   ```bash
   vercel inspect <deployment-url> --logs
   ```

3. **Verificar variables de entorno**:
   ```bash
   vercel env ls
   ```

4. **Probar con deployment de preview**:
   ```bash
   # Crea un deployment de preview sin afectar producción
   vercel
   ```

5. **Si el fix funciona, desplegar a producción**:
   ```bash
   vercel --prod
   ```

## 7. Problemas Específicos del Proyecto

### Backend Express no desplegado en Vercel

⚠️ **IMPORTANTE**: Tu proyecto tiene un servidor Express en `server/index.ts` que **NO se despliega automáticamente** con Vercel.

**Opciones**:

1. **Desplegar backend por separado** (Railway, Render, etc.)
2. **Migrar a Vercel Serverless Functions**:
   - Mover endpoints de `server/index.ts` a `api/` como serverless functions
   - Ejemplo: `api/send-email.ts`, `api/auth/signup.ts`, etc.

3. **Verificar VITE_API_URL**:
   ```bash
   # Debe apuntar al backend desplegado externamente
   vercel env ls | grep VITE_API_URL
   ```

### Verificar Conectividad con Supabase

```bash
# Probar conexión localmente con variables de producción
vercel env pull .env.local
source .env.local
psql $SUPABASE_DB_CONNECTION_STRING -c "SELECT 1;"
```

## 8. Recursos Útiles

- **Vercel Dashboard**: https://vercel.com/ipms-projects-f53884bc/espana-creativa-red-agents
- **Documentación Vercel CLI**: https://vercel.com/docs/cli
- **Guía de Troubleshooting**: https://vercel.com/docs/errors

## 9. Comandos de Emergencia

```bash
# Rollback a un deployment anterior
vercel rollback <previous-deployment-url>

# Cancelar deployment en progreso
vercel cancel

# Ver estado de todos los deployments
vercel ls

# Eliminar deployment específico
vercel rm <deployment-url>
```

## Notas Finales

- Los logs de build muestran que el último deployment se completó exitosamente en 8 segundos
- El bundle size es grande (740 KB) - considera implementar code-splitting
- Asegúrate de que el backend Express esté desplegado por separado y accesible
- Usa `vercel env pull` regularmente para mantener sincronizadas las variables locales
