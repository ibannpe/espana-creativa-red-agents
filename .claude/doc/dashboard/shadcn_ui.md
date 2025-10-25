# Plan de Implementación: NewMemberCard Component
## Proyecto: España Creativa Red - Dashboard Feature

**Fecha**: 2025-10-25
**Feature**: Dashboard - New Members Section
**Componente**: `NewMemberCard`
**Ubicación**: `src/app/features/dashboard/components/NewMemberCard.tsx`

---

## 1. Análisis y Decisión Arquitectónica

### 1.1 ¿Por qué crear NewMemberCard en vez de reutilizar UserConnectionCard?

**Razones para crear un componente separado:**

1. **Propósito diferente**:
   - `UserConnectionCard`: Componente versátil para gestión completa de conexiones (aceptar, rechazar, eliminar)
   - `NewMemberCard`: Componente específico para mostrar nuevos miembros con **acción única de conectar**

2. **Complejidad reducida**:
   - `UserConnectionCard` tiene 4 estados diferentes (none, pending, accepted, rejected) con múltiples acciones
   - `NewMemberCard` solo necesita 3 estados simples (puede conectar, solicitud enviada, ya conectado)

3. **Layout optimizado**:
   - `UserConnectionCard`: Layout flexible (compact mode, info completa con bio, skills)
   - `NewMemberCard`: Layout **ultra-compacto** optimizado para listas/grids de dashboard

4. **Menos dependencias**:
   - `UserConnectionCard` usa 3 mutations + 1 query
   - `NewMemberCard` solo necesita 1 mutation

5. **Responsabilidad única (SOLID)**:
   - Mantener componentes enfocados en un solo caso de uso
   - Más fácil de mantener y testear

---

## 2. Componentes shadcn/ui Necesarios

### 2.1 Componentes ya instalados ✅

Todos los componentes necesarios ya están disponibles en el proyecto:

```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
```

**NO se necesita instalar componentes adicionales del registry.**

### 2.2 Componentes adicionales

```typescript
import { useToast } from '@/hooks/use-toast'
```

### 2.3 Iconos (lucide-react)

```typescript
import { UserPlus } from 'lucide-react'
```

---

## 3. Interface de Props

### 3.1 Props propuestas

```typescript
interface NewMemberCardProps {
  user: User  // Tipo ya definido en src/types/index.ts
  connectionStatus?: 'none' | 'pending' | 'accepted'
  onConnect?: (userId: string) => void
  isLoading?: boolean
  className?: string  // Para flexibilidad de layout padre
}
```

### 3.2 Análisis de Props

**✅ Props correctas:**
- `user`: User - Tipo correcto del proyecto
- `connectionStatus`: Simplificado a 3 estados relevantes
- `onConnect`: Callback opcional para eventos padre
- `isLoading`: Control de estado de carga
- `className`: Flexibilidad de estilo

**⚠️ Cambios respecto a propuesta inicial:**
- Eliminado `'rejected'` del `connectionStatus` - No se muestra en dashboard de nuevos miembros
- Agregado `className` para mayor flexibilidad

**🔍 Consideraciones:**
- El componente manejará internamente el `useRequestConnectionMutation`
- `onConnect` es opcional por si el padre necesita tracking adicional
- `isLoading` puede venir del padre o ser manejado internamente

---

## 4. Layout y Estructura Visual

### 4.1 Layout Recomendado: **Horizontal Compacto**

```
┌─────────────────────────────────────────────┐
│  [Avatar]  Name               [Botón]      │
│            Rol/Badge                        │
└─────────────────────────────────────────────┘
```

**Justificación:**
- Máximo aprovechamiento horizontal para listas/grids
- Avatar pequeño como identificador visual rápido
- Botón alineado a la derecha para acción clara
- Menos altura = más miembros visibles sin scroll

### 4.2 Tamaños de Elementos

