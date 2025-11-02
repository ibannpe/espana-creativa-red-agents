# CLAUDE.md

Guía para Claude Code al trabajar con este repositorio.

## Visión General del Proyecto

**España Creativa Red** es una plataforma SaaS de networking que conecta emprendedores y mentores de la asociación España Creativa.

### Stack Tecnológico

- **Frontend**: Vite + React + TypeScript + React Router
- **Backend**: Express + TypeScript con Arquitectura Hexagonal
- **Base de Datos**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: shadcn/ui (componentes basados en Radix UI)
- **Estado**: React Query (estado remoto) + Zustand (estado global mínimo)
- **Estilos**: Tailwind CSS
- **Testing**: Vitest + React Testing Library

## Comandos de Desarrollo

### Ejecución de la Aplicación

```bash
# Servidor de desarrollo frontend (Vite en puerto 8080)
yarn dev

# Servidor API backend (Express en puerto 3001)
yarn dev:server

# Ambos servidores concurrentemente
yarn dev:full
```

### Build y Despliegue

```bash
# Build de producción
yarn build

# Build de desarrollo (con source maps)
yarn build:dev

# Vista previa del build de producción
yarn preview
```

### Calidad de Código

```bash
# Ejecutar ESLint
yarn lint

# Ejecutar tests
yarn test

# Ejecutar tests una vez
yarn test:run

# Cobertura de tests
yarn test:coverage
```

### Gestión de Base de Datos

```bash
# Limpiar datos de test
yarn clean-db

# Limpiar entorno de desarrollo (elimina todos los datos de usuario)
yarn clean-dev
```

## Arquitectura del Proyecto

### Arquitectura de Dual-Server

Este proyecto usa una **arquitectura de servidores separados**:

1. **Frontend (Vite)**: Puerto 8080, sirve la SPA de React
2. **Backend (Express)**: Puerto 3001, maneja rutas API y emails

La comunicación ocurre vía configuración de proxy en [vite.config.ts](vite.config.ts):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  }
}
```

### Estructura del Proyecto

```
├── src/                         # Frontend React
│   ├── app/
│   │   ├── features/           # Arquitectura basada en features
│   │   │   ├── auth/          # Autenticación con React Query
│   │   │   ├── profile/       # Gestión de perfiles
│   │   │   ├── messages/      # Mensajería en tiempo real
│   │   │   ├── opportunities/ # Oportunidades colaborativas
│   │   │   ├── network/       # Conexiones entre usuarios
│   │   │   ├── dashboard/     # Panel principal
│   │   │   └── signup-approval/ # Aprobación de registros
│   │   └── providers/          # Providers de React Query
│   ├── components/             # Componentes compartidos
│   │   ├── ui/                # shadcn/ui components
│   │   └── pages/             # Páginas principales
│   ├── lib/                   # Utilidades y clientes
│   │   ├── supabase.ts       # Cliente de Supabase
│   │   ├── axios.ts          # Cliente HTTP
│   │   └── utils.ts          # Funciones de utilidad
│   ├── types/                # Definiciones TypeScript
│   └── App.tsx               # Router principal
│
├── server/                    # Backend Express con Arquitectura Hexagonal
│   ├── domain/               # Dominio puro (sin dependencias)
│   │   ├── entities/        # Entidades de dominio
│   │   └── value-objects/   # Value Objects
│   ├── application/          # Lógica de aplicación
│   │   ├── use-cases/       # Casos de uso por dominio
│   │   └── ports/           # Interfaces (contratos)
│   └── infrastructure/       # Implementaciones concretas
│       ├── adapters/        # Implementación de ports
│       │   ├── repositories/
│       │   └── services/
│       ├── api/             # Express API
│       │   ├── routes/
│       │   └── middleware/
│       └── di/              # Inyección de dependencias
│
├── scripts/                  # Scripts de mantenimiento
├── migrations/               # Migraciones SQL
└── docs/                     # Documentación organizada
    ├── arquitectura/
    ├── deployment/
    ├── scripts/
    └── database/
```

## Patrón de Arquitectura por Features

**IMPORTANTE**: El proyecto usa arquitectura basada en features. Cada feature sigue este patrón:

```
feature-name/
├── components/          # Componentes presentacionales
├── hooks/              # Custom hooks
│   ├── mutations/      # useXXXMutation (POST/PUT/DELETE)
│   └── queries/        # useXXXQuery (GET)
├── data/               # Capa de datos
│   ├── schemas/        # Validación con Zod
│   └── services/       # Comunicación con API
└── pages/              # Páginas de la feature
```

### Sistema de Autenticación Actual

**Hook Principal**: `useAuthContext` de [src/app/features/auth/hooks/useAuthContext.tsx](src/app/features/auth/hooks/useAuthContext.tsx)

**Uso en componentes**:
```typescript
import { useAuthContext } from '@/app/features/auth/hooks/useAuthContext'

