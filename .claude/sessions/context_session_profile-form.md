# Sesión de Contexto: ProfileForm Component

## Solicitud Original (2025-10-26)

Iban solicita crear el componente `ProfileForm` que se usa en `ProfilePage.tsx` pero que actualmente no existe.

## Decisiones Arquitectónicas Clave

### ❌ NO Usar Hexagonal Architecture

**Decisión**: A pesar de que el proyecto usa arquitectura hexagonal para la feature de auth, **ProfileForm NO la usará**.

**Justificación**:
1. Ya existe un endpoint backend funcional: `PUT /api/users/:id`
2. Ya existe una función legacy: `updateUserProfile()` en `/src/lib/api/users.ts`
3. Es un formulario CRUD simple sin lógica de negocio compleja
4. `PhotoUploadModal.tsx` (componente similar) usa el mismo patrón legacy
5. Menor fricción y más rápido de implementar

**Patrón a seguir**:
```
ProfileForm → updateUserProfile() → Supabase
              ↓
         React Query mutation
              ↓
         Invalidate ['currentUser'] query
```

### ✅ Stack Técnico

- **React Hook Form** con **Zod** para validación
- **React Query mutation** para actualización
- **Legacy API function**: `updateUserProfile()` de `/src/lib/api/users.ts`
- **shadcn/ui components**: Input, Textarea, Button, Badge, Label
- **Toast notifications**: `useToast()` para feedback

### 🔑 Query Invalidation

**Query key correcta**: `['currentUser']`

```typescript
queryClient.invalidateQueries({ queryKey: ['currentUser'] })
```

Esto invalidará y recargará:
- Usuario en `useAuthContext`
- Porcentaje de completado (calculado por backend)
- Dashboard
- ProfilePage

## Campos del Formulario

1. **name** - Requerido, min 2 caracteres
2. **bio** - Opcional, textarea
3. **location** - Opcional
4. **linkedin_url** - Opcional, URL válida o vacío
5. **website_url** - Opcional, URL válida o vacío
6. **skills** - Array de strings con input + badges removibles
7. **interests** - Array de strings con input + badges removibles

## Estructura del Archivo

```
/src/components/profile/ProfileForm.tsx
```

**Exports**:
```typescript
export function ProfileForm({ user }: ProfileFormProps) {
  // ...
}
```

## Consideraciones de Implementación

### 1. Arrays (Skills/Interests)

**Pattern**:
```typescript
const [skillInput, setSkillInput] = useState('')

const handleAddSkill = () => {
  if (!skillInput.trim()) return
  const currentSkills = form.getValues('skills')

  // Validar duplicados
  if (currentSkills.includes(skillInput.trim())) {
    toast({ title: 'Habilidad duplicada', variant: 'destructive' })
    return
  }

  form.setValue('skills', [...currentSkills, skillInput.trim()])
  setSkillInput('')
}

const handleRemoveSkill = (skillToRemove: string) => {
  const currentSkills = form.getValues('skills')
  form.setValue('skills', currentSkills.filter(s => s !== skillToRemove))
}
```

### 2. URL Validation

```typescript
z.string().url('URL inválida').or(z.literal(''))
```

Esto permite campo vacío O URL válida.

### 3. Default Values

```typescript
defaultValues: {
  skills: user.skills || [],  // ← importante: arrays pueden ser null en BD
  interests: user.interests || []
}
```

### 4. Mutation Setup

```typescript
const updateMutation = useMutation({
  mutationFn: async (data: ProfileFormData) => {
    const result = await updateUserProfile(user.id, data)
    if (result.error) throw new Error(result.error.message)
    return result.data
  },
  onSuccess: () => {
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
```

## Archivos Relacionados

### Leer/Estudiar
- `/src/components/pages/ProfilePage.tsx` - Cómo se usa el componente
- `/src/components/profile/PhotoUploadModal.tsx` - Patrón de mutation similar
- `/src/app/features/auth/components/LoginForm.tsx` - Manejo de errores
- `/src/types/index.ts` - Tipo User
- `/src/lib/api/users.ts` - Función updateUserProfile()

### NO Modificar
- `/src/app/features/auth/*` - Sistema de auth (hexagonal)
- `/server/infrastructure/api/routes/users.routes.ts` - Backend ya funcional
- `/src/types/index.ts` - Tipos establecidos

### Crear
- `/src/components/profile/ProfileForm.tsx` ⭐ ÚNICO ARCHIVO NUEVO

## Design System

### Colores (de /src/index.css)
```css
--primary: 14 100% 57%;         /* Naranja español */
--destructive: 0 84.2% 60.2%;   /* Rojo para errores */
--muted-foreground: 220 8.9% 46.1%; /* Placeholders */
--border: 220 13% 91%;          /* Borders */
```

**NO usar verde** - El design system actual es naranja español.

### Estilos
- Radius: `rounded-xl` para cards, `rounded-full` para badges
- Spacing: `space-y-6` para formularios, `gap-2` para badges
- Shadows: Usar los del design system

## Testing Manual Necesario

1. ✅ Actualización de campos básicos
2. ✅ Validación de URLs (válidas, inválidas, vacías)
3. ✅ Agregar/eliminar skills/interests
4. ✅ Detectar duplicados
5. ✅ Tecla Enter para agregar
6. ✅ Verificar recarga del porcentaje en dashboard
7. ✅ Toasts de éxito y error
8. ✅ Loading state del botón

## Errores Comunes a Evitar

❌ **NO usar arquitectura hexagonal** - No es necesaria aquí
❌ **NO crear servicios, schemas, mutations separados** - Usar legacy API
❌ **NO usar verde #22c55e** - Usar naranja del design system
❌ **NO olvidar `|| []` para arrays** - Pueden ser null en BD
❌ **NO usar query key incorrecta** - Es `['currentUser']` no `['auth', 'currentUser']`
❌ **NO olvidar ABOUTME comments** - Obligatorio en todos los archivos

## Estado de Implementación

- [ ] Crear `/src/components/profile/ProfileForm.tsx`
- [ ] Probar integración en ProfilePage
- [ ] Testing manual de todos los campos
- [ ] Verificar recarga automática de datos
- [ ] Verificar actualización del porcentaje

## Próximos Pasos

1. Implementar el componente según el plan en `.claude/doc/profile-form/frontend.md`
2. Probar manualmente todos los casos
3. Si funciona bien, considerar migrar a hexagonal más adelante (opcional)

---

**Creado**: 2025-10-26
**Agente**: frontend-developer
**Estado**: Planificación completa
