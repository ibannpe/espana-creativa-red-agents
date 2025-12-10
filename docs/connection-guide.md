# Guía de Conexión a Base de Datos (PostgreSQL)

Guía técnica para conectar a la base de datos Supabase desde terminal local.

## Credenciales y Configuración
Consultar el archivo `.env` para valores actuales.

- **Host:** `aws-0-eu-central-1.pooler.supabase.com`
- **Puerto:** `5432`
- **Database:** `postgres`
- **Usuario:** `postgres.jbkzymvswvnkrxriyzdx`
- **Password:** Ver `SUPABASE_DB_PASSWORD` en `.env`

⚠️ **IMPORTANTE:** Es obligatorio añadir `?gssencmode=disable` al final del string de conexión para evitar errores de negociación GSSAPI.

---

## Comandos PSQL

Si usas Homebrew en Mac, tu ruta binaria suele ser:

```
/opt/homebrew/opt/postgresql@16/bin/psql
```

### 1. Conexión Interactiva (Consola)

```bash
PGPASSWORD='TU_PASSWORD_DEL_ENV' /opt/homebrew/opt/postgresql@16/bin/psql "postgresql://postgres.jbkzymvswvnkrxriyzdx@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?gssencmode=disable"
```

---

### 2. Ejecutar Comando SQL Directo

Ejemplo: listar proyectos

```bash
PGPASSWORD='TU_PASSWORD_DEL_ENV' /opt/homebrew/opt/postgresql@16/bin/psql "postgresql://postgres.jbkzymvswvnkrxriyzdx@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?gssencmode=disable" -c "SELECT * FROM projects;"
```

---

### 3. Ver Estructura de Tabla

```bash
PGPASSWORD='TU_PASSWORD_DEL_ENV' /opt/homebrew/opt/postgresql@16/bin/psql "postgresql://postgres.jbkzymvswvnkrxriyzdx@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?gssencmode=disable" -c "\d nombre_tabla"
```

---

### 4. Ejecutar Archivo de Migración

```bash
PGPASSWORD='TU_PASSWORD_DEL_ENV' /opt/homebrew/opt/postgresql@16/bin/psql "postgresql://postgres.jbkzymvswvnkrxriyzdx@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?gssencmode=disable" -f migrations/nombre_archivo.sql
```

---

## Solución de Problemas Comunes

| Error | Causa / Solución |
|------|-------------------|
| `received invalid response to GSSAPI negotiation` | Falta `?gssencmode=disable` en la URL de conexión. |
| `Tenant or user not found` | Usuario o host incorrectos. Verificar `.env`. |
| `command not found: psql` | No tienes `psql` en el PATH. Usa la ruta absoluta `/opt/homebrew/...`. |

---

## Flujo de Migraciones

1. Crear archivo SQL en carpeta `migrations/`.
2. Actualizar `docs/database/supabase-schema.sql` para referencia.
3. Ejecutar migración usando el comando #4 o el script de Node:

```bash
node migrations/execute-migrations.mjs
```

4. Actualizar tipos TypeScript en `src/types/` si la estructura cambió.

---