function MyComponent() {
  const { user, isLoading, signIn, signOut, signUp } = useAuthContext()

  if (isLoading) return <Loading />
  if (!user) return <Login />

  return <div>Hola {user.name}</div>
}
```

**Características**:
- ✅ React Query para gestión de estado
- ✅ Integración completa con backend Express
- ✅ Auto-refresh de tokens (Supabase)
- ✅ Persistencia de sesión
- ✅ Invalidación automática de caché
- ✅ Email de bienvenida en registro

### Endpoints API del Backend

**Autenticación** ([server/infrastructure/api/routes/auth.routes.ts](server/infrastructure/api/routes/auth.routes.ts)):
- `POST /api/auth/signup` - Registro de usuario
- `POST /api/auth/signin` - Inicio de sesión
- `POST /api/auth/signout` - Cierre de sesión
- `GET /api/auth/me` - Usuario actual autenticado

**Usuarios** ([server/infrastructure/api/routes/users.routes.ts](server/infrastructure/api/routes/users.routes.ts)):
- `GET /api/users/:userId` - Obtener perfil
- `PUT /api/users/:userId` - Actualizar perfil
- `GET /api/users/search` - Buscar usuarios
- `GET /api/users/recent` - Usuarios recientes

**Mensajes** ([server/infrastructure/api/routes/messages.routes.ts](server/infrastructure/api/routes/messages.routes.ts)):
- `POST /api/messages` - Enviar mensaje
- `GET /api/messages/conversations` - Obtener conversaciones
- `GET /api/messages/conversation/:id` - Obtener mensajes
- `PUT /api/messages/read` - Marcar como leído
- `DELETE /api/messages/:id` - Eliminar mensaje

**Oportunidades** ([server/infrastructure/api/routes/opportunities.routes.ts](server/infrastructure/api/routes/opportunities.routes.ts)):
- `GET /api/opportunities` - Listar oportunidades
- `POST /api/opportunities` - Crear oportunidad
- `GET /api/opportunities/:id` - Obtener oportunidad
- `PUT /api/opportunities/:id` - Actualizar oportunidad
- `DELETE /api/opportunities/:id` - Eliminar oportunidad
- `GET /api/opportunities/my` - Oportunidades del usuario

**Conexiones** ([server/infrastructure/api/routes/connections.routes.ts](server/infrastructure/api/routes/connections.routes.ts)):
- `GET /api/connections` - Obtener conexiones
- `POST /api/connections/request` - Solicitar conexión
- `GET /api/connections/status/:userId` - Estado de conexión
- `PUT /api/connections/:id` - Actualizar conexión
- `DELETE /api/connections/:id` - Eliminar conexión
- `GET /api/connections/stats` - Estadísticas de red

## Schema de Base de Datos

Ver [docs/database/supabase-schema.sql](docs/database/supabase-schema.sql) para el schema completo.

**Tablas Principales**:
- `users` - Perfiles de usuario extendidos (referencia a `auth.users`)
- `roles` - Roles del sistema: admin, mentor, emprendedor
- `user_roles` - Mapeo many-to-many usuario-rol
- `projects` - Proyectos y programas
- `opportunities` - Oportunidades colaborativas
- `messages` - Mensajes privados y tablón público
- `connections` - Conexiones entre usuarios
- `pending_signups` - Solicitudes de registro pendientes de aprobación

**Características Importantes**:
- Row Level Security (RLS) habilitado en todas las tablas
- Cálculo automático de completitud de perfil vía trigger
- Índices full-text search para español
- Índices GIN en campos array (skills, interests)
- Creación automática de perfil y rol por defecto en signup

## Sistema de Logging

**Frontend** ([src/lib/client-logger.ts](src/lib/client-logger.ts)):
- Batch logging enviado al backend
- Auto-flush en descarga de página
- Uso vía `devLogger` en código frontend

**Backend** ([server/logger.ts](server/logger.ts)):
- Logging estructurado con categorías
- Tracking de operaciones de email
- Agregación de logs del cliente

**API de Dev Logger** (disponible en frontend):
```typescript
import { devLogger } from '@/lib/logger'

