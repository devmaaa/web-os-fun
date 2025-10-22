# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
```bash
# Start development server (runs on port 3200)
bun run dev
# or
npm run dev

# Build for production
bun run build
# or
npm run build

# Preview production build
bun run serve
# or
npm run serve
```

### Package Management
This project uses **Bun** as the recommended package manager (lock file present: `bun.lock`). npm can be used as fallback.

## Architecture Overview

DineApp is a **web-based restaurant management OS** built with a **microkernel architecture** and **Feature-Sliced Design (FSD)** principles. It provides a desktop-like experience with draggable windows and a plugin system.

### Core Technologies
- **Frontend**: SolidJS + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Package Manager**: Bun (preferred)
- **Architecture**: Microkernel + Feature-Sliced Design (FSD)

### Key Architectural Patterns

#### 1. Event-Driven Architecture
- **Central Event Bus**: Located at `src/core/event-bus/index.ts`
- **Features**: Priority-based handling, scoped listeners, multi-tab support via BroadcastChannel
- **Usage**: All inter-plugin communication happens through events
- **Event Patterns**: `plugin:loaded`, `window:opened`, `order:created`, etc.

#### 2. Finite State Machine (FSM) System
- **Core FSM**: Located at `src/core/fsm/`
- **Purpose**: Deterministic state coordination for all subsystems
- **Features**: Window lifecycle, plugin lifecycle, network states, storage operations
- **Benefits**: Prevents conflicting transitions, enables visual debugging, provides telemetry
- **Usage**: Use `createWindow()` for windows, `createPlugin()` for plugins, `createFSM()` for custom FSMs

#### 3. Plugin System
- **Plugin Loader**: `src/core/plugin-loader/index.ts`
- **Lifecycle**: `unloaded` → `discovering` → `loading` → `ready` → `active` → `unloading` (FSM-managed)
- **Isolation**: Plugins use scoped event listeners for clean separation
- **Structure**: Each plugin follows FSD layering with manifest.json

#### 4. Window Management System
- **Desktop Interface**: Advanced window manager at `src/core/window-manager/`
- **Features**: Minimize, maximize, resize, drag, snap-to-screen, z-index management
- **FSM Integration**: Window lifecycle managed by `windowFSMManager`
- **Performance**: One SolidJS store per window with RAF-batched updates

### Directory Structure

```
src/
├── core/                    # Core systems (microkernel)
│   ├── event-bus/          # Central event communication
│   ├── fsm/                # Finite State Machine system
│   ├── plugin-loader/      # Plugin system management
│   ├── window-manager/     # Multi-window desktop environment
│   ├── auth-permissions/   # Authentication & RBAC
│   ├── config-engine/      # Configuration management
│   ├── storage-abstraction/# Storage interface
│   ├── themes/             # Theming system
│   ├── i18n/               # Internationalization
│   └── telemetry/          # Usage analytics
├── apps/                   # Root applications
│   └── os-shell/           # Main desktop environment
├── plugins/                # Feature modules (FSD micro-apps)
│   ├── pos/                # Point of Sale
│   ├── kds/                # Kitchen Display System
│   ├── inventory/          # Inventory management
│   ├── analytics/          # Business intelligence
│   ├── menu/               # Menu management
│   └── settings/           # System settings
├── ports/                  # External integrations (adapters)
│   ├── db/                 # Database adapters
│   ├── payments/           # Payment gateways
│   ├── printers/           # Printer drivers
│   └── notif/              # Notification systems
├── composables/            # Reactive SolidJS utilities
├── ui/                     # Shared component library
└── types/                  # TypeScript definitions
```

## Path Aliases

The project uses extensive path mapping for clean imports:

```typescript
// Core systems
@core/event-bus
@core/fsm
@core/window-manager
@core/plugin-loader

// Plugins
@plugins/pos
@plugins/kds
@plugins/analytics

// External integrations
@ports/payments
@ports/database
@ports/printers

// Shared utilities
@composables
@utils
@types
@ui
```

