📘 window-manager-spec.md

Subsystem: OS UI Layer
Context: Desktop-style environment for WebOS

1. Purpose

The Window Manager provides the desktop environment abstraction within WebOS.
It manages all visual windows, their states, focus, z-order, and lifecycle events.

2. Core Responsibilities
   Responsibility	Description
   Window Lifecycle	Create, render, minimize, maximize, close windows.
   State Tracking	Maintain list of open, focused, minimized windows.
   Event Emission	Emit lifecycle events (window:opened, window:closed, etc.).
   Taskbar Integration	Expose minimized windows to taskbar.
   Multi-Window Management	Support concurrent application windows.
   Theme & Layout Integration	Respond to theme engine changes and layout config.
3. Window States

opened, minimized, maximized, restored, closed, focused, unfocused.

State transitions are deterministic and observable through the EventBus.

4. Responsibilities per Layer
   Layer	Responsibility
   Core	Manage z-index, stacking order, drag/resize.
   Plugin	Provide window content component and metadata.
   UI	Render chrome (titlebar, controls, etc.) via shared UI package.
5. Event Lifecycle
   Event	Trigger
   window:opened	New window instantiated
   window:closed	Window destroyed
   window:minimized	User minimized or auto-minimize
   window:maximized	Fullscreen toggle
   window:restored	From minimized/maximized
   window:focused	Gained focus
   window:blurred	Lost focus
   window:resized	Dimension change

All events emitted through eventBus.emitSync() for immediate UI updates.

6. Data Model

Each window has a descriptor:

Field	Description
id	Unique runtime ID
appId	Source application
title	Display name
state	Current state
zIndex	Render order
component	Solid component reference
props	Initial props
createdAt	Timestamp
7. Window Creation Flow

Application calls windowManager.openWindow(appId, component, options).

Core instantiates window descriptor.

Emits window:opened event.

Solid renders component in window shell.

User actions (minimize/maximize/close) trigger new events.

On destroy → window:closed emitted → memory released.

8. Theming & Responsiveness

Theme engine injects CSS variables per theme.

Windows can subscribe to theme:changed event.

Layout responds to breakpoints for tablet/desktop usage.

9. Developer Guidelines
   ✅ DO

Use the shared UI components for chrome and controls.

Subscribe to window events via useEventBus().

Maintain minimal logic inside window shell.

Unsubscribe on application unload.

❌ DON’T

Don’t manipulate DOM directly.

Don’t bypass eventBus for state propagation.

Don’t keep references to destroyed windows.

10. Performance Targets
    Metric	Target
    Open/Close latency	< 50 ms
    Max concurrent windows	≥ 20
    Z-index reordering	O(1)
    Memory leak tolerance	0 retained nodes after close
11. Diagnostics & Testing

Dev overlay shows live window graph and states.

Automated tests simulate open/minimize/restore cycles.

Stress test for 1000 open/close operations.

Profiling ensures 0 leaks and stable FPS > 60.

12. Integration with Event Bus

Window events are dispatched via the global EventBus under window:* namespace.
Plugins can react to them for analytics, synchronization, or custom workflows.