#### Avatar:
```typescript
<Avatar className="h-12 w-12">  // 48px × 48px
```
**Razonamiento:**
- `h-10 w-10` (40px) demasiado pequeño para reconocimiento facial
- `h-16 w-16` (64px) demasiado grande para layout compacto
- `h-12 w-12` (48px) **sweet spot** para balance visual

#### Card Padding:
```typescript
<CardContent className="p-4">  // 16px padding
```
**Razonamiento:**
- `p-6` (24px) usado en UserConnectionCard es demasiado generoso
- `p-4` (16px) mantiene compactidad sin sentirse apretado

#### Typography:
```typescript
// Nombre
<h3 className="text-sm font-semibold">

// Rol
<span className="text-xs text-muted-foreground">
```

### 4.3 Espaciado (Gap)

```typescript
<div className="flex items-center gap-3">
  {/* Avatar - Info - Button */}
</div>
```

- `gap-3` (12px) entre avatar, info y botón
- Suficiente separación sin desperdiciar espacio

---

## 5. Estados del Botón y Lógica Visual

### 5.1 Estado 1: Sin Conexión (`connectionStatus === 'none'`)

```typescript
<Button
  size="sm"
  onClick={handleConnect}
  disabled={isLoading}
  className="flex items-center gap-2"
>
  <UserPlus className="h-4 w-4" />
  {isLoading ? 'Conectando...' : 'Conectar'}
</Button>
```

**Características:**
- Variante: `default` (primary color - naranja España Creativa)
- Icono: `UserPlus` para claridad visual
- Estado loading: Texto cambia + botón disabled
- Size: `sm` para mantener compactidad

### 5.2 Estado 2: Solicitud Pendiente (`connectionStatus === 'pending'`)

```typescript
<Button
  size="sm"
  variant="secondary"
  disabled
  className="cursor-not-allowed"
>
  Solicitud enviada
</Button>
```

**Características:**
- Variante: `secondary` (gris claro)
- Sin icono (no es accionable)
- Siempre disabled
- Cursor: `not-allowed` para feedback visual

### 5.3 Estado 3: Conectado (`connectionStatus === 'accepted'`)

```typescript
<Badge variant="default" className="flex items-center gap-1 px-3 py-1">
  <UserCheck className="h-3 w-3" />
  Conectado
</Badge>
```

**Características:**
- Usa `Badge` en vez de `Button` (no es accionable)
- Variante: `default` con color primario
- Icono: `UserCheck` para confirmación visual
- Padding extra para que tenga tamaño similar al botón

**⚠️ IMPORTANTE**: Importar el icono:
```typescript
import { UserPlus, UserCheck } from 'lucide-react'
```

### 5.4 Tabla de Estados

| Estado | Componente | Variante | Accionable | Icono | Texto |
|--------|-----------|----------|------------|-------|-------|
| `none` | Button | default | Sí | UserPlus | "Conectar" |
| `none` (loading) | Button | default | No | UserPlus | "Conectando..." |
| `pending` | Button | secondary | No | - | "Solicitud enviada" |
| `accepted` | Badge | default | No | UserCheck | "Conectado" |

---

## 6. Integración con Toast

### 6.1 Implementación del Toast

```typescript
import { useToast } from '@/hooks/use-toast'

export function NewMemberCard({ ... }: NewMemberCardProps) {
  const { toast } = useToast()
  const { action: requestConnection, isLoading } = useRequestConnectionMutation()

  const handleConnect = () => {
    requestConnection(
      { addressee_id: user.id },
      {
        onSuccess: () => {
          // Toast de éxito
          toast({
            title: "Solicitud enviada",
            description: `Tu solicitud de conexión a ${user.name} ha sido enviada.`,
            variant: "default",
          })

          // Callback opcional al padre
          onConnect?.(user.id)
        },
        onError: (error) => {
          // Toast de error
          toast({
            title: "Error al conectar",
            description: error.message || "No se pudo enviar la solicitud. Inténtalo de nuevo.",
            variant: "destructive",
          })
        }
      }
    )
  }
}
```

