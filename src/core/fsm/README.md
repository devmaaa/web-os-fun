# DineApp OS - Finite State Machine (FSM) System

This module provides deterministic state coordination for all DineApp OS subsystems through a lightweight, high-performance FSM implementation that integrates seamlessly with the EventBus.

## 🎯 Purpose

Finite State Machines eliminate ambiguous or overlapping states, prevent conflicting transitions, and enable visual debugging and telemetry across the OS. FSMs are used to control:

- **Window Lifecycle** - Sequential window transitions (normal → maximizing → maximized)
- **Plugin Lifecycle** - Safe plugin startup/unload (loading → ready → active → unloading)
- **Network Connections** - Reliable reconnection cycles (connecting → connected → reconnecting)
- **Storage Operations** - Safe concurrency control (idle → reading → writing → done)
- **Authentication** - Predictable auth flows (unauth → verifying → authenticated)
- **Usage Enforcement** - Controlled monetization states (allowed → limited → blocked)

## 🏗️ Architecture

### Core Components

- **`FSM`** - Core state machine class with immutable transition tables
- **`FSMRegistry`** - Global registry for managing multiple FSM instances
- **`EventBus Integration`** - All FSM transitions emit observable events
- **`Composables`** - SolidJS reactive hooks for UI integration
- **Developer Tools** - Inspector, profiler, and debugging utilities

### Key Features

- ✅ **Deterministic Execution** - One active state per FSM
- ✅ **Transition Validation** - Reject invalid transitions with errors
- ✅ **Event-Driven** - All transitions emit events for observability
- ✅ **Type Safety** - Full TypeScript support with generic constraints
- ✅ **Performance** - ≤ 1ms transition latency, ≥ 100 concurrent FSMs
- ✅ **Developer Tools** - Visual inspector and performance profiler

## 🚀 Quick Start

### Basic FSM Creation

```typescript
import { createFSM, registerFSM } from '@core/fsm';

// Define states and events
type State = 'idle' | 'loading' | 'success' | 'error';
type Event = 'start' | 'complete' | 'fail' | 'reset';

// Define transition table
const transitions = {
  idle: { start: 'loading' },
  loading: { complete: 'success', fail: 'error' },
  success: { reset: 'idle' },
  error: { reset: 'idle' }
};

// Create FSM
const fsm = createFSM('my-fsm', 'idle', transitions);
registerFSM(fsm);
```

### Using FSM in Components

```typescript
import { useFSMState } from '@core/fsm';

function MyComponent() {
  const { state, transition, can } = useFSMState(fsm);

  return (
    <div>
      <p>Current state: {state()}</p>
      <button onClick={() => transition('start')} disabled={!can('start')}>
        Start
      </button>
    </div>
  );
}
```

### Window Lifecycle FSM

```typescript
import { createWindow, getWindow } from '@core/fsm';

// Create window FSM
const windowFSM = createWindow('main-window', {
  title: 'Main Window',
  width: 800,
  height: 600
});

// Window operations
windowFSM.transition('open');      // closed → opening → normal
windowFSM.transition('minimize');  // normal → minimizing → minimized
windowFSM.transition('maximize');  // minimized → maximizing → maximized
windowFSM.transition('close');     // maximized → closing → closed
```

### Plugin Lifecycle FSM

```typescript
import { createPlugin, getPlugin } from '@core/fsm';

// Create plugin FSM
const pluginFSM = createPlugin('pos-plugin', {
  displayName: 'Point of Sale',
  version: '1.0.0'
});

// Plugin operations
await pluginFSM.transition('discover');  // unloaded → discovering
await pluginFSM.transition('load');     // discovering → loading
await pluginFSM.transition('init');     // loading → loaded
await pluginFSM.transition('start');    // loaded → active
```

## 📋 Predefined FSM Types

### Window Lifecycle

**States:** `closed` | `opening` | `normal` | `minimizing` | `minimized` | `maximizing` | `maximized` | `restoring` | `closing`

