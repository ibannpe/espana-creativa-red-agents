# Admin Approval Registration - UI/UX Design Guide

## Design System Reference

### Color Palette (From `src/index.css`)
```css
--primary: 14 100% 57%        /* Spanish orange/red accent */
--primary-foreground: 0 0% 100%
--destructive: 0 84.2% 60.2%  /* Error states */
--muted: 210 11.3% 94.9%      /* Subtle backgrounds */
--muted-foreground: 220 8.9% 46.1%
--border: 220 13% 91%
```

### Design Principles
- **Border Radius**: `rounded-xl`, `rounded-2xl` for cards
- **Shadows**: `shadow-elegant` (custom), `shadow-sm` with `hover:shadow-md`
- **Spacing**: Generous padding (`p-6`, `p-8`) and gaps (`gap-6`, `gap-8`)
- **Primary Action Color**: Orange/Red (#ff5722 - España Creativa brand)
- **Typography**: Clear hierarchy with proper sizing

---

## 1. Request Access Form (Signup Request)

### Component Selection
**Primary Components:**
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` - Container
- `Field`, `FieldLabel`, `FieldDescription`, `FieldGroup` - Form structure (NEW v4)
- `Input` - Text inputs with icon decorations
- `Button` - Submit action
- `Alert` - Error/validation feedback
- `Spinner` - Loading state

### Layout Mockup
```
┌─────────────────────────────────────────────┐
│                                             │
│              [EC Logo Circle]               │
│           España Creativa Red               │
│     Red de emprendedores y mentores         │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Solicitar Acceso                     │  │
│  │  Completa el formulario y un          │  │
│  │  administrador revisará tu solicitud  │  │
│  ├───────────────────────────────────────┤  │
│  │                                       │  │
│  │  Email *                              │  │
│  │  [✉ ] tu@email.com                   │  │
│  │  Recibirás un enlace cuando seas     │  │
│  │  aprobado                             │  │
│  │                                       │  │
│  │  Nombre *                             │  │
│  │  [👤] Tu nombre                       │  │
│  │                                       │  │
│  │  Apellidos                            │  │
│  │  [👤] Tus apellidos                   │  │
│  │                                       │  │
│  │  ┌─────────────────────────────────┐ │  │
│  │  │ ⓘ Tu solicitud será revisada    │ │  │
│  │  │   por un administrador en las   │ │  │
│  │  │   próximas 24-48 horas          │ │  │
│  │  └─────────────────────────────────┘ │  │
│  │                                       │  │
│  │     [  Enviar Solicitud  ]           │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ¿Ya tienes cuenta? [Iniciar Sesión]       │
│                                             │
└─────────────────────────────────────────────┘
```

### Styling Recommendations

**Form Container:**
```tsx
<Card className="shadow-elegant border-0">
  <CardHeader className="space-y-1 pb-4">
    <CardTitle className="text-2xl text-center">Solicitar Acceso</CardTitle>
    <CardDescription className="text-center">
      Completa el formulario y un administrador revisará tu solicitud
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Form fields */}
  </CardContent>
</Card>
```

**Input Fields (with Field component):**
```tsx
<Field>
  <FieldLabel htmlFor="email">Email *</FieldLabel>
  <div className="relative">
    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
    <Input
      id="email"
      type="email"
      placeholder="tu@email.com"
      className="pl-10"
      required
    />
  </div>
  <FieldDescription>
    Recibirás un enlace cuando seas aprobado
  </FieldDescription>
</Field>
```

**Info Alert (Rate Limiting Warning):**
```tsx
<Alert>
  <AlertCircleIcon className="h-4 w-4" />
  <AlertTitle>Tu solicitud será revisada</AlertTitle>
  <AlertDescription>
    Un administrador revisará tu solicitud en las próximas 24-48 horas
  </AlertDescription>
</Alert>
```

**Submit Button:**
```tsx
<Button
  type="submit"
  className="w-full h-11"
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <Spinner className="mr-2" />
      Enviando...
    </>
  ) : (
    'Enviar Solicitud'
  )}
