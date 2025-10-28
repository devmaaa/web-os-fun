import { createStore } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { onCleanup } from 'solid-js';
import { eventBus } from '../event-bus';
import { Window, WindowStore } from './types';

// Granular window stores - one store per window for optimal performance
const windowStores = new Map<string, WindowStore>();
const [nextZIndex, setNextZIndex] = createSignal(1000);

// Create a reactive store for window list to enable SolidJS reactivity
const [windowsSignal, setWindowsSignal] = createStore([] as Window[]);

// Version signal to force reactivity updates
const [windowsVersion, setWindowsVersion] = createSignal(0);

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

export function createWindowStore(initial: Window): WindowStore {
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

export function addWindowStore(window: Window): WindowStore {
  const store = createWindowStore(window);
  windowStores.set(window.id, store);
  updateWindowsSignal();
  return store;
}

export function removeWindowStore(id: string): WindowStore | undefined {
  const store = windowStores.get(id);
  if (store) {
    windowStores.delete(id);
    updateWindowsSignal();
  }
  return store;
}

export function getWindowStore(id: string): WindowStore | undefined {
  return windowStores.get(id);
}

export function getAllWindowStores(): Map<string, WindowStore> {
  return new Map(windowStores);
}

export function getAllWindows(): Window[] {
  return Array.from(windowStores.values()).map(store => store.state);
}

export function getWindowsSignal() {
  return windowsSignal;
}


export function updateWindowsSignal() {
  const currentWindows = Array.from(windowStores.values()).map(store => store.state);
  setWindowsSignal(currentWindows);
  setWindowsVersion(v => v + 1); // Force reactivity
}

export function getWindowsVersion() {
  return windowsVersion();
}

export function getNextZIndex(): number {
  const current = nextZIndex();
  setNextZIndex(current + 1);
  return current;
}

export function scheduleWindowUpdate(windowId: string) {
  scheduleUpdate(windowId);
}

export function clearAllStores() {
  windowStores.clear();
  updateWindowsSignal();
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

