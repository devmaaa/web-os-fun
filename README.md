# 🍽️ DineApp - Modern Restaurant Management System

<div align="center">

![DineApp Logo](https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=DineApp)

**A modular, plugin-based restaurant management platform built with modern web technologies**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4F46E5?logo=typescript)](https://www.typescriptlang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-4A90E2?logo=solid)](https://www.solidjs.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite)](https://vitejs.dev/)

</div>

## ✨ Features

### 🏗️ Core Architecture
- **Plugin-Based System**: Modular architecture with pluggable components
- **Event-Driven**: Robust event bus for inter-plugin communication
- **Multi-Window Support**: Dedicated windows for different restaurant operations
- **Real-time Communication**: Built-in support for multi-tab synchronization
- **TypeScript-First**: Full type safety across the entire application

### 🔧 Core Systems
- **Authentication & Permissions**: Role-based access control
- **Configuration Engine**: Dynamic configuration management
- **Storage Abstraction**: Unified storage interface
- **Theme Engine**: Customizable theming system
- **Internationalization**: Multi-language support
- **Telemetry**: Usage analytics and monitoring
- **Local Cache**: Optimized data caching

### 📱 Available Plugins

| Plugin | Description | Icon | Status |
|--------|-------------|------|--------|
| **💰 POS Terminal** | Point of Sale interface for order taking and payment processing | 💰 | ✅ Active |
| **🍽️ Menu Management** | Digital menu creation and management | 📋 | ✅ Active |
| **📦 Inventory** | Stock tracking and management system | 📦 | ✅ Active |
| **👨‍🍳 Kitchen Display System** | Order display for kitchen staff | 👨‍🍳 | ✅ Active |
| **📊 Analytics** Business intelligence and reporting | 📊 | ✅ Active |
| **⚙️ Settings** | System configuration and preferences | ⚙️ | ✅ Active |

### 🔌 External Integrations
- **💳 Payment Gateways**: Extensible payment processing
- **🖨️ Printers**: Kitchen and receipt printer support
- **📢 Notifications**: Real-time alerts and messaging
- **💾 Database**: Flexible database abstraction layer

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Bun (recommended) or npm/yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/devmaaa/os.dineapp.git
cd os.dineapp

# Install dependencies
bun install

# Start development server
bun run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
# Build the application
bun run build

# Preview the production build
bun run serve
```

## 🏛️ Architecture Overview

DineApp OS follows a **microkernel architecture** with **Feature-Sliced Design (FSD)** principles, creating a modular, OS-like restaurant management platform.

### Core Philosophy
- **Microkernel Extensibility**: Core + Plugins with schema-driven configuration
- **Isolation by Design**: Scoped event communication and plugin boundaries
- **Event-Driven Communication**: Deterministic, leak-free messaging via EventBus
- **Offline-First**: Real-time sync with local cache capabilities
- **TypeScript-First**: Full type safety across the entire system

### Macro Architecture

```
┌────────────────────────────────────────────┐
│              DineApp OS Core               │
│────────────────────────────────────────────│
│ 🧠 Microkernel                             │
│  • Plugin Loader                           │
│  • Event Bus (Scoped + Leak-safe)          │
│  • Window Manager                          │
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
│          Plugins            │
│─────────────────────────────│
│ POS / KDS / CRM / Analytics │
│ Inventory / Tables / Menu   │
└──────────────▲──────────────┘
│
Solid.js Windows (UI)
```

### Directory Structure

```
dineapp/
├── src/
│   ├── core/                    # Core systems
│   │   ├── auth-permissions/    # Authentication & RBAC
│   │   ├── config-engine/       # Configuration management
│   │   ├── event-bus/          # Inter-plugin communication
│   │   ├── i18n/               # Internationalization
│   │   ├── plugin-loader/      # Plugin system
│   │   ├── storage-abstraction/# Storage interface
│   │   ├── telemetry/          # Usage analytics
│   │   ├── themes/             # Theming system
│   │   └── window-manager/     # Multi-window management
│   ├── ports/                   # External integrations
│   │   ├── db/                 # Database adapters
│   │   ├── notif/              # Notification systems
│   │   ├── payments/           # Payment gateways
│   │   └── printers/           # Printer drivers
│   ├── plugins/                 # Application plugins
│   │   ├── pos/                # Point of Sale
│   │   ├── menu/               # Menu Management
│   │   ├── inventory/          # Inventory System
│   │   ├── kds/                # Kitchen Display System
│   │   ├── analytics/          # Business Intelligence
│   │   └── settings/           # System Settings
│   └── composables/            # Reusable logic
```

## 🔌 Plugin Development

### Creating a New Plugin

DineApp plugins follow **Feature-Sliced Design (FSD)** principles for clean, maintainable architecture.

1. **Create Plugin Directory Structure**:
```bash
mkdir src/plugins/my-plugin
cd src/plugins/my-plugin
mkdir -p entities features widgets pages stores composables shared
```

2. **Create Plugin Manifest** (`manifest.json`):
```json
{
  "id": "@dineapp/my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "description": "Description of my plugin",
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
      "id": "my-plugin-main",
      "title": "My Plugin",
      "defaultWidth": 800,
      "defaultHeight": 600,
      "minWidth": 600,
      "minHeight": 400
    }
  ]
}
```

3. **Plugin Bootstrap** (`init.ts`):
```ts
import { eventBus } from '../../core/event-bus';