**Events:** `open` | `minimize` | `maximize` | `restore` | `close` | `focus` | `blur` | `resize_start` | `resize_end`

### Plugin Lifecycle

**States:** `unloaded` | `discovering` | `loading` | `loaded` | `initializing` | `ready` | `active` | `stopping` | `unloading` | `error`

**Events:** `discover` | `load` | `init` | `start` | `stop` | `unload` | `recover` | `error`

### Network States

**States:** `disconnected` | `connecting` | `connected` | `reconnecting` | `failed`

**Events:** `connect` | `disconnect` | `reconnect` | `error`

## 🎨 Reactive Integration

### FSM State Signals

```typescript
import { createFSMSignal } from '@core/fsm';

// Create reactive signal from FSM events
const [state, setState] = createFSMSignal('window:main', 'closed');

// Signal automatically updates when FSM state changes
createEffect(() => {
  console.log('Window state:', state());
});
```

### FSM Metrics

```typescript
import { createFSMMetricsSignal } from '@core/fsm';

// Track FSM performance metrics
const metrics = createFSMMetricsSignal('window:main');

createEffect(() => {
  console.log('Transition count:', metrics().transitionCount);
  console.log('Error count:', metrics().errorCount);
});
```

## 🔧 Developer Tools

### FSM Inspector

```typescript
import { fsmInspector } from '@core/fsm';

// Enable inspector (auto-enabled in development)
fsmInspector.enable();

// Get all FSMs
const allFSMs = fsmInspector.getFSMs();

// Get specific FSM
const windowFSM = fsmInspector.getFSM('window:main');

// Force transition (for debugging)
fsmInspector.forceTransition('window:main', 'maximize');

// Reset FSM
fsmInspector.resetFSM('window:main', 'closed');
```

### Browser DevTools

In development mode, FSM tools are available globally:

```javascript
// Browser console
window.fsmInspector.getFSMs()           // View all FSMs
window.fsmProfiler.getProfiles()       // Performance metrics
window.fsmDevUtils.printStats()         // Console statistics
window.fsmDevUtils.createTraceFile()    // Export trace data
```

### Visual FSM Graph

```typescript
import { fsmInspector } from '@core/fsm';

// Get transition graph for visualization
const graph = fsmInspector.getTransitionGraph('window:main');

// graph.nodes = [{ id: 'closed', label: 'Closed', state: 'current' }]
// graph.edges = [{ from: 'closed', to: 'opening', label: 'open' }]
```

## 📊 Event Integration

### FSM Events

All FSM transitions emit standardized events:

```typescript
// Transition event
eventBus.on('fsm:transition', (event) => {
  console.log(`${event.id}: ${event.from} → ${event.to} via ${event.event}`);
});

// Error event
eventBus.on('fsm:error', (event) => {
  console.error(`${event.id}: ${event.error} in state ${event.from}`);
});

// Registry events
eventBus.on('fsm:registered', (event) => {
  console.log(`FSM ${event.id} registered`);
});
```

### Legacy Compatibility

FSM integration maintains compatibility with existing event patterns:

```typescript
// Window FSM automatically emits legacy events
eventBus.on('window:maximized', (event) => {
  // Works with existing window event handlers
});

// Plugin FSM automatically emits legacy events
eventBus.on('plugin:loaded', (event) => {
  // Works with existing plugin event handlers
});
```

## 🚀 Performance

### Benchmarks

- **Transition Latency:** ≤ 1ms (in-memory execution)
- **Concurrent FSMs:** ≥ 100 (multiple windows + plugins)
- **Memory Footprint:** < 1KB per FSM
- **Diagnostics Overhead:** < 2% (when enabled)

### Optimization Tips

1. **Use `emitSync()`** for UI transitions to avoid frame drops
2. **Use `emit()`** for background FSM events (network, storage)
3. **Scope FSM events** with plugin IDs for cleanup
4. **Batch transitions** when possible to reduce overhead

## 🧪 Testing

### Unit Tests

