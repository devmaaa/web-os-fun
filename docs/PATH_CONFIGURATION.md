# Absolute Path Configuration - DineApp OS

This document describes the absolute path configuration that follows the microkernel architecture pattern defined in the [architecture specification](../spec/architecture/architecture.md).

## 🏗️ Architecture-Based Path Structure

The path mapping is organized according to the core architectural layers:

### 🧠 Core System (@core/*)

Core modules that form the microkernel and essential services.

```typescript
// Event-driven messaging system
import { eventBus } from '@core/event-bus';

// Window management and OS shell
import { windowManager } from '@core/window-manager';

// Plugin lifecycle and loading
import { pluginLoader } from '@core/plugin-loader';

// Schema-driven configuration
import { configEngine } from '@core/config-engine';

// Authentication and permissions
import { authService } from '@core/auth';

// Theme management
import { themeEngine } from '@core/themes';

// Storage abstraction and sync
import { storageEngine } from '@core/storage';

// Diagnostics and telemetry
import { telemetry } from '@core/telemetry';

// Local cache management
import { cache } from '@core/cache';

// Internationalization
import { i18n } from '@core/i18n';
```

### 🖥️ Apps (@apps/*)

Root applications and desktop environment components.

```typescript
// Main OS shell (desktop environment)
import OsShell from '@apps/os-shell';

// OS shell components
import { DesktopIcons } from '@apps/os-shell/components/DesktopIcons';
import { Taskbar } from '@apps/os-shell/components/Taskbar';
import { WindowManager } from '@apps/os-shell/components/WindowManager';
```

### 🔌 Plugins (@plugins/*)

Feature-Sliced Design micro-applications.

```typescript
// Point of Sale plugin
import PosPlugin from '@plugins/pos';

// Kitchen Display System
import KdsPlugin from '@plugins/kds';

// Customer Relationship Management
import CrmPlugin from '@plugins/crm';

// Business Analytics
import AnalyticsPlugin from '@plugins/analytics';

// Inventory Management
import InventoryPlugin from '@plugins/inventory';

// Menu Management
import MenuPlugin from '@plugins/menu';

// System Settings
import SettingsPlugin from '@plugins/settings';
```

### 🔌 Ports (@ports/*)

External system integrations and adapters.

```typescript
// Payment processors
import { paymentService } from '@ports/payments';

// Notification systems
import { notificationService } from '@ports/notifications';

// Database adapters
import { databaseService } from '@ports/database';

// Printer drivers
import { printerService } from '@ports/printers';
```

### 🛠️ Shared (@shared/*)

Cross-cutting utilities and shared resources.

```typescript
// Custom hooks and composables
import { useEventBus } from '@composables';

// Utility functions
import { formatDate } from '@utils';

// Type definitions
import type { WindowProps } from '@types';

// Static assets
import logo from '@assets/logo.png';
```

### 🎨 UI Components (@ui/*)

Shared component library and styling system.

```typescript
// UI components
import { Button, Modal, Card } from '@ui/components';

// UI hooks
import { useTheme } from '@ui/hooks';

// Styled components
import { themeStyles } from '@ui/styles';
```

## 📁 File Structure

