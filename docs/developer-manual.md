# Manual del Desarrollador - España Creativa Red

Este documento complementa a `CLAUDE.md` y contiene la documentación detallada sobre la arquitectura, flujos de trabajo y referencias del sistema.

## 1. Arquitectura Detallada

### Arquitectura Dual-Server
El proyecto opera con dos servidores distintos durante el desarrollo:

1.  **Frontend (Vite - Puerto 8080):** Sirve la SPA (Single Page Application).
2.  **Backend (Express - Puerto 3001):** API REST y servicios de email.

**Comunicación (Proxy):**
El frontend no llama directamente a `localhost:3001` en desarrollo, sino que usa un proxy configurado en `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  }
}