devLogger.info(category, message, data)
devLogger.error(category, message, error)
devLogger.apiCall(method, endpoint, data, fnName)
```

## Sistema de Diseño

**Lenguaje Visual**:
- Color primario: Verde (#22c55e)
- Border radius: `rounded-xl`, `rounded-2xl` para cards y contenedores
- Sombras: `shadow-sm` con transiciones `hover:shadow-md`
- Espaciado: Padding generoso (`p-6`, `p-8`) y gaps (`gap-6`, `gap-8`)

**Patrones de Componentes**:
- Cards: Fondo blanco, bordes sutiles, efectos hover
- Formularios: Labels claros, estados focus con efectos ring
- Navegación: Header sticky con backdrop blur
- Botones: Redondeados con efectos de transición

## Flujos de Trabajo Comunes

### Agregar una Nueva Página Protegida

1. Crear componente de página en [src/components/pages/](src/components/pages/)
2. Agregar ruta en [src/App.tsx](src/App.tsx) envuelta con `<ProtectedRoute>`
3. Agregar link de navegación en [src/components/layout/Navigation.tsx](src/components/layout/Navigation.tsx)

### Implementar Nueva Feature

1. Crear carpeta en [src/app/features/](src/app/features/)
2. Seguir el patrón: `components/`, `hooks/`, `data/`, `pages/`
3. Crear schemas de validación con Zod en `data/schemas/`
4. Crear service para comunicación con API en `data/services/`
5. Crear hooks de queries y mutations
6. Crear componentes y páginas

### Cambios en Base de Datos

1. Crear migration en [migrations/](migrations/)
2. Actualizar [docs/database/supabase-schema.sql](docs/database/supabase-schema.sql)
3. Ejecutar migration con `node migrations/execute-migrations.mjs`
4. Actualizar tipos TypeScript en [src/types/](src/types/)
5. Actualizar políticas RLS si es necesario

### Agregar Notificación por Email

1. Crear función de template en [src/lib/resend.ts](src/lib/resend.ts)
2. Agregar endpoint API en [server/infrastructure/api/routes/email.routes.ts](server/infrastructure/api/routes/email.routes.ts)
3. Llamar endpoint desde frontend o trigger server-side
4. Probar con `RESEND_API_KEY` válida

## Variables de Entorno

Archivo `.env` en la raíz del proyecto:

```bash
# Supabase
VITE_SUPABASE_URL=          # URL del proyecto Supabase
VITE_SUPABASE_ANON_KEY=     # Clave anon pública
SUPABASE_SERVICE_ROLE_KEY=  # Clave service role (solo server)
SUPABASE_DB_PASSWORD=       # Contraseña PostgreSQL
SUPABASE_DB_CONNECTION_STRING=  # String de conexión psql completo

# Email
RESEND_API_KEY=             # Clave API de Resend para emails

# IMPORTANTE: Desarrollo Local
# Para desarrollo local, VITE_API_URL debe estar comentado para usar proxy de Vite
# VITE_API_URL solo debe configurarse en deployment de producción
```

### Credenciales de Test

El archivo `.env` incluye credenciales de test para desarrollo local:

```bash
# Ver credenciales de test en el archivo .env
# Sección: TEST_USER_EMAIL y TEST_USER_PASSWORD
```

**Uso recomendado**:
- Usa las credenciales de test del `.env` para pruebas locales
- No commitees credenciales reales al repositorio
- Las credenciales de test son solo para desarrollo

## Notas Importantes

### Configuración de TypeScript

Usa patrón de project references con [tsconfig.json](tsconfig.json) base:
- [tsconfig.app.json](tsconfig.app.json) - Configuración para código React (src/)
- [tsconfig.node.json](tsconfig.node.json) - Configuración para código Node (vite.config.ts, server/)

### Alias de Path

`@/` resuelve a `./src/` vía configuración Vite en [vite.config.ts](vite.config.ts).

### Configuración de Puertos

- Frontend (Vite): Puerto 8080
- Backend (Express): Puerto 3001

Si cambias puertos, actualizar:
- [vite.config.ts](vite.config.ts) `server.port`
- [vite.config.ts](vite.config.ts) `server.proxy.'/api'.target`
- [server/index.ts](server/index.ts) array de orígenes CORS

### Estructura de Branches Git

- **Branch principal**: `main`
- Crear PRs apuntando a `main`

## Testing

### Frontend Tests
- Runner: Vitest
- Testing Library: React Testing Library
- Ubicación: Archivos `.test.ts` y `.test.tsx` junto a código fuente

### Backend Tests
- Runner: Vitest
- Patrón: Builder pattern para test data
- Ubicación: Archivos `.test.ts` junto a código fuente

```bash
# Ejecutar tests en watch mode
yarn test