## Plugin Development

### Creating a New Plugin

1. **Directory Structure**:
```bash
src/plugins/my-plugin/
├── manifest.json           # Plugin metadata
├── init.ts                # Bootstrap logic
├── app.tsx                # Main UI component
├── entities/              # Business entities
├── features/              # Business logic
├── widgets/               # UI components
├── pages/                 # Page components
└── stores/                # State management
```

2. **Manifest.json**:
```json
{
  "id": "@dineapp/my-plugin",
  "displayName": "My Plugin",
  "version": "1.0.0",
  "entry": "./app.tsx",
  "permissions": ["my-feature.read", "my-feature.create"],
  "windows": [{
    "id": "my-plugin-main",
    "title": "My Plugin",
    "defaultWidth": 800,
    "defaultHeight": 600
  }]
}
```

3. **Plugin Bootstrap** (init.ts):
```typescript
import { eventBus } from '../../core/event-bus';

const scope = '@dineapp/my-plugin';

export async function init() {
  // Register scoped event listeners
  eventBus.on('order:created', handleOrderCreated, { scope });

  // Emit plugin loaded event
  eventBus.emit('plugin:loaded', {
    pluginId: '@dineapp/my-plugin',
    timestamp: Date.now()
  });

  return () => {
    // Cleanup function
    eventBus.offAll(scope);
  };
}
```

### Event System Usage

#### Core Event Bus (System Level)
```typescript
import { eventBus } from '@core/event-bus';

// Emit events
await eventBus.emit('order:created', orderData);

// Register scoped listeners
eventBus.on('order:created', handler, { scope: '@dineapp/my-plugin'});

// Cleanup
eventBus.offAll('@dineapp/my-plugin');
```

#### UI Event Bus (Composables)
```typescript
import { useEventBus, createEventSignal } from '@composables/useEventBus';

export function MyComponent() {
  const events = useEventBus();

  // Reactive signal from events
  const orderCount = createEventSignal('order:created', 0);

  onMount(() => {
    // Auto-cleanup on unmount
    const unsubscribe = events.on('window:focused', handler);
    return unsubscribe;
  });
}
```

### Event Naming Conventions
- **Window Events**: `window:opened`, `window:closed`, `window:focused`
- **Plugin Events**: `plugin:loaded`, `plugin:unloaded`
- **Domain Events**: `order:created`, `inventory:low`, `user:logged-in`
- **System Events**: `theme:changed`, `os:ready`
- **FSM Events**: `fsm:transition`, `fsm:error`, `fsm:reset`, `fsm:registered`

## Finite State Machine (FSM) Usage

The FSM system provides deterministic state management for all subsystems. All FSMs integrate with the EventBus for observability.

### Creating Custom FSMs

```typescript
import { createFSM, registerFSM } from '@core/fsm';

// Define states and events
type State = 'idle' | 'processing' | 'success' | 'error';
type Event = 'start' | 'complete' | 'fail' | 'reset';

// Define transition table
const transitions = {
  idle: { start: 'processing' },
  processing: { complete: 'success', fail: 'error' },
  success: { reset: 'idle' },
  error: { reset: 'idle' }
};

// Create and register FSM
const fsm = createFSM('my-process', 'idle', transitions, {
  context: { attempts: 0 },
  metadata: { type: 'data-processor' }
});
registerFSM(fsm);
```

### Using FSMs in Components

```typescript
import { useFSMState } from '@core/fsm';

function MyComponent() {
  const { state, transition, can, lastError } = useFSMState(fsm);

  return (
    <div>
      <p>State: {state()}</p>
      <button onClick={() => transition('start')} disabled={!can('start')}>
        Start
      </button>
      {lastError() && <p>Error: {lastError()!.error}</p>}
    </div>
  );
}
```

### Window FSM Integration

