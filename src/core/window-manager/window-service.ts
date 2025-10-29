import { eventBus } from '../event-bus';
import { createWindow, getWindow, destroyWindow, windowFSMManager } from '@core/fsm';
import type { FSM } from '@core/fsm';
import { Window, WindowOptions, WindowStore, WindowState, SnapEdge } from './types';
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
    findWindowElement,
    animateWindowGenieLamp,
    animateWindowGenieReverse
} from './utils';
import { resizeManager } from './resize-manager';
import type { ResizeHandle } from './use-resize-calculations';


export class WindowService {
    // ==== Constants ====
    private static readonly TASKBAR_HEIGHT = 48;
    private static readonly MENUBAR_HEIGHT = 26; // MenuBar height from MenuBar.tsx
    // Allow for tiny jitter when comparing maximized geometry (scrollbar/zoom)
    private static readonly GEOM_EPS = 1; // px

    // FSM state management is now handled globally by windowFSMManager

    // Animation tracking is now handled internally by the genie functions

    // ==== Small Utils ====

    private emit<T extends object>(name: string, payload: T): void {
        eventBus.emitSync(name, payload);
    }

    private withStore(id: string, fn: (store: WindowStore) => void): void {
        const store = getWindowStore(id);
        if (!store) return;
        fn(store);
    }

    private getFSM(id: string): FSM<any, any> | undefined {
        return getWindow(id);
    }

    private createWindowFSM(id: string, windowData: Partial<Window>): FSM<any, any> {
        return createWindow(id, windowData);
    }

    private destroyWindowFSM(id: string): void {
        destroyWindow(id);
    }

    private syncWindowStateWithFSM(id: string): void {
        const store = getWindowStore(id);
        const fsm = this.getFSM(id);

        if (store && fsm) {
            const fsmState = fsm.getState();
            const windowState = this.mapFSMStateToWindowState(fsmState);

            if (store.state.state !== windowState) {
                store.update('state', windowState);
            }
        }
    }

    private mapFSMStateToWindowState(fsmState: string): WindowState {
        // Most FSM states map directly to window states
        return ['opening', 'minimizing', 'minimized', 'maximizing', 'maximized', 'restoring', 'resizing', 'closing'].includes(fsmState)
            ? fsmState as WindowState
            : 'normal'; // 'closed' and 'normal' both map to 'normal'
    }

    private getBounds() {
        return getScreenBounds();
    }

    private setGeom(store: WindowStore, x: number, y: number, width: number, height: number) {
        store.set({ x, y, width, height });
    }

    private savePreviousStateOnce(win: Window, store: WindowStore) {
        // Save only if we don't have a non-maximized previous or the previous was 'maximized'
        if (!win.previousState || win.previousState.state === 'maximized') {
            store.update('previousState', {
                x: win.x,
                y: win.y,
                width: win.width,
                height: win.height,
                state: win.state
            });
        }
    }

    private isGeometryMaximized(win: Window): boolean {
        const b = this.getBounds();
        const expectedHeight = b.height - WindowService.MENUBAR_HEIGHT; // Height minus MenuBar
        const expectedY = b.offsetTop + WindowService.MENUBAR_HEIGHT; // Start below MenuBar
        const eq = (a: number, b: number) => Math.abs(a - b) <= WindowService.GEOM_EPS;
        return (
            eq(win.x, b.offsetLeft) &&
            eq(win.y, expectedY) &&
            eq(win.width, b.width) &&
            eq(win.height, expectedHeight)
        );
    }

    private isLogicallyMaximized(win: Window): boolean {
        return win.state === 'maximized' || this.isGeometryMaximized(win);
    }

    private getWindowsSnapshot() {
        // Single call snapshot for functions that need to iterate
        return getAllWindows();
    }

    // ==== Public API (unchanged) ====

