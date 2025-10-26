# Plan de Implementación: ProfileForm Component

## Contexto del Proyecto

El proyecto **España Creativa Red** necesita un formulario de edición de perfil (`ProfileForm`) que permita a los usuarios actualizar su información personal y profesional. Este componente se integrará con la arquitectura existente basada en React Query y seguirá los patrones establecidos en el proyecto.

## Estado Actual

### Archivos Existentes Relevantes
- **ProfilePage**: `/src/components/pages/ProfilePage.tsx` - Ya importa y usa `<ProfileForm user={user} />` pero el componente no existe
- **User Type**: `/src/types/index.ts` - Define la estructura completa del tipo `User`
- **Auth Context**: `/src/app/features/auth/hooks/useAuthContext.tsx` - Proporciona acceso al usuario actual
- **Backend API**: `/server/infrastructure/api/routes/users.routes.ts` - `PUT /api/users/:id` ya implementado
- **Legacy API**: `/src/lib/api/users.ts` - Función `updateUserProfile()` existente (Supabase directo)

### Backend Endpoint Disponible
```typescript
PUT /api/users/:id
Request Body: {
  name?: string
  avatar_url?: string
  bio?: string
  location?: string
  linkedin_url?: string
  website_url?: string
  skills?: string[]
  interests?: string[]
}
Response: {
  user: {
    id, email, name, avatar_url, bio, location,
    linkedin_url, website_url, skills, interests,
    completed_pct, created_at, updated_at
  }
}
```

## Arquitectura Propuesta

### Patrón de Diseño
**NO seguiremos el patrón hexagonal completo** para este componente porque:

1. **Ya existe un endpoint backend funcional**: `PUT /api/users/:id`
2. **Ya existe una función legacy**: `updateUserProfile()` en `/src/lib/api/users.ts`
3. **Es un formulario simple**: No requiere lógica de negocio compleja
4. **Consistencia con PhotoUploadModal**: El componente similar usa directamente la función API legacy

### Decisión Arquitectónica
Seguiremos el mismo patrón que `PhotoUploadModal.tsx`:
- Usar directamente la función `updateUserProfile()` de `/src/lib/api/users.ts`
- Usar React Query mutation para gestión de estado
- Invalidar queries manualmente después de la actualización

**Justificación**:
- Menor fricción y más rápido de implementar
- Consistente con código existente
- Suficiente para un formulario CRUD simple
- Podemos migrar a hexagonal más adelante si es necesario

## Plan de Implementación

### Archivos a Crear

#### 1. `/src/components/profile/ProfileForm.tsx` ⭐ PRINCIPAL
**Propósito**: Formulario de edición de perfil de usuario

**Tecnologías**:
- React Hook Form (validación)
- Zod (schemas de validación)
- React Query mutation
- shadcn/ui components

**Props**:
```typescript
interface ProfileFormProps {
  user: User
}
```

**Estructura del Componente**:

```typescript
// ABOUTME: Profile editing form with React Hook Form validation and React Query mutation
// ABOUTME: Handles user profile updates including bio, skills, interests, and social links

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUserProfile } from '@/lib/api/users'
import { useToast } from '@/hooks/use-toast'
import { User } from '@/types'
import { z } from 'zod'

// Zod schema for validation
const profileFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  bio: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().url('URL inválida').or(z.literal('')).optional(),
  website_url: z.string().url('URL inválida').or(z.literal('')).optional(),
  skills: z.array(z.string()),
  interests: z.array(z.string())
})

type ProfileFormData = z.infer<typeof profileFormSchema>

export function ProfileForm({ user }: ProfileFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // React Hook Form setup
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      linkedin_url: user.linkedin_url || '',
      website_url: user.website_url || '',
      skills: user.skills || [],
      interests: user.interests || []
    }
  })

  // React Query mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const result = await updateUserProfile(user.id, data)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    onSuccess: () => {
      // Invalidate current user query to refresh data
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })

      toast({
        title: 'Perfil actualizado',
        description: 'Tus cambios se han guardado correctamente'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el perfil',
        variant: 'destructive'
      })
    }
  })

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data)
  }

  // State for skills/interests arrays
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Form fields aquí */}
    </form>
  )
}
```

