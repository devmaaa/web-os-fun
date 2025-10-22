⚙️ DineApp OS — Finite State Machine (FSM) Architecture Specification

Version: 1.0
Subsystem: Deterministic State Coordination
Applies To: Core + Plugins + UI Layers
Author: Principal Engineer (System Layer Design)
Status: Stable Draft
References:

architecture.md
— Core System Architecture

eventbus.md
— Messaging Layer Specification

window-manager-spec.md
— UI Windowing Behavior

plugin-system-spec.md
— Plugin Lifecycle & Manifest

🧭 1 · Purpose

Finite State Machines (FSMs) provide a deterministic mechanism for handling component and subsystem transitions within DineApp OS.
They eliminate ambiguous or overlapping states, prevent conflicting transitions, and allow for visual debugging, telemetry, and predictable behavior across the OS.

FSMs are used to control the lifecycle of windows, plugins, user sessions, network connections, and storage operations, ensuring that each subsystem’s state flow is explicit and recoverable.

🧠 2 · Rationale
Concern	Problem	FSM Benefit
Window Manager	Concurrent resize/maximize causes UI conflict	Sequential transitions (normal → maximizing → maximized)
Plugin Lifecycle	Async load/unload races	Linear phase enforcement (loading → ready → active → unloading)
Network	Reconnect loops	Explicit retry cycles (connecting → connected → reconnecting → failed)
Storage	Concurrent reads/writes	Mutual exclusion (idle → reading → writing → done)
Auth	Stale tokens or partial sessions	Predictable authentication path (unauth → verifying → auth)
Usage Enforcement	Improper limit enforcement	Controlled monetization states (allowed → limited → blocked)
⚙️ 3 · Core FSM Implementation

All FSMs are built on a shared, lightweight core class.

// /core/fsm/fsm.ts
export class FSM<S extends string, E extends string> {
constructor(
private state: S,
private transitions: Record<S, Partial<Record<E, S>>>
) {}

getState(): S {
return this.state;
}

can(event: E): boolean {
return !!this.transitions[this.state]?.[event];
}

transition(event: E): S | null {
const next = this.transitions[this.state]?.[event];
if (next) this.state = next;
return next ?? null;
}
}


Key principles

Immutable transition tables → no hidden mutation.

Deterministic execution → one active state per FSM.

Strict transition validation → reject invalid paths.

EventBus integration for telemetry and inspection.

🧩 4 · FSM Subsystem Mapping
Subsystem	FSM States	Benefits	Integration File
🪟 Window Lifecycle	normal / maximizing / maximized / minimizing / minimized / closing / closed	Deterministic window behavior	window-fsm.ts
🔌 Plugin Lifecycle	discover / loading / ready / active / stopping / unloading	Safe startup and unload	plugin-service.ts
🖱️ User Interaction	idle / dragging / snapped	Accurate cursor state & snapping	window-interaction-fsm.ts
🖥️ OS Session	booting / ready / shutting_down / halted	Controlled startup & recovery	kernel-service.ts
🌐 Network / WebSocket	connecting / connected / reconnecting / disconnected / failed	Fault-tolerant streams	network-service.ts
💾 Storage	idle / reading / writing / error	Safe concurrency	storage-service.ts
🔐 Auth	unauthenticated / verifying / authenticated / expired	Predictable login flow	auth-service.ts
💸 Usage Enforcement	allowed / limited / blocked	Monetization integrity	usage-enforcement.ts
🪄 Animation (optional)	idle / playing / finished	Composable UI transitions	animation-fsm.ts
🔗 5 · EventBus Integration

Every FSM is observable through the global EventBus (described in eventbus.md
).

Event	Payload	Purpose
fsm:transition	{ id, from, to, event, timestamp }	Telemetry and analytics
fsm:error	{ id, from, event, error }	Invalid transition logging
fsm:inspected	{ id, state, transitions }	DevTools inspection
fsm:reset	{ id, state }	Forced state reset (used by kernel recovery)

Emit Rules

Use emitSync() for UI transitions.

Use emit() for background FSM events (network, storage, auth).

Each FSM is tagged with a unique scope ID for cleanup (fsm:{scopeId}).

🧰 6 · Developer Tooling
Tool	Function
/fsm-inspector	Visual UI to trace live FSM states and transitions. Connects to EventBus diagnostic stream.
fsm-trace.log	Optional console or file output for persistent state logs in dev mode.
createFSMInspector()	Utility for programmatic inspection and debugging.
Telemetry Stream (__diagnostics)	Collects fsm:transition and fsm:error events for analytics dashboards.
🧭 7 · Best Practices (Do & Don’t)
✅ DO	❌ DON’T
Define explicit transition maps for every FSM.	Use boolean flags (isMaximized, isDragging) to represent state.
Use EventBus to broadcast FSM transitions for diagnostics.	Trigger state changes via side effects without FSM.
Name states clearly and use verbs for events (e.g. maximize, close).	Allow two parallel FSMs to control the same resource.
Log invalid transitions (fsm:error) and recover gracefully.	Silently ignore invalid events.
Integrate FSM with rAF for UI animations.	Use blocking timers for animations.
Use a shared FSM core class for consistency.	Duplicate FSM logic inside plugins.
Clean up FSM listeners on plugin unload (eventBus.offAll(scope)).	Leave active FSM listeners running after unload.
🧩 8 · Testing & Diagnostics
Test Type	Goal	Example
Unit	Validate transition logic	expect(fsm.transition('maximize')).toBe('maximized')
Integration	Ensure subsystem FSM emits correct EventBus events	Window FSM → window:maximized event
Stress	Simulate 10k transitions under load	Measure < 1 ms latency per transition
Recovery	Validate state reset logic	fsm:reset → state returns to idle
Telemetry	Check FSM events in diagnostic stream	eventBus.inspect() shows all active FSMs
🧱 9 · Performance Targets
Metric	Target	Notes
Transition Latency	≤ 1 ms	Pure in-memory execution
Concurrent FSMs	≥ 100	Multiple windows & plugins
Memory Footprint	< 1 KB per FSM	Lightweight state tables
Diagnostics Overhead	< 2 %	When telemetry enabled
🧩 10 · Extensibility & Future Work

Declarative FSM Schemas — YAML/JSON state diagrams for LLM-assisted generation.

FSM Visualizer — Graph-based renderer integrated with /fsm-inspector.

State Recovery System — Snapshot and restore FSM graphs after crash.

Async FSMs — Support for Promises as transition resolvers.

Telemetry Integration — Per-state duration metrics for performance profiling.

🧭 11 · Summary
Goal	Achieved By
Deterministic System Behavior	FSM as first-class runtime primitive
Debuggable Transitions	EventBus telemetry + visual inspector
Safe Concurrency	Explicit state boundaries per subsystem
Extensible Architecture	Shared FSM core + schema-driven definitions
Developer Visibility	fsm:transition & fsm:error channels

Golden Rule
“In DineApp OS, every subsystem must exist in exactly one state at a time — and every transition must be observable.”