    openWindow(pluginId: string, title: string, options: WindowOptions = {}) {
        const windows = this.getWindowsSnapshot();
        const existing = windows.find(w => w.pluginId === pluginId);
        if (existing) {
            if (existing.state === 'minimized') {
                this.restoreWindow(existing.id);
            } else {
                this.focusWindow(existing.id);
            }
            return;
        }

        const currentCount = windows.length;
        const newWindowWidth = options.width ?? 800;
        const newWindowHeight = options.height ?? 600;

        // Removed excessive debug logging for memory efficiency

        const newWindow: Window = {
            id: `${pluginId}-${Date.now()}`,
            title,
            pluginId,
            x: options.x ?? 100 + currentCount * 50,
            y: options.y ?? 100 + currentCount * 50,
            width: newWindowWidth,
            height: newWindowHeight,
            state: 'normal',
            focused: true,
            zIndex: getNextZIndex(),
            selected: false,
            alwaysOnTop: options.alwaysOnTop ?? false,
            opacity: 1,
            isDragging: false,
            isResizing: false,
            isPreview: false,
            minWidth: options.minWidth ?? 200,
            minHeight: options.minHeight ?? 150,
            resizable: options.resizable ?? true,
            component: options.component,
            props: options.props,
            createdAt: new Date(),
        };

        const constrained = constrainPosition(newWindow.x, newWindow.y, newWindow.width, newWindow.height);
        newWindow.x = constrained.x;
        newWindow.y = constrained.y;

        // Create FSM for the window
        const fsm = this.createWindowFSM(newWindow.id, newWindow);

        // Start FSM lifecycle - complete the full transition to normal state
        if (fsm.transition('open')) { // closed -> opening
            fsm.transition('open');    // opening -> normal
            // Sync window state with final FSM state
            this.syncWindowStateWithFSM(newWindow.id);
        }

        addWindowStore(newWindow);

        // Blur others if focused
        for (const w of windows) {
            if (w.id !== newWindow.id && w.focused) this.blurWindow(w.id);
        }

        this.emit('window:opened', {
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
        const win = store.state;
        const fsm = this.getFSM(id);

        // Use FSM to handle the close operation
        if (fsm && fsm.can('close')) {
            fsm.transition('close');
        }

        // Scoped listener cleanup
        eventBus.offAll(`window:${id}*`);

        // If you later track per-window observers, unobserve here.
        // (ResizeObserver is centralized in your module setup.)

        removeWindowStore(id);

        // Clean up FSM
        this.destroyWindowFSM(id);

        this.emit('window:closed', {
            id,
            pluginId: win.pluginId,
            title: win.title
        });
    }

    async minimizeWindow(id: string) {
        const fsm = this.getFSM(id);
        if (!fsm || !fsm.can('minimize')) {
            console.warn(`[WindowService] Cannot minimize window "${id}" - FSM state doesn't allow it`);
            return;
        }

        await this.withStoreAsync(id, async (store) => {
            const win = store.state;
            if (win.state === 'minimized') return;

            // Use FSM to handle minimization
            fsm.transition('minimize');

            const wasMaximized = win.state === 'maximized';

            // Visual hint (optional CSS)
            store.update('state', 'minimizing');
            this.emit('window:minimizing', { id, pluginId: win.pluginId, title: win.title });

            // If minimizing from maximized, don't overwrite the existing previousState
            // (which should contain the original normal state from before maximization)
            if (!wasMaximized) {
                // Only save previousState if we're not minimizing from maximized
                const prev = { x: win.x, y: win.y, width: win.width, height: win.height, state: 'normal' };
                store.set({
                    previousState: prev,
                    focused: false
                });
            } else {
                // When minimizing from maximized, just update focus, keep previousState intact
                store.update('focused', false);
            }

            // Find DOM element and start animation
            const el = findWindowElement(id);
            if (el) {
                try {
                    await animateWindowGenieLamp(el, id);
                } catch (error) {
                    console.error('[WindowService] Animation failed:', error);
                }
            }

            // After animation finishes, hide and mark minimized in store
            store.set({
                state: 'minimized',
                focused: false
            });

            this.emit('window:minimized', { id, pluginId: win.pluginId, title: win.title });
        });
    }

    // Async wrapper for withStore so we can await animation inside it
    private async withStoreAsync(id: string, fn: (store: WindowStore) => Promise<void> | void): Promise<void> {
        const store = getWindowStore(id);
        if (!store) return;

        try {
            return Promise.resolve(fn(store));
        } catch (error) {
            console.error('[WindowService] Error in async operation:', error);
            throw error;
        }
    }

    maximizeWindow(id: string) {
        const fsm = this.getFSM(id);
        if (!fsm || !fsm.can('maximize')) {
            console.warn(`[WindowService] Cannot maximize window "${id}" - FSM state doesn't allow it`);
            return;
        }

        this.withStore(id, (store) => {
            const win = store.state;
            if (this.isLogicallyMaximized(win)) return;

            // Use FSM to handle maximization
            fsm.transition('maximize');

            this.savePreviousStateOnce(win, store);

            const b = this.getBounds();
            store.set({
                state: 'maximized',
                x: b.offsetLeft,
                y: b.offsetTop + WindowService.MENUBAR_HEIGHT, // Account for MenuBar
                width: b.width,
                height: b.height - WindowService.MENUBAR_HEIGHT, // Full height minus MenuBar
            });

            // Re-render only when geometry or stacking changes
            updateWindowsSignal();

            this.emit('window:maximized', { id, pluginId: win.pluginId, title: win.title });
        });
    }

    toggleMaximizeWindow(id: string) {
        const store = getWindowStore(id);
        if (!store) return;
        const win = store.state;
        if (this.isLogicallyMaximized(win)) this.restoreWindowFromMaximize(id); // Use non-animated restore
        else this.maximizeWindow(id);
    }

    // Simple restore for maximize (no animation)
    restoreWindowFromMaximize(id: string) {
        const fsm = this.getFSM(id);
        if (!fsm || !fsm.can('restore')) {
            console.warn(`[WindowService] Cannot restore window "${id}" - FSM state doesn't allow it`);
            return;
        }

        this.withStore(id, (store) => {
            const win = store.state;
            const prev = win.previousState;
            if (!prev) return;

            // Restore geometry from previousState and clear previousState
            store.set({
                state: prev.state,
                x: prev.x,
                y: prev.y,
                width: prev.width,
                height: prev.height,
                previousState: undefined,
            });

            this.focusWindow(id);

            this.emit('window:restored', {
                id,
                pluginId: win.pluginId,
                title: win.title,
                fromState: prev.state
            });
        });
    }

    restoreWindow(id: string) {
        const fsm = this.getFSM(id);

        if (!fsm) {
            console.error(`[WindowService] No FSM found for window "${id}"`);
            return;
        }

        if (!fsm.can('restore')) {
            console.warn(`[WindowService] Cannot restore window "${id}" - FSM state "${fsm.getState()}" doesn't allow restore.`);
            return;
        }

        this.withStore(id, (store) => {
            const win = store.state;
            const prev = win.previousState;

            if (!prev) {
                console.warn(`[WindowService] No previous state to restore for window "${id}".`);
                // If no previous state, just restore to normal
                fsm.transition('restore');
                this.focusWindow(id);
                return;
            }

            // Use FSM to handle restoration - this goes: minimized -> restoring -> target state
            fsm.transition('restore');

            // If the previous state was maximized, we need to continue the transition
            if (prev.state === 'maximized') {
                // Complete the FSM transition to maximized
                fsm.transition('maximize');

                // Apply maximized geometry
                const b = this.getBounds();
                store.set({
                    state: 'maximized',
                    x: b.offsetLeft,
                    y: b.offsetTop + WindowService.MENUBAR_HEIGHT, // Account for MenuBar
                    width: b.width,
                    height: b.height - WindowService.MENUBAR_HEIGHT, // Full height minus MenuBar
                    previousState: undefined, // Clear previousState after successful restore
                });
            } else {
                // For normal state, use the stored geometry
                store.set({
                    state: prev.state,
                    x: prev.x,
                    y: prev.y,
                    width: prev.width,
                    height: prev.height,
                    previousState: undefined, // Clear previousState after successful restore
                });
            }

            this.focusWindow(id);

            this.emit('window:restored', {
                id,
                pluginId: win.pluginId,
                title: win.title,
                fromState: prev.state
            });
        });
    }

    focusWindow(id: string) {
        const windows = this.getWindowsSnapshot();
        const currentlyFocused = windows.find(w => w.focused);

        if (currentlyFocused && currentlyFocused.id === id) return;

        if (currentlyFocused) this.blurWindow(currentlyFocused.id);

        this.withStore(id, (store) => {
            const win = store.state;
            store.update('focused', true);
            this.bringToFront(id);
            this.emit('window:focused', { id, pluginId: win.pluginId, title: win.title });
        });
    }

    blurWindow(id: string) {
        this.withStore(id, (store) => {
            const win = store.state;
            if (!win.focused) return;
            store.update('focused', false);
            this.emit('window:blurred', { id, pluginId: win.pluginId, title: win.title });
        });
    }

    updateWindowPosition(id: string, x: number, y: number) {
        this.withStore(id, (store) => {
            const win = store.state;
            const c = constrainPosition(x, y, win.width, win.height);

            scheduleWindowUpdate(id);
            store.update('x', c.x);
            store.update('y', c.y);

            if (win.isDragging) updateWindowsSignal();
        });
    }

    updateWindowSize(id: string, width: number, height: number) {
        this.withStore(id, (store) => {
            const win = store.state;
            const c = constrainPosition(win.x, win.y, width, height);

            scheduleWindowUpdate(id);
            // Batch geometry updates
            store.set({ width, height, x: c.x, y: c.y });

            updateWindowsSignal();

            this.emit('window:resized', {
                id,
                pluginId: win.pluginId,
                title: win.title,
                width,
                height
            });
        });
    }

    private getSnapRect(edge: SnapEdge) {
        const b = this.getBounds();
        const halfW = b.width / 2;
        const halfH = b.height / 2;

        switch (edge) {
            case 'left':         return { x: b.offsetLeft, y: undefined, w: halfW, h: b.height };
            case 'right':        return { x: b.offsetLeft + halfW, y: undefined, w: halfW, h: b.height };
            case 'top':          return { x: b.offsetLeft, y: b.offsetTop, w: b.width, h: halfH };
            case 'bottom':       return { x: b.offsetLeft, y: b.offsetTop + halfH, w: b.width, h: halfH };
            case 'top-left':     return { x: b.offsetLeft, y: b.offsetTop, w: halfW, h: halfH };
            case 'top-right':    return { x: b.offsetLeft + halfW, y: b.offsetTop, w: halfW, h: halfH };
            case 'bottom-left':  return { x: b.offsetLeft, y: b.offsetTop + halfH, w: halfW, h: halfH };
            case 'bottom-right': return { x: b.offsetLeft + halfW, y: b.offsetTop + halfH, w: halfW, h: halfH };
        }
    }

    snapWindow(id: string, edge: SnapEdge) {
        this.withStore(id, (store) => {
            const win = store.state;
            const r = this.getSnapRect(edge);
            if (!r) return;

            // Keep y if not defined (left/right snaps)
            const newX = r.x!;
            const newY = r.y ?? win.y;
            const newW = r.w!;
            const newH = r.h!;

            store.set({ x: newX, y: newY, width: newW, height: newH, snapEdge: edge });
        });
    }

    selectWindow(id: string, multi = false) {
        if (!multi) this.clearSelection();
        this.withStore(id, (store) => store.update('selected', true));
    }

    deselectWindow(id: string) {
        this.withStore(id, (store) => store.update('selected', false));
    }

    clearSelection() {
        const windows = this.getWindowsSnapshot();
        for (const w of windows) {
            if (w.selected) this.deselectWindow(w.id);
        }
    }

    bringToFront(id: string) {
        this.withStore(id, (store) => {
            store.update('zIndex', getNextZIndex());
            updateWindowsSignal();
        });
    }

    sendToBack(id: string) {
        const windows = this.getWindowsSnapshot();
        if (windows.length === 0) return;

        const minZ = Math.min(...windows.map(w => w.zIndex));
        this.withStore(id, (store) => store.update('zIndex', minZ - 1));
    }

    setAlwaysOnTop(id: string, alwaysOnTop: boolean) {
        this.withStore(id, (store) => {
            store.update('alwaysOnTop', alwaysOnTop);
            if (alwaysOnTop) this.bringToFront(id);
        });
    }

    setWindowOpacity(id: string, opacity: number) {
        this.withStore(id, (store) => {
            const clamped = Math.max(0, Math.min(1, opacity));
            store.update('opacity', clamped);
        });
    }

    startDrag(id: string) {
        this.withStore(id, (store) => store.update('isDragging', true));
    }

    endDrag(id: string) {
        this.withStore(id, (store) => {
            store.set({ isDragging: false, snapEdge: undefined });
        });
    }

    startResize(id: string) {
        this.withStore(id, (store) => store.update('isResizing', true));
    }

    endResize(id: string) {
        this.withStore(id, (store) => store.update('isResizing', false));
    }

    setPreviewState(id: string) {
        this.withStore(id, (store) => store.update('isPreview', true));
    }

    clearPreviewState(id: string) {
        this.withStore(id, (store) => store.update('isPreview', false));
    }

    // ==== Resize Methods ====

    /**
     * Start resizing a window with specified handle
     */
    startWindowResize(id: string, handle: ResizeHandle, event: MouseEvent) {
        this.withStore(id, (store) => {
            const win = store.state;

            // Check if window is resizable
            if (!win.resizable) {
                console.warn(`[WindowService] Window "${id}" is not resizable`);
                return;
            }

            // Check FSM state
            if (!this.canResizeWindow(id)) {
                console.warn(`[WindowService] Cannot resize window "${id}" - FSM state doesn't allow it`);
                return;
            }

            // Update window state to show resize handle
            store.update('resizeHandle', handle);
            store.update('isResizing', true);

            // Delegate to resize manager for actual resize handling
            // The resize manager will handle FSM transitions
        });
    }

    /**
     * End resizing a window
     */
    endWindowResize(id: string) {
        this.withStore(id, (store) => {
            const win = store.state;

            if (!win.isResizing) {
                return;
            }

            // Update window state
            store.update('isResizing', false);
            store.update('resizeHandle', undefined);

            // FSM state will be handled by resize manager
        });
    }

    /**
     * Check if a window can be resized
     */
    canResizeWindow(id: string): boolean {
        const store = getWindowStore(id);
        if (!store) return false;

        const win = store.state;
        if (!win.resizable) return false;

        // Check FSM state
        const fsm = this.getFSM(id);
        if (!fsm) return false;

        return fsm.can('resize_start');
    }

    /**
     * Get resize performance metrics
     */
    getResizeMetrics() {
        return resizeManager.getPerformanceMetrics();
    }

    getSelectedWindows() {
        return this.getWindowsSnapshot().filter(w => w.selected);
    }

    getHighestZIndex() {
        const windows = this.getWindowsSnapshot();
        return windows.length > 0 ? Math.max(...windows.map(w => w.zIndex)) : 0;
    }

    constrainToScreen(id: string) {
        this.withStore(id, (store) => {
            const w = store.state;
            const c = constrainPosition(w.x, w.y, w.width, w.height);
            store.set({ x: c.x, y: c.y });
        });
    }

    getMinimizedWindows() {
        return this.getWindowsSnapshot().filter(w => w.state === 'minimized');
    }

    inspect() {
        const windows = this.getWindowsSnapshot();
        const focusedWindow = windows.find(w => w.focused);
        const z = windows.map(w => w.zIndex);
        return {
            totalWindows: windows.length,
            focusedWindow: focusedWindow?.id || null,
            zIndexRange: { min: z.length ? Math.min(...z) : 0, max: z.length ? Math.max(...z) : 0 },
            memoryUsage: windows.length * 150, // Estimated KB per window
            activeListeners: eventBus.getListenerCount('window:*') || 0
        };
    }

    // Expose window store access for ResizeObserver
    getWindowStore(id: string) {
        return getWindowStore(id);
    }

    // FSM-specific methods - delegate to global FSM manager
    getFSMState(id: string): string | undefined {
        const fsm = this.getFSM(id);
        return fsm?.getState();
    }

    canExecuteOperation(id: string, operation: 'close' | 'minimize' | 'maximize' | 'restore' | 'focus' | 'resize_start' | 'resize_end'): boolean {
        const fsm = this.getFSM(id);
        return fsm ? fsm.can(operation) : false;
    }
}