**Campos del Formulario**:

1. **Nombre completo** (Input)
   - Campo requerido
   - Validación: mínimo 2 caracteres

2. **Ubicación** (Input)
   - Opcional
   - Placeholder: "Madrid, España"

3. **Biografía** (Textarea)
   - Opcional
   - Placeholder: "Cuéntanos sobre ti..."
   - Max height con scroll

4. **LinkedIn URL** (Input)
   - Opcional
   - Validación: URL válida o vacío
   - Placeholder: "https://linkedin.com/in/..."

5. **Sitio web** (Input)
   - Opcional
   - Validación: URL válida o vacío
   - Placeholder: "https://..."

6. **Habilidades** (Array Input + Tags)
   - Input con botón "Agregar"
   - Lista de badges removibles
   - Al hacer click en X, elimina la habilidad

7. **Intereses** (Array Input + Tags)
   - Input con botón "Agregar"
   - Lista de badges removibles
   - Al hacer click en X, elimina el interés

**Lógica de Arrays (Skills/Interests)**:

```typescript
// Para agregar skill
const handleAddSkill = () => {
  if (!skillInput.trim()) return
  const currentSkills = form.getValues('skills')
  if (currentSkills.includes(skillInput.trim())) {
    toast({
      title: 'Habilidad duplicada',
      description: 'Esta habilidad ya está en tu lista',
      variant: 'destructive'
    })
    return
  }
  form.setValue('skills', [...currentSkills, skillInput.trim()])
  setSkillInput('')
}

// Para eliminar skill
const handleRemoveSkill = (skillToRemove: string) => {
  const currentSkills = form.getValues('skills')
  form.setValue('skills', currentSkills.filter(s => s !== skillToRemove))
}

// Mismo patrón para interests
```

**UI Components (shadcn/ui)**:
- `Input` - campos de texto
- `Textarea` - biografía
- `Button` - botón de submit y agregar tags
- `Badge` - mostrar skills/interests con X para eliminar
- `Label` - etiquetas de campos
- `Form` components de shadcn/ui para mejor integración

**Estilo Visual**:
```tsx
<form className="space-y-6">
  {/* Campo básico */}
  <div className="space-y-2">
    <Label htmlFor="name">Nombre completo *</Label>
    <Input
      id="name"
      {...form.register('name')}
      className="modern-input"
    />
    {form.formState.errors.name && (
      <p className="text-sm text-red-600">
        {form.formState.errors.name.message}
      </p>
    )}
  </div>

  {/* Skills con tags */}
  <div className="space-y-3">
    <Label>Habilidades</Label>
    <div className="flex gap-2">
      <Input
        value={skillInput}
        onChange={(e) => setSkillInput(e.target.value)}
        placeholder="Añade una habilidad"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAddSkill()
          }
        }}
      />
      <Button
        type="button"
        onClick={handleAddSkill}
        variant="outline"
      >
        Agregar
      </Button>
    </div>

    {/* Lista de badges */}
    <div className="flex flex-wrap gap-2">
      {form.watch('skills').map(skill => (
        <Badge
          key={skill}
          variant="secondary"
          className="gap-1"
        >
          {skill}
          <X
            className="h-3 w-3 cursor-pointer hover:text-destructive"
            onClick={() => handleRemoveSkill(skill)}
          />
        </Badge>
      ))}
    </div>
  </div>

  {/* Botón submit */}
  <Button
    type="submit"
    className="w-full"
    disabled={updateMutation.isPending}
  >
    {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
  </Button>
</form>
```

### Integración con React Query

**Query Key a Invalidar**: `['currentUser']`

Esto está definido en `/src/app/features/auth/hooks/queries/useCurrentUserQuery.ts`:

```typescript
// Archivo actual
export function useCurrentUserQuery() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await authService.getCurrentUser()
      return response.user
    },
    retry: false
  })
}
```

