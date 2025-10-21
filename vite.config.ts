import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import path from 'path';

export default defineConfig({
  plugins: [devtools(), solidPlugin(), tailwindcss()],
  server: {
    port: 3200,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      // Core System - Microkernel and Core Services
      '@core': path.resolve(__dirname, 'src/core'),
      '@core/event-bus': path.resolve(__dirname, 'src/core/event-bus'),
      '@core/window-manager': path.resolve(__dirname, 'src/core/window-manager'),
      '@core/plugin-loader': path.resolve(__dirname, 'src/core/plugin-loader'),
      '@core/config-engine': path.resolve(__dirname, 'src/core/config-engine'),
      '@core/auth': path.resolve(__dirname, 'src/core/auth-permissions'),
      '@core/themes': path.resolve(__dirname, 'src/core/themes'),
      '@core/storage': path.resolve(__dirname, 'src/core/storage-abstraction'),
      '@core/telemetry': path.resolve(__dirname, 'src/core/telemetry'),
      '@core/cache': path.resolve(__dirname, 'src/core/local-cache'),
      '@core/i18n': path.resolve(__dirname, 'src/core/i18n'),

      // Apps - Desktop Environment and Root Applications
      '@apps': path.resolve(__dirname, 'src/apps'),
      '@apps/os-shell': path.resolve(__dirname, 'src/apps/os-shell'),

      // Plugins - Feature-Sliced Design Micro-apps
      '@plugins': path.resolve(__dirname, 'src/plugins'),
      '@plugins/pos': path.resolve(__dirname, 'src/plugins/pos'),
      '@plugins/kds': path.resolve(__dirname, 'src/plugins/kds'),
      '@plugins/crm': path.resolve(__dirname, 'src/plugins/crm'),
      '@plugins/analytics': path.resolve(__dirname, 'src/plugins/analytics'),
      '@plugins/inventory': path.resolve(__dirname, 'src/plugins/inventory'),
      '@plugins/menu': path.resolve(__dirname, 'src/plugins/menu'),
      '@plugins/settings': path.resolve(__dirname, 'src/plugins/settings'),

      // Ports - External System Integrations
      '@ports': path.resolve(__dirname, 'src/ports'),
      '@ports/payments': path.resolve(__dirname, 'src/ports/payments'),
      '@ports/notifications': path.resolve(__dirname, 'src/ports/notif'),
      '@ports/database': path.resolve(__dirname, 'src/ports/db'),
      '@ports/printers': path.resolve(__dirname, 'src/ports/printers'),

      // Shared - Cross-cutting Utilities
      '@shared': path.resolve(__dirname, 'src'),
      '@composables': path.resolve(__dirname, 'src/composables'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@assets': path.resolve(__dirname, 'src/assets'),

      // UI - Shared Component Library
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@ui/components': path.resolve(__dirname, 'src/ui/components'),
      '@ui/hooks': path.resolve(__dirname, 'src/ui/hooks'),
      '@ui/styles': path.resolve(__dirname, 'src/ui/styles'),
    },
  },
});
