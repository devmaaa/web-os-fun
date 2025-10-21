import { eventBus } from '../event-bus';
import { Window, WindowOptions, WindowStore, WindowState, SnapEdge, ScreenBounds } from './types';
import {
  getWindowStore,
  getAllWindows,
  addWindowStore,
  removeWindowStore,
  getNextZIndex,
  scheduleWindowUpdate,
  updateWindowsSignal
} from './store';
import {
  getScreenBounds,
  constrainPosition,
  animateWindowMinimize,
  findWindowElement
} from './utils';

export class WindowService {
  private TASKBAR_HEIGHT = 48;

  private isGeometryMaximized(win: Window): boolean {
    const bounds = getScreenBounds();
    const expectedHeight = bounds.height - this.TASKBAR_HEIGHT;
    return (
      win.x === bounds.offsetLeft &&
      win.y === bounds.offsetTop &&
      win.width === bounds.width &&
      win.height === expectedHeight
    );
  }

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

    // Get current windows count BEFORE adding new one for correct positioning
    const currentWindowsCount = getAllWindows().length;

    const newWindow: Window = {
      id: `${pluginId}-${Date.now()}`,
      title,
      pluginId,
      x: options.x ?? 100 + currentWindowsCount * 50,
      y: options.y ?? 100 + currentWindowsCount * 50,
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
      isPreview: false,
      component: options.component,
      props: options.props,
      createdAt: new Date(),
    };

    const constrained = constrainPosition(newWindow.x, newWindow.y, newWindow.width, newWindow.height);
    newWindow.x = constrained.x;
    newWindow.y = constrained.y;

    // Create granular store for this window
    addWindowStore(newWindow);

    // Blur other windows
    getAllWindows().forEach(win => {
      if (win.id !== newWindow.id && win.focused) {
        this.blurWindow(win.id);
      }
    });

