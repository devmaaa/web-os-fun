import { createFSM, registerFSM } from './index';
import type { WindowLifecycleStates, WindowLifecycleEvents } from './types';
import type { FSM } from './types';

/**
 * Window Lifecycle FSM Implementation
 *
 * Manages deterministic window state transitions for the WindowManager.
 * Prevents UI conflicts like concurrent resize/maximize operations.
 */

// Type-safe window states
type WindowState = WindowLifecycleStates[keyof WindowLifecycleStates];

// Type-safe window events
type WindowEvent = WindowLifecycleEvents[keyof WindowLifecycleEvents];

// Window FSM context
interface WindowContext {
  windowId: string;
  pluginId?: string;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  resizable: boolean;
  maximizable: boolean;
  minimizable: boolean;
  focused: boolean;
  zOrder: number;
}

/**
 * Window transition table - defines all valid state transitions
 */
const WINDOW_TRANSITIONS: Record<WindowState, Partial<Record<WindowEvent, WindowState>>> = {
  // Closed window can only be opened
  closed: {
    open: 'opening'
  },

  // Opening window transitions to normal (success) or closed (failure)
  opening: {
    open: 'normal',
    close: 'closed'
  },

  // Normal window has many possible transitions
  normal: {
    minimize: 'minimizing',
    maximize: 'maximizing',
    close: 'closing',
    resize_start: 'resizing', // Can start resizing from normal
    focus: 'normal',
    blur: 'normal'
  },

  // Minimizing is a transitional state
  minimizing: {
    minimize: 'minimized', // Complete minimization
    restore: 'normal', // Cancel minimization
    close: 'closing' // Can close during minimization
  },

  // Minimized window can be restored or closed
  minimized: {
    restore: 'normal',
    close: 'closing'
  },

  // Maximizing is a transitional state
  maximizing: {
    maximize: 'maximized', // Complete maximization
    restore: 'normal', // Cancel maximization
    minimize: 'minimizing', // Can minimize during maximization
    close: 'closing' // Can close during maximization
  },

  // Maximized window can be restored, minimized, or closed
  maximized: {
    restore: 'normal',
    minimize: 'minimizing',
    close: 'closing',
    focus: 'maximized',
    blur: 'maximized'
  },

  // Restoring is a transitional state
  restoring: {
    restore: 'normal', // Complete restoration
    maximize: 'maximizing', // Can maximize during restore
    minimize: 'minimizing', // Can minimize during restore
    close: 'closing' // Can close during restore
  },

  // Resizing is a transitional state
  resizing: {
    resize_end: 'normal', // Complete resizing and return to normal
    minimize: 'minimizing', // Can minimize during resize
    maximize: 'maximizing', // Can maximize during resize
    close: 'closing' // Can close during resize
  },

  // Closing is a transitional state
  closing: {
    close: 'closed' // Complete closing
  }
};

/**
 * Create a Window FSM instance
 *
 * @param windowId Unique identifier for the window
 * @param initialContext Initial window context data
 * @returns FSM instance for the window
 */
export function createWindowFSM(
  windowId: string,
  initialContext: Partial<WindowContext> = {}
): FSM<WindowState, WindowEvent> {
  // Ensure required context fields have defaults
  const context: WindowContext = {
    windowId,
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    resizable: true,
    maximizable: true,
    minimizable: true,
    focused: false,
    zOrder: 0,
    ...initialContext
  };

  const fsm = createFSM<WindowState, WindowEvent>(
    `window:${windowId}`,
    'closed',
    WINDOW_TRANSITIONS,
    {
      context,
      metadata: {
        type: 'window',
        createdAt: Date.now()
      }
    }
  );

  // Register with the global FSM registry
  registerFSM(fsm);

  return fsm;
}

/**
 * Window FSM Manager - handles multiple window FSM instances
 */
export class WindowFSMManager {
  private windows = new Map<string, FSM<WindowState, WindowEvent>>();
  private zOrderCounter = 0;
  private pendingFocusOperations = new Set<string>();
  private focusBatchTimeout: number | null = null;

  /**
   * Create a new window FSM
   */
  createWindow(
    windowId: string,
    initialContext: Partial<WindowContext> = {}
  ): FSM<WindowState, WindowEvent> {
    if (this.windows.has(windowId)) {
      throw new Error(`Window FSM with ID "${windowId}" already exists`);
    }

    const fsm = createWindowFSM(windowId, {
      ...initialContext,
      zOrder: ++this.zOrderCounter
    });

    this.windows.set(windowId, fsm);

    // Emit window:created event
    import('@core/event-bus').then(({ eventBus }) => {
      eventBus.emitSync('window:created', {
        windowId,
        state: fsm.getState(),
        context: fsm.getContext(),
        timestamp: Date.now()
      });
    });

    return fsm;
  }

