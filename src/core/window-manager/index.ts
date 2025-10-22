import { onCleanup } from 'solid-js';
import { eventBus } from '../event-bus';
import { WindowManager } from './types';
import { getWindowsSignal, getAllWindows, clearAllStores, getWindowsVersion } from './store';
import { WindowService } from './window-service';
import { getWindowStore } from './store';

// Create window service instance
const windowService = new WindowService();

// ResizeObserver for efficient resize detection - prevent infinite loop
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const windowId = entry.target.getAttribute('data-window-id');
    if (windowId) {
      const { width, height } = entry.contentRect;

      // Find the window store and check if size changed
      const store = getWindowStore(windowId);
      if (store && (store.state.width !== width || store.state.height !== height)) {
        // Update the store directly to avoid ResizeObserver loop
        store.update('width', width);
        store.update('height', height);

        // Emit resize event
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

// Subscribe to theme changes
eventBus.on('theme:changed', () => {
  // Windows will automatically react to CSS variable changes
  // This is mainly for any theme-specific window behavior
}, { scope: 'window-manager' });

export const windowManager: WindowManager = {
  get windows() {
    getWindowsVersion(); // Ensure reactivity
    return getWindowsSignal();
  },

  /**
   * Enhanced openWindow with FSM integration
   * Creates window with FSM backing for deterministic state management
   */
  openWindow: (pluginId: string, title: string, options?) => {
    return windowService.openWindow(pluginId, title, options);
  },

  closeWindow: (id: string) => windowService.closeWindow(id),

  minimizeWindow: (id: string) => windowService.minimizeWindow(id),

  maximizeWindow: (id: string) => windowService.maximizeWindow(id),

  toggleMaximizeWindow: (id: string) => windowService.toggleMaximizeWindow(id),

  restoreWindow: (id: string) => windowService.restoreWindow(id),

  focusWindow: (id: string) => windowService.focusWindow(id),

  blurWindow: (id: string) => windowService.blurWindow(id),
  updateWindowPosition: (id: string, x: number, y: number) => windowService.updateWindowPosition(id, x, y),
  updateWindowSize: (id: string, width: number, height: number) => windowService.updateWindowSize(id, width, height),
  snapWindow: (id: string, edge) => windowService.snapWindow(id, edge),
  selectWindow: (id: string, multi?: boolean) => windowService.selectWindow(id, multi),
  deselectWindow: (id: string) => windowService.deselectWindow(id),
  clearSelection: () => windowService.clearSelection(),
  bringToFront: (id: string) => windowService.bringToFront(id),
  sendToBack: (id: string) => windowService.sendToBack(id),
  setAlwaysOnTop: (id: string, alwaysOnTop: boolean) => windowService.setAlwaysOnTop(id, alwaysOnTop),
  setWindowOpacity: (id: string, opacity: number) => windowService.setWindowOpacity(id, opacity),
  startDrag: (id: string) => windowService.startDrag(id),
  endDrag: (id: string) => windowService.endDrag(id),
  startResize: (id: string) => windowService.startResize(id),
  endResize: (id: string) => windowService.endResize(id),
  setPreviewState: (id: string) => windowService.setPreviewState(id),
  clearPreviewState: (id: string) => windowService.clearPreviewState(id),
  getSelectedWindows: () => windowService.getSelectedWindows(),
  getHighestZIndex: () => windowService.getHighestZIndex(),
  constrainToScreen: (id: string) => windowService.constrainToScreen(id),
  getMinimizedWindows: () => windowService.getMinimizedWindows(),
  inspect: () => windowService.inspect(),

  /**
   * FSM-specific methods
   */
  getFSMState: (id: string) => windowService.getFSMState(id),
  canExecuteOperation: (id: string, operation: 'close' | 'minimize' | 'maximize' | 'restore' | 'focus') => {
    return windowService.canExecuteOperation(id, operation);
  },
  getFSMStats: () => windowService.getFSMStats()
};

// Cleanup on module unload
onCleanup(() => {
  resizeObserver.disconnect();
  clearAllStores();
});

// Export types for external use
export * from './types';
export { WindowService } from './window-service';