# Ejecutar tests una vez
yarn test:run

# Generar reporte de cobertura
yarn test:coverage
```

## Deployment

Ver [docs/deployment/DEPLOYMENT.md](docs/deployment/DEPLOYMENT.md) para instrucciones completas.

**Frontend y Backend deben deployarse por separado**:

**Frontend (Vite)**:
- Deploy a Vercel, Netlify, o hosting estático similar
- Configurar variables de entorno para Supabase

**Backend (Express)**:
- Deploy a Railway, Render, o plataforma serverless
- Actualizar proxy/URL de API del frontend a URL de backend de producción
- Configurar `RESEND_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY`

**Base de Datos**:
- Ya está en Supabase cloud
- Ejecutar [docs/database/supabase-schema.sql](docs/database/supabase-schema.sql) en instancia de producción
- Configurar políticas RLS

---

## Reglas de Trabajo con Claude Code

### Flujo de Trabajo de Sub-Agentes

**Reglas**:
- Tras la fase de planificación, crear archivo `.claude/sessions/context_session_{feature_name}.md` con definición del plan
- Antes de comenzar cualquier trabajo, revisar el archivo de sesión y archivos `.claude/doc/{feature_name}/*`
- El archivo de sesión debe contener el contexto y plan general, actualizado continuamente
- Al finalizar cada fase o tarea, actualizar el archivo de contexto con toda la información del trabajo realizado
- **Responder siempre en español**

### Sub-Agentes Especializados

Este proyecto usa sub-agentes especializados:
- `shadcn-ui-architect`: Construcción y arquitectura de componentes UI
- `qa-criteria-validator`: Validación final de UI/UX
- `ui-ux-analyzer`: Revisión e iteración de UI/UX
- `frontend-developer`: Lógica de negocio del cliente
- `frontend-test-engineer`: Definición de casos de prueba del frontend
- `typescript-test-explorer`: Diseño de pruebas TypeScript
- `hexagonal-backend-architect`: Arquitectura backend y API
- `backend-test-architect`: Definición de pruebas backend

**Los subagentes investigan e informan, pero el agente principal implementa.**
Antes de actuar, consultar siempre los archivos contextuales creados por ellos.

### Estándares de Escritura de Código

- **Simplicidad Primero**: Preferir soluciones simples y mantenibles sobre las ingeniosas
- **Comentarios ABOUTME**: Todos los archivos deben iniciar con dos líneas que empiecen con `ABOUTME:` explicando el propósito del archivo
- **Cambios Mínimos**: Solo los necesarios para cumplir el objetivo
- **Consistencia de Estilo**: Igualar el formato y estilo existente del archivo
- **Preservar Comentarios**: No eliminar comentarios salvo que sean falsos
- **Sin Nombres Temporales**: Evitar términos como "nuevo", "mejorado", etc.
- **Documentación Perpetua**: Los comentarios deben describir el código actual, no su historia

### Control de Versiones

- Los cambios no triviales deben registrarse en git
- Crear branches WIP para nuevo trabajo
- Hacer commits frecuentes
- No eliminar implementaciones sin permiso explícito

### Requisitos de Pruebas

**POLÍTICA SIN EXCEPCIONES**:
Todo proyecto debe incluir pruebas unitarias.

La única forma de omitir pruebas es que Iban diga explícitamente:
> "AUTORIZO QUE OMITAS LAS PRUEBAS ESTA VEZ."

- Las pruebas deben cubrir toda la funcionalidad
- La salida de las pruebas debe ser limpia y sin errores
- Nunca ignorar los logs o resultados: pueden contener información crítica

### Cumplimiento de Arquitectura

**Backend**:
1. Mantener el Dominio Puro: sin dependencias de frameworks
2. Definir Puertos Primero: interfaces en `application/ports/`
3. Controladores Delgados: las rutas API delegan a casos de uso
4. Inyección de Dependencias: todo se inyecta por constructor
5. Patrón Repositorio: el acceso a datos solo a través de interfaces

**Frontend**:
1. Patrón Contenedor: separar lógica de presentación
2. Hooks Personalizados: la lógica de negocio en hooks
3. Organización por Características: `app/features/`
4. Componentes Puros: los componentes reciben props, los hooks gestionan estado

### Comunicación

- **Dirigirse SIEMPRE como "Iban"**
- Priorizar claridad y mantenibilidad sobre concisión o rendimiento
- Preguntar antes de asumir
- Detenerse y pedir ayuda si bloqueado
- Cualquier excepción a las reglas requiere autorización explícita de Iban

---

**Última actualización**: 2025-11-02
