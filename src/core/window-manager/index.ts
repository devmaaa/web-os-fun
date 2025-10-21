import { createStore } from 'solid-js/store';
import { createSignal, onCleanup } from 'solid-js';
import { eventBus } from '../event-bus';

export type WindowState = 'normal' | 'maximized' | 'minimized' | 'preview' | 'ghost' | 'minimizing';
export type SnapEdge = 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

import { Component } from 'solid-js';

export interface Window {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  state: WindowState;
  focused: boolean;
  pluginId: string;
  zIndex: number;
  selected: boolean;
  alwaysOnTop: boolean;
  opacity: number;
  isDragging: boolean;
  isResizing: boolean;
  snapEdge?: SnapEdge;
  component?: Component; // Solid component reference
  props?: Record<string, any>; // Initial props
  createdAt: Date; // Timestamp
  previousState?: {
    x: number;
    y: number;
    width: number;
    height: number;
    state: WindowState;
  };
}

export interface WindowOptions {
  component?: Component;
  props?: Record<string, any>;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  alwaysOnTop?: boolean;
}

export interface WindowManager {
  windows: Window[];
  openWindow: (pluginId: string, title: string, options?: WindowOptions) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  blurWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  snapWindow: (id: string, edge: SnapEdge) => void;
  selectWindow: (id: string, multi?: boolean) => void;
  deselectWindow: (id: string) => void;
  clearSelection: () => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  setAlwaysOnTop: (id: string, alwaysOnTop: boolean) => void;
  setWindowOpacity: (id: string, opacity: number) => void;
  startDrag: (id: string) => void;
  endDrag: (id: string) => void;
  startResize: (id: string) => void;
  endResize: (id: string) => void;
  setPreviewState: (id: string) => void;
  clearPreviewState: (id: string) => void;
  getSelectedWindows: () => Window[];
  getHighestZIndex: () => number;
  constrainToScreen: (id: string) => void;
  getMinimizedWindows: () => Window[];
  inspect: () => {
    totalWindows: number;
    focusedWindow: string | null;
    zIndexRange: { min: number; max: number };
    memoryUsage: number;
    activeListeners: number;
  };
}

// Granular window store type
export type WindowStore = {
  state: Window;
  set: (updates: Partial<Window>) => void;
  update: (key: keyof Window, value: any) => void;
};

// Helper to create individual window stores
function createWindowStore(initial: Window): WindowStore {
  const [state, set] = createStore(initial);
  
  return {
    state,
    set: (updates: Partial<Window>) => {
      set(updates);
    },
    update: (key: keyof Window, value: any) => {
      set(key, value);
    }
  };
}

// Granular window stores - one store per window for optimal performance
const windowStores = new Map<string, WindowStore>();
const [nextZIndex, setNextZIndex] = createSignal(1000);

// Create a reactive store for window list to enable SolidJS reactivity
const [windowsSignal, setWindowsSignal] = createStore([] as Window[]);

// Performance optimization: batch updates with requestAnimationFrame
let pendingUpdates = new Set<string>();
let rafId: number | null = null;

function scheduleUpdate(windowId: string) {
  pendingUpdates.add(windowId);
  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      pendingUpdates.clear();
      rafId = null;
    });
  }
}

// ResizeObserver for efficient resize detection
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const windowId = entry.target.getAttribute('data-window-id');
    if (windowId && windowStores.has(windowId)) {
      const { width, height } = entry.contentRect;
      const store = windowStores.get(windowId)!;
      
      // Only emit if size actually changed
      if (store.state.width !== width || store.state.height !== height) {
        store.update('width', width);
        store.update('height', height);
        
        eventBus.emitSync('window:resized', {
          id: windowId,
          pluginId: store.state.pluginId,
          title: store.state.title,
          width,
          height
        });
      }
    }
  }
});

// VisualViewport API for accurate positioning
function getScreenBounds() {
  if (window.visualViewport) {
    return {
      width: window.visualViewport.width,
      height: window.visualViewport.height,
      offsetLeft: window.visualViewport.offsetLeft,
      offsetTop: window.visualViewport.offsetTop,
    };
  }
  return {
    width: window.innerWidth || 1920,
    height: window.innerHeight || 1080,
    offsetLeft: 0,
    offsetTop: 0,
  };
}

