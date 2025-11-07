# Path Crítico de Tests

## Descripción

El **path crítico** es un conjunto mínimo de tests que validan la funcionalidad esencial de la plataforma. Estos tests **deben pasar siempre** antes de realizar cambios importantes o deploys.

## Ejecución

```bash
# Ejecutar tests del path crítico
yarn test:critical

# Modo watch para desarrollo
yarn test:critical:watch

# Con reporte de cobertura
yarn test:critical:coverage
```

## Tests Incluidos

### 🔴 Nivel Crítico - Backend Use Cases (Core Business Logic)

Estos tests validan la lógica de negocio principal del backend:

1. **`server/application/use-cases/auth/SignUpUseCase.test.ts`**
   - Registro de nuevos usuarios
   - Validación de email y contraseña
   - Creación de perfil en base de datos
   - Envío de email de bienvenida
   - Manejo de errores y rollback

2. **`server/application/use-cases/messages/SendMessageUseCase.test.ts`**
   - Envío de mensajes entre usuarios
   - Validación de permisos
   - Persistencia de mensajes

3. **`server/application/use-cases/users/GetRecentUsersUseCase.test.ts`**
   - Consulta de usuarios recientes
   - Paginación correcta
   - Filtrado de datos

### 🟠 Nivel Alta Prioridad - Domain Layer (Integridad de Datos)

Tests que garantizan la integridad de las entidades y value objects del dominio:

4. **`server/domain/value-objects/Email.test.ts`**
   - Validación de formato de email
   - Rechazo de emails inválidos

5. **`server/domain/value-objects/UserId.test.ts`**
   - Validación de UUIDs
   - Generación de IDs únicos

6. **`server/domain/entities/User.test.ts`**
   - Creación de entidades User
   - Validación de reglas de negocio
   - Inmutabilidad de entidades

7. **`server/domain/entities/Message.test.ts`**
   - Creación de entidades Message
   - Validación de longitud de contenido
   - Relaciones entre usuarios

### 🟡 Nivel Media Prioridad - Frontend Schemas (Validación de Datos)

Tests que validan los schemas de entrada/salida del frontend:

8. **`src/app/features/auth/data/schemas/auth.schema.test.ts`**
   - Validación de requests de signup/signin
   - Validación de responses de autenticación
   - Manejo de errores

9. **`src/app/features/auth/data/services/auth.service.test.ts`**
   - Integración con Supabase Auth
   - Manejo de tokens
   - Gestión de sesiones

10. **`src/app/features/messages/data/schemas/message.schema.test.ts`**
    - Validación de requests de mensajes
    - Validación de paginación
    - Validación de respuestas

11. **`src/app/features/signup-approval/data/schemas/signup-approval.schema.test.ts`**
    - Validación de solicitudes de aprobación
    - Estados de aprobación válidos

## Estadísticas

- **Total de tests en el proyecto**: ~326 tests
- **Tests en path crítico**: ~164 tests (50%)
- **Tiempo de ejecución**: ~6 segundos
- **Archivos cubiertos**: 11 archivos críticos

## Cuándo Ejecutar

### ✅ SIEMPRE ejecutar antes de:

1. **Commits importantes**
   ```bash
   yarn test:critical && git commit -m "..."
   ```

2. **Pull Requests**
   ```bash
   yarn test:critical && gh pr create
   ```

3. **Merge a main**
   ```bash
   git checkout main
   yarn test:critical && git merge feature-branch
   ```

4. **Deploy a producción**
   ```bash
   yarn test:critical && yarn build && yarn deploy
   ```

### ✅ Ejecutar después de:

- Cambios en use cases del backend
- Cambios en entidades de dominio
- Cambios en value objects
- Cambios en schemas de validación
- Actualizaciones de dependencias críticas (Supabase, Zod, etc.)
- Cambios en la lógica de autenticación
- Cambios en la lógica de mensajería

## Interpretación de Resultados

### ✅ Tests Pasando (Ideal)

```bash
Test Files  11 passed (11)
Tests  164 passed (164)
Duration  6.19s
```

**Acción**: Puedes proceder con confianza.

### ⚠️ Tests Fallando

```bash
Test Files  4 failed | 7 passed (11)
Tests  8 failed | 156 passed (164)
```

**Acción**:
1. **NO MERGEAR** ni hacer deploy
2. Investigar los fallos uno por uno
3. Corregir el código o los tests
4. Volver a ejecutar `yarn test:critical`
5. Repetir hasta que todos pasen

## Estado Actual

**✅ PATH CRÍTICO AL 100%**: Todos los tests pasando exitosamente.

```bash
Test Files  11 passed (11)
Tests  171 passed (171)
Duration  ~6 seconds
```

### Historial de Correcciones

**2025-11-06**: Arreglados todos los tests fallando

1. ✅ **auth.service.test.ts** (1 test):
   - Corregido mock de @/lib/axios
   - Agregado mock de fetch y supabase
   - Agregado role_ids a mocks

2. ✅ **auth.schema.test.ts** (3 tests):
   - Passwords actualizados a Password123 (cumple requisitos)
   - Agregado role_ids a userResponseSchema
   - Búsqueda correcta de errores específicos

3. ✅ **message.schema.test.ts** (2 tests):
   - Tests corregidos: message.id es BIGSERIAL, no UUID
   - message_ids también son strings normales

4. ✅ **SignUpUseCase** (3 tests):
   - Mock de findById retorna User completo
   - Simula correctamente el trigger de base de datos
   - UserProps completo con todos los campos requeridos

## Configuración

La configuración del path crítico está en:
- **Archivo**: `vitest.critical.config.ts`
- **Scripts**: `package.json` (líneas 19-21)

Para agregar o quitar tests del path crítico, edita el array `include` en `vitest.critical.config.ts`.

## Mejores Prácticas

1. **Ejecuta el path crítico localmente** antes de push
2. **No ignores tests fallando** - investiga y corrige
3. **Mantén los tests rápidos** - el path crítico debe ejecutarse en < 10 segundos
4. **Agrega tests críticos nuevos** cuando agregues funcionalidad core
5. **Documenta fallos conocidos** en este archivo

## Roadmap

- [x] Arreglar los 8 tests actualmente fallando ✅ **COMPLETADO 2025-11-06**
- [ ] Agregar tests críticos para Opportunities
- [ ] Agregar tests críticos para Connections
- [ ] Configurar CI/CD para ejecutar path crítico automáticamente
- [ ] Configurar pre-commit hook para path crítico
- [ ] Agregar badge de status en README principal

---

**Última actualización**: 2025-11-06
**Tests críticos**: 171 ✅ **100% PASSING**
**Cobertura objetivo**: ✅ **ALCANZADO**