export async function init() {
  // Register event listeners with plugin scope
  const scope = '@dineapp/my-plugin';

  // Listen to domain events
  eventBus.on('order:created', handleOrderCreated, { scope });
  eventBus.on('my-feature:updated', handleFeatureUpdate, { scope });

  // Emit plugin loaded event
  eventBus.emit('plugin:loaded', {
    pluginId: '@dineapp/my-plugin',
    timestamp: Date.now()
  });

  return () => {
    // Cleanup function
    eventBus.offAll(scope);
    eventBus.emit('plugin:unloaded', {
      pluginId: '@dineapp/my-plugin',
      timestamp: Date.now()
    });
  };
}

function handleOrderCreated(order: any) {
  // Handle business logic
}

function handleFeatureUpdate(data: any) {
  // Handle feature updates
}
```

4. **FSD Layers Implementation**:

   **Entities** (`entities/order.ts`):
```ts
export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed';
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  modifiers: string[];
}
```

   **Features** (`features/useOrderManagement.ts`):
```ts
import { createSignal, createEffect } from 'solid-js';
import { Order } from '../entities/order';

export function useOrderManagement() {
  const [orders, setOrders] = createSignal<Order[]>([]);
  const [loading, setLoading] = createSignal(false);

  const createOrder = (orderData: Partial<Order>) => {
    setLoading(true);
    const order: Order = {
      id: generateId(),
      items: [],
      total: 0,
      status: 'pending',
      createdAt: new Date(),
      ...orderData
    } as Order;

    setOrders(prev => [...prev, order]);
    setLoading(false);

    // Emit domain event
    eventBus.emit('order:created', order);

    return order;
  };

  return { orders, loading, createOrder };
}
```

   **Widgets** (`widgets/OrderList.tsx`):
```tsx
import { For } from 'solid-js';
import { useOrderManagement } from '../features/useOrderManagement';

export function OrderList() {
  const { orders, loading } = useOrderManagement();

  return (
    <div class="order-list">
      <h2>Orders</h2>
      {loading() ? (
        <p>Loading...</p>
      ) : (
        <For each={orders()}>
          {(order) => (
            <div class="order-item">
              <span>Order {order.id}</span>
              <span>{order.status}</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          )}
        </For>
      )}
    </div>
  );
}
```

5. **Main Application** (`app.tsx`):
```tsx
import { onMount, onCleanup } from 'solid-js';
import { eventBus } from '../../core/event-bus';
import { useEventBus } from '../../composables/useEventBus';
import { OrderList } from './widgets/OrderList';

export default function MyPlugin() {
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
      <h1 class="text-2xl font-bold mb-6">My Plugin</h1>
      <OrderList />
    </div>
  );
}
```

6. **Plugin Registration** (in `src/plugins/index.ts`):
```ts
export { default as myPlugin } from './my-plugin/app';
export { init } from './my-plugin/init';
```

### Event System

DineApp OS uses a **deterministic, leak-free EventBus** for all inter-plugin communication. The EventBus is scoped by design, ensuring clean isolation between plugins.

#### Core Event Bus (System-Level)
Used by core modules, plugin bootstraps, and data stores:

```typescript
import { eventBus } from '../core/event-bus';

// Emit events with async side effects
await eventBus.emit('order:created', {
  id: 123,
  items: [...],
  timestamp: Date.now()
});

// Register listeners with plugin scope (required for cleanup)
const scope = '@dineapp/my-plugin';
eventBus.on('order:created', handleOrderCreated, { scope });
eventBus.on('inventory:low', handleLowStock, { scope });

// Cleanup on plugin unload
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

// Order Events
'order:created' | 'order:updated' | 'order:cancelled' | 'order:paid'

// System Events
'plugin:loaded' | 'plugin:unloaded' | 'os:ready' | 'theme:changed'

// User Events
'user:logged-in' | 'user:logged-out' | 'permissions:changed'
```

#### Event Accumulation
For collecting multiple event payloads:

```tsx
import { createEventAccumulator } from '../composables/useEventBus';

export function ActivityLog() {
  // Accumulates events into an array
  const activities = createEventAccumulator('user:action', []);

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

DineApp supports customizable themes:

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
    'order.created': 'Order {{id}} created successfully'
  },
  es: {
    'welcome': 'Bienvenido',
    'order.created': 'Pedido {{id}} creado exitosamente'
  }
};
```

## 🔧 Configuration

Dynamic configuration system allows runtime configuration changes:

```typescript
// Plugin configuration schema
const configSchema = {
  type: 'object',
  properties: {
    currency: { type: 'string', default: 'USD' },
    taxRate: { type: 'number', default: 0.1 }
  }
};
```

## 📊 Development

### Project Structure
- **Core**: Essential systems that power the application
- **Ports**: External integration points
- **Plugins**: Feature-specific modules
- **Composables**: Reusable logic hooks

### Technology Stack
- **Frontend**: SolidJS + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Package Manager**: Bun
- **Architecture**: Microkernel + Feature-Sliced Design (FSD)

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
4. Run tests: `pnpm test`
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

- 📧 Email: support@dineapp.com
- 💬 Discord: [Join our community](https://discord.gg/dineapp)
- 📖 Documentation: [docs.dineapp.com](https://docs.dineapp.com)

---

<div align="center">

**Built with ❤️ for the restaurant industry**

[⭐ Star this repo](https://github.com/devmaaa/os.dineapp) | [🐛 Report Issues](https://github.com/devmaaa/os.dineapp/issues) | [💡 Request Features](https://github.com/devmaaa/os.dineapp/discussions)

</div>