Al invalidar `['currentUser']`, se recargará automáticamente:
1. El usuario en `useAuthContext`
2. El porcentaje de completado (calculado por backend)
3. El dashboard mostrará el nuevo porcentaje
4. La página de perfil mostrará los datos actualizados

### Estado del Formulario

**React Hook Form + Zod**:
```typescript
const form = useForm<ProfileFormData>({
  resolver: zodResolver(profileFormSchema),
  defaultValues: {
    name: user.name || '',
    bio: user.bio || '',
    location: user.location || '',
    linkedin_url: user.linkedin_url || '',
    website_url: user.website_url || '',
    skills: user.skills || [],
    interests: user.interests || []
  }
})
```

**Validaciones**:
- `name`: Requerido, mínimo 2 caracteres
- `bio`: Opcional
- `location`: Opcional
- `linkedin_url`: URL válida o vacío
- `website_url`: URL válida o vacío
- `skills`: Array de strings
- `interests`: Array de strings

### Manejo de Errores

**Tipos de Error**:

1. **Error de validación** (React Hook Form)
   - Mostrar bajo cada campo con `form.formState.errors`
   - Color: `text-red-600`

2. **Error de red** (React Query mutation)
   - Mostrar toast con variante `destructive`
   - Mensaje: "No se pudo actualizar el perfil"

3. **Habilidad/Interés duplicado**
   - Mostrar toast warning
   - No agregar el duplicado

### Toast Notifications

**Éxito**:
```typescript
toast({
  title: 'Perfil actualizado',
  description: 'Tus cambios se han guardado correctamente'
})
```

**Error**:
```typescript
toast({
  title: 'Error',
  description: error.message || 'No se pudo actualizar el perfil',
  variant: 'destructive'
})
```

## Flujo de Usuario

1. Usuario navega a `/profile`
2. `ProfilePage` renderiza `<ProfileForm user={user} />`
3. Formulario se pre-rellena con datos actuales del usuario
4. Usuario edita campos, agrega/elimina skills e interests
5. Usuario hace click en "Guardar Cambios"
6. React Query mutation llama a `updateUserProfile()`
7. Backend procesa la actualización y recalcula `completed_pct`
8. Si éxito:
   - Invalida query `['currentUser']`
   - Muestra toast de éxito
   - Datos se recargan automáticamente
   - Dashboard refleja nuevo porcentaje
9. Si error:
   - Muestra toast de error
   - Usuario puede reintentar

## Consideraciones Técnicas Importantes

### 1. **URL Validation con Zod**
```typescript
z.string().url('URL inválida').or(z.literal(''))
```
Esto permite que el campo esté vacío O sea una URL válida.

### 2. **Array Management**
- Usar `form.setValue()` para actualizar arrays
- Usar `form.watch('skills')` para renderizar badges
- Validar duplicados antes de agregar

### 3. **Performance**
- React Hook Form maneja re-renders eficientemente
- Solo se invalida la query después del submit exitoso
- No hay re-fetching innecesario

### 4. **Accesibilidad**
- Usar `<Label htmlFor>` para asociar labels con inputs
- Botón submit disabled durante carga
- Mensajes de error claramente visibles
- Enter key para agregar skills/interests

### 5. **Responsive Design**
- Formulario full-width en mobile
- Grid layout para campos en desktop
- Badges se envuelven con `flex-wrap`

## Testing Considerations

### Casos de Prueba Manuales

1. **Actualización básica**
   - Cambiar nombre, bio, ubicación
   - Verificar que se guarda correctamente

2. **URLs**
   - URL válida: debe aceptarse
   - URL inválida: debe mostrar error
   - Campo vacío: debe permitirse

3. **Skills/Interests**
   - Agregar nuevo item
   - Eliminar item existente
   - Intentar agregar duplicado (debe rechazarse)
   - Agregar con Enter key
   - Agregar con botón

4. **Recarga de datos**
   - Verificar que el porcentaje se actualiza en dashboard
   - Verificar que los datos se actualizan en ProfilePage
   - Verificar que el sidebar muestra el avatar actualizado