const constrainPosition = (x: number, y: number, width: number, height: number) => {
  const bounds = getScreenBounds();
  return {
    x: Math.max(bounds.offsetLeft, Math.min(x, bounds.offsetLeft + bounds.width - width)),
    y: Math.max(bounds.offsetTop, Math.min(y, bounds.offsetTop + bounds.height - height)),
  };
};

// Helper to get all windows as array for compatibility
function getAllWindows(): Window[] {
  // Update reactive store with current windows
  const currentWindows = Array.from(windowStores.values()).map(store => store.state);
  setWindowsSignal(currentWindows);
  return currentWindows;
}

// Helper to update the reactive windows store
function updateWindowsSignal() {
  const currentWindows = Array.from(windowStores.values()).map(store => store.state);
  setWindowsSignal(currentWindows);
}

// Helper to find window store
function getWindowStore(id: string): WindowStore | undefined {
  return windowStores.get(id);
}

// Helper to get next z-index atomically
function getNextZIndex(): number {
  const current = nextZIndex();
  setNextZIndex(current + 1);
  return current;
}

// Subscribe to theme changes
eventBus.on('theme:changed', () => {
  // Windows will automatically react to CSS variable changes
  // This is mainly for any theme-specific window behavior
}, { scope: 'window-manager' });

