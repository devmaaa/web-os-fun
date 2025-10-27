📘 application-system-spec.md

Subsystem: Application Lifecycle & Manifest Architecture
Context: Microkernel Runtime

1. Purpose

Defines the application system contract between WebOS Core and all application modules.
Each application is a self-contained micro-application that integrates through a manifest and the Event Bus.

2. Application Goals

Independence: Applications build, deploy, and test in isolation.

Discoverability: Core auto-detects via manifest registry.

Extensibility: New applications (system tools, user apps, utilities) can be added as applications.

Lifecycle Safety: Applications clean up all listeners and windows on unload.

3. Lifecycle Phases
   Phase	Description	Responsible
   discover	Kernel finds manifest	Microkernel
   load	Import application bundle	ApplicationLoader
   init	Execute init() to register events/stores	Application
   start	Render main UI window(s)	WindowManager
   stop	Destroy windows / remove listeners	Application
   unload	Clear scope / free memory	Microkernel
4. Manifest Specification

File: manifest.json

Field	Type	Description
id	string	Unique application ID, e.g. @webos/file-manager
displayName	string	Human-readable name
version	string	Semantic version
entry	string	Path to application entry bundle
windows	array	Registered window definitions
permissions	array	Capabilities requested
dependencies	array	Optional list of required applications
configSchema	string	Optional path to schema file
icon	string	Optional icon asset
5. Directory Structure
   apps/{app-name}/
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


Each application adheres to FSD-like internal layering:
entities → features → widgets → pages → app.

6. Integration Contract
   Concern	Mechanism
   Communication	EventBus (eventBus, useEventBus)
   UI Windows	WindowManager API
   Storage	Core storage adapter (IndexedDB, sync)
   Auth & Permissions	Core SDK (auth.checkPermission)
   Configuration	Schema-driven JSON/YAML definitions
7. Application Developer Responsibilities

Declare application scope (e.g. @webos/file-manager).

Register all event handlers with that scope.

Unregister all listeners on unload.

Emit relevant domain events for state changes.

Provide at least one UI entrypoint (app.tsx).

Follow event naming conventions.

Avoid cross-application imports.

Use shared packages for utilities/UI.

8. Lifecycle Hooks
   Hook	Description
   onLoad()	Called when application bundle is imported.
   onInit()	Register handlers, stores, services.
   onStart()	Called when first window opens.
   onUnload()	Remove all listeners, cleanup memory.

Hooks are optional but strongly recommended.

9. Application DOs and DON'Ts
   ✅ DO

Use scoped naming: @webos/{app}.

Keep domain logic inside entities/features.

Expose a clean public interface via manifest.

Emit app:loaded and app:unloaded events.

❌ DON'T

Don't modify global state directly.

Don't import other application internals.

Don't create listeners without scope.

Don't rely on implicit cleanup.

10. Dependency & Compatibility Rules

Each application declares its version and dependencies.

Core validates semantic version compatibility on load.

Optional: Marketplace validation for third-party applications.

11. Performance & Safety
    Metric	Target
    Application load time	< 300 ms
    Application unload cleanup	100 % listener removal
    Max memory per application	≤ 10 MB
    Concurrent windows	≥ 20
12. Testing Strategy

Unit: Manifest validation, lifecycle hook calls.

Integration: Multi-application startup/unload scenario.

Security: Permission sandboxing.

Performance: Memory profiling after repeated reloads.