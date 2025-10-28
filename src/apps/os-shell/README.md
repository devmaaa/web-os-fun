# DineApp OS - OS Shell

The OS Shell is the desktop environment and root application for DineApp OS. It provides a window-based interface for running plugins and managing the system.

## Architecture

According to the [architecture specification](../../../spec/architecture/architecture.md), the OS Shell implements:

- **Window Management**: Multi-window interface with minimize, maximize, and drag functionality
- **Plugin Loading**: Dynamic discovery and initialization of plugins
- **Theme System**: Light/dark theme switching with CSS variables
- **Desktop Interface**: Icon-based application launcher
- **Taskbar**: System tray with clock, theme toggle, and window controls

## Components

- `OsShell.tsx` - Main shell component and orchestrator
- `components/DesktopIcons.tsx` - Desktop icon grid for launching apps
- `components/Taskbar.tsx` - Bottom taskbar with system controls
- `components/WindowManager.tsx` - Window drag, resize, and focus management

## Features

- **60fps Drag Performance**: Uses `requestAnimationFrame` for smooth window dragging
- **GPU Acceleration**: Hardware acceleration during drag operations
- **Plugin Isolation**: Each plugin runs in its own window context
- **Scoped Events**: Event bus prevents memory leaks and cross-plugin interference
- **Responsive Design**: Adapts to different screen sizes

## Usage

The OS Shell is imported as the root component in `src/App.tsx`:

```tsx
import OsShell from './apps/os-shell/OsShell';

const App = () => <OsShell />;
```