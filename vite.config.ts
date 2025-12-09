import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Proxy solo en desarrollo. En producción, Vercel redirige con rewrites
    proxy: mode === 'development' ? {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // Configuración de reconexión para evitar errores cuando Express está iniciando
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('[VITE PROXY] Error de proxy - El backend puede estar iniciando todavía:', err.message)
            if (res && !res.headersSent) {
              res.writeHead(503, {
                'Content-Type': 'application/json',
              })
              res.end(JSON.stringify({
                error: 'El servidor backend está iniciando. Por favor, espera unos segundos e intenta de nuevo.'
              }))
            }
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[VITE PROXY] ${req.method} ${req.url} -> ${proxyReq.host}${proxyReq.path}`)
          })
        },
      }
    } : undefined
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));