### 6.2 Configuración del Toast

**Mensajes:**
- ✅ **Éxito**: "Solicitud enviada" + nombre del usuario
- ❌ **Error**: Mensaje descriptivo del error

**Duración:**
- La duración por defecto del sistema es adecuada
- No necesitamos especificar `duration` manualmente
- El toast se auto-cierra según la configuración global

**Variantes:**
- Éxito: `variant: "default"` (usa color primario)
- Error: `variant: "destructive"` (rojo de error)

---

## 7. Accesibilidad (a11y)

### 7.1 ARIA Labels

```typescript
<Avatar className="h-12 w-12">
  <AvatarImage
    src={user.avatar_url || undefined}
    alt={`Foto de perfil de ${user.name}`}  // ← IMPORTANTE
  />
  <AvatarFallback
    className="bg-gradient-to-br from-primary to-primary/80 text-white"
    aria-label={`Iniciales de ${user.name}`}  // ← IMPORTANTE
  >
    {getInitials(user)}
  </AvatarFallback>
</Avatar>

<Button
  aria-label={`Enviar solicitud de conexión a ${user.name}`}  // ← IMPORTANTE
  onClick={handleConnect}
>
  {/* ... */}
</Button>
```

### 7.2 Keyboard Navigation

**Componentes shadcn/ui ya incluyen:**
- ✅ Focus states automáticos (`focus-visible:ring`)
- ✅ Navegación por teclado (Tab, Enter, Space)
- ✅ Escape handlers donde aplica

**Verificar:**
- El botón debe ser alcanzable con Tab
- Enter/Space deben activar la acción de conectar
- Focus ring visible cuando se navega con teclado

### 7.3 Focus States

```typescript
// Button ya tiene built-in:
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

**No requiere modificación** - Los estilos de shadcn/ui son accesibles por defecto.

### 7.4 Screen Readers

**Asegurar:**
- Nombres completos en `alt` de imágenes
- Estados del botón comunicados (loading, disabled)
- Roles semánticos correctos (button, img, heading)

---

## 8. Sistema de Colores (Design System)

### 8.1 Colores del Proyecto

Según `src/index.css`, el proyecto usa:

```css
--primary: 14 100% 57%; /* Naranja/rojo español - NO verde #22c55e */
```

⚠️ **CORRECCIÓN IMPORTANTE**:
El brief menciona verde `#22c55e`, pero el design system real del proyecto usa **naranja español** (`hsl(14 100% 57%)`).

### 8.2 Aplicación de Colores

```typescript
// Avatar Fallback - Gradiente con color primario
<AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">

// Botón Conectar - Usa automáticamente el primary del sistema
<Button variant="default">  // bg-primary text-primary-foreground

// Badge Conectado - Usa automáticamente el primary
<Badge variant="default">  // bg-primary text-primary-foreground
```

**Todos los componentes usarán automáticamente el naranja español del design system.**

---

## 9. Gestión de Estados Edge Cases

### 9.1 Usuario sin Avatar

```typescript
const getInitials = (user: User): string => {
  if (user.name) {
    return user.name.charAt(0).toUpperCase()
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase()
  }
  return 'M'  // Fallback: "Miembro"
}
```

**Renderizado:**
```typescript
<AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
  {getInitials(user)}
</AvatarFallback>
```

### 9.2 Usuario sin Rol

```typescript
const getUserRole = (user: User): string => {
  if (user.roles && user.roles.length > 0) {
    return user.roles[0].name  // Mostrar primer rol
  }
  return 'Miembro'  // Fallback según decisión de Iban
}
```

**Renderizado:**
```typescript
<span className="text-xs text-muted-foreground">
  {getUserRole(user)}
</span>
```

### 9.3 Nombre Largo (Truncamiento)

```typescript
<h3 className="text-sm font-semibold truncate">
  {user.name}
</h3>
```

- `truncate` = `overflow-hidden text-ellipsis whitespace-nowrap`
- Previene que nombres largos rompan el layout