  /**
   * Get a window FSM by ID
   */
  getWindow(windowId: string): FSM<WindowState, WindowEvent> | undefined {
    return this.windows.get(windowId);
  }

  /**
   * Remove a window FSM
   */
  destroyWindow(windowId: string): void {
    const fsm = this.windows.get(windowId);
    if (!fsm) {
      console.warn(`[WindowFSM] Window "${windowId}" not found`);
      return;
    }

    // Ensure window is closed before destroying
    if (fsm.getState() !== 'closed') {
      fsm.transition('close');
    }

    this.windows.delete(windowId);

    // Unregister from global FSM registry
    import('./registry').then(({ unregisterFSM }) => {
      unregisterFSM(`window:${windowId}`);
    });

    // Emit window:destroyed event
    import('@core/event-bus').then(({ eventBus }) => {
      eventBus.emitSync('window:destroyed', {
        windowId,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Get all window FSMs
   */
  getAllWindows(): Map<string, FSM<WindowState, WindowEvent>> {
    return new Map(this.windows);
  }

  /**
   * Get windows in a specific state
   */
  getWindowsInState(state: WindowState): FSM<WindowState, WindowEvent>[] {
    const result: FSM<WindowState, WindowEvent>[] = [];

    for (const fsm of this.windows.values()) {
      if (fsm.getState() === state) {
        result.push(fsm);
      }
    }

    return result;
  }

  /**
   * Batch focus operations to prevent event storms
   */
  private batchFocusOperations(): void {
    const focusedWindows = Array.from(this.pendingFocusOperations);
    this.pendingFocusOperations.clear();

    if (this.focusBatchTimeout) {
      clearTimeout(this.focusBatchTimeout);
      this.focusBatchTimeout = null;
    }

    queueMicrotask(() => {
      // Process all focus operations in a single microtask
      for (const windowId of focusedWindows) {
        this.performFocusOperation(windowId);
      }
    });
  }

  /**
   * Perform the actual focus operation for a single window
   */
  private performFocusOperation(windowId: string): void {
    const fsm = this.windows.get(windowId);
    if (!fsm || !fsm.can('focus')) {
      return;
    }

    // Update z-order
    const context = fsm.getContext() as WindowContext;
    const newZOrder = ++this.zOrderCounter;

    fsm.updateContext({ ...context, focused: true, zOrder: newZOrder });
    fsm.transition('focus');

    // Blur other windows
    for (const [id, otherFsm] of this.windows) {
      if (id !== windowId && otherFsm.can('blur')) {
        const otherContext = otherFsm.getContext() as WindowContext;
        otherFsm.updateContext({ ...otherContext, focused: false });
        otherFsm.transition('blur');
      }
    }
  }

  /**
   * Focus a window (bring to front) - batched to prevent event storms
   */
  focusWindow(windowId: string): boolean {
    const fsm = this.windows.get(windowId);
    if (!fsm) {
      console.warn(`[WindowFSM] Cannot focus window "${windowId}" - not found`);
      return false;
    }

    if (!fsm.can('focus')) {
      console.warn(`[WindowFSM] Cannot focus window "${windowId}" - not focusable in current state`);
      return false;
    }

    // Add to pending operations
    this.pendingFocusOperations.add(windowId);

    // Schedule batch processing
    if (this.focusBatchTimeout) {
      clearTimeout(this.focusBatchTimeout);
    }

    this.focusBatchTimeout = setTimeout(() => {
      this.batchFocusOperations();
    }, 0) as unknown as number;

    return true;
  }

  /**
   * Minimize a window
   */
  minimizeWindow(windowId: string): boolean {
    const fsm = this.windows.get(windowId);
    if (!fsm) {
      console.warn(`[WindowFSM] Cannot minimize window "${windowId}" - not found`);
      return false;
    }

    if (!fsm.can('minimize')) {
      console.warn(`[WindowFSM] Cannot minimize window "${windowId}" - not minimizable in current state`);
      return false;
    }

    return fsm.transition('minimize') !== null;
  }

  /**
   * Maximize a window
   */
  maximizeWindow(windowId: string): boolean {
    const fsm = this.windows.get(windowId);
    if (!fsm) {
      console.warn(`[WindowFSM] Cannot maximize window "${windowId}" - not found`);
      return false;
    }

    const context = fsm.getContext() as WindowContext;
    if (!context.maximizable) {
      console.warn(`[WindowFSM] Cannot maximize window "${windowId}" - not maximizable`);
      return false;
    }

    if (!fsm.can('maximize')) {
      console.warn(`[WindowFSM] Cannot maximize window "${windowId}" - not maximizable in current state`);
      return false;
    }

    return fsm.transition('maximize') !== null;
  }

  /**
   * Restore a window
   */
  restoreWindow(windowId: string): boolean {
    const fsm = this.windows.get(windowId);
    if (!fsm) {
      console.warn(`[WindowFSM] Cannot restore window "${windowId}" - not found`);
      return false;
    }

    if (!fsm.can('restore')) {
      console.warn(`[WindowFSM] Cannot restore window "${windowId}" - not restorable in current state`);
      return false;
    }

    return fsm.transition('restore') !== null;
  }

  /**
   * Close a window
   */
  closeWindow(windowId: string): boolean {
    const fsm = this.windows.get(windowId);
    if (!fsm) {
      console.warn(`[WindowFSM] Cannot close window "${windowId}" - not found`);
      return false;
    }

    if (!fsm.can('close')) {
      console.warn(`[WindowFSM] Cannot close window "${windowId}" - not closable in current state`);
      return false;
    }

    const result = fsm.transition('close') !== null;

    // Auto-destroy window after closing animation completes
    if (result) {
      setTimeout(() => {
        this.destroyWindow(windowId);
      }, 300); // Allow time for closing animation
    }

    return result;
  }

  /**
   * Start resizing a window
   */
  startResizeWindow(windowId: string): boolean {
    const fsm = this.windows.get(windowId);
    if (!fsm) {
      console.warn(`[WindowFSM] Cannot start resizing window "${windowId}" - not found`);
      return false;
    }

    const context = fsm.getContext() as WindowContext;
    if (!context.resizable) {
      console.warn(`[WindowFSM] Cannot resize window "${windowId}" - not resizable`);
      return false;
    }

    if (!fsm.can('resize_start')) {
      console.warn(`[WindowFSM] Cannot start resizing window "${windowId}" - not resizable in current state`);
      return false;
    }

    return fsm.transition('resize_start') !== null;
  }

  /**
   * End resizing a window
   */
  endResizeWindow(windowId: string): boolean {
    const fsm = this.windows.get(windowId);
    if (!fsm) {
      console.warn(`[WindowFSM] Cannot end resizing window "${windowId}" - not found`);
      return false;
    }

    if (!fsm.can('resize_end')) {
      console.warn(`[WindowFSM] Cannot end resizing window "${windowId}" - not currently resizing`);
      return false;
    }

    return fsm.transition('resize_end') !== null;
  }

  /**
   * Check if a window can be resized
   */
  canResizeWindow(windowId: string): boolean {
    const fsm = this.windows.get(windowId);
    if (!fsm) return false;

    const context = fsm.getContext() as WindowContext;
    return context.resizable && fsm.can('resize_start');
  }

  /**
   * Get diagnostics for all windows
   */
  getDiagnostics() {
    const windowStates: Record<string, any> = {};

    for (const [id, fsm] of this.windows) {
      windowStates[id] = {
        ...fsm.inspect(),
        context: fsm.getContext()
      };
    }

    return {
      windowCount: this.windows.length,
      zOrderCounter: this.zOrderCounter,
      windowStates,
      timestamp: Date.now()
    };
  }

  /**
   * Close all windows
   */
  closeAllWindows(): void {
    const windowIds = Array.from(this.windows.keys());

    for (const windowId of windowIds) {
      this.closeWindow(windowId);
    }
  }
}

/**
 * Global Window FSM Manager instance
 */
export const windowFSMManager = new WindowFSMManager();

/**
 * Convenience function to create a window FSM
 */
export function createWindow(windowId: string, context?: Partial<WindowContext>): FSM<WindowState, WindowEvent> {
  return windowFSMManager.createWindow(windowId, context);
}

/**
 * Convenience function to get a window FSM
 */
export function getWindow(windowId: string): FSM<WindowState, WindowEvent> | undefined {
  return windowFSMManager.getWindow(windowId);
}

/**
 * Convenience function to destroy a window FSM
 */
export function destroyWindow(windowId: string): void {
  windowFSMManager.destroyWindow(windowId);
}