    // Emit window opened event
    eventBus.emitSync('window:opened', {
      id: newWindow.id,
      pluginId,
      title,
      component: options.component,
      props: options.props
    });
  }

  closeWindow(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;

    // Cleanup scoped event listeners - fix scope pattern
    eventBus.offAll(`window:${id}*`);

    // Stop observing the DOM element for ResizeObserver
    const windowElement = findWindowElement(id);
    if (windowElement) {
      // Note: We need access to the resizeObserver instance to unobserve
      // This will be handled by the main index.ts cleanup
    }

    // Remove from stores
    removeWindowStore(id);

    // Emit window closed event
    eventBus.emitSync('window:closed', {
      id,
      pluginId: window.pluginId,
      title: window.title
    });
  }

  async minimizeWindow(id: string) {
    const store = getWindowStore(id);
    if (!store || store.state.state === 'minimized') return;

    const window = store.state;

    // CRITICAL: Check if window was maximized before any state changes
    const wasMaximized = window.state === 'maximized';

    // Save the ORIGINAL state before changing to 'minimizing'
    const originalState = wasMaximized ? window.state : 'normal';

                
    // First, add minimizing class to trigger animation
    store.update('state', 'minimizing');

    // Debug logging before and after state updates
                    
    // Emit window minimizing event
    eventBus.emitSync('window:minimizing', {
      id,
      pluginId: window.pluginId,
      title: window.title
    });

    // Find the DOM element for this window and animate it
    const windowElement = findWindowElement(id);

    if (windowElement) {
      await animateWindowMinimize(windowElement);

      // Save current state as previousState for restoration
                              if (window.previousState) {
              }

      // ALWAYS preserve previousState for minimize operations
      // This ensures we can restore correctly after minimize + restore
      const currentState = {
        x: window.x,
        y: window.y,
        width: window.width,
        height: window.height,
        state: originalState, // Use original state, not 'minimizing'
      };
            store.update('previousState', currentState);
      store.update('state', 'minimized');
      store.update('focused', false);

      // Emit window minimized event
      eventBus.emitSync('window:minimized', {
        id,
        pluginId: window.pluginId,
        title: window.title
      });
    } else {
      // Fallback to setTimeout if element not found
      setTimeout(() => {
        const currentStore = getWindowStore(id);
        if (!currentStore) return;

        // Save the ORIGINAL state before 'minimizing' for restoration
        const originalState = currentStore.state.state;

        // Save current state as previousState for restoration
        const currentState = {
          x: currentStore.state.x,
          y: currentStore.state.y,
          width: currentStore.state.width,
          height: currentStore.state.height,
          state: originalState, // Use original state, not 'minimizing'
        };
                currentStore.update('previousState', currentState);
        currentStore.update('state', 'minimized');
        currentStore.update('focused', false);

        eventBus.emitSync('window:minimized', {
          id,
          pluginId: currentStore.state.pluginId,
          title: currentStore.state.title
        });
      }, 250);
    }
  }

  maximizeWindow(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;

            
    // Don't overwrite previousState if window is already maximized
    if (window.state === 'maximized') {
            return;
    }

    const bounds = getScreenBounds();

    // If already maximized (or effectively maximized), do nothing
    if (window.state === 'maximized' || this.isGeometryMaximized(window)) {
            return;
    }

    // Only set previousState if we're transitioning from a non-maximized mode
    // Don't overwrite good previousState with maximized geometry
    if (!window.previousState || window.previousState.state === 'maximized') {
      const newPreviousState = {
        x: window.x,
        y: window.y,
        width: window.width,
        height: window.height,
        state: window.state,
      };
            store.update('previousState', newPreviousState);
    }

    // Batch all updates together
    store.set({
      state: 'maximized',
      x: bounds.offsetLeft,
      y: bounds.offsetTop,
      width: bounds.width,
      height: bounds.height - this.TASKBAR_HEIGHT,
    });

    
    // Update reactive store to trigger UI re-render
    updateWindowsSignal();

    // Emit window maximized event
    eventBus.emitSync('window:maximized', {
      id,
      pluginId: window.pluginId,
      title: window.title
    });
  }

  // Native-like toggle maximize functionality
  toggleMaximizeWindow(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;

                if (window.previousState) {
          }

    // Check if window is logically maximized (state OR geometry)
    const logicallyMaximized = window.state === 'maximized' || this.isGeometryMaximized(window);
    
    if (logicallyMaximized) {
            // If already maximized, restore to previous size
      this.restoreWindow(id);
    } else {
            // If not maximized, maximize it
      this.maximizeWindow(id);
    }
  }

  restoreWindow(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;

                if (window.previousState) {
          }

    // Only restore if we have a previous state
    if (!window.previousState) {
            return;
    }

    const previousState = window.previousState;

    // Batch all updates together
    store.set({
      state: previousState.state,
      x: previousState.x,
      y: previousState.y,
      width: previousState.width,
      height: previousState.height,
      previousState: undefined,
    });

    
    // Focus the restored window and bring it to front
    this.focusWindow(id);

    // Emit window restored event
    eventBus.emitSync('window:restored', {
      id,
      pluginId: window.pluginId,
      title: window.title,
      fromState: previousState.state
    });
  }

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
  }

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
  }

  updateWindowPosition(id: string, x: number, y: number) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;
    const constrained = constrainPosition(x, y, window.width, window.height);

    scheduleWindowUpdate(id);
    store.update('x', constrained.x);
    store.update('y', constrained.y);

    // Update reactive store to trigger UI re-render during drag
    if (getWindowStore(id)?.state.isDragging) {
      updateWindowsSignal();
    }
  }

  updateWindowSize(id: string, width: number, height: number) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;
    const constrained = constrainPosition(window.x, window.y, width, height);

    scheduleWindowUpdate(id);
    store.update('width', width);
    store.update('height', height);
    store.update('x', constrained.x);
    store.update('y', constrained.y);

    // Update reactive store to trigger UI re-render
    updateWindowsSignal();

    // Emit window resized event
    eventBus.emitSync('window:resized', {
      id,
      pluginId: window.pluginId,
      title: window.title,
      width,
      height
    });
  }

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
  }

  selectWindow(id: string, multi = false) {
    const store = getWindowStore(id);
    if (!store) return;

    if (!multi) {
      this.clearSelection();
    }
    store.update('selected', true);
  }

  deselectWindow(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('selected', false);
  }

  clearSelection() {
    getAllWindows().forEach(win => {
      const store = getWindowStore(win.id);
      if (store && store.state.selected) {
        store.update('selected', false);
      }
    });
  }

  bringToFront(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const newZIndex = getNextZIndex();
    store.update('zIndex', newZIndex);

    // Update reactive store to trigger UI re-render
    updateWindowsSignal();
  }

  sendToBack(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const lowestZIndex = Math.min(...getAllWindows().map(w => w.zIndex));
    store.update('zIndex', lowestZIndex - 1);
  }

  setAlwaysOnTop(id: string, alwaysOnTop: boolean) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('alwaysOnTop', alwaysOnTop);
    if (alwaysOnTop) {
      this.bringToFront(id);
    }
  }

  setWindowOpacity(id: string, opacity: number) {
    const store = getWindowStore(id);
    if (!store) return;

    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    store.update('opacity', clampedOpacity);
  }

  startDrag(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isDragging', true);
    // DON'T change state - use isDragging flag for visual effects
  }

  endDrag(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isDragging', false);
    // DON'T force state to 'normal' - preserve layout state
    store.update('snapEdge', undefined);
  }

  startResize(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isResizing', true);
  }

  endResize(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isResizing', false);
  }

  setPreviewState(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isPreview', true);
  }

  clearPreviewState(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    store.update('isPreview', false);
  }

  getSelectedWindows() {
    return getAllWindows().filter(w => w.selected);
  }

  getHighestZIndex() {
    const windows = getAllWindows();
    return windows.length > 0 ? Math.max(...windows.map(w => w.zIndex)) : 0;
  }

  constrainToScreen(id: string) {
    const store = getWindowStore(id);
    if (!store) return;

    const window = store.state;
    const constrained = constrainPosition(window.x, window.y, window.width, window.height);
    store.update('x', constrained.x);
    store.update('y', constrained.y);
  }

  getMinimizedWindows() {
    return getAllWindows().filter(w => w.state === 'minimized');
  }

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
      memoryUsage: windows.length * 150, // Estimated KB per window
      activeListeners: eventBus.getListenerCount('window:*') || 0
    };
  }

  // Expose window store access for ResizeObserver
  getWindowStore(id: string) {
    return getWindowStore(id);
  }
}