---

## 10. Comparación: UserConnectionCard vs NewMemberCard

| Característica | UserConnectionCard | NewMemberCard |
|----------------|-------------------|---------------|
| **Propósito** | Gestión completa conexiones | Mostrar nuevos miembros |
| **Estados** | 4 (none, pending, accepted, rejected) | 3 (none, pending, accepted) |
| **Acciones** | Conectar, Aceptar, Rechazar, Eliminar | Solo Conectar |
| **Layout** | Flexible (compact mode) | Siempre compacto |
| **Info mostrada** | Avatar, Nombre, Bio, Location, Skills | Avatar, Nombre, Rol |
| **Mutations** | 3 (request, update, delete) | 1 (request) |
| **Queries** | 1 (connection status) | 0 (recibe status por props) |
| **Avatar size** | 12/16 (según compact) | 12 fijo |
| **Padding** | 4/6 (según compact) | 4 fijo |
| **Bio** | Opcional (hidden en compact) | Nunca |
| **Skills** | Muestra hasta 3 | Nunca |
| **Location** | Con icono MapPin | Nunca |
| **Toast** | No implementado | Sí (éxito/error) |
| **Líneas de código** | ~170 | ~80 estimadas |

### 10.1 ¿Qué NO necesitamos de UserConnectionCard?

1. ❌ **Bio del usuario** - Ocupa espacio, no es crítico para primera impresión
2. ❌ **Skills** - Interesante pero no esencial para decidir conectar
3. ❌ **Location** - Información secundaria
4. ❌ **Modo compact/expanded** - Siempre compacto
5. ❌ **Botones Aceptar/Rechazar** - No aplica en sección "nuevos miembros"
6. ❌ **Botón Eliminar** - No aplica
7. ❌ **Query de connection status** - Recibe status por props desde el padre

### 10.2 ¿Qué SÍ tomamos de UserConnectionCard?

1. ✅ **Estructura de Avatar** - Mismo patrón de fallback con inicial
2. ✅ **Diseño de Card** - Mantener consistencia visual
3. ✅ **Patrón de estados del botón** - Misma lógica de loading/disabled
4. ✅ **Uso de useRequestConnectionMutation** - Mismo hook de conexión
5. ✅ **Gradient en AvatarFallback** - Mismo estilo visual

---

## 11. Estructura de Archivos

### 11.1 Ubicación del Componente

```
src/app/features/dashboard/
├── components/
│   └── NewMemberCard.tsx       ← AQUÍ
├── hooks/
│   └── queries/
│       └── useNewMembersQuery.ts
└── data/
    └── services/
        └── dashboard.service.ts
```

### 11.2 Imports del Componente

```typescript
// ABOUTME: Compact card component for displaying new members in dashboard
// ABOUTME: Shows user avatar, name, role and connection button with toast feedback

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { UserPlus, UserCheck } from 'lucide-react'
import { useRequestConnectionMutation } from '@/app/features/network/hooks/mutations/useRequestConnectionMutation'
import type { User } from '@/types'
```

---

## 12. Responsiveness

### 12.1 Mobile (< 640px)

```typescript
<Card className="w-full">  // Full width en mobile
  <CardContent className="p-3">  // Padding reducido a 12px
    <div className="flex items-center gap-2">  // Gap reducido
      <Avatar className="h-10 w-10">  // Avatar más pequeño
```

### 12.2 Tablet/Desktop (≥ 640px)

```typescript
<Card className="w-full sm:max-w-md">  // Max width en pantallas grandes
  <CardContent className="p-4">
    <div className="flex items-center gap-3">
      <Avatar className="h-12 w-12">
```

### 12.3 Grid Layout (Responsabilidad del Padre)

```typescript
// En Dashboard.tsx o NewMembersSection.tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {newMembers.map(member => (
    <NewMemberCard key={member.id} user={member} {...} />
  ))}
</div>
```

---

## 13. Testing Considerations (Para Próxima Fase)

