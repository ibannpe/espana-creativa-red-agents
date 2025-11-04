# Claude Code Configuration

Este directorio contiene la configuración para Claude Code.

## Setup

1. Copia el archivo de ejemplo:
   ```bash
   cp settings.json.example settings.json
   ```

2. Edita `settings.json` y reemplaza los siguientes placeholders:
   - `YOUR_PROJECT_ID` → Tu ID de proyecto de Supabase
   - `YOUR_USERNAME` → Tu nombre de usuario del sistema
   - `YOUR_DB_PASSWORD` → Tu contraseña de base de datos

3. **IMPORTANTE**: El archivo `settings.json` contiene credenciales sensibles y está excluido de git por seguridad.

## Estructura

- `settings.json.example` - Plantilla de configuración (sin credenciales)
- `settings.json` - Tu configuración local (gitignored)
- `hooks/` - Scripts ejecutados en eventos de Claude Code
