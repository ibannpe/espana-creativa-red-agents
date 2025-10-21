# 📁 Configuración Manual de Supabase Storage

Para habilitar la funcionalidad de subida de fotos de perfil, necesitas configurar el storage de Supabase manualmente.

## 🔧 Pasos en Supabase Dashboard:

### 1. Crear el Bucket de Storage
1. Ve a tu proyecto de Supabase
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Configura el bucket:
   - **Name**: `profile-photos`
   - **Public bucket**: ✅ Activado
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png` 
     - `image/gif`
     - `image/webp`

### 2. Configurar Políticas RLS (Row Level Security)

Ve a **Storage > Policies** y crea estas políticas para el bucket `profile-photos`:

#### Política 1: Permitir subida (INSERT)
```sql
-- Nombre: Allow authenticated users to upload profile photos
-- Operation: INSERT
-- Policy definition:
auth.role() = 'authenticated'
```

#### Política 2: Permitir lectura pública (SELECT)  
```sql
-- Nombre: Allow public read access to profile photos
-- Operation: SELECT
-- Policy definition:
true
```

#### Política 3: Permitir actualizar/eliminar propias fotos (UPDATE/DELETE)
```sql
-- Nombre: Allow users to update their own profile photos  
-- Operation: UPDATE, DELETE
-- Policy definition:
auth.uid()::text = (storage.foldername(name))[1]
```

## ✅ Verificación

Después de configurar:
1. El botón "Añadir foto de perfil" debe funcionar
2. Los usuarios pueden subir imágenes JPG, PNG, GIF (máx 5MB)
3. Las fotos se almacenan en `profile-photos/avatars/`
4. Las URLs son públicamente accesibles

## 🚀 ¡Listo!

Una vez completados estos pasos, la funcionalidad de subida de fotos de perfil estará completamente operativa en España Creativa Red.