### 13.1 Test Cases Críticos

```typescript
describe('NewMemberCard', () => {
  it('muestra iniciales cuando no hay avatar')
  it('muestra "Miembro" cuando no hay rol')
  it('muestra botón "Conectar" cuando status es none')
  it('muestra "Solicitud enviada" cuando status es pending')
  it('muestra badge "Conectado" cuando status es accepted')
  it('deshabilita botón mientras isLoading')
  it('llama requestConnection al hacer click en Conectar')
  it('muestra toast de éxito después de conectar')
  it('muestra toast de error si falla la conexión')
  it('trunca nombres largos correctamente')
  it('es navegable por teclado')
  it('tiene ARIA labels apropiados')
})
```

### 13.2 Herramientas de Testing

- **Unit**: Vitest + React Testing Library
- **Accessibility**: axe-core / jest-axe
- **Visual**: Storybook (opcional)

---

## 14. Performance Optimizations

### 14.1 Memoization (Si se usa en listas grandes)

```typescript
import { memo } from 'react'

export const NewMemberCard = memo(function NewMemberCard({ ... }) {
  // ...
})
```

**Cuándo usar:**
- Si se renderizan +20 cards simultáneamente
- Si el parent re-renderiza frecuentemente

**Cuándo NO usar:**
- Para listas pequeñas (<10 items)
- Agrega complejidad innecesaria

### 14.2 Lazy Loading de Avatares

```typescript
<AvatarImage
  src={user.avatar_url || undefined}
  loading="lazy"  // ← HTML native lazy loading
/>
```

---

## 15. Documentación de Props (JSDoc)

```typescript
/**
 * Compact card component for displaying new members in the dashboard.
 * Shows user avatar, name, role and a connection action button.
 *
 * @param user - User profile object
 * @param connectionStatus - Current connection state ('none' | 'pending' | 'accepted')
 * @param onConnect - Optional callback fired after successful connection
 * @param isLoading - External loading state (overrides internal mutation loading)
 * @param className - Additional CSS classes for styling flexibility
 *
 * @example
 * ```tsx
 * <NewMemberCard
 *   user={member}
 *   connectionStatus="none"
 *   onConnect={(userId) => console.log('Connected to', userId)}
 * />
 * ```
 */
interface NewMemberCardProps { ... }
```

---

## 16. Flujo de Datos (Data Flow)

```
Dashboard Page
    │
    ├─> useNewMembersQuery()
    │        │
    │        ├─> GET /api/dashboard/new-members
    │        └─> Returns User[]
    │
    └─> NewMemberCard (for each user)
             │
             ├─> useRequestConnectionMutation()
             │        │
             │        ├─> POST /api/network/connections
             │        └─> Invalidates: ['connections', 'network-stats']
             │
             └─> useToast() (on success/error)
```

---

## 17. Ejemplo de Uso en Dashboard

```typescript
// En src/app/features/dashboard/components/NewMembersSection.tsx

import { NewMemberCard } from './NewMemberCard'
import { useNewMembersQuery } from '../hooks/queries/useNewMembersQuery'

export function NewMembersSection() {
  const { data: newMembers, isLoading } = useNewMembersQuery()

  if (isLoading) return <LoadingSpinner />
  if (!newMembers?.length) return <EmptyState />

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Nuevos Miembros</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {newMembers.map((member) => (
          <NewMemberCard
            key={member.id}
            user={member}
            connectionStatus={member.connectionStatus}
            onConnect={(userId) => {
              console.log('Connected to user:', userId)
              // Analytics tracking, etc.
            }}
          />
        ))}
      </div>
    </section>
  )
}
```

---

## 18. Resumen de Decisiones Clave

### ✅ Decisiones Arquitectónicas
1. **Componente separado** de UserConnectionCard (responsabilidad única)
2. **Layout horizontal compacto** (máxima eficiencia de espacio)
3. **3 estados** en vez de 4 (sin 'rejected' en dashboard)
4. **Toast integrado** para feedback inmediato
5. **Props simples** (User + status + callbacks)

