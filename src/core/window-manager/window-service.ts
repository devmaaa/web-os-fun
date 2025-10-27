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


export class WindowService {
    // ==== Constants ====
    private static readonly TASKBAR_HEIGHT = 48;
    // Allow for tiny jitter when comparing maximized geometry (scrollbar/zoom)
    private static readonly GEOM_EPS = 1; // px

    // FSM state management
    private windowFSMs = new Map<string, FSM<any, any>>();

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
        return this.windowFSMs.get(id);
    }

    private createWindowFSM(id: string, windowData: Partial<Window>): FSM<any, any> {
        const fsm = createWindow(id, {
            windowId: id,
            pluginId: windowData.pluginId || 'unknown',
            title: windowData.title || 'Window',
            x: windowData.x ?? 100,
            y: windowData.y ?? 100,
            width: windowData.width ?? 400,
            height: windowData.height ?? 300,
            resizable: true,
            maximizable: true,
            minimizable: true,
            focused: false,
            zOrder: 0
        });

        this.windowFSMs.set(id, fsm);
        return fsm;
    }

    private destroyWindowFSM(id: string): void {
        const fsm = this.windowFSMs.get(id);
        if (fsm) {
            // Ensure window is closed before destroying FSM
            if (fsm.getState() !== 'closed') {
                fsm.transition('close');
            }
            this.windowFSMs.delete(id);
            destroyWindow(id);
        }
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
        const stateMapping: Record<string, WindowState> = {
            'closed': 'normal',
            'opening': 'opening',
            'normal': 'normal',
            'minimizing': 'minimizing',
            'minimized': 'minimized',
            'maximizing': 'maximizing',
            'maximized': 'maximized',
            'restoring': 'restoring',
            'closing': 'closing'
        };
        return stateMapping[fsmState] as WindowState || 'normal';
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
        const expectedHeight = b.height - WindowService.TASKBAR_HEIGHT;
        const eq = (a: number, b: number) => Math.abs(a - b) <= WindowService.GEOM_EPS;
        return (
            eq(win.x, b.offsetLeft) &&
            eq(win.y, b.offsetTop) &&
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
        const newWindow: Window = {
            id: `${pluginId}-${Date.now()}`,
            title,
            pluginId,
            x: options.x ?? 100 + currentCount * 50,
            y: options.y ?? 100 + currentCount * 50,
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
        console.log('🔥🔥 [WindowService] minimizeWindow called with ID:', id);
        const fsm = this.getFSM(id);
        console.log('🔥🔥 [WindowService] FSM for window:', fsm);
        console.log('🔥🔥 [WindowService] Can minimize?', fsm?.can('minimize'));

        if (!fsm || !fsm.can('minimize')) {
            console.warn(`[WindowService] Cannot minimize window "${id}" - FSM state doesn't allow it`);
            return;
        }

        // Wrap the whole store update/animation in 'withStore'
        console.log('🔥🔥 [WindowService] About to call withStoreAsync');
        await this.withStoreAsync(id, async (store) => {
            console.log('🔥🔥 [WindowService] Inside withStoreAsync');
            const win = store.state;
            console.log('🔥🔥 [WindowService] Current window state:', win.state);
            if (win.state === 'minimized') {
                console.log('🔥🔥 [WindowService] Window already minimized, returning');
                return;
            }

            // Animation cancellation is now handled internally by the genie functions
            console.log('🔥🔥 [WindowService] About to start FSM transition');

            // Use FSM to handle minimization
            fsm.transition('minimize');

            const wasMaximized = win.state === 'maximized';
            const originalState: WindowState = wasMaximized ? 'maximized' : 'normal';

            // Visual hint (optional CSS)
            store.update('state', 'minimizing');
            this.emit('window:minimizing', { id, pluginId: win.pluginId, title: win.title });

            // Snapshot previous geometry BEFORE hiding
            const prev = { x: win.x, y: win.y, width: win.width, height: win.height, state: originalState };
            store.set({
                previousState: prev,
                // Do not set 'minimized' yet — wait until animation completes. This avoids UI removing the element mid-animation.
                focused: false
            });

            // Find DOM element and start animation
            const el = findWindowElement(id);
            console.log('[WindowService] Found element for animation:', el);
            console.log('[WindowService] Window ID for animation:', id);
            if (el) {
                try {
                    console.log('[WindowService] About to call animateWindowGenieLamp');
                    console.log('[WindowService] Element visibility before animation:', el.style.visibility);
                    await animateWindowGenieLamp(el, id);
                    console.log('[WindowService] Animation completed successfully');
                    console.log('[WindowService] Element visibility after animation:', el.style.visibility);
                } catch (error) {
                    console.error('[WindowService] Animation failed:', error);
                }
            } else {
                console.warn('[WindowService] No element found for window ID:', id);
            }

            // After animation finishes, hide (Final: hide) and mark minimized in store
            store.set({
                state: 'minimized',
                focused: false
            });

            this.emit('window:minimized', { id, pluginId: win.pluginId, title: win.title });
        });
    }

    // new helper: an async wrapper for withStore so we can await animation inside it.
    private async withStoreAsync(id: string, fn: (store: WindowStore) => Promise<void> | void): Promise<void> {
        console.log('🔥🔥 [withStoreAsync] Called with ID:', id);
        const store = getWindowStore(id);
        console.log('🔥🔥 [withStoreAsync] Store found:', !!store);
        if (!store) {
            console.warn('🔥🔥 [withStoreAsync] No store found for ID:', id);
            return;
        }
        console.log('🔥🔥 [withStoreAsync] About to execute function');
        try {
            const result = Promise.resolve(fn(store));
            console.log('🔥🔥 [withStoreAsync] Function executed, returning promise');
            return result;
        } catch (error) {
            console.error('🔥🔥 [withStoreAsync] Error in function:', error);
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
                y: b.offsetTop,
                width: b.width,
                height: b.height - WindowService.TASKBAR_HEIGHT,
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

    async restoreWindow(id: string) {
        const fsm = this.getFSM(id);

        if (!fsm || !fsm.can('restore')) {
            console.warn(`[WindowService] Cannot restore window "${id}" - FSM state doesn't allow it.`);
            return;
        }

        await this.withStoreAsync(id, async (store) => {
            const win = store.state;
            const prev = win.previousState;

            if (!prev) {
                console.warn(`[WindowService] No previous state to restore for window "${id}".`);
                // If no previous state, just set to normal and focus.
                store.update('state', 'normal');
                this.focusWindow(id);
                return;
            }

            // 1. Set restoring state to have the element in DOM but keep it invisible
            fsm.transition('restore');
            store.update('state', 'restoring');
            this.emit('window:restoring', { id, pluginId: win.pluginId, title: win.title });

            // Wait for SolidJS to render the element
            await new Promise(r => setTimeout(r, 0));

            const el = findWindowElement(id);

            if (el) {
                // 2. Run animation
                el.style.visibility = 'hidden';
                try {
                    await animateWindowGenieReverse(el, id);
                } catch (error) {
                    console.error('[WindowService] Reverse animation failed:', error);
                }
                el.style.visibility = 'visible';
            } else {
                console.warn('[WindowService] Could not find window element for restore animation:', id);
            }

            // 3. Set final state from `previousState`
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

    // FSM-specific methods
    getFSMState(id: string): string | undefined {
        const fsm = this.getFSM(id);
        return fsm?.getState();
    }

    canExecuteOperation(id: string, operation: 'close' | 'minimize' | 'maximize' | 'restore' | 'focus'): boolean {
        const fsm = this.getFSM(id);
        return fsm ? fsm.can(operation) : false;
    }

    getFSMStats() {
        return {
            totalWindows: this.windowFSMs.size,
            activeWindows: Array.from(this.windowFSMs.values()).filter(fsm => fsm.isEnabled()).length,
            fsmStates: Array.from(this.windowFSMs.entries()).map(([id, fsm]) => ({
                windowId: id,
                state: fsm.getState(),
                enabled: fsm.isEnabled()
            }))
        };
    }
}
