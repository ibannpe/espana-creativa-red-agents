# España Creativa Red

Plataforma SaaS de networking que conecta emprendedores y mentores de la asociación España Creativa.

## 🚀 Características

- **Autenticación segura** con Supabase Auth (email/password y Google SSO)
- **Perfiles de usuario** completos con sistema de completitud
- **Búsqueda y filtrado** de usuarios por rol, ubicación y habilidades
- **Sistema de roles** (Admin, Mentor, Emprendedor)
- **Chat privado** y tablón público (próximamente)
- **Gestión de oportunidades** de colaboración
- **Programas y proyectos** futuros
- **Notificaciones por email** con Resend

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 + TypeScript
- **UI Components**: shadcn/ui + Tailwind CSS (con sistema de diseño moderno)
- **Estado global**: Zustand
- **Base de datos**: Supabase
- **Autenticación**: Supabase Auth
- **Email**: Resend
- **Hosting**: Vercel (recomendado)

## 🎨 Sistema de Diseño

### Principios de Diseño
La aplicación implementa un sistema de diseño moderno con:

- **Esquema de colores**: Verde primario (#22c55e) con gradientes y acentos
- **Bordes redondeados**: `rounded-xl`, `rounded-2xl` para elementos principales
- **Sombras suaves**: `shadow-sm` con `hover:shadow-md`
- **Espaciado generoso**: `p-6`, `p-8`, `gap-6`, `gap-8`
- **Transiciones fluidas**: `transition-all duration-200`

### Componentes Estandarizados

**Clases CSS Personalizadas:**
```css
/* Tarjetas modernas */
.card-modern {
  @apply bg-white rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200;
}

/* Botones modernos */
.button-modern {
  @apply inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200;
}

/* Inputs modernos */
.input-modern {
  @apply flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20;
}
```

### Patrones Obligatorios
- **Navegación**: Sticky con backdrop-blur y gradientes en el logo
- **Tarjetas**: Fondo blanco con bordes sutiles y efectos hover
- **Iconos**: Contenedores redondeados con colores de fondo suaves
- **Formularios**: Labels claros, inputs con focus states, feedback visual
- **Estados**: Carga, error y vacío con diseño consistente

**⚠️ IMPORTANTE**: Todo código nuevo debe seguir estos patrones de diseño para mantener la consistencia visual en toda la aplicación.

## 📋 Requisitos Previos

- Node.js 18+
- Yarn
- Cuenta de Supabase
- Cuenta de Resend (opcional, para emails)

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd espana-creativa-red
   ```

2. **Instalar dependencias**
   ```bash
   yarn install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Editar `.env.local` con tus credenciales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
   RESEND_API_KEY=tu_clave_de_resend
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Configurar la base de datos**
   - Crear un nuevo proyecto en [Supabase](https://supabase.com)
   - Ejecutar el script SQL en `supabase-schema.sql` en el editor SQL de Supabase
   - Configurar las políticas RLS (ya incluidas en el script)

5. **Ejecutar en desarrollo**
   ```bash
   yarn dev
   ```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard principal
│   ├── network/           # Búsqueda de usuarios
│   ├── profile/           # Perfil de usuario
│   └── ...
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticación
│   ├── layout/           # Layout y navegación
│   ├── network/          # Búsqueda y filtros
│   ├── profile/          # Componentes de perfil
│   └── ui/               # Componentes UI (shadcn)
├── lib/                   # Utilidades y configuración
│   ├── api/              # Funciones API
│   ├── auth.ts           # Funciones de autenticación
│   ├── supabase.ts       # Cliente de Supabase
│   └── utils.ts          # Utilidades generales
├── store/                 # Estado global (Zustand)
├── types/                 # Definiciones de tipos TypeScript
└── ...
```

## 🎯 Funcionalidades Implementadas

### ✅ Fase 1 - MVP
- [x] Autenticación completa (email/password + Google SSO)
- [x] Perfiles de usuario con CRUD
- [x] Sistema de completitud de perfil
- [x] Búsqueda y filtrado de usuarios
- [x] Sistema de roles
- [x] Navegación responsive
- [x] Páginas principales (Dashboard, Perfil, Red)

### 🚧 En Desarrollo
- [ ] Chat privado con Supabase Realtime
- [ ] Sistema de oportunidades
- [ ] Tablón público
- [ ] Notificaciones por email
- [ ] Programas y proyectos

### 📋 Próximas Funcionalidades
- [ ] Panel de administración
- [ ] Notificaciones push
- [ ] Sistema de moderación
- [ ] Analytics y métricas
- [ ] Integración con calendarios

## 🔒 Seguridad

- **Row Level Security (RLS)** activado en todas las tablas
- **Políticas de acceso** configuradas por rol
- **Validación de datos** en frontend y backend
- **Tokens JWT** con expiración automática
- **Rate limiting** en API routes

## 📧 Sistema de Emails

El proyecto está preparado para usar Resend para el envío de emails:

- Email de bienvenida
- Notificaciones de mensajes
- Recordatorios de perfil incompleto
- Alertas de nuevas oportunidades

## 🚀 Deployment

### Vercel (Recomendado)

1. Conectar el repositorio a Vercel
2. Configurar las variables de entorno en Vercel
3. Deploy automático en cada push

### Docker (Alternativo)

```bash
# Construir imagen
docker build -t espana-creativa-red .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env.local espana-creativa-red
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
yarn test

# Ejecutar tests en modo watch
yarn test:watch

# Coverage
yarn test:coverage
```

## 🔧 Scripts Disponibles

```bash
yarn dev          # Desarrollo
yarn build        # Construcción para producción
yarn start        # Servidor de producción
yarn lint         # Linting
yarn type-check   # Verificación de tipos
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto es privado y pertenece a España Creativa.

## 🆘 Soporte

Para soporte técnico o preguntas sobre el proyecto, contactar al equipo de desarrollo.

---

## 🗂️ Base de Datos

### Tablas principales:

- **users**: Perfiles de usuario extendidos
- **roles**: Definición de roles del sistema
- **user_roles**: Relación muchos a muchos usuario-rol
- **opportunities**: Oportunidades de colaboración
- **projects**: Proyectos y programas futuros
- **messages**: Sistema de mensajería
- **interests**: Intereses de usuarios en proyectos

### Índices optimizados:

- Full-text search en español
- Índices GIN para arrays (skills, interests)
- Índices compuestos para consultas frecuentes

---

**España Creativa Red** - Conectando el futuro del emprendimiento español 🇪🇸
