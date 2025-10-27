# 🌐 WebOS - Modern Web-Based Operating System

<div align="center">

![WebOS Logo](https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=WebOS)

**A complete web-based operating system with modular, plugin-based architecture built with modern web technologies**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4F46E5?logo=typescript)](https://www.typescriptlang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-4A90E2?logo=solid)](https://www.solidjs.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite)](https://vitejs.dev/)

</div>

## ✨ Features

### 🖥️ Desktop Environment
- **Multi-Window Interface**: Full desktop experience with draggable, resizable windows
- **Taskbar & Dock**: Complete desktop navigation with app launcher and system tray
- **Window Management**: Minimize, maximize, snap-to-screen, and z-index management
- **Desktop Icons**: Customizable desktop with shortcuts to applications
- **Alt+Tab Navigation**: Switch between running applications

### 🏗️ Core Architecture
- **Plugin-Based System**: Modular architecture with pluggable applications
- **Event-Driven**: Robust event bus for inter-application communication
- **Multi-Window Support**: Dedicated windows for different applications and tasks
- **Finite State Machine**: Deterministic state management for all subsystems
- **Real-time Communication**: Built-in support for multi-tab synchronization
- **TypeScript-First**: Full type safety across the entire operating system

### 🔧 Core Systems
- **Authentication & Permissions**: Role-based access control
- **Configuration Engine**: Dynamic configuration management
- **Storage Abstraction**: Unified storage interface
- **Theme Engine**: Customizable theming system
- **Internationalization**: Multi-language support
- **Telemetry**: Usage analytics and monitoring
- **Local Cache**: Optimized data caching

### 📱 Available Applications

| Application | Description | Icon | Status |
|-------------|-------------|------|--------|
| **📁 File Manager** | File system navigation and management | 📁 | ✅ Active |
| **📝 Text Editor** | Rich text editing and document creation | 📝 | ✅ Active |
| **🖼️ Image Viewer** | View and edit images | 🖼️ | ✅ Active |
| **🌐 Web Browser** | Web browsing application | 🌐 | ✅ Active |
| **📊 Analytics** | System monitoring and analytics | 📊 | ✅ Active |
| **⚙️ Settings** | System configuration and preferences | ⚙️ | ✅ Active |
| **🎮 Media Player** | Audio and video playback | 🎮 | ✅ Active |
| **💬 Terminal** | Command line interface | 💬 | ✅ Active |

### 🔌 External Integrations
- **💾 Storage**: Local and cloud storage providers
- **🖨️ Printers**: Print driver support for various printers
- **📢 Notifications**: Real-time alerts and messaging
- **🌐 Network**: Network and connectivity adapters
- **🔐 Security**: Authentication and security service integrations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/devmaaa/webos.git
cd webos

# Install dependencies
bun install

# Start development server
bun run dev
```

The WebOS will be available at `http://localhost:3200`

### Build for Production

```bash
# Build the application
bun run build

# Preview the production build
bun run serve
```

## 🏛️ Architecture Overview

WebOS follows a **microkernel architecture** with **Feature-Sliced Design (FSD)** principles, creating a complete, modular web-based operating system.

### Core Philosophy
- **Microkernel Extensibility**: Core + Plugins with schema-driven configuration
- **Isolation by Design**: Scoped event communication and plugin boundaries
- **Event-Driven Communication**: Deterministic, leak-free messaging via EventBus
- **Offline-First**: Real-time sync with local cache capabilities
- **TypeScript-First**: Full type safety across the entire system

### Macro Architecture

```
┌────────────────────────────────────────────┐
│                WebOS Core                 │
│────────────────────────────────────────────│
│ 🧠 Microkernel                             │
│  • Plugin Loader                           │
│  • Event Bus (Scoped + Leak-safe)          │
│  • Window Manager                          │
│  • Finite State Machine (FSM) System       │
│  • State Manager                           │
│  • Config Engine                           │
│  • Theme Engine                            │
│  • Auth & Permission Layer                 │
│  • Storage Abstraction (Offline + Sync)    │
│                                            │
│ 🔌 Core Services                           │
│  • Notification Service                    │
│  • Sync & Queue Manager                    │
│  • Diagnostics / Telemetry                 │
│  • Cross-tab / Cross-window bridge         │
└────────────────────────────────────────────┘
▲
│
┌──────────────┴──────────────┐
│          Applications       │
│─────────────────────────────│
│ File Manager / Text Editor  │
│ Media Player / Browser      │
│ Terminal / Analytics       │
│ Settings / System Apps     │
└──────────────▲──────────────┘
│
Solid.js Windows (UI)
```

### Directory Structure

```
webos/
├── src/
│   ├── core/                    # Core systems
│   │   ├── auth-permissions/    # Authentication & RBAC
│   │   ├── config-engine/       # Configuration management
│   │   ├── event-bus/          # Inter-application communication
│   │   ├── fsm/                # Finite State Machine system
│   │   ├── i18n/               # Internationalization
│   │   ├── plugin-loader/      # Plugin system
│   │   ├── storage-abstraction/# Storage interface
│   │   ├── telemetry/          # Usage analytics
│   │   ├── themes/             # Theming system
│   │   └── window-manager/     # Multi-window management
│   ├── ports/                   # External integrations
│   │   ├── db/                 # Database adapters
│   │   ├── notif/              # Notification systems
│   │   ├── network/            # Network adapters
│   │   ├── printers/           # Printer drivers
│   │   └── security/           # Security integrations
│   ├── apps/                    # System applications
│   │   ├── file-manager/       # File management
│   │   ├── text-editor/        # Text editing
│   │   ├── media-player/       # Media playback
│   │   ├── browser/            # Web browsing
│   │   ├── terminal/           # Command line interface
│   │   ├── analytics/          # System monitoring
│   │   └── settings/           # System Settings
│   ├── plugins/                 # Third-party applications
│   │   └── [user-plugins]/     # User-installed applications
│   └── composables/            # Reusable logic
```

## 🔌 Application Development

### Creating a New Application

WebOS applications follow **Feature-Sliced Design (FSD)** principles for clean, maintainable architecture.

1. **Create Application Directory Structure**:
```bash
mkdir src/apps/my-app
cd src/apps/my-app
mkdir -p entities features widgets pages stores composables shared
```

2. **Create Application Manifest** (`manifest.json`):
```json
{
  "id": "@webos/my-app",
  "displayName": "My App",
  "version": "1.0.0",
  "description": "Description of my application",
  "icon": "🔧",
  "entry": "./app.tsx",
  "permissions": [
    "my-feature.read",
    "my-feature.create"
  ],
  "dependencies": [],
  "configSchema": "./config/schema.json",
  "windows": [
    {
      "id": "my-app-main",
      "title": "My App",
      "defaultWidth": 800,
      "defaultHeight": 600,
      "minWidth": 600,
      "minHeight": 400
    }
  ]
}
```

3. **Application Bootstrap** (`init.ts`):
```ts
import { eventBus } from '../../core/event-bus';

export async function init() {
  // Register event listeners with application scope
  const scope = '@webos/my-app';

  // Listen to domain events
  eventBus.on('file:opened', handleFileOpened, { scope });
  eventBus.on('my-feature:updated', handleFeatureUpdate, { scope });

  // Emit application loaded event
  eventBus.emit('app:loaded', {
    appId: '@webos/my-app',
    timestamp: Date.now()
  });

  return () => {
    // Cleanup function
    eventBus.offAll(scope);
    eventBus.emit('app:unloaded', {
      appId: '@webos/my-app',
      timestamp: Date.now()
    });
  };
}

function handleFileOpened(file: any) {
  // Handle file operations
}

function handleFeatureUpdate(data: any) {
  // Handle feature updates
}
```

4. **FSD Layers Implementation**:

   **Entities** (`entities/file.ts`):
```ts
export interface File {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  content: string | ArrayBuffer;
  modifiedAt: Date;
  createdAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  children: (File | Folder)[];
  createdAt: Date;
}
```

   **Features** (`features/useFileManagement.ts`):
```ts
import { createSignal, createEffect } from 'solid-js';
import { File, Folder } from '../entities/file';

export function useFileManagement() {
  const [files, setFiles] = createSignal<File[]>([]);
  const [folders, setFolders] = createSignal<Folder[]>([]);
  const [loading, setLoading] = createSignal(false);

  const createFile = (fileData: Partial<File>) => {
    setLoading(true);
    const file: File = {
      id: generateId(),
      name: '',
      path: '',
      size: 0,
      type: '',
      content: '',
      modifiedAt: new Date(),
      createdAt: new Date(),
      ...fileData
    } as File;

    setFiles(prev => [...prev, file]);
    setLoading(false);

    // Emit domain event
    eventBus.emit('file:created', file);

    return file;
  };

  const openFile = (fileId: string) => {
    const file = files().find(f => f.id === fileId);
    if (file) {
      eventBus.emit('file:opened', file);
    }
    return file;
  };

  return { files, folders, loading, createFile, openFile };
}
```

   **Widgets** (`widgets/FileList.tsx`):
```tsx
import { For } from 'solid-js';
import { useFileManagement } from '../features/useFileManagement';

export function FileList() {
  const { files, loading } = useFileManagement();

  return (
    <div class="file-list">
      <h2>Files</h2>
      {loading() ? (
        <p>Loading...</p>
      ) : (
        <For each={files()}>
          {(file) => (
            <div class="file-item">
              <span>{file.name}</span>
              <span>{file.type}</span>
              <span>{formatFileSize(file.size)}</span>
            </div>
          )}
        </For>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

5. **Main Application** (`app.tsx`):
```tsx
import { onMount, onCleanup } from 'solid-js';
import { eventBus } from '../../core/event-bus';
import { useEventBus } from '../../composables/useEventBus';
import { FileList } from './widgets/FileList';

export default function MyApp() {
  const events = useEventBus();

  onMount(() => {
    // Register UI-specific event listeners
    const unsubscribe = events.on('window:focused', (windowId) => {
      console.log('Window focused:', windowId);
    });

    return () => unsubscribe();
  });

  return (
    <div class="p-6 bg-white dark:bg-gray-800 min-h-full">
      <h1 class="text-2xl font-bold mb-6">My App</h1>
      <FileList />
    </div>
  );
}
```

6. **Application Registration** (in `src/apps/index.ts`):
```ts
export { default as myApp } from './my-app/app';
export { init } from './my-app/init';
```

### Event System

WebOS uses a **deterministic, leak-free EventBus** for all inter-application communication. The EventBus is scoped by design, ensuring clean isolation between applications.

#### Core Event Bus (System-Level)
Used by core modules, application bootstraps, and data stores:

```typescript
import { eventBus } from '../core/event-bus';

// Emit events with async side effects
await eventBus.emit('file:created', {
  id: 'file123',
  name: 'document.txt',
  size: 1024,
  timestamp: Date.now()
});

// Register listeners with application scope (required for cleanup)
const scope = '@webos/my-app';
eventBus.on('file:opened', handleFileOpened, { scope });
eventBus.on('app:updated', handleAppUpdate, { scope });

// Cleanup on application unload
eventBus.offAll(scope);
```

#### UI-Level Event Bus (Composables)
For Solid components with automatic cleanup:

```tsx
import { useEventBus, createEventSignal } from '../composables/useEventBus';

export function OrderDashboard() {
  const events = useEventBus();

  // Reactive signal that updates on events
  const orderCount = createEventSignal('order:created', 0);

  onMount(() => {
    // Automatic cleanup on component unmount
    const unsubscribe = events.on('window:focused', (windowId) => {
      console.log('Window focused:', windowId);
    });

    // Manual cleanup available
    return () => unsubscribe();
  });

  return (
    <div>
      <h2>Order Count: {orderCount()}</h2>
    </div>
  );
}
```

#### Event Naming Conventions
Follow descriptive, namespaced naming using **domain:action** convention:

```typescript
// Window Events
'window:opened' | 'window:closed' | 'window:minimized' | 'window:focused'

// File System Events
'file:created' | 'file:opened' | 'file:modified' | 'file:deleted'
'folder:created' | 'folder:navigated' | 'folder:renamed'

// Application Events
'app:loaded' | 'app:unloaded' | 'app:focused' | 'os:ready'

// System Events
'os:ready' | 'theme:changed' | 'notification:shown'

// User Events
'user:logged-in' | 'user:logged-out' | 'permissions:changed'
```

#### Event Accumulation
For collecting multiple event payloads:

```tsx
import { createEventAccumulator } from '../composables/useEventBus';

export function SystemLog() {
  // Accumulates events into an array
  const activities = createEventAccumulator('system:action', []);

  return (
    <For each={activities()}>
      {(activity) => <div>{activity.description}</div>}
    </For>
  );
}
```

#### Performance & Safety
- **Handler latency**: < 1ms for in-memory dispatch
- **Async throughput**: ≥ 10,000 events/s
- **Memory retention**: < 5 MB idle with automatic scope cleanup
- **Load/unload integrity**: 100% listener removal guaranteed

## 🎨 Theming

WebOS supports customizable themes:

```typescript
// Create a custom theme
const customTheme = {
  colors: {
    primary: '#4F46E5',
    secondary: '#7C3AED',
    // ... more colors
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    // ... more spacing
  }
};
```

## 🌍 Internationalization

Built-in i18n support:

```typescript
// Add translations
const translations = {
  en: {
    'welcome': 'Welcome',
    'file.opened': 'File {{name}} opened successfully',
    'app.loaded': 'Application {{name}} loaded'
  },
  es: {
    'welcome': 'Bienvenido',
    'file.opened': 'Archivo {{name}} abierto exitosamente',
    'app.loaded': 'Aplicación {{name}} cargada'
  }
};
```

## 🔧 Configuration

Dynamic configuration system allows runtime configuration changes:

```typescript
// Application configuration schema
const configSchema = {
  type: 'object',
  properties: {
    theme: { type: 'string', default: 'auto' },
    autoSave: { type: 'boolean', default: true },
    defaultPath: { type: 'string', default: '/home' }
  }
};
```

## 📊 Development

### Project Structure
- **Core**: Essential systems that power the operating system
- **Ports**: External integration points
- **Apps**: System applications
- **Plugins**: Third-party applications
- **Composables**: Reusable logic hooks

### Technology Stack
- **Frontend**: SolidJS + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Package Manager**: Bun
- **Architecture**: Microkernel + Feature-Sliced Design (FSD)
- **State Management**: Finite State Machine (FSM) System

### Development Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run serve

# Type checking
bun run type-check
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `bun test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [SolidJS](https://www.solidjs.com/) - Reactive UI library
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📞 Support

- 📧 Email: support@webos.com
- 💬 Discord: [Join our community](https://discord.gg/webos)
- 📖 Documentation: [docs.webos.com](https://docs.webos.com)

---

<div align="center">

**Built with ❤️ for the web platform**

[⭐ Star this repo](https://github.com/devmaaa/webos) | [🐛 Report Issues](https://github.com/devmaaa/webos/issues) | [💡 Request Features](https://github.com/devmaaa/webos/discussions)

</div>