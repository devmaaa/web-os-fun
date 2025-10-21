📘 plugin-system-spec.md

Subsystem: Plugin Lifecycle & Manifest Architecture
Context: Microkernel Runtime

1. Purpose

Defines the plugin system contract between DineApp Core and all feature modules.
Each plugin is a self-contained micro-application that integrates through a manifest and the Event Bus.

2. Plugin Goals

Independence: Plugins build, deploy, and test in isolation.

Discoverability: Core auto-detects via manifest registry.

Extensibility: New industries (restaurant, retail, hotel) can be added as plugins.

Lifecycle Safety: Plugins clean up all listeners and windows on unload.

3. Lifecycle Phases
   Phase	Description	Responsible
   discover	Kernel finds manifest	Microkernel
   load	Import plugin bundle	PluginLoader
   init	Execute init() to register events/stores	Plugin
   start	Render main UI window(s)	WindowManager
   stop	Destroy windows / remove listeners	Plugin
   unload	Clear scope / free memory	Microkernel
4. Manifest Specification

File: manifest.json

Field	Type	Description
id	string	Unique plugin ID, e.g. @dineapp/pos
displayName	string	Human-readable name
version	string	Semantic version
entry	string	Path to plugin entry bundle
windows	array	Registered window definitions
permissions	array	Capabilities requested
dependencies	array	Optional list of required plugins
configSchema	string	Optional path to schema file
icon	string	Optional icon asset
5. Directory Structure
   plugins/{plugin-name}/
   ├── manifest.json
   ├── init.ts
   ├── app.tsx
   ├── entities/
   ├── features/
   ├── widgets/
   ├── pages/
   ├── stores/
   ├── composables/
   └── shared/


Each plugin adheres to FSD-like internal layering:
entities → features → widgets → pages → app.

6. Integration Contract
   Concern	Mechanism
   Communication	EventBus (eventBus, useEventBus)
   UI Windows	WindowManager API
   Storage	Core storage adapter (IndexedDB, sync)
   Auth & Permissions	Core SDK (auth.checkPermission)
   Configuration	Schema-driven JSON/YAML definitions
7. Plugin Developer Responsibilities

Declare plugin scope (e.g. @dineapp/pos).

Register all event handlers with that scope.

Unregister all listeners on unload.

Emit relevant domain events for state changes.

Provide at least one UI entrypoint (app.tsx).

Follow event naming conventions.

Avoid cross-plugin imports.

Use shared packages for utilities/UI.

8. Lifecycle Hooks
   Hook	Description
   onLoad()	Called when plugin bundle is imported.
   onInit()	Register handlers, stores, services.
   onStart()	Called when first window opens.
   onUnload()	Remove all listeners, cleanup memory.

Hooks are optional but strongly recommended.

9. Plugin DOs and DON’Ts
   ✅ DO

Use scoped naming: @dineapp/{plugin}.

Keep domain logic inside entities/features.

Expose a clean public interface via manifest.

Emit plugin:loaded and plugin:unloaded events.

❌ DON’T

Don’t modify global state directly.

Don’t import other plugin internals.

Don’t create listeners without scope.

Don’t rely on implicit cleanup.

10. Dependency & Compatibility Rules

Each plugin declares its version and dependencies.

Core validates semantic version compatibility on load.

Optional: Marketplace validation for third-party plugins.

11. Performance & Safety
    Metric	Target
    Plugin load time	< 300 ms
    Plugin unload cleanup	100 % listener removal
    Max memory per plugin	≤ 10 MB
    Concurrent windows	≥ 20
12. Testing Strategy

Unit: Manifest validation, lifecycle hook calls.

Integration: Multi-plugin startup/unload scenario.

Security: Permission sandboxing.

Performance: Memory profiling after repeated reloads.