```
src/
├── core/                           # @core/* - Microkernel and Core Services
│   ├── event-bus/                  # @core/event-bus
│   ├── window-manager/             # @core/window-manager
│   ├── plugin-loader/              # @core/plugin-loader
│   ├── config-engine/              # @core/config-engine
│   ├── auth-permissions/           # @core/auth
│   ├── themes/                     # @core/themes
│   ├── storage-abstraction/        # @core/storage
│   ├── telemetry/                  # @core/telemetry
│   ├── local-cache/                # @core/cache
│   └── i18n/                       # @core/i18n
├── apps/                           # @apps/* - Desktop Environment
│   └── os-shell/                   # @apps/os-shell
│       ├── OsShell.tsx
│       ├── components/
│       └── index.ts
├── plugins/                        # @plugins/* - FSD Micro-apps
│   ├── pos/                        # @plugins/pos
│   ├── kds/                        # @plugins/kds
│   ├── crm/                        # @plugins/crm
│   ├── analytics/                  # @plugins/analytics
│   ├── inventory/                  # @plugins/inventory
│   ├── menu/                       # @plugins/menu
│   └── settings/                   # @plugins/settings
├── ports/                          # @ports/* - External Integrations
│   ├── payments/                   # @ports/payments
│   ├── notif/                      # @ports/notifications
│   ├── db/                         # @ports/database
│   └── printers/                   # @ports/printers
├── composables/                    # @composables
├── utils/                          # @utils
├── types/                          # @types
├── assets/                         # @assets
└── ui/                             # @ui/*
    ├── components/                 # @ui/components
    ├── hooks/                      # @ui/hooks
    └── styles/                     # @ui/styles
```

## 🔧 Configuration Files

### TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@apps/*": ["src/apps/*"],
      "@plugins/*": ["src/plugins/*"],
      "@ports/*": ["src/ports/*"],
      "@composables": ["src/composables"],
      "@utils": ["src/utils"],
      "@types": ["src/types"],
      "@assets": ["src/assets"],
      "@ui/*": ["src/ui/*"]
    }
  }
}
```

### Vite (vite.config.ts)

```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@apps': path.resolve(__dirname, 'src/apps'),
      '@plugins': path.resolve(__dirname, 'src/plugins'),
      '@ports': path.resolve(__dirname, 'src/ports'),
      '@composables': path.resolve(__dirname, 'src/composables'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@ui': path.resolve(__dirname, 'src/ui'),
    },
  },
});
```

## 🎯 Benefits

### 1. **Clear Architecture Boundaries**
- Core services are clearly distinguished from plugins
- Apps layer separation from core functionality
- Clear integration points via ports

### 2. **Maintainable Imports**
- No more `../../../core/plugin-loader` spaghetti
- Self-documenting imports show architectural layer
- Easy refactoring with IDE support

### 3. **Consistent Naming Convention**
- `@core/*` for microkernel services
- `@apps/*` for desktop environment
- `@plugins/*` for FSD micro-apps
- `@ports/*` for external integrations

### 4. **Type Safety**
- Full TypeScript support for path mapping
- IDE autocomplete and go-to-definition
- Compilation-time import validation

### 5. **Developer Experience**
- Intuitive path organization
- Easy module discovery
- Clear architectural intent

## 🚀 Usage Examples

### Importing Core Services

```typescript
// Good: Clear architectural layering
import { eventBus } from '@core/event-bus';
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';

// Bad: Relative paths and unclear boundaries
import { eventBus } from '../../core/event-bus';
import { windowManager } from '../../../core/window-manager';
```

### Importing Plugins

```typescript
// Good: Clear plugin boundaries
import PosPlugin from '@plugins/pos';
import KdsPlugin from '@plugins/kds';

// Bad: Cross-plugin imports (violates architecture)
import { OrderComponent } from '../pos/components/Order';
```

### Importing UI Components

```typescript
// Good: Shared UI library
import { Button, Modal } from '@ui/components';

// Bad: Plugin-specific UI from another plugin
import { Button } from '@plugins/pos/components/Button';
```

## 🔍 Migration Guide

When converting existing imports:

1. **Identify the architectural layer** (Core, App, Plugin, Port, Shared)
2. **Use the appropriate path alias** (@core, @apps, @plugins, @ports, @shared)
3. **Update all relative imports** in the file
4. **Verify TypeScript compilation**
5. **Test build and dev server**

### Example Migration

```typescript
// Before
import { windowManager } from '../../../core/window-manager';
import { pluginLoader } from '../../../core/plugin-loader';
import { DesktopIcons } from './components/DesktopIcons';

// After
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';
import { DesktopIcons } from '@apps/os-shell/components/DesktopIcons';
```

This path configuration enforces the microkernel architecture and provides a clean, maintainable import structure that scales with the application's complexity.