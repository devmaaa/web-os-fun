Perfect — you're asking for what's essentially the canonical architecture specification for your entire system —
a foundational LLM Context Spec File that defines how WebOS is structured, how applications are architected, and how every part of the ecosystem interacts.

Below is your production-grade spec file written in clear, declarative format — it can be used both for onboarding engineers and as a reference for AI-assisted development (LLM-driven design).

🏗️ WebOS — System Architecture Specification

Version: 1.0
Document Type: Architecture Specification (LLM Context)
System: WebOS
Primary Stack: Solid.js + Vite + TypeScript
Core Paradigm: Microkernel Architecture (Core + Apps + Schema-driven Config + Event Bus + FSM)
Status: Stable Draft
Audience: LLMs, Core Engineers, Application Developers, QA

🧭 1. High-Level Philosophy

WebOS is designed as a complete, modular, OS-like web platform for general-purpose computing.
The architecture emphasizes:

Microkernel extensibility (Core + Apps)

Isolation by design

Schema-driven configuration

Event-driven communication

Finite State Machine coordination

Offline-first, real-time sync

The goal is to allow any application (e.g., File Manager, Text Editor, Browser) to be built, loaded, or replaced independently —
while sharing a consistent UI, communication, and data contract layer.

🧩 2. Macro Architecture Overview
┌────────────────────────────────────────────┐
│                WebOS Core                 │
│────────────────────────────────────────────│
│ 🧠 Microkernel                             │
│  • Application Loader                      │
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
│ Terminal / Settings        │
│ System Apps / User Apps    │
└──────────────▲──────────────┘
│
Solid.js Windows (UI)

🧱 3. Core Subsystems
Subsystem	Description
Microkernel	Minimal runtime responsible for loading, starting, and stopping applications.
Event Bus	Global message backbone connecting all modules. Leak-free, scoped per application.
Window Manager	Handles window-based multitasking (open, minimize, maximize, close).
Finite State Machine (FSM) System	Deterministic state coordination for all subsystems (windows, applications, storage, auth).
State Manager	Lightweight layer for shared state between applications (optional).
Config Engine	Loads schema-driven configurations defining entities, workflows, permissions.
Theme Engine	Provides global theming, dark/light modes, and per-application overrides.
Storage Engine	Abstracted persistence layer with offline cache and real-time sync.
🔌 4. Application Architecture (FSD-Driven Micro-App Model)

Each application is a self-contained micro-application following Feature-Sliced Design (FSD) principles.

4.1 Directory Structure
apps/
├── file-manager/
│    ├── app.tsx              # App UI entrypoint
│    ├── manifest.json        # App manifest (id, name, permissions)
│    ├── init.ts              # App bootstrap/init logic
│    ├── entities/            # Core business entities (File, Folder, FileSystem)
│    ├── features/            # Isolated feature logic (FileOperations, Navigation)
│    ├── pages/               # Composed UI screens
│    ├── widgets/             # UI components used across features
│    ├── stores/              # Solid stores (local app state)
│    ├── composables/         # App-specific composables (hooks)
│    ├── shared/              # Constants, utils, common assets
│    └── index.ts             # App registration/export

4.2 Internal FSD Rules
Layer	Responsibility	Example
entities/	Domain logic, pure business rules	entities/file.ts
features/	Small reusable units of behavior	features/useFileOperations.ts
widgets/	UI elements combining multiple features	widgets/FileList.tsx
pages/	High-level UI composition	pages/FileManager.tsx
stores/	State + event subscriptions	stores/fileStore.ts
shared/	Utilities, constants, types	shared/formatFileSize.ts

Rule:

UI imports only from widgets/, features/, or entities/.
Features may depend on entities, but not vice versa.
Shared code is importable by all layers.

🧠 5. Application Lifecycle
Phase	Description	Trigger
Load	Microkernel discovers and imports app manifest	System boot or on-demand
Init	Calls app.init() to register events and windows	After dependencies resolve
Start	UI window(s) instantiated by Window Manager	User interaction
Stop	Listeners and windows destroyed	App unload or user disable
Unload	Memory cleared, scope removed	Manual unload or crash recovery

Each application must implement:

manifest.json (metadata, version, permissions)

init.ts (register events, initialize stores)

offAll(scopeId) on unload

At least one renderable entrypoint (app.tsx)

🧭 6. Communication Layer (Event Bus)

The Event Bus is the backbone of all inter-module communication.

Type	Purpose
eventBus	Core API for long-lived logic (stores, services)
useEventBus()	UI-safe composable (auto cleanup)
createEventSignal()	Reactive signal tied to event
createEventAccumulator()	Reactive array for event streams
Event Rules

Always register listeners with a scope (e.g. @webos/file-manager).

Always clean up with eventBus.offAll(scope) on unload.

Use useEventBus() in UI components only.

Use eventBus directly in stores or app init.

Event names follow domain:action convention (file:created, window:focused).

No direct application-to-application imports — only communicate through events.