</Button>
```

**Error States:**
```tsx
{error && (
  <Alert variant="destructive">
    <AlertCircleIcon />
    <AlertTitle>Error al enviar solicitud</AlertTitle>
    <AlertDescription>
      {error.message}
    </AlertDescription>
  </Alert>
)}
```

### Validation Feedback
- **Real-time validation**: Show error borders (`border-destructive`) on blur
- **Email validation**: Format check + disposable email warning
- **Required fields**: Red asterisk, clear labels
- **Success state**: Green border flash before transition

### Mobile Considerations
- Full-width form on mobile (`w-full max-w-md mx-auto`)
- Touch-friendly input heights (`h-11` minimum)
- Proper spacing for thumb reach
- Stack all fields vertically

---

## 2. Pending Approval Page (Success State)

### Component Selection
- `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`
- `Alert` - Info message
- `Button` - Secondary actions

### Layout Mockup
```
┌─────────────────────────────────────────────┐
│                                             │
│              [✓ Icon Circle]                │
│              Success green                  │
│                                             │
│         ¡Solicitud Enviada!                 │
│                                             │
│    Tu solicitud ha sido enviada             │
│    correctamente. Recibirás un email        │
│    cuando un administrador la apruebe.      │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  ⓘ ¿Qué sucede ahora?                 │  │
│  │                                       │  │
│  │  1. Un administrador revisará tu      │  │
│  │     solicitud en 24-48 horas          │  │
│  │                                       │  │
│  │  2. Recibirás un email si eres        │  │
│  │     aprobado con un enlace para       │  │
│  │     acceder a la plataforma           │  │
│  │                                       │  │
│  │  3. No necesitas crear una contraseña │  │
│  │     - el enlace te da acceso directo  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Email enviado a: usuario@email.com         │
│                                             │
│       [  Volver a Inicio  ]                 │
│                                             │
└─────────────────────────────────────────────┘
```

### Styling Recommendations

**Empty State Container:**
```tsx
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
  <div className="w-full max-w-md">
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2Icon className="h-8 w-8 text-primary" />
          </div>
        </EmptyMedia>
        <EmptyTitle>¡Solicitud Enviada!</EmptyTitle>
        <EmptyDescription className="text-center">
          Tu solicitud ha sido enviada correctamente. Recibirás un email
          cuando un administrador la apruebe.
        </EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        <Alert className="text-left">
          <AlertCircleIcon />
          <AlertTitle>¿Qué sucede ahora?</AlertTitle>
          <AlertDescription>
            <ol className="list-decimal list-inside space-y-2 text-sm mt-2">
              <li>Un administrador revisará tu solicitud en 24-48 horas</li>
              <li>Recibirás un email si eres aprobado con un enlace mágico</li>
              <li>No necesitas contraseña - el enlace te da acceso directo</li>
            </ol>
          </AlertDescription>
        </Alert>

        <p className="text-sm text-muted-foreground text-center mt-4">
          Email enviado a: <strong className="text-foreground">{email}</strong>
        </p>

        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="mt-6"
        >
          Volver a Inicio
        </Button>
      </EmptyContent>
    </Empty>
  </div>
</div>
```

### Visual Hierarchy
1. **Primary focus**: Success icon (large, primary color)
2. **Secondary**: Title (bold, large)
3. **Tertiary**: Description + timeline info
4. **Action**: Return button (outline, less prominent)

---

## 3. Admin Pending Signups Dashboard

### Component Selection
**Primary Components:**
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` - Main data view
- `Badge` - Status indicators
- `Button` - Actions (Approve/Reject)
- `Dialog` - Confirmation modals
- `Input` - Search field
- `Select` - Filter controls
- `Empty` - No pending signups state
- `Spinner` - Loading states
- `Alert` - Bulk action feedback

