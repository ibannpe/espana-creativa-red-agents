// ABOUTME: Configuración de Vitest para ejecutar solo tests del path crítico
// ABOUTME: Tests esenciales que deben pasar antes de cualquier merge o deploy
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      // 🔴 CRÍTICO - Backend Use Cases (Core Business Logic)
      'server/application/use-cases/auth/SignUpUseCase.test.ts',
      'server/application/use-cases/messages/SendMessageUseCase.test.ts',
      'server/application/use-cases/users/GetRecentUsersUseCase.test.ts',

      // 🟠 ALTA PRIORIDAD - Domain Layer (Integridad de Datos)
      'server/domain/value-objects/Email.test.ts',
      'server/domain/value-objects/UserId.test.ts',
      'server/domain/entities/User.test.ts',
      'server/domain/entities/Message.test.ts',

      // 🟡 MEDIA PRIORIDAD - Frontend Schemas (Validación de Datos)
      'src/app/features/auth/data/schemas/auth.schema.test.ts',
      'src/app/features/auth/data/services/auth.service.test.ts',
      'src/app/features/messages/data/schemas/message.schema.test.ts',
      'src/app/features/signup-approval/data/schemas/signup-approval.schema.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'server/application/use-cases/**/*.ts',
        'server/domain/**/*.ts',
        'src/app/features/*/data/schemas/**/*.ts',
        'src/app/features/*/data/services/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/node_modules/**',
      ],
    },
  },
})