```typescript
import { createFSM } from '@core/fsm';

test('valid transition', () => {
  const fsm = createFSM('test', 'idle', { idle: { start: 'active' } });
  expect(fsm.can('start')).toBe(true);
  expect(fsm.transition('start')).toBe('active');
});

test('invalid transition', () => {
  const fsm = createFSM('test', 'idle', { idle: { start: 'active' } });
  expect(fsm.can('stop')).toBe(false);
  expect(fsm.transition('stop')).toBe(null);
});
```

### Integration Tests

```typescript
test('FSM emits events', async () => {
  const fsm = createFSM('test', 'idle', { idle: { start: 'active' } });

  const events = [];
  eventBus.on('fsm:transition', (event) => events.push(event));

  fsm.transition('start');

  expect(events).toHaveLength(1);
  expect(events[0]).toMatchObject({
    id: 'test',
    from: 'idle',
    to: 'active',
    event: 'start'
  });
});
```

## 📚 Migration Guide

### From Manual State Management

**Before:**
```typescript
let windowState = 'closed';
let isMinimized = false;

function openWindow() {
  if (windowState === 'closed') {
    windowState = 'normal';
    // Apply window logic
  }
}
```

**After:**
```typescript
const windowFSM = createWindow('main');

function openWindow() {
  if (windowFSM.can('open')) {
    windowFSM.transition('open');
    // FSM handles state and events automatically
  }
}
```

### Benefits

- ✅ **State Safety** - Impossible to have invalid states
- ✅ **Transition Logging** - All changes are observable
- ✅ **Error Recovery** - Built-in error states and recovery
- ✅ **Performance** - Optimized state transitions
- ✅ **Developer Experience** - Rich debugging and profiling

## 🔮 Advanced Usage

### Custom FSM with Context

```typescript
const customFSM = createFSM('custom', 'initial', {
  initial: { start: 'processing' },
  processing: { complete: 'done', error: 'failed' },
  done: { reset: 'initial' },
  failed: { reset: 'initial' }
}, {
  context: { retryCount: 0, data: null },
  metadata: { type: 'data-processor' }
});

// Update context
customFSM.updateContext({ retryCount: customFSM.getContext().retryCount + 1 });
```

### FSM with Effects

```typescript
const fsm = createFSM('effects', 'idle', {
  idle: { start: 'active' },
  active: { stop: 'idle' }
}, {
  effects: {
    start: (from, to) => {
      console.log(`Started: ${from} → ${to}`);
      // Start background process
    },
    stop: (from, to) => {
      console.log(`Stopped: ${from} → ${to}`);
      // Stop background process
    }
  }
});
```

### FSM Validation

```typescript
import { FSMDevUtils } from '@core/fsm';

// Validate FSM configuration
const validation = FSMDevUtils.validateFSM('window:main');
if (!validation.valid) {
  console.warn('FSM issues:', validation.issues);
}

// Check for unreachable states, dead ends, etc.
```

## 🎯 Best Practices

### ✅ DO

- Define explicit transition tables for every FSM
- Use EventBus to broadcast FSM transitions for diagnostics
- Name states clearly and use verbs for events (e.g., `maximize`, `close`)
- Integrate FSM with RAF for UI animations
- Use shared FSM core class for consistency
- Clean up FSM listeners on plugin unload

### ❌ DON'T

- Use boolean flags (`isMaximized`, `isDragging`) to represent state
- Trigger state changes via side effects without FSM
- Allow two parallel FSMs to control the same resource
- Silently ignore invalid events
- Use blocking timers for animations
- Leave active FSM listeners running after unload

## 🏁 Summary

The FSM system provides:

- **Deterministic Behavior** - FSM as first-class runtime primitive
- **Debuggable Transitions** - EventBus telemetry + visual inspector
- **Safe Concurrency** - Explicit state boundaries per subsystem
- **Extensible Architecture** - Shared FSM core + schema-driven definitions
- **Developer Visibility** - Complete observability and tooling

**Golden Rule:** *In DineApp OS, every subsystem must exist in exactly one state at a time — and every transition must be observable.*