### Layout Mockup (Desktop)
```
┌──────────────────────────────────────────────────────────────────┐
│  Dashboard > Solicitudes Pendientes                    [12]      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [🔍 Buscar por email o nombre...]  [Estado ▼] [Fecha ▼]       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Email              │ Nombre       │ Fecha      │ Estado    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ juan@email.com     │ Juan García  │ hace 2h    │ PENDIENTE │ │
│  │                    │              │            │ [✓][✗]    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ maria@email.com    │ María López  │ hace 5h    │ PENDIENTE │ │
│  │                    │              │            │ [✓][✗]    │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ pedro@email.com    │ Pedro Ruiz   │ ayer       │ PENDIENTE │ │
│  │                    │              │            │ [✓][✗]    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Mostrando 3 de 12 solicitudes                    [← 1 2 3 →]  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────────┐
│ Solicitudes        [12]     │
├─────────────────────────────┤
│                             │
│ [🔍 Buscar...]              │
│ [Filtros ▼]                 │
│                             │
│ ┌─────────────────────────┐ │
│ │ Juan García             │ │
│ │ juan@email.com          │ │
│ │ hace 2 horas            │ │
│ │ ──────────────────────  │ │
│ │ [PENDIENTE]             │ │
│ │ [✓ Aprobar] [✗ Rechazar]│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ María López             │ │
│ │ maria@email.com         │ │
│ │ hace 5 horas            │ │
│ │ ──────────────────────  │ │
│ │ [PENDIENTE]             │ │
│ │ [✓ Aprobar] [✗ Rechazar]│ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

### Styling Recommendations

**Page Header with Badge:**
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-3xl font-bold">Solicitudes Pendientes</h1>
    <p className="text-muted-foreground">
      Revisa y aprueba nuevos miembros
    </p>
  </div>
  {pendingCount > 0 && (
    <Badge
      className="h-8 min-w-8 rounded-full px-3 font-mono tabular-nums"
      variant="destructive"
    >
      {pendingCount}
    </Badge>
  )}
</div>
```

