# 🧹 Limpieza Completa del Entorno de Desarrollo

Este script limpia completamente la base de datos y el almacenamiento de Supabase para empezar con un entorno de desarrollo fresco.

## ⚠️ ADVERTENCIAS IMPORTANTES

- **SOLO para desarrollo**: El script tiene protecciones contra ejecución en producción
- **Elimina TODO**: Usuarios, mensajes, proyectos, fotos, etc.
- **Irreversible**: Una vez ejecutado, no se pueden recuperar los datos
- **Requiere Service Role Key**: Necesitas la clave de servicio de Supabase (no la anon key)

## 🔧 Requisitos

### Variables de Entorno Necesarias

Crea un archivo `.env` en la raíz del proyecto con:

```env
# URL de tu proyecto Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co

# Service Role Key (NO la anon key)
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

### Dónde encontrar la Service Role Key

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Configuración > API
3. Copia la "service_role" key (NO la "anon" key)

## 🚀 Cómo Usar

### Opción 1: Comando NPM (Recomendado)
```bash
npm run clean-dev
```

### Opción 2: Directamente con Node
```bash
node scripts/clean-dev-environment.js
```

## 📋 Qué Hace el Script

### 1. 🗃️ Limpia Base de Datos
- Elimina todos los usuarios de `auth.users`
- Limpia tablas en orden correcto:
  - `interests` (intereses en proyectos)
  - `messages` (mensajes privados y públicos)
  - `opportunities` (oportunidades de colaboración)
  - `projects` (proyectos)
  - `user_roles` (relaciones usuario-rol)
  - `users` (perfiles extendidos)
- **Mantiene**: La tabla `roles` (datos de configuración)

### 2. 🗂️ Limpia Almacenamiento
- Elimina todas las fotos del bucket `fotos-perfil`
- Limpia subcarpetas como `avatars/`
- Mantiene la estructura del bucket

### 3. 🔄 Restablece Configuración
- Recrea roles por defecto:
  - `admin`: Administrador con acceso completo
  - `mentor`: Mentor con privilegios extendidos
  - `emprendedor`: Emprendedor con acceso estándar

## ✅ Verificación de Seguridad

El script incluye protecciones:
- Verifica que NO sea entorno de producción
- Requiere Service Role Key válida
- Muestra advertencias antes de ejecutar
- Logs detallados de cada paso

## 🔍 Ejemplo de Salida

```
🧹 LIMPIEZA COMPLETA DEL ENTORNO DE DESARROLLO
==================================================
⚠️  ADVERTENCIA: Esto eliminará TODOS los datos
==================================================

🗑️ Limpiando base de datos...
  📋 Eliminando datos de tabla: interests
    ✅ Tabla interests limpiada
  📋 Eliminando datos de tabla: messages
    ✅ Tabla messages limpiada
  👥 Eliminando usuarios de autenticación...
    ✅ Usuario eliminado: usuario@example.com
✅ Base de datos limpiada completamente

🗂️ Limpiando almacenamiento...
  📁 Limpiando bucket: fotos-perfil
    🗑️ Eliminando 5 archivos...
    ✅ 5 archivos eliminados
✅ Almacenamiento limpiado completamente

🔄 Restableciendo roles por defecto...
    ✅ Rol admin restablecido
    ✅ Rol mentor restablecido
    ✅ Rol emprendedor restablecido
✅ Roles restablecidos

🎉 LIMPIEZA COMPLETADA
✅ Base de datos vacía
✅ Almacenamiento vacío
✅ Roles restablecidos

🚀 El entorno está listo para desarrollo fresco
```

## 🚨 Solución de Problemas

### Error: Variables de entorno no encontradas
- Asegúrate de tener un archivo `.env` válido
- Verifica que las variables estén bien escritas

### Error: Insufficient permissions
- Estás usando la "anon key" en lugar de la "service_role key"
- Ve a Supabase Dashboard > Settings > API y copia la service_role key

### Error: Parece ser entorno de producción
- El script detectó que podría ser producción por seguridad
- Solo se ejecuta en entornos de desarrollo

## 🔄 Después de la Limpieza

1. **Reinicia el servidor de desarrollo**: `npm run dev`
2. **Crea un nuevo usuario** desde la página de registro
3. **Verifica** que todo funciona correctamente
4. **¡Desarrolla con tranquilidad!** 🎉