🧩 7. Core vs Application Boundaries
Direction	Allowed	Mechanism
App → Core	✅	Via SDK imports (import { eventBus, windowManager } from '@core')
App → Shared	✅	Via @shared/* modules
App → App	❌	Use EventBus
Core → App	❌	Applications self-register via manifest
🧠 8. Configuration Engine

All domain-specific data is schema-driven, enabling no-code customization.

Entities, fields, workflows, and permissions defined via JSON/YAML schema.

The schema defines:

Field types and validations.

UI behavior (forms, lists, dashboards).

Workflow states and transitions.

This enables the same core engine to support different use cases with different schemas.

🎨 9. UI & Window System

The OS Shell (in apps/os-shell/) manages window instances using Solid’s fine-grained reactivity.

Window Event	Description
window:opened	Window created
window:closed	Window destroyed
window:focused	Window activated
window:minimized	Window minimized
window:maximized	Window maximized
window:restored	Window restored

Plugins open new windows by calling:

windowManager.openWindow(pluginId, component, options)

📁 10. Directory Structure (Monorepo Layout)
dineapp/
├── apps/
│   └── os-shell/             # Desktop environment / root app
├── core/
│   ├── event-bus/            # Core messaging system
│   ├── window-manager/       # OS windowing layer
│   ├── fsm/                 # Finite State Machine system (deterministic state coordination)
│   ├── plugin-loader/        # Dynamic plugin lifecycle
│   ├── config-engine/        # Schema-driven config engine
│   ├── auth/                 # User authentication / permissions
│   └── theme-engine/         # System theming layer
├── packages/
│   ├── ui/                   # Shared UI components
│   ├── sdk/                  # Plugin SDK for developers
│   ├── storage/              # IndexedDB + sync adapters
│   └── types/                # Global TypeScript types
├── apps/                     # System applications
│   ├── file-manager/
│   ├── text-editor/
│   ├── media-player/
│   ├── browser/
│   └── settings/
├── plugins/                  # Third-party applications
│   └── [user-apps]/
└── infra/
├── backend/              # REST / WebSocket backend services
└── deploy/               # Build & deployment configs

🧩 11. Application Development Guidelines
✅ DOs

Follow FSD internal boundaries (entities → features → widgets → pages).

Register all event listeners with application scope (@webos/{app}).

Emit events for all domain actions (e.g. file:created, window:opened).

Keep business logic inside entities/features, not UI.

Use composables for integration with Solid lifecycle.

Clean up with eventBus.offAll(scope) in onUnload().

Declare application capabilities in manifest.json.

Use shared packages (@ui, @sdk, @types) for consistency.

Use FSM for application lifecycle management (import { createApp } from '@core/fsm').

Listen to FSM events for debugging (fsm:transition, fsm:error) with application scope.

❌ DON’Ts

Don't import other application code directly.

Don’t mutate global shared state directly — communicate via events.

Don’t rely on localStorage/sessionStorage manually; use storage adapter.

Don’t use weak references or implicit GC behavior for cleanup.

Don’t duplicate UI logic that exists in shared packages.

Don’t bypass manifest-based registration.

🧠 12. LLM Context Rules (for Spec-Driven Development)

For all LLM-based code generation or reasoning:

Treat this file as the system contract — do not invent new architecture layers.

Always assume microkernel boundaries — Core ↔ Plugin communication via SDK/EventBus only.

Prefer Solid.js reactivity (createSignal, useEventBus) for all UI logic.

Respect FSD inside plugins — entities → features → widgets → pages.

Use scoped naming (@dineapp/{plugin}) for all plugin identifiers.

Always generate manifest.json for new plugins.

Never assume cross-plugin imports.

Use schema-driven configuration for domain entities, not hardcoded logic.

All events must follow domain:action naming convention.

Prefer async emit() for side effects, emitSync() for reactive UI updates.

Plugin teardown must always call eventBus.offAll(scope).

Use FSM for state management in complex subsystems (windows, plugins, storage, auth).

Assume FSM integration is native to core systems - don't create parallel state management.

Follow fsm-architecture-spec.md for deterministic state coordination patterns.

🧩 13. Example Plugin Life Cycle (Non-code Summary)

Manifest Discovered → Microkernel identifies plugin.

Init Phase → Plugin registers handlers with scope.

UI Ready → WindowManager spawns main window.

Runtime → Events emitted; data flows through EventBus.

Unload → Plugin listeners cleared, windows closed, scope freed.

📈 14. Future Extensibility

Plugin marketplace with versioned API contracts.

Cross-process event replication (WebSocket Gateway).

Analytics and Telemetry events (__diagnostics channel).

Typed event schema registry for safe plugin interactions.

Configuration versioning and live reload.

🧭 15. Summary
Goal	Achieved By
Extensibility	Microkernel + Plugin manifest system
Decoupling	EventBus (scoped communication)
Scalability	Schema-driven configuration
Reactivity	Solid.js fine-grained signals
Maintainability	FSD-based plugin boundaries
Stability	Deterministic cleanup + scope isolation
Developer Experience	SDK + typed APIs + composables

📍 Specification Location
/specs/architecture/architecture.md

📘 Reference Specs

event-bus-spec.md — Messaging layer specification

plugin-system-spec.md — Plugin lifecycle and manifest structure

window-manager-spec.md — OS UI and windowing behavior

fsm-architecture-spec.md — Finite State Machine system specification