**Search and Filters:**
```tsx
<div className="flex flex-col md:flex-row gap-4 mb-6">
  <div className="flex-1 relative">
    <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Buscar por email o nombre..."
      className="pl-10"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-full md:w-[180px]">
      <SelectValue placeholder="Estado" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      <SelectItem value="pending">Pendientes</SelectItem>
      <SelectItem value="approved">Aprobados</SelectItem>
      <SelectItem value="rejected">Rechazados</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Table with Actions (Desktop):**
```tsx
<Card>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Email</TableHead>
        <TableHead>Nombre</TableHead>
        <TableHead>Fecha</TableHead>
        <TableHead>Estado</TableHead>
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {signups.map((signup) => (
        <TableRow key={signup.id}>
          <TableCell className="font-medium">{signup.email}</TableCell>
          <TableCell>{signup.name} {signup.surname}</TableCell>
          <TableCell className="text-muted-foreground">
            {formatRelativeTime(signup.created_at)}
          </TableCell>
          <TableCell>
            <Badge variant="secondary">
              {signup.status === 'pending' ? 'PENDIENTE' : signup.status}
            </Badge>
          </TableCell>
          <TableCell className="text-right space-x-2">
            <Button
              size="sm"
              onClick={() => handleApprove(signup)}
              disabled={isProcessing}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(signup)}
              disabled={isProcessing}
            >
              <XIcon className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Card>
```

**Card View (Mobile):**
```tsx
<div className="space-y-4">
  {signups.map((signup) => (
    <Card key={signup.id} className="p-4">
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold">{signup.name} {signup.surname}</h3>
          <p className="text-sm text-muted-foreground">{signup.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(signup.created_at)}
          </p>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Badge variant="secondary">{signup.status}</Badge>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleApprove(signup)}
            >
              <CheckIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(signup)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  ))}
</div>
```

**Confirmation Dialog:**
```tsx
<Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Aprobar Solicitud</DialogTitle>
      <DialogDescription>
        ¿Estás seguro de que deseas aprobar a {selectedSignup?.name}?
        Se enviará un email con un enlace de acceso.
      </DialogDescription>
    </DialogHeader>

    <Alert>
      <MailIcon className="h-4 w-4" />
      <AlertDescription>
        Email: <strong>{selectedSignup?.email}</strong>
      </AlertDescription>
    </Alert>

    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancelar</Button>
      </DialogClose>
      <Button onClick={confirmApprove} disabled={isApproving}>
        {isApproving ? (
          <>
            <Spinner className="mr-2" />
            Aprobando...
          </>
        ) : (
          <>
            <CheckIcon className="h-4 w-4 mr-2" />
            Aprobar
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Empty State:**
```tsx
<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <CheckCircle2Icon className="h-12 w-12" />
    </EmptyMedia>
    <EmptyTitle>No hay solicitudes pendientes</EmptyTitle>
    <EmptyDescription>
      Todas las solicitudes han sido procesadas. Los nuevos registros
      aparecerán aquí automáticamente.
    </EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button variant="outline" onClick={() => navigate('/dashboard')}>
      Volver al Dashboard
    </Button>
  </EmptyContent>
</Empty>
```

### Status Badge Colors
```tsx
const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}
```

### Bulk Actions UI (Optional)
```tsx
<div className="flex items-center gap-4 mb-4">
  <Checkbox
    checked={selectedAll}
    onCheckedChange={handleSelectAll}
  />
  {selectedCount > 0 && (
    <div className="flex items-center gap-2">
      <Badge>{selectedCount} seleccionados</Badge>
      <Button size="sm" variant="outline">
        <CheckIcon className="h-4 w-4 mr-1" />
        Aprobar Todos
      </Button>
      <Button size="sm" variant="outline">
        <XIcon className="h-4 w-4 mr-1" />
        Rechazar Todos
      </Button>
    </div>
  )}
</div>
```

---

## 4. Email Templates

### Design Principles
- **Responsive**: Mobile-first design, max-width 600px
- **Inline CSS**: All styles inline for email client compatibility
- **Brand Colors**: Use España Creativa orange (#ff5722)
- **Clear CTAs**: Large, tappable buttons
- **Plain text fallback**: Always include text version

### Admin Notification Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Solicitud de Registro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto; background: linear-gradient(135deg, #ff5722, #ff7043); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">EC</span>
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #2c3e50; font-weight: 600;">
                Nueva Solicitud de Registro
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px; color: #5a6c7d; font-size: 16px; line-height: 1.6;">
              <p style="margin: 0 0 20px;">Hola Administrador,</p>
              <p style="margin: 0 0 20px;">
                Un nuevo usuario ha solicitado acceso a la plataforma España Creativa Red:
              </p>

              <!-- User Info Box -->
              <div style="background-color: #f8f9fa; border-left: 4px solid #ff5722; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px;"><strong>Nombre:</strong> {{name}} {{surname}}</p>
                <p style="margin: 0 0 8px;"><strong>Email:</strong> {{email}}</p>
                <p style="margin: 0;"><strong>Fecha:</strong> {{date}}</p>
              </div>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" align="center">
                    <a href="{{approve_url}}" style="display: inline-block; width: 100%; padding: 14px 24px; background-color: #ff5722; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
                      ✓ Aprobar
                    </a>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" align="center">
                    <a href="{{reject_url}}" style="display: inline-block; width: 100%; padding: 14px 24px; background-color: #e0e0e0; color: #5a6c7d; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
                      ✗ Rechazar
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 12px 12px; text-align: center; color: #95a5a6; font-size: 14px;">
              <p style="margin: 0 0 8px;">España Creativa Red - Admin Panel</p>
              <p style="margin: 0;">Este email fue enviado automáticamente, no responder</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### User Approval Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu cuenta ha sido aprobada</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Success Icon -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto; background-color: #d4edda; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: #28a745; font-size: 48px;">✓</span>
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #2c3e50; font-weight: 600;">
                ¡Bienvenido a España Creativa!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px; color: #5a6c7d; font-size: 16px; line-height: 1.6;">
              <p style="margin: 0 0 20px;">Hola {{name}},</p>
              <p style="margin: 0 0 20px;">
                Tu solicitud ha sido aprobada. Ya puedes acceder a nuestra plataforma
                de networking para emprendedores y mentores.
              </p>

              <!-- Info Box -->
              <div style="background-color: #e7f3ff; border-left: 4px solid #2196f3; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>💡 Importante:</strong> El siguiente enlace te dará acceso
                  directo a la plataforma. No necesitas crear una contraseña en este momento.
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="{{magic_link}}" style="display: inline-block; padding: 16px 48px; background-color: #ff5722; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 6px rgba(255, 87, 34, 0.3);">
                Acceder a la Plataforma
              </a>
              <p style="margin: 20px 0 0; font-size: 14px; color: #95a5a6;">
                Este enlace expira en 24 horas
              </p>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 40px 40px; color: #5a6c7d; font-size: 15px;">
              <h3 style="margin: 0 0 16px; color: #2c3e50; font-size: 18px;">
                Próximos pasos:
              </h3>
              <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Completa tu perfil con tus intereses y habilidades</li>
                <li style="margin-bottom: 8px;">Explora proyectos y oportunidades de colaboración</li>
                <li style="margin-bottom: 8px;">Conecta con otros emprendedores y mentores</li>
              </ol>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 12px 12px; text-align: center; color: #95a5a6; font-size: 14px;">
              <p style="margin: 0 0 8px;">España Creativa Red</p>
              <p style="margin: 0;">Red de emprendedores y mentores de confianza</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### User Rejection Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Actualización de tu solicitud</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto; background: linear-gradient(135deg, #ff5722, #ff7043); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">EC</span>
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; color: #2c3e50; font-weight: 600;">
                Actualización de tu Solicitud
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px; color: #5a6c7d; font-size: 16px; line-height: 1.6;">
              <p style="margin: 0 0 20px;">Hola {{name}},</p>
              <p style="margin: 0 0 20px;">
                Gracias por tu interés en formar parte de España Creativa Red.
                Después de revisar tu solicitud, lamentablemente no podemos
                aprobar tu acceso en este momento.
              </p>

              <!-- Info Box -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>Motivo:</strong> {{reason || 'No se proporcionó información adicional.'}}
                </p>
              </div>

              <p style="margin: 20px 0 0;">
                Si crees que esto es un error o deseas más información,
                no dudes en contactarnos a
                <a href="mailto:admin@espanacreativa.dev" style="color: #ff5722; text-decoration: none;">
                  admin@espanacreativa.dev
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e0e0e0; border-radius: 0 0 12px 12px; text-align: center; color: #95a5a6; font-size: 14px;">
              <p style="margin: 0 0 8px;">España Creativa Red</p>
              <p style="margin: 0;">Red de emprendedores y mentores de confianza</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Plain Text Versions

**Admin Notification (Plain Text):**
```
NUEVA SOLICITUD DE REGISTRO
----------------------------

Hola Administrador,

Un nuevo usuario ha solicitado acceso a España Creativa Red:

Nombre: {{name}} {{surname}}
Email: {{email}}
Fecha: {{date}}

ACCIONES:

Aprobar: {{approve_url}}
Rechazar: {{reject_url}}

---
España Creativa Red - Admin Panel
Este email fue enviado automáticamente
```

**User Approval (Plain Text):**
```
¡BIENVENIDO A ESPAÑA CREATIVA!
------------------------------

Hola {{name}},

Tu solicitud ha sido aprobada. Ya puedes acceder a nuestra plataforma.

ACCEDER A LA PLATAFORMA:
{{magic_link}}

(Este enlace expira en 24 horas)

PRÓXIMOS PASOS:
1. Completa tu perfil
2. Explora proyectos y oportunidades
3. Conecta con otros emprendedores

---
España Creativa Red
```

---

## 5. Responsive Design Strategy

### Breakpoints (Tailwind)
- **Mobile**: `< 640px` (sm)
- **Tablet**: `640px - 1024px` (md, lg)
- **Desktop**: `> 1024px` (xl)

### Mobile-First Approach

**Form Fields:**
```tsx
// Always full-width on mobile, auto-width on desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Field>...</Field>
  <Field>...</Field>
</div>
```

**Action Buttons:**
```tsx
// Stack vertically on mobile, horizontal on desktop
<div className="flex flex-col sm:flex-row gap-2">
  <Button className="w-full sm:w-auto">Aprobar</Button>
  <Button className="w-full sm:w-auto" variant="outline">Rechazar</Button>
</div>
```

**Table → Card Transformation:**
```tsx
{/* Desktop: Table view */}
<div className="hidden md:block">
  <Table>...</Table>
</div>

{/* Mobile: Card view */}
<div className="block md:hidden space-y-4">
  {signups.map(signup => (
    <Card>...</Card>
  ))}
</div>
```

**Navigation Adaptation:**
```tsx
// Add "Pending Signups" to sidebar on desktop
// Show as badge icon on mobile nav
```

### Touch-Friendly Sizing
- Minimum tap target: `44px × 44px` (h-11 = 44px)
- Button padding: `px-4 py-2.5` minimum
- Input height: `h-11` or `h-12`
- Adequate spacing between clickable elements: `gap-3` or `gap-4`

### Email Responsive Design
```html
<!-- Use max-width and media queries -->
<style>
  @media only screen and (max-width: 600px) {
    .mobile-padding { padding: 20px !important; }
    .mobile-font-size { font-size: 14px !important; }
    .mobile-button {
      display: block !important;
      width: 100% !important;
      margin-bottom: 10px !important;
    }
  }
</style>
```

---

## 6. Visual Hierarchy & Design Patterns

### Primary Action Hierarchy

**1. Primary Actions (Approve):**
- Background: `bg-primary` (#ff5722)
- Text: `text-primary-foreground` (white)
- Size: `h-10` or `h-11`
- Shadow: `hover:shadow-md`
- Icon: CheckIcon before text

**2. Secondary Actions (Reject):**
- Background: `bg-destructive` or `variant="outline"`
- Text: `text-destructive-foreground`
- Size: Same as primary
- Less prominent visually

**3. Tertiary Actions (Cancel, Back):**
- Variant: `variant="outline"` or `variant="ghost"`
- Text: `text-muted-foreground`
- Smaller size: `size="sm"`

### Status Indicators

**Badge Variants:**
```tsx
// Pending - Yellow/Amber
<Badge
  variant="secondary"
  className="bg-yellow-100 text-yellow-800 border-yellow-300"
>
  PENDIENTE
</Badge>

// Approved - Green
<Badge
  variant="secondary"
  className="bg-green-100 text-green-800 border-green-300"
>
  APROBADO
</Badge>

// Rejected - Red
<Badge
  variant="secondary"
  className="bg-red-100 text-red-800 border-red-300"
>
  RECHAZADO
</Badge>
```

**Notification Badge (Count):**
```tsx
<Badge
  className="h-6 min-w-6 rounded-full px-2 font-mono tabular-nums"
  variant="destructive"
>
  {count > 99 ? '99+' : count}
</Badge>
```

### Loading States

**Button Loading:**
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner className="mr-2 h-4 w-4" />
      Procesando...
    </>
  ) : (
    'Aprobar'
  )}
</Button>
```

**Page Loading:**
```tsx
<div className="flex items-center justify-center min-h-[400px]">
  <Spinner className="h-8 w-8 text-primary" />
</div>
```

**Skeleton Loading (Table):**
```tsx
<TableBody>
  {[...Array(5)].map((_, i) => (
    <TableRow key={i}>
      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
    </TableRow>
  ))}
</TableBody>
```

### Spacing Consistency

**Container Padding:**
```tsx
// Page wrapper
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

// Card internal
<CardContent className="p-6">

// Form groups
<div className="space-y-6">
```

**Gap Between Elements:**
```tsx
// Form fields: gap-4 (16px)
// Card grids: gap-6 (24px)
// Section spacing: mb-8 or mb-12
```

---

## 7. Accessibility Considerations

### ARIA Labels

**Form Fields:**
```tsx
<Field>
  <FieldLabel htmlFor="email" id="email-label">
    Email *
  </FieldLabel>
  <Input
    id="email"
    type="email"
    aria-labelledby="email-label"
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : "email-description"}
  />
  {errors.email && (
    <span id="email-error" role="alert" className="text-sm text-destructive">
      {errors.email}
    </span>
  )}
</Field>
```

**Action Buttons:**
```tsx
<Button
  onClick={handleApprove}
  aria-label={`Aprobar solicitud de ${signup.name}`}
>
  <CheckIcon aria-hidden="true" />
  Aprobar
</Button>
```

**Status Badges:**
```tsx
<Badge aria-label={`Estado: ${status}`}>
  {status}
</Badge>
```

### Keyboard Navigation

**Tab Order:**
1. Form fields (top to bottom)
2. Primary action button
3. Secondary actions
4. Navigation links

**Focus States:**
```tsx
// All interactive elements must have visible focus
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

**Dialog Trap Focus:**
```tsx
// Dialog component automatically handles focus trap
// Ensure Cancel button is first in tab order
<DialogFooter>
  <DialogClose asChild>
    <Button variant="outline">Cancelar</Button>
  </DialogClose>
  <Button>Confirmar</Button>
</DialogFooter>
```

### Screen Reader Support

**Loading States:**
```tsx
<div role="status" aria-live="polite">
  {isLoading && (
    <>
      <Spinner className="mr-2" />
      <span className="sr-only">Cargando...</span>
    </>
  )}
</div>
```

**Table Headers:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead scope="col">Email</TableHead>
      <TableHead scope="col">Nombre</TableHead>
      <TableHead scope="col">Acciones</TableHead>
    </TableRow>
  </TableHeader>
</Table>
```

### Color Contrast

**Ensure WCAG AA compliance:**
- Text on background: minimum 4.5:1
- Large text (18px+): minimum 3:1
- Primary color (#ff5722) on white: ✓ Pass
- Muted text on muted background: Review carefully

**Test with tools:**
- Chrome DevTools Lighthouse
- axe DevTools extension

---

## 8. Animation & Transitions

### Micro-interactions

**Button Hover:**
```tsx
className="transition-all duration-200 hover:shadow-md hover:scale-105"
```

**Card Hover:**
```tsx
className="transition-shadow duration-200 hover:shadow-lg"
```

**Badge Pulse (New notifications):**
```tsx
<Badge className="animate-pulse">
  {newCount}
</Badge>
```

### Page Transitions

**Success Feedback:**
```tsx
// After approval, show success toast
toast({
  title: "Solicitud aprobada",
  description: `Email enviado a ${signup.email}`,
  variant: "default",
})
```

**Loading to Content:**
```tsx
// Fade in content after load
<div className="animate-in fade-in duration-500">
  {content}
</div>
```

### Alert Animations

**Slide in from top:**
```tsx
<Alert className="animate-in slide-in-from-top-2 duration-300">
  <AlertDescription>Solicitud enviada correctamente</AlertDescription>
</Alert>
```

---

## 9. Implementation Checklist

### Request Access Form
- [ ] Replace signup tab with "Solicitar Acceso" form
- [ ] Remove password fields
- [ ] Add surname field (optional)
- [ ] Add email validation with disposable email check
- [ ] Add rate limiting client-side indicator
- [ ] Implement loading spinner on submit
- [ ] Show success state with next steps
- [ ] Add "¿Ya tienes cuenta?" link to login tab

### Pending Approval Page
- [ ] Create Empty state component with success icon
- [ ] Display user's submitted email
- [ ] Show timeline (24-48 hours)
- [ ] Add "Volver a Inicio" button
- [ ] Ensure mobile responsive layout

### Admin Dashboard
- [ ] Create new protected route `/admin/pending-signups`
- [ ] Add to admin navigation with count badge
- [ ] Implement search functionality
- [ ] Add status filter dropdown
- [ ] Create desktop table view
- [ ] Create mobile card view
- [ ] Add approve/reject action buttons
- [ ] Implement confirmation dialogs
- [ ] Add empty state for no pending signups
- [ ] Show loading states (spinner, skeleton)
- [ ] Add pagination if >20 items

### Email Templates
- [ ] Create admin notification template (HTML + plain text)
- [ ] Create user approval template with magic link (HTML + plain text)
- [ ] Create user rejection template (HTML + plain text)
- [ ] Test on major email clients (Gmail, Outlook, Apple Mail)
- [ ] Ensure mobile responsive rendering
- [ ] Verify CTA buttons work on all clients

### Accessibility
- [ ] Add ARIA labels to all form fields
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify color contrast ratios
- [ ] Add focus indicators to all interactive elements
- [ ] Test with keyboard-only navigation

### Responsive Design
- [ ] Test on mobile (320px - 480px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (1280px+)
- [ ] Ensure touch targets are minimum 44px
- [ ] Verify email rendering on mobile clients

---

## 10. Component File Structure

### Recommended File Organization

```
src/
├── app/features/auth/
│   ├── components/
│   │   ├── RequestAccessForm.tsx        # New signup form
│   │   ├── PendingApprovalPage.tsx      # Success state
│   │   └── AuthPage.tsx                 # Modified (remove signup tab)
│   │
│   └── ...
│
├── app/features/admin/
│   ├── components/
│   │   ├── PendingSignupsPage.tsx       # Main admin dashboard
│   │   ├── PendingSignupsTable.tsx      # Desktop table view
│   │   ├── PendingSignupCard.tsx        # Mobile card view
│   │   ├── ApproveDialog.tsx            # Confirmation dialog
│   │   └── RejectDialog.tsx             # Rejection dialog
│   │
│   └── hooks/
│       └── usePendingSignups.tsx        # React Query hook
│
└── lib/
    └── email-templates/
        ├── admin-notification.html
        ├── user-approval.html
        └── user-rejection.html
```

---

## 11. Design Tokens Summary

### Colors (HSL)
```typescript
const colors = {
  primary: 'hsl(14 100% 57%)',          // España Creativa orange
  primaryForeground: 'hsl(0 0% 100%)',
  destructive: 'hsl(0 84.2% 60.2%)',
  muted: 'hsl(210 11.3% 94.9%)',
  mutedForeground: 'hsl(220 8.9% 46.1%)',
  border: 'hsl(220 13% 91%)',

  // Custom status colors
  pending: 'hsl(45 93% 47%)',   // Yellow/Amber
  approved: 'hsl(142 71% 45%)',  // Green
  rejected: 'hsl(0 84% 60%)',    // Red
}
```

### Typography
```typescript
const typography = {
  headingXL: 'text-3xl font-bold',        // 30px
  headingLG: 'text-2xl font-semibold',    // 24px
  headingMD: 'text-xl font-semibold',     // 20px
  body: 'text-base',                       // 16px
  bodySmall: 'text-sm',                    // 14px
  caption: 'text-xs',                      // 12px
}
```

### Spacing
```typescript
const spacing = {
  cardPadding: 'p-6',          // 24px
  formGap: 'gap-4',            // 16px
  sectionGap: 'gap-6',         // 24px
  pageMargin: 'mb-8',          // 32px
}
```

### Border Radius
```typescript
const radius = {
  button: 'rounded-lg',        // 8px
  card: 'rounded-xl',          // 12px
  badge: 'rounded-full',       // 9999px
  input: 'rounded-md',         // 6px
}
```

---

## Summary

This UI/UX design guide provides comprehensive recommendations for implementing the admin-approval signup system using shadcn/ui components. Key highlights:

**1. Component Choices:**
- **Forms**: Field, FieldLabel, Input (v4 components)
- **Feedback**: Alert, Badge, Spinner
- **Layout**: Card, Table, Empty
- **Modals**: Dialog with confirmation flows

**2. Design Consistency:**
- Maintains España Creativa brand (orange primary color)
- Follows existing AuthPage design patterns
- Uses generous spacing and elegant shadows
- Mobile-first responsive approach

**3. User Experience:**
- Clear visual hierarchy (primary actions prominent)
- Comprehensive feedback at every step
- Accessible keyboard navigation
- Loading states for all async operations

**4. Accessibility:**
- WCAG AA compliance
- Proper ARIA labels
- Screen reader support
- Keyboard navigation

**5. Email Design:**
- Responsive HTML templates
- Plain text fallbacks
- Brand-consistent styling
- Clear CTAs with proper touch targets

Iban, this design system ensures a professional, accessible, and user-friendly approval workflow that integrates seamlessly with your existing España Creativa platform.