### 🎨 Decisiones de Diseño
1. **Avatar 48px** (h-12 w-12) - Balance visual
2. **Padding 16px** (p-4) - Compacto pero no apretado
3. **Typography pequeña** (text-sm, text-xs) - Densidad de información
4. **Gradiente naranja** en fallback (color primario del proyecto)
5. **Badge** para estado conectado (no accionable)

### 🔧 Decisiones Técnicas
1. **Un solo mutation** (useRequestConnectionMutation)
2. **Cero queries** (status viene por props del padre)
3. **useToast hook** para notificaciones
4. **Memo opcional** (solo si >20 items)
5. **ARIA labels completos** (accesibilidad first-class)

### 📊 Decisiones de UX
1. **"Miembro"** como fallback de rol
2. **Iniciales** como fallback de avatar
3. **Truncate** para nombres largos
4. **Disabled + secondary** para solicitudes pendientes
5. **Toast descriptivo** con nombre del usuario

---

## 19. Notas Importantes para Implementación

### ⚠️ CRÍTICO - No olvidar:

1. **Color System**: El proyecto usa **naranja** (`hsl(14 100% 57%)`), NO verde
2. **Tipo User**: Importar desde `@/types`, NO desde feature-specific schemas
3. **ABOUTME Comments**: Agregar en las primeras 2 líneas del archivo
4. **Imports absolutos**: Usar `@/` para todos los imports
5. **Toast Provider**: Verificar que esté en el layout raíz
6. **Connection Status**: Debe venir del padre (query de nuevos miembros)

### 🎯 Orden de Implementación Recomendado:

1. ✅ Crear archivo `NewMemberCard.tsx`
2. ✅ Implementar helper functions (`getInitials`, `getUserRole`)
3. ✅ Crear estructura básica del componente
4. ✅ Implementar lógica de estados del botón
5. ✅ Integrar toast notifications
6. ✅ Agregar ARIA labels
7. ✅ Testing manual en diferentes viewports
8. ✅ Escribir tests unitarios

### 📝 Checklist de Entrega:

- [ ] Componente implementado en ubicación correcta
- [ ] ABOUTME comments presentes
- [ ] Todos los imports usan paths absolutos (@/)
- [ ] Estados de botón funcionan correctamente
- [ ] Toast aparece en éxito/error
- [ ] Fallbacks funcionan (sin avatar, sin rol)
- [ ] ARIA labels completos
- [ ] Navegable por teclado
- [ ] Responsive en mobile/tablet/desktop
- [ ] Código documentado con JSDoc
- [ ] Tests básicos escritos

---

## 20. Referencias

### Archivos a Consultar:

- `src/app/features/network/components/UserConnectionCard.tsx` - Patrón de referencia
- `src/app/features/network/hooks/mutations/useRequestConnectionMutation.ts` - Mutation hook
- `src/hooks/use-toast.ts` - Toast implementation
- `src/types/index.ts` - Tipo User
- `src/index.css` - Design system (colores, variables)
- `src/components/ui/avatar.tsx` - Avatar component API
- `src/components/ui/button.tsx` - Button variants y sizes
- `src/components/ui/badge.tsx` - Badge variants

### Documentación Externa:

- shadcn/ui Avatar: https://ui.shadcn.com/docs/components/avatar
- shadcn/ui Button: https://ui.shadcn.com/docs/components/button
- shadcn/ui Badge: https://ui.shadcn.com/docs/components/badge
- shadcn/ui Toast: https://ui.shadcn.com/docs/components/toast
- Radix UI Avatar: https://www.radix-ui.com/docs/primitives/components/avatar
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

---

**Fin del Plan de Implementación**

Este documento debe ser leído completamente antes de proceder con la implementación del componente NewMemberCard. Contiene todas las decisiones arquitectónicas, de diseño y técnicas necesarias para una implementación exitosa y mantenible.
