import { eventBus } from '../event-bus';
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
    findWindowElement
} from './utils';

export class WindowService {
    // ==== Constants ====
    private static readonly TASKBAR_HEIGHT = 48;
    // Allow for tiny jitter when comparing maximized geometry (scrollbar/zoom)
    private static readonly GEOM_EPS = 1; // px

    // ==== Small Utils ====

    private emit<T extends object>(name: string, payload: T): void {
        eventBus.emitSync(name, payload);
    }

    private withStore(id: string, fn: (store: WindowStore) => void): void {
        const store = getWindowStore(id);
        if (!store) return;
        fn(store);
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

        // Scoped listener cleanup
        eventBus.offAll(`window:${id}*`);

        // If you later track per-window observers, unobserve here.
        // (ResizeObserver is centralized in your module setup.)

        removeWindowStore(id);

        this.emit('window:closed', {
            id,
            pluginId: win.pluginId,
            title: win.title
        });
    }

    minimizeWindow(id: string) {
        this.withStore(id, (store) => {
            const win = store.state;
            if (win.state === 'minimized') return;

            const wasMaximized = win.state === 'maximized';
            const originalState: WindowState = wasMaximized ? 'maximized' : 'normal';

            // Visual hint (optional CSS), not awaited
            store.update('state', 'minimizing');
            this.emit('window:minimizing', { id, pluginId: win.pluginId, title: win.title });

            // Snapshot before hiding
            const prev = { x: win.x, y: win.y, width: win.width, height: win.height, state: originalState };
            store.set({
                previousState: prev,
                state: 'minimized',
                focused: false
            });

            this.emit('window:minimized', { id, pluginId: win.pluginId, title: win.title });

            const el = findWindowElement(id);
            if (el) {
                // Fire-and-forget animation
                animateWindowMinimize(el).catch(() => {/* ignore */});
            }
        });
    }

    maximizeWindow(id: string) {
        this.withStore(id, (store) => {
            const win = store.state;
            if (this.isLogicallyMaximized(win)) return;

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
        if (this.isLogicallyMaximized(win)) this.restoreWindow(id);
        else this.maximizeWindow(id);
    }

    restoreWindow(id: string) {
        this.withStore(id, (store) => {
            const win = store.state;
            const prev = win.previousState;
            if (!prev) return;

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
}
