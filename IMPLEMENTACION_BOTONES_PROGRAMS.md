# Implementación de Botones "Ver Detalles" e "Inscríbete"

## Fecha: 2025-11-09

## Resumen

Se ha implementado la funcionalidad completa de los botones "Ver detalles" e "Inscríbete" en la feature de Programs.

## Cambios Realizados

### 1. ✅ Componente ProgramDetailsDialog

**Archivo creado**: `src/app/features/programs/components/ProgramDetailsDialog.tsx`

**Funcionalidades**:
- Modal completo con todos los detalles del programa
- Información expandida:
  - Fechas de inicio y fin formateadas
  - Duración, ubicación, plazas disponibles
  - Habilidades que se desarrollarán
  - Información del instructor
  - Precio destacado
  - Estado del programa (próximo, activo, completado)
- Botón de inscripción integrado con lógica completa
- Estados visuales claros:
  - "Inscríbete ahora" para programas disponibles
  - "Ya estás inscrito" con checkmark verde
  - "Este programa está completo" para programas llenos
  - "Inicia sesión para inscribirte" para usuarios no autenticados
- Diseño responsive y accesible

**Características del modal**:
- Grid de información con iconos
- Badges para skills y tags
- Sección de instructor con avatar
- Manejo de estados de carga y éxito
- Validación de disponibilidad de plazas
- Scroll automático para contenido largo

### 2. ✅ Integración en ProgramsPage

**Archivo modificado**: `src/components/pages/ProgramsPage.tsx`

**Cambios**:
```typescript
// Estado para controlar el modal
const [selectedProgram, setSelectedProgram] = useState<ProgramWithCreator | null>(null)
const [detailsOpen, setDetailsOpen] = useState(false)

// Handler para abrir el modal
const handleViewDetails = (program: ProgramWithCreator) => {
  setSelectedProgram(program)
  setDetailsOpen(true)
}

// Componente del modal al final
<ProgramDetailsDialog
  program={selectedProgram}
  open={detailsOpen}
  onOpenChange={setDetailsOpen}
/>
```

### 3. ✅ Autenticación Selectiva en Backend

**Archivo modificado**: `server/infrastructure/api/routes/programs.routes.ts`

**Problema resuelto**: Habíamos movido todo el router de programs fuera del middleware de autenticación, lo que hacía que TODOS los endpoints fueran públicos (incluyendo POST/PUT/DELETE).

**Solución**: Agregar `authMiddleware` selectivamente a cada ruta protegida:

```typescript
// Rutas públicas (sin middleware)
router.get('/', ...) // GET /api/programs
router.get('/:id', ...) // GET /api/programs/:id

// Rutas protegidas (con authMiddleware)
router.post('/', authMiddleware, ...) // POST /api/programs
router.put('/:id', authMiddleware, ...) // PUT /api/programs/:id
router.delete('/:id', authMiddleware, ...) // DELETE /api/programs/:id
router.post('/:id/enroll', authMiddleware, ...) // POST /api/programs/:id/enroll
router.get('/my/enrollments', authMiddleware, ...) // GET /api/programs/my/enrollments
```

## Flujo de Usuario Completo

### Ver Detalles

1. Usuario hace clic en "Ver detalles" en cualquier ProgramCard
2. Se abre un modal con información completa del programa
3. Usuario puede ver:
   - Descripción completa
   - Fechas y duración
   - Ubicación
   - Plazas disponibles
   - Habilidades a desarrollar
   - Información del instructor
   - Precio

### Inscripción

**Para usuarios autenticados**:
1. Usuario hace clic en "Inscribirse" (en card o en modal)
2. Se muestra "Inscribiendo..." mientras procesa
3. Al completarse:
   - Badge verde "Inscrito ✓"
   - Se invalida la caché de React Query
   - Se actualizan automáticamente las plazas disponibles
4. El usuario queda inscrito en el programa

**Para usuarios NO autenticados**:
- Mensaje: "Inicia sesión para inscribirte"
- Botón de inscripción no se muestra

**Para programas completos**:
- Badge "Completo" en lugar del botón
- Mensaje en modal: "Este programa está completo"

**Para programas activos o completados**:
- No se muestra botón de inscripción
- Solo se puede ver detalles

## Archivos Modificados/Creados

### Creados
1. `src/app/features/programs/components/ProgramDetailsDialog.tsx` (nuevo)

### Modificados
1. `src/components/pages/ProgramsPage.tsx`
2. `server/infrastructure/api/routes/programs.routes.ts`

## Tecnologías Utilizadas

- **shadcn/ui Dialog**: Modal component
- **React Query**: Gestión de estado y mutations
- **Lucide React**: Iconos (Calendar, Clock, Users, MapPin, etc.)
- **Tailwind CSS**: Estilos
- **TypeScript**: Type safety

## Testing Recomendado

### Manual
1. ✅ Ver detalles de un programa
2. ✅ Inscribirse en un programa (usuario autenticado)
3. ✅ Ver mensaje para usuario no autenticado
4. ✅ Ver estado "Completo" para programas llenos
5. ✅ Verificar que las plazas se actualizan correctamente
6. ✅ Verificar que el modal se cierra correctamente
7. ✅ Verificar responsive en mobile

### Endpoints Backend
```bash
# Ver programas (público)
curl http://localhost:3001/api/programs

# Inscribirse (requiere token)
curl -X POST http://localhost:3001/api/programs/1/enroll \
  -H "Authorization: Bearer TOKEN"

# Ver mis inscripciones (requiere token)
curl http://localhost:3001/api/programs/my/enrollments \
  -H "Authorization: Bearer TOKEN"
```

## Próximos Pasos Opcionales

- [ ] Página de confirmación de inscripción
- [ ] Email de confirmación al inscribirse
- [ ] Calendario de eventos del programa
- [ ] Lista de participantes inscritos
- [ ] Sistema de cancelación de inscripción
- [ ] Rating y reviews de programas completados
- [ ] Descarga de certificado al completar

## Notas Técnicas

- El hook `useEnrollInProgramMutation` maneja automáticamente la invalidación de caché
- La tabla `program_enrollments` tiene trigger que actualiza el contador de participantes
- Las políticas RLS permiten que usuarios vean sus propias inscripciones
- Los creadores de programas pueden ver todas las inscripciones de sus programas
- El modal usa el estado local para tracking de inscripción exitosa

## Estado Final

✅ **Ambos botones completamente funcionales**
✅ **Backend con autenticación correcta**
✅ **Frontend con UI completa y estados manejados**
✅ **Listo para producción**
