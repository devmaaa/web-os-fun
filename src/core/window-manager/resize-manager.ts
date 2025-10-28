/**
 * High-Performance Resize Manager for Window System
 *
 * Provides blazing fast resize detection using ResizeObserver API
 * Integrates with FSM for deterministic state management
 * Supports bottom-left and bottom-right edge/corner resizing
 */

import { createResizeObserver, requestAnimationFrameThrottled } from './utils';
import { eventBus } from '../event-bus';
import { windowFSMManager } from '../fsm';
import { getWindowStore, updateWindowsSignal } from './store';
import type { Window } from './types';
import { calculateResize, type ResizeHandle, type ResizeStartState } from './use-resize-calculations';

export interface ResizeHandleElement {
  type: 'bottom-left' | 'bottom-right' | 'bottom';
  cursor: 'nw-resize' | 'ne-resize' | 'n-resize';
  element?: HTMLElement;
}

export interface ResizeState {
  isResizing: boolean;
  handle: ResizeHandle;
  startState: ResizeStartState;
}

/**
 * High-Performance Resize Manager
 *
 * Features:
 * - Single ResizeObserver for all windows (performance optimized)
 * - RAF-throttled updates for 60fps performance
 * - FSM integration for deterministic state
 * - Support for bottom-left and bottom-right handles
 */
export class ResizeManager {
  private resizeObserver: ResizeObserver;
  private activeResizes = new Map<string, ResizeState>();
  private resizeHandles = new Map<string, Set<ResizeHandleElement>>();
  private rafId: number | null = null;
  private pendingUpdates = new Set<string>();

  // Performance metrics
  private resizeCount = 0;
  private lastResizeTime = 0;
  private averageResizeLatency = 0;

  // Fix memory leak: store bound event handlers
  private boundHandleMouseMove: (e: MouseEvent) => void;
  private boundHandleMouseUp: (e: MouseEvent) => void;

  // Separate RAF ID for mouse move throttling
  private mouseMoveRafId: number | null = null;

  constructor() {
    // Create shared ResizeObserver for all windows
    this.resizeObserver = createResizeObserver(this.handleResize.bind(this));

    // Fix memory leak: create bound handlers once
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);

    // Listen to FSM resize state changes
    this.setupFSMListeners();

    // Setup event bus listeners
    this.setupEventBusListeners();