5. **Manejo de errores**
   - Error de red: desconectar wifi y enviar
   - Campo requerido vacío: debe mostrar error
   - URL inválida: debe mostrar error

## Colores del Design System

Usar los colores definidos en `/src/index.css`:

```css
--primary: 14 100% 57%;         /* Spanish orange/red */
--destructive: 0 84.2% 60.2%;   /* Error states */
--muted-foreground: 220 8.9% 46.1%; /* Placeholders */
--border: 220 13% 91%;          /* Borders */
```

**NO usar verde** (aunque CLAUDE.md menciona #22c55e, el design system actual usa naranja español).

## Dependencias Necesarias

Ya instaladas en el proyecto:
- ✅ `react-hook-form`
- ✅ `@hookform/resolvers`
- ✅ `zod`
- ✅ `@tanstack/react-query`
- ✅ `lucide-react` (iconos)

## Estructura de Archivos Final

```
src/
├── components/
│   └── profile/
│       ├── ProfileForm.tsx      ⭐ NUEVO
│       └── PhotoUploadModal.tsx (existente)
├── types/
│   └── index.ts                 (User type existente)
├── lib/
│   └── api/
│       └── users.ts             (updateUserProfile existente)
└── app/
    └── features/
        └── auth/
            └── hooks/
                ├── useAuthContext.tsx (existente)
                └── queries/
                    └── useCurrentUserQuery.ts (existente)
```

## Notas Importantes para el Implementador

### ⚠️ NO usar hexagonal architecture aquí
A pesar de que el proyecto usa hexagonal en auth, **este formulario NO lo necesita**:
- Ya existe endpoint backend funcional
- Ya existe función API legacy (`updateUserProfile`)
- Es un CRUD simple sin lógica de negocio
- PhotoUploadModal usa el mismo patrón (legacy API + mutation)

### ⚠️ Query invalidation correcta
La key es `['currentUser']`, NO `['auth', 'currentUser']`:
```typescript
queryClient.invalidateQueries({ queryKey: ['currentUser'] })
```

### ⚠️ Manejo de arrays
Los arrays pueden ser `null` en la BD:
```typescript
defaultValues: {
  skills: user.skills || [],  // ← importante el || []
  interests: user.interests || []
}
```

### ⚠️ Validación de URLs
Permitir campo vacío:
```typescript
z.string().url('URL inválida').or(z.literal(''))
```

### ⚠️ No eliminar ABOUTME comments
Todos los archivos deben empezar con dos líneas ABOUTME:
```typescript
// ABOUTME: Profile editing form with React Hook Form validation
// ABOUTME: Handles user profile updates and array field management
```

## Cronograma de Implementación

1. **Crear archivo base** (5 min)
   - Estructura del componente
   - Imports necesarios
   - Props interface

2. **Implementar Zod schema** (5 min)
   - Definir validaciones
   - Export types

3. **Setup React Hook Form** (10 min)
   - useForm con zodResolver
   - defaultValues del user
   - onSubmit handler

4. **Implementar mutation** (10 min)
   - useMutation setup
   - onSuccess con invalidation
   - onError con toast

5. **UI básica** (15 min)
   - Campos Input y Textarea
   - Labels y error messages
   - Botón submit

6. **Arrays (Skills/Interests)** (15 min)
   - Input + botón agregar
   - Badges removibles
   - Validación duplicados

7. **Testing manual** (10 min)
   - Probar todos los campos
   - Verificar recarga de datos
   - Probar errores

**Total estimado**: ~70 minutos

## Resultado Esperado

Un formulario completamente funcional que:
- ✅ Pre-rellena con datos actuales
- ✅ Valida todos los campos
- ✅ Permite gestionar arrays de skills/interests
- ✅ Muestra errores claramente
- ✅ Actualiza el backend
- ✅ Invalida cache de React Query
- ✅ Muestra toast de éxito/error
- ✅ Recarga automática del porcentaje en dashboard
- ✅ UI consistente con el resto de la app
- ✅ Responsive y accesible

---

**Autor**: Claude (frontend-developer agent)
**Fecha**: 2025-10-26
**Versión**: 1.0
