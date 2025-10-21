⚙️ EventBus Architecture Specification

Version: 1.0
Subsystem: Core Messaging & Reactive Communication
System: DineApp OS (Solid.js + Microkernel Architecture)

🧭 Overview

DineApp OS uses a layered, deterministic EventBus system for all cross-component, plugin, and window communication.
It forms the messaging backbone for the entire OS, ensuring clean, decoupled, and reactive behavior between modules, stores, and UI components.

🧩 Architecture Layers
1. Core EventBus (Foundation)

Purpose: Centralized, type-safe message bus for inter-module communication.

Characteristics:

Deterministic and leak-free.

Scoped (plugin-level) event isolation.

Solid integration for lifecycle cleanup.

Extensible diagnostics and developer tooling.

No usage of WeakRef or FinalizationRegistry.

2. Composables Layer (Plugin SDK)

Provides ergonomic interfaces:

useEventBus() — lifecycle-aware listener.

useEmit() — emit helpers.

createEventSignal() / createEventAccumulator() — reactive wrappers.

3. Plugin / Window Layer

Plugins (POS, KDS, CRM, Inventory, Analytics, etc.) consume and emit domain-level events.

UI components subscribe through composables, ensuring automatic cleanup.

🧠 Core Responsibilities
Capability	Description
Event Registration	Register listeners with optional scope, priority, and “once” execution.
Emission	Async (emit) and synchronous (emitSync) dispatch.
Scope Isolation	Separate plugin contexts; auto cleanup via offAll(scope).
Lifecycle Management	Deterministic listener cleanup on component unmount or plugin unload.
Diagnostics	Provide visibility into active events, listener counts, and memory footprint.
🧭 Usage Strategy
1. Direct eventBus (System-Level)

Used by: Core modules, plugin bootstraps, data stores, background services.
Lifecycle: Managed manually.
Responsibilities:

Register global or background event handlers.

Emit events that persist beyond UI lifecycle.

Call offAll(scopeId) when plugin or service unloads.

2. useEventBus() (UI-Level)

Used by: Solid components, windows, interactive features.
Lifecycle: Automatically cleaned up via onCleanup().
Responsibilities:

Subscribe to transient, UI-related events (notifications, updates, etc.).

Avoid manual cleanup or global state retention.

Ideal for cross-component communication.

3. Signal Helpers (Reactive Layer)

Used by: Reactive UIs and dashboards.

createEventSignal(event, initial) — single reactive value updated on event.

createEventAccumulator(event, []) — reactive array accumulating multiple payloads.

🧱 Layer Responsibilities Summary
Layer	API	Managed by	Cleanup	Common Use
Core	eventBus	Microkernel / Services	Manual (offAll)	Bootstraps, stores, background sync
Composables	useEventBus() / useEmit()	Solid runtime	Automatic	UI components, windows
Reactive Helpers	createEventSignal() / createEventAccumulator()	Solid runtime	Automatic	Reactive dashboards, analytics
🧩 EventBus Usage DOs and DON'Ts
✅ DOs

Use useEventBus() inside components to benefit from automatic Solid lifecycle cleanup.

Use eventBus directly only in long-lived contexts (plugin init, background worker, store).

Always assign scope when registering plugin-level listeners.

Call eventBus.offAll(scopeId) during plugin unload or teardown.

Use emit() for async side effects and emitSync() for UI updates.

Use createEventSignal() or createEventAccumulator() when reactivity is required in UI.

Leverage diagnostic APIs (inspect(), getAllEvents()) in dev mode for introspection.

Follow consistent event naming (domain:action pattern).

❌ DON'Ts

Don’t use eventBus.on() directly in UI components — use useEventBus() instead.

Don’t rely on WeakRef or FinalizationRegistry for cleanup; Solid handles cleanup deterministically.

Don’t use emitSync() for async or blocking operations.

Don’t use ambiguous event names like "update" or "change" — always namespace them.

Don’t emit recursive or circular events (avoid A → B → A feedback loops).

Don’t share mutable objects across event payloads without cloning (to prevent state bleed).

🔐 Event Naming Conventions

Follow descriptive, namespaced naming using the domain:action convention.

Category	Examples
Window Events	window:opened, window:closed, window:minimized, window:focused
Order Events	order:created, order:updated, order:cancelled
User Events	user:logged-in, user:logged-out
System Events	plugin:loaded, plugin:unloaded, os:ready

Avoid generic events like update, delete, or save that lack context.

🧰 Integration with Stores and Windows

Stores can listen directly with eventBus.on() for background updates.

Windows subscribe via useEventBus() to respond to lifecycle changes.

The WindowManager emits standardized events (window:opened, window:minimized, etc.) for taskbar synchronization and analytics.

🧩 Performance and Reliability Targets
Metric	Target	Description
Handler latency	< 1 ms	In-memory dispatch
Async throughput	≥ 10,000 events/s	Concurrent Promise.all dispatch
Memory retention	< 5 MB idle	Automatic cleanup per plugin scope
Load/unload integrity	100%	No retained subscriptions after unload
🔬 Diagnostics & Observability

eventBus.inspect() → Returns total active events and handler counts.

eventBus.getListenerCount(event) → Returns listeners per event.

eventBus.getAllEvents() → Returns list of active event types.

Dev mode: Optional global event logging enabled through configuration.

🧪 Testing Strategy
Test Type	Description
Unit	Validate on/off/emit functionality and scope isolation.
Integration	Validate plugin load/unload lifecycle cleanup.
Stress	Simulate 10k+ events under load; ensure no leaks or duplicates.
DevTools	Visual diagnostics panel subscribed to "__diagnostics" events.
🧭 Summary

The DineApp OS EventBus is a core system-level communication layer that ensures:

Predictable, leak-free, and deterministic event flow.

Clean integration with Solid’s lifecycle system.

Clear separation between plugin logic, background services, and UI state.

Extensible diagnostics and tooling for developer visibility.

Golden Rule:
“In UI → useEventBus(); in core → eventBus; in analytics → signals.”