    console.log('[ResizeManager] Initialized with high-performance ResizeObserver');
  }

  /**
   * Setup FSM state change listeners
   */
  private setupFSMListeners(): void {
    // Listen to FSM transition events
    import('../event-bus').then(({ eventBus }) => {
      eventBus.on('fsm:transition', (event) => {
        if (event.id.startsWith('window:') && event.event === 'resize_start') {
          this.handleResizeStart(event.id.replace('window:', ''));
        } else if (event.id.startsWith('window:') && event.event === 'resize_end') {
          this.handleResizeEnd(event.id.replace('window:', ''));
        }
      }, { scope: 'resize-manager' });
    });
  }

  /**
   * Setup event bus listeners for window lifecycle
   */
  private setupEventBusListeners(): void {
    eventBus.on('window:opened', (event) => {
      this.observeWindow(event.id);
    }, { scope: 'resize-manager' });

    eventBus.on('window:closed', (event) => {
      this.unobserveWindow(event.id);
    }, { scope: 'resize-manager' });
  }

  /**
   * Start observing a window for resize
   */
  private observeWindow(windowId: string): void {
    const element = document.querySelector(`.window[data-window-id="${windowId}"]`) as HTMLElement;
    if (element) {
      this.resizeObserver.observe(element);
      this.createResizeHandles(windowId, element);
    }
  }

  /**
   * Stop observing a window
   */
  private unobserveWindow(windowId: string): void {
    const element = document.querySelector(`.window[data-window-id="${windowId}"]`) as HTMLElement;
    if (element) {
      this.resizeObserver.unobserve(element);
    }

    // Clean up resize handles
    this.cleanupResizeHandles(windowId);
    this.activeResizes.delete(windowId);
  }

  /**
   * Create resize handles for a window
   */
  private createResizeHandles(windowId: string, windowElement: HTMLElement): void {
    const handles: ResizeHandleElement[] = [
      { type: 'bottom-left', cursor: 'nw-resize' },
      { type: 'bottom-right', cursor: 'ne-resize' },
      { type: 'bottom', cursor: 'n-resize' }
    ];

    const handleSet = new Set<ResizeHandleElement>();

    handles.forEach(handle => {
      const handleElement = this.createHandleElement(windowId, handle, windowElement);
      if (handleElement) {
        handle.element = handleElement;
        handleSet.add(handle);
      }
    });

    this.resizeHandles.set(windowId, handleSet);
  }

  /**
   * Create a single resize handle element
   */
  private createHandleElement(windowId: string, handle: ResizeHandleElement, windowElement: HTMLElement): HTMLElement | null {
    const handleElement = document.createElement('div');
    handleElement.className = `resize-handle resize-handle-${handle.type}`;
    handleElement.style.cssText = `
      position: absolute;
      background: transparent;
      z-index: 1000;
      cursor: ${handle.cursor};
      opacity: 0;
      transition: opacity 0.15s ease;
    `;

    // Position handle based on type
    switch (handle.type) {
      case 'bottom-left':
        handleElement.style.cssText += `
          bottom: 0;
          left: 0;
          width: 12px;
          height: 12px;
          border-radius: 0 0 0 8px;
        `;
        break;
      case 'bottom-right':
        handleElement.style.cssText += `
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 0 0 8px 0;
        `;
        break;
      case 'bottom':
        handleElement.style.cssText += `
          bottom: 0;
          left: 12px;
          right: 12px;
          height: 6px;
        `;
        break;
    }

    // Add event listeners
    handleElement.addEventListener('mouseenter', () => {
      handleElement.style.opacity = '1';
    });

    handleElement.addEventListener('mouseleave', () => {
      if (!this.activeResizes.has(windowId)) {
        handleElement.style.opacity = '0';
      }
    });

    handleElement.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startResize(windowId, handle.type, e);
    });

    // Append to window element
    windowElement.appendChild(handleElement);
    return handleElement;
  }

  /**
   * Start resize operation
   */
  private startResize(windowId: string, handleType: ResizeHandle, event: MouseEvent): void {
    const store = getWindowStore(windowId);
    if (!store) return;

    const window = store.state;
    if (!window.resizable) return;

    // Check FSM state
    const fsm = windowFSMManager.getWindow(windowId);
    if (!fsm || !windowFSMManager.canResizeWindow(windowId)) {
      console.warn(`[ResizeManager] Cannot resize window "${windowId}" - FSM state doesn't allow it`);
      return;
    }

    // Update FSM state
    if (!windowFSMManager.startResizeWindow(windowId)) {
      console.warn(`[ResizeManager] Failed to start resize for window "${windowId}"`);
      return;
    }

    // Get current window position and dimensions
    const windowRect = document.querySelector(`.window[data-window-id="${windowId}"]`)?.getBoundingClientRect();
    if (!windowRect) return;

    // Initialize resize state using the new calculation hook format
    const resizeState: ResizeState = {
      isResizing: true,
      handle: handleType,
      startState: {
        startX: event.clientX,
        startY: event.clientY,
        startWidth: windowRect.width,
        startHeight: windowRect.height,
        startLeft: windowRect.left,
        startTop: windowRect.top
      }
    };

    this.activeResizes.set(windowId, resizeState);

    // Update window store
    store.update('isResizing', true);
    store.update('resizeHandle', handleType);

    // Show all handles for this window
    const handles = this.resizeHandles.get(windowId);
    if (handles) {
      handles.forEach(handle => {
        if (handle.element) {
          handle.element.style.opacity = '1';
        }
      });
    }

    // Add global mouse listeners (using bound handlers to prevent memory leaks)
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);

    // Emit resize start event
    eventBus.emitSync('window:resize_start', {
      id: windowId,
      handle: handleType,
      startX: resizeState.startState.startX,
      startY: resizeState.startState.startY,
      width: resizeState.startState.startWidth,
      height: resizeState.startState.startHeight,
      timestamp: Date.now()
    });
  }

  /**
   * Handle mouse move during resize (RAF-throttled for performance)
   */
  private handleMouseMove(event: MouseEvent): void {
    if (this.activeResizes.size === 0) return;

    // Skip if we already have a pending RAF
    if (this.mouseMoveRafId) return;

    const startTime = performance.now();

    // Throttle with RAF for 60fps performance
    this.mouseMoveRafId = requestAnimationFrame(() => {
      for (const [windowId, resizeState] of this.activeResizes) {
        const store = getWindowStore(windowId);
        if (!store) continue;

        const window = store.state;

        // Use the new calculation hook for consistent resize behavior
        const resizeResult = calculateResize(resizeState.handle, {
          mouseX: event.clientX,
          mouseY: event.clientY,
          windowState: resizeState.startState
        }, {
          minWidth: window.minWidth || 200,
          minHeight: window.minHeight || 150
        });

        // Update window store with new dimensions and position
        store.set({
          width: resizeResult.newWidth,
          height: resizeResult.newHeight,
          x: resizeResult.newX,
          y: resizeResult.newY
        });
      }

      // Update performance metrics
      const latency = performance.now() - startTime;
      this.updatePerformanceMetrics(latency);

      // Emit resize event
      eventBus.emitSync('window:resizing', {
        timestamp: Date.now()
      });

      // Clear RAF ID
      this.mouseMoveRafId = null;
    });
  }

  /**
   * Handle mouse up to end resize
   */
  private handleMouseUp(event: MouseEvent): void {
    if (this.activeResizes.size === 0) return;

    const resizedWindows = Array.from(this.activeResizes.keys());

    // End all active resizes
    for (const windowId of resizedWindows) {
      this.endResize(windowId);
    }

    // Clean up RAF if still pending
    if (this.mouseMoveRafId) {
      cancelAnimationFrame(this.mouseMoveRafId);
      this.mouseMoveRafId = null;
    }

    // Remove global listeners (using the same bound handler references)
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
  }

  /**
   * End resize operation
   */
  private endResize(windowId: string): void {
    const resizeState = this.activeResizes.get(windowId);
    if (!resizeState) return;

    const store = getWindowStore(windowId);
    if (!store) return;

    // Update FSM state
    windowFSMManager.endResizeWindow(windowId);

    // Update window store
    store.update('isResizing', false);

    // Hide handles
    const handles = this.resizeHandles.get(windowId);
    if (handles) {
      handles.forEach(handle => {
        if (handle.element) {
          handle.element.style.opacity = '0';
        }
      });
    }

    // Clean up
    this.activeResizes.delete(windowId);

    // Emit resize end event
    eventBus.emitSync('window:resize_end', {
      id: windowId,
      finalWidth: store.state.width,
      finalHeight: store.state.height,
      timestamp: Date.now()
    });
  }

  /**
   * Handle ResizeObserver callback
   */
  private handleResize(entries: ResizeObserverEntry[]): void {
    const startTime = performance.now();

    for (const entry of entries) {
      const windowElement = entry.target as HTMLElement;
      const windowId = windowElement.getAttribute('data-window-id');

      if (!windowId) continue;

      // Skip if we're actively resizing (handles dimensions via mouse events)
      if (this.activeResizes.has(windowId)) continue;

      // Handle programmatic or external resize
      this.pendingUpdates.add(windowId);
    }

    // Batch updates with RAF for performance
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.processPendingUpdates();
        this.rafId = null;
      });
    }

    // Update performance metrics
    const latency = performance.now() - startTime;
    this.updatePerformanceMetrics(latency);
  }

  /**
   * Process pending resize updates
   */
  private processPendingUpdates(): void {
    for (const windowId of this.pendingUpdates) {
      const store = getWindowStore(windowId);
      if (!store) continue;

      const windowElement = document.querySelector(`.window[data-window-id="${windowId}"]`) as HTMLElement;
      if (!windowElement) continue;

      const rect = windowElement.getBoundingClientRect();

      // Update store with new dimensions if they changed
      if (rect.width !== store.state.width || rect.height !== store.state.height) {
        store.set({
          width: rect.width,
          height: rect.height
        });

        // Emit resize event
        eventBus.emitSync('window:resized', {
          id: windowId,
          width: rect.width,
          height: rect.height,
          timestamp: Date.now()
        });
      }
    }

    this.pendingUpdates.clear();
    updateWindowsSignal();
  }

  /**
   * Handle resize start from FSM
   */
  private handleResizeStart(windowId: string): void {
    const store = getWindowStore(windowId);
    if (store) {
      store.update('isResizing', true);
    }
  }

  /**
   * Handle resize end from FSM
   */
  private handleResizeEnd(windowId: string): void {
    const store = getWindowStore(windowId);
    if (store) {
      store.update('isResizing', false);
    }

    this.activeResizes.delete(windowId);
  }

  /**
   * Clean up resize handles for a window
   */
  private cleanupResizeHandles(windowId: string): void {
    const handles = this.resizeHandles.get(windowId);
    if (handles) {
      handles.forEach(handle => {
        if (handle.element && handle.element.parentNode) {
          handle.element.parentNode.removeChild(handle.element);
        }
      });
      this.resizeHandles.delete(windowId);
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(latency: number): void {
    this.resizeCount++;
    this.lastResizeTime = Date.now();

    // Calculate rolling average latency
    if (this.averageResizeLatency === 0) {
      this.averageResizeLatency = latency;
    } else {
      this.averageResizeLatency = (this.averageResizeLatency * 0.9) + (latency * 0.1);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      totalResizes: this.resizeCount,
      averageLatency: this.averageResizeLatency,
      lastResizeTime: this.lastResizeTime,
      activeResizes: this.activeResizes.size,
      observedWindows: this.resizeObserver ? 'unknown' : 0 // ResizeObserver doesn't expose observed elements count
    };
  }

  /**
   * Destroy the resize manager and clean up resources
   */
  destroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.mouseMoveRafId) {
      cancelAnimationFrame(this.mouseMoveRafId);
      this.mouseMoveRafId = null;
    }

    this.resizeObserver.disconnect();
    this.resizeHandles.clear();
    this.activeResizes.clear();
    this.pendingUpdates.clear();

    // Clean up event listeners
    eventBus.offAll('resize-manager');
  }
}

/**
 * Global resize manager instance
 */
export const resizeManager = new ResizeManager();