export const windowManager: WindowManager = {
  get windows() { return windowsSignal; },
  
  openWindow(pluginId: string, title: string, options: WindowOptions = {}) {
    const existing = getAllWindows().find(w => w.pluginId === pluginId);
    if (existing) {
      if (existing.state === 'minimized') {
        this.restoreWindow(existing.id);
      } else {
        this.focusWindow(existing.id);
      }
      return;
    }

    const newWindow: Window = {
      id: `${pluginId}-${Date.now()}`,
      title,
      pluginId,
      x: options.x ?? 100 + getAllWindows().length * 50,
      y: options.y ?? 100 + getAllWindows().length * 50,
      width: options.width ?? 400,
      height: options.height ?? 300,
      state: 'normal',
      focused: true,
      zIndex: getNextZIndex(),
      selected: false,
      alwaysOnTop: options.alwaysOnTop ?? false,
      opacity: 1,
      isDragging: false,
      isResizing: false,
      component: options.component,
      props: options.props,
      createdAt: new Date(),
    };

    const constrained = constrainPosition(newWindow.x, newWindow.y, newWindow.width, newWindow.height);
    newWindow.x = constrained.x;
    newWindow.y = constrained.y;

    // Create granular store for this window
    const store = createWindowStore(newWindow);
    windowStores.set(newWindow.id, store);

    // Update reactive store to trigger UI re-render
    updateWindowsSignal();

    // Blur other windows
    getAllWindows().forEach(win => {
      if (win.id !== newWindow.id && win.focused) {
        this.blurWindow(win.id);
      }
    });

    // Emit window opened event with plugin scope
    eventBus.emitSync('window:opened', {
      id: newWindow.id,
      pluginId,
      title,
      component: options.component,
      props: options.props
    });
  },
  
  closeWindow(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;
    
    // Cleanup scoped event listeners
    eventBus.offAll(`window:${id}`);
    
    // Remove from stores
    windowStores.delete(id);

    // Update reactive store to trigger UI re-render
    updateWindowsSignal();

    // Emit window closed event
    eventBus.emitSync('window:closed', {
      id,
      pluginId: window.pluginId,
      title: window.title
    });
  },
  
  minimizeWindow(id: string) {
    const store = getWindowStore(id);
    if (!store || store.state.state === 'minimized') return;

    const window = store.state;
    
    // First, add minimizing class to trigger animation
    store.update('state', 'minimizing');

    // Emit window minimizing event
    eventBus.emitSync('window:minimizing', {
      id,
      pluginId: window.pluginId,
      title: window.title
    });

    // Find the DOM element for this window and animate it
    const windowElement = document.querySelector(`[data-window-id="${id}"]`) as HTMLElement;
    if (windowElement) {
      const animation = windowElement.animate([
        { 
          transform: 'scale(1)', 
          opacity: 1 
        },
        { 
          transform: 'scale(0.1)', 
          opacity: 0.5,
          offset: 0.7
        },
        { 
          transform: 'scale(0) translate(-50%, 50%)', 
          opacity: 0 
        }
      ], {
        duration: 250,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      });

      animation.addEventListener('finish', () => {
        store.update('previousState', {
          x: window.x,
          y: window.y,
          width: window.width,
          height: window.height,
          state: window.state,
        });
        store.update('state', 'minimized');
        store.update('focused', false);

        // Emit window minimized event
        eventBus.emitSync('window:minimized', {
          id,
          pluginId: window.pluginId,
          title: window.title
        });
      });
    } else {
      // Fallback to setTimeout if element not found
      setTimeout(() => {
        store.update('previousState', {
          x: window.x,
          y: window.y,
          width: window.width,
          height: window.height,
          state: window.state,
        });
        store.update('state', 'minimized');
        store.update('focused', false);

        // Update reactive store to trigger UI re-render
        updateWindowsSignal();

        eventBus.emitSync('window:minimized', {
          id,
          pluginId: window.pluginId,
          title: window.title
        });
      }, 250);
    }
  },
  
  maximizeWindow(id: string) {
    const store = getWindowStore(id);
    if (!store || store.state.state === 'maximized') return;

    const window = store.state;
    const bounds = getScreenBounds();
    
    store.update('previousState', {
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height,
      state: window.state,
    });
    store.update('state', 'maximized');
    updateWindowsSignal();
    store.update('x', bounds.offsetLeft);
    store.update('y', bounds.offsetTop);
    store.update('width', bounds.width);
    store.update('height', bounds.height - 48); // Subtract taskbar height

    // Final update to ensure all changes are captured
    updateWindowsSignal();

    // Emit window maximized event
    eventBus.emitSync('window:maximized', {
      id,
      pluginId: window.pluginId,
      title: window.title
    });
  },
  
  restoreWindow(id: string) {
    const store = getWindowStore(id);
    if (!store || !store.state.previousState) return;

    const window = store.state;
    const previousState = window.previousState!;
    
    store.update('state', previousState.state);
    updateWindowsSignal();
    store.update('x', previousState.x);
    store.update('y', previousState.y);
    store.update('width', previousState.width);
    store.update('height', previousState.height);
    store.update('previousState', undefined);

    // Final update to ensure all changes are captured
    updateWindowsSignal();

    // Emit window restored event
    eventBus.emitSync('window:restored', {
      id,
      pluginId: window.pluginId,
      title: window.title,
      fromState: previousState.state
    });
  },
  
  focusWindow(id: string) {
    const store = getWindowStore(id);
    if (!store || store.state.focused) return;

    const window = store.state;
    
    // Blur the currently focused window
    const currentlyFocused = getAllWindows().find(w => w.focused);
    if (currentlyFocused && currentlyFocused.id !== id) {
      this.blurWindow(currentlyFocused.id);
    }

    store.update('focused', true);
    this.bringToFront(id);

    // Emit window focused event
    eventBus.emitSync('window:focused', {
      id,
      pluginId: window.pluginId,
      title: window.title
    });
  },

  blurWindow(id: string) {
    const store = getWindowStore(id);
    if (!store || !store.state.focused) return;

    const window = store.state;
    store.update('focused', false);

    // Emit window blurred event
    eventBus.emitSync('window:blurred', {
      id,
      pluginId: window.pluginId,
      title: window.title
    });
  },
  
  updateWindowPosition(id: string, x: number, y: number) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;
    const constrained = constrainPosition(x, y, window.width, window.height);
    
    scheduleUpdate(id);
    store.update('x', constrained.x);
    store.update('y', constrained.y);

    // Update reactive store to trigger UI re-render during drag
    if (getWindowStore(id)?.state.isDragging) {
      updateWindowsSignal();
    }
  },
  
  updateWindowSize(id: string, width: number, height: number) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;
    const constrained = constrainPosition(window.x, window.y, width, height);
    
    scheduleUpdate(id);
    store.update('width', width);
    store.update('height', height);
    store.update('x', constrained.x);
    store.update('y', constrained.y);

    // Emit window resized event
    eventBus.emitSync('window:resized', {
      id,
      pluginId: window.pluginId,
      title: window.title,
      width,
      height
    });
  },
  
  snapWindow(id: string, edge: SnapEdge) {
    const store = getWindowStore(id);
    if (!store) return;

    const bounds = getScreenBounds();
    const window = store.state;
    
    let newX = window.x;
    let newY = window.y;
    let newWidth = window.width;
    let newHeight = window.height;
    
    switch (edge) {
      case 'left':
        newX = bounds.offsetLeft;
        newWidth = bounds.width / 2;
        newHeight = bounds.height;
        break;
      case 'right':
        newX = bounds.offsetLeft + bounds.width / 2;
        newWidth = bounds.width / 2;
        newHeight = bounds.height;
        break;
      case 'top':
        newX = bounds.offsetLeft;
        newY = bounds.offsetTop;
        newWidth = bounds.width;
        newHeight = bounds.height / 2;
        break;
      case 'bottom':
        newX = bounds.offsetLeft;
        newY = bounds.offsetTop + bounds.height / 2;
        newWidth = bounds.width;
        newHeight = bounds.height / 2;
        break;
      case 'top-left':
        newX = bounds.offsetLeft;
        newY = bounds.offsetTop;
        newWidth = bounds.width / 2;
        newHeight = bounds.height / 2;
        break;
      case 'top-right':
        newX = bounds.offsetLeft + bounds.width / 2;
        newY = bounds.offsetTop;
        newWidth = bounds.width / 2;
        newHeight = bounds.height / 2;
        break;
      case 'bottom-left':
        newX = bounds.offsetLeft;
        newY = bounds.offsetTop + bounds.height / 2;
        newWidth = bounds.width / 2;
        newHeight = bounds.height / 2;
        break;
      case 'bottom-right':
        newX = bounds.offsetLeft + bounds.width / 2;
        newY = bounds.offsetTop + bounds.height / 2;
        newWidth = bounds.width / 2;
        newHeight = bounds.height / 2;
        break;
    }
    
    store.update('x', newX);
    store.update('y', newY);
    store.update('width', newWidth);
    store.update('height', newHeight);
    store.update('snapEdge', edge);
  },
  
  selectWindow(id: string, multi = false) {
    const store = getWindowStore(id);
    if (!store) return;

    if (!multi) {
      this.clearSelection();
    }
    store.update('selected', true);
  },
  
  deselectWindow(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('selected', false);
  },
  
  clearSelection() {
    getAllWindows().forEach(win => {
      const store = getWindowStore(win.id);
      if (store && store.state.selected) {
        store.update('selected', false);
      }
    });
  },
  
  bringToFront(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const newZIndex = getNextZIndex();
    store.update('zIndex', newZIndex);
  },
  
  sendToBack(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const lowestZIndex = Math.min(...getAllWindows().map(w => w.zIndex));
    store.update('zIndex', lowestZIndex - 1);
  },
  
  setAlwaysOnTop(id: string, alwaysOnTop: boolean) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('alwaysOnTop', alwaysOnTop);
    if (alwaysOnTop) {
      this.bringToFront(id);
    }
  },
  
  setWindowOpacity(id: string, opacity: number) {
    const store = getWindowStore(id);
    if (!store) return;

    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    store.update('opacity', clampedOpacity);
  },
  
  startDrag(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isDragging', true);
    store.update('state', 'ghost');
  },
  
  endDrag(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isDragging', false);
    store.update('state', 'normal');
    store.update('snapEdge', undefined);
  },
  
  startResize(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isResizing', true);
  },
  
  endResize(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isResizing', false);
  },
  
  setPreviewState(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('state', 'preview');
  },
  
  clearPreviewState(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('state', 'normal');
  },
  
  getSelectedWindows() {
    return getAllWindows().filter(w => w.selected);
  },
  
  getHighestZIndex() {
    const windows = getAllWindows();
    return windows.length > 0 ? Math.max(...windows.map(w => w.zIndex)) : 0;
  },
  
  constrainToScreen(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;
    const constrained = constrainPosition(window.x, window.y, window.width, window.height);
    store.update('x', constrained.x);
    store.update('y', constrained.y);
  },

  getMinimizedWindows() {
    return getAllWindows().filter(w => w.state === 'minimized');
  },

  inspect() {
    const windows = getAllWindows();
    const focusedWindow = windows.find(w => w.focused);
    const zIndexes = windows.map(w => w.zIndex);
    
    return {
      totalWindows: windows.length,
      focusedWindow: focusedWindow?.id || null,
      zIndexRange: {
        min: zIndexes.length > 0 ? Math.min(...zIndexes) : 0,
        max: zIndexes.length > 0 ? Math.max(...zIndexes) : 0
      },
      memoryUsage: windowStores.size * 150, // Estimated KB per window
      activeListeners: eventBus.getListenerCount('window:*') || 0
    };
  },
};

// Cleanup on module unload
onCleanup(() => {
  resizeObserver.disconnect();
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  windowStores.clear();
});