# Scripts de Base de Datos

## clean-test-data.js

Script para limpiar todos los datos de prueba de la base de datos, manteniendo la estructura de tablas y los roles por defecto.

### Uso

```bash
# Desde la raíz del proyecto
node scripts/clean-test-data.js
```

### ¿Qué hace?

- 🗑️ Elimina todos los registros de las tablas principales
- ✅ Mantiene la estructura de tablas intacta
- ✅ Preserva los roles por defecto (admin, mentor, emprendedor)
- 🔍 Verifica que la limpieza se completó correctamente
- 📊 Muestra estadísticas de registros eliminados

### Orden de limpieza

El script respeta las restricciones de foreign key eliminando en este orden:

1. `interests` - Intereses de usuarios en proyectos
2. `messages` - Mensajes privados y públicos
3. `opportunities` - Oportunidades de colaboración
4. `projects` - Proyectos y programas
5. `user_roles` - Relaciones usuario-rol
6. `users` - Perfiles de usuario

### Seguridad

- ⚠️ **CUIDADO**: Este script elimina TODOS los datos de prueba
- 🔒 Usa la clave de servicio para operaciones administrativas
- 🚫 NO elimina usuarios de `auth.users` (se mantienen para referencias)
- ✅ Ideal para limpiar entre releases o versiones de prueba

### Ejemplo de salida

```
🧹 Iniciando limpieza de datos de prueba...

⚠️  ATENCIÓN: Este script eliminará TODOS los datos de prueba
📋 Tablas a limpiar: interests, messages, opportunities, projects, user_roles, users
🔄 Procesando...

🗑️  interests: 5 registros eliminados
🗑️  messages: 12 registros eliminados
🗑️  opportunities: 3 registros eliminados
🗑️  projects: 2 registros eliminados
🗑️  user_roles: 8 registros eliminados
🗑️  users: 4 registros eliminados

✨ Limpieza completada!
📊 Total de registros eliminados: 34

🔍 Verificando limpieza...
   interests: 0 registros
   messages: 0 registros
   opportunities: 0 registros
   projects: 0 registros
   user_roles: 0 registros
   users: 0 registros
   roles: 3 registros (admin, mentor, emprendedor)

🎉 Base de datos lista para nuevas pruebas!
```