```typescript
import { createWindow } from '@core/fsm';

// Create window with FSM
const windowFSM = createWindow('main-window', {
  title: 'My Window',
  width: 800,
  height: 600
});

// Window operations (FSM ensures valid transitions)
windowFSM.transition('open');    // closed → opening → normal
windowFSM.transition('minimize'); // normal → minimizing → minimized
windowFSM.transition('maximize'); // minimized → maximizing → maximized
windowFSM.transition('close');   // maximized → closing → closed

// Check state
if (windowFSM.can('close')) {
  windowFSM.transition('close');
}
```

### Plugin FSM Integration

```typescript
import { createPlugin } from '@core/fsm';

// Create plugin with FSM
const pluginFSM = createPlugin('my-plugin', {
  displayName: 'My Plugin',
  version: '1.0.0'
});

// Plugin lifecycle operations
await pluginFSM.transition('discover');  // unloaded → discovering
await pluginFSM.transition('load');     // discovering → loading
await pluginFSM.transition('init');     // loading → loaded
await pluginFSM.transition('start');    // loaded → active
```

### FSM Events and Debugging

```typescript
import { eventBus } from '@core/event-bus';

// Listen to all FSM transitions
eventBus.on('fsm:transition', (event) => {
  console.log(`${event.id}: ${event.from} → ${event.to} via ${event.event}`);
});

// Listen to FSM errors
eventBus.on('fsm:error', (event) => {
  console.error(`${event.id}: ${event.error} in state ${event.from}`);
});

// Development tools (auto-enabled in dev)
console.log('FSM Inspector:', window.fsmInspector);
console.log('FSM Profiler:', window.fsmProfiler);
console.log('FSM Utils:', window.fsmDevUtils);
```

## Development Guidelines

### DO ✅
- Use scoped event listeners with plugin ID
- Follow FSD layering within plugins
- Emit domain events for state changes
- Use `createScopedEventBus(pluginId)` for plugin isolation
- Clean up all listeners on plugin unload
- Follow existing event naming patterns
- Use FSM for all stateful subsystems (windows, plugins, network, storage)
- Define explicit transition tables for every FSM
- Use `useFSMState()` for reactive FSM state in components
- Register FSMs with the global registry for observability
- Log FSM transitions for debugging and telemetry

### DON'T ❌
- Import other plugin internals directly
- Create event listeners without scope
- Modify global state directly
- Rely on implicit cleanup
- Cross-plugin imports (use shared packages instead)
- Use boolean flags (`isMaximized`, `isLoading`) instead of FSM states
- Allow invalid state transitions - FSM should prevent them
- Skip FSM registration - it breaks diagnostics and recovery
- Use FSM for simple boolean states that don't need transitions
- Create multiple FSMs that control the same resource

## Performance Targets
- **Plugin load time**: < 300ms
- **Event handler latency**: < 1ms
- **FSM transition latency**: ≤ 1ms
- **Max memory per plugin**: ≤ 10MB
- **Concurrent windows**: ≥ 20
- **Concurrent FSMs**: ≥ 100
- **FSM memory footprint**: < 1KB per FSM
- **Plugin cleanup**: 100% listener removal
- **FSM diagnostics overhead**: < 2%

## Testing Strategy
The `spec/` directory contains architecture specifications:
- `spec/plugin-system-spec.md` - Plugin lifecycle and manifest requirements
- `spec/init.md` - Initial concept and goals
- `spec/core/` - Core system specifications

## External Integrations (Ports)
The system uses a ports/adapters pattern for external services:
- **Database**: Abstract adapter interface at `@ports/database`
- **Payments**: Payment gateway adapters at `@ports/payments`
- **Printers**: Print driver interfaces at `@ports/printers`
- **Notifications**: Notification systems at `@ports/notif`

## Key Files to Understand
- `src/core/event-bus/index.ts` - Central event system
- `src/core/plugin-loader/index.ts` - Plugin lifecycle management
- `src/core/window-manager/` - Desktop window system
- `src/apps/os-shell/` - Main desktop environment
- `src/plugins/index.ts` - Plugin registry
- `src/composables/useEventBus.ts` - Reactive event utilities