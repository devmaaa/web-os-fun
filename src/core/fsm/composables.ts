import { createSignal, onCleanup, onMount, batch } from 'solid-js';
import { useEventBus } from '@composables/useEventBus';
import { getWindow, getPlugin } from './index';
import type { FSM } from './types';
import type { FSMState, FSMEvent, FSMTransitionEvent, FSMErrorEvent } from './types';

/**
 * Reactive FSM state signal
 *
 * Creates a SolidJS signal that automatically updates when the FSM state changes.
 * Perfect for UI components that need to react to FSM transitions.
 *
 * @param fsm The FSM instance to observe
 * @returns Signal containing current state and transition function
 */
export function useFSMState<S extends string, E extends string>(fsm: FSM<S, E>) {
  const [state, setState] = createSignal<S>(fsm.getState());
  const [enabled, setEnabled] = createSignal<boolean>(fsm.isEnabled());
  const [lastTransition, setLastTransition] = createSignal<FSMTransitionEvent | null>(null);
  const [lastError, setLastError] = createSignal<FSMErrorEvent | null>(null);

  const fsmId = fsm.getId();

  // Subscribe to FSM transition events
  const unsubscribeTransition = useEventBus('fsm:transition', (event: FSMTransitionEvent) => {
    if (event.id === fsmId) {
      batch(() => {
        setState(() => event.to as S);
        setLastTransition(() => event);
      });
    }
  });

  // Subscribe to FSM error events
  const unsubscribeError = useEventBus('fsm:error', (event: FSMErrorEvent) => {
    if (event.id === fsmId) {
      batch(() => {
        setLastError(() => event);
      });
    }
  });

  // Subscribe to FSM reset events
  const unsubscribeReset = useEventBus('fsm:reset', (event: any) => {
    if (event.id === fsmId) {
      batch(() => {
        setState(() => event.to as S);
        setLastTransition(() => null);
        setLastError(() => null);
      });
    }
  });

  // Subscribe to FSM enabled/disabled events
  const unsubscribeEnabled = useEventBus('fsm:disabled-all', () => {
    setEnabled(() => false);
  });

  const unsubscribeEnabledAll = useEventBus('fsm:enabled-all', () => {
    setEnabled(() => true);
  });

  // Cleanup on component unmount
  onCleanup(() => {
    unsubscribeTransition();
    unsubscribeError();
    unsubscribeReset();
    unsubscribeEnabled();
    unsubscribeEnabledAll();
  });

  // Return reactive interface
  return {
    state,
    enabled,
    lastTransition,
    lastError,

    // Convenience methods
    can: (event: E) => fsm.can(event),
    transition: (event: E) => fsm.transition(event),
    getPossibleEvents: () => fsm.getPossibleEvents(),
    getContext: () => fsm.getContext(),
    updateContext: (updates: any) => fsm.updateContext(updates)
  };
}

/**
 * Create a reactive FSM signal from EventBus events
 *
 * Useful when you don't have direct FSM access but want to react to FSM events.
 *
 * @param fsmId The ID of the FSM to observe
 * @param initialState Initial state value
 * @returns Signal containing current state
 */
export function createFSMSignal<S extends string>(
  fsmId: string,
  initialState: S
) {
  const [state, setState] = createSignal<S>(initialState);
  const [lastTransition, setLastTransition] = createSignal<FSMTransitionEvent | null>(null);

  // Subscribe to FSM transition events
  const unsubscribeTransition = useEventBus('fsm:transition', (event: FSMTransitionEvent) => {
    if (event.id === fsmId) {
      batch(() => {
        setState(() => event.to as S);
        setLastTransition(() => event);
      });
    }
  });

  // Subscribe to FSM reset events
  const unsubscribeReset = useEventBus('fsm:reset', (event: any) => {
    if (event.id === fsmId) {
      batch(() => {
        setState(() => event.to as S);
        setLastTransition(() => null);
      });
    }
  });

  // Cleanup on component unmount
  onCleanup(() => {
    unsubscribeTransition();
    unsubscribeReset();
  });

  return [state, lastTransition] as const;
}

/**
 * Reactive FSM metrics signal
 *
 * Creates a signal that tracks FSM performance metrics like transition count,
 * error count, and timing information.
 *
 * @param fsmId The ID of the FSM to observe
 * @returns Signal containing FSM metrics
 */
export function createFSMMetricsSignal(fsmId: string) {
  const [metrics, setMetrics] = createSignal({
    transitionCount: 0,
    errorCount: 0,
    lastTransitionTime: 0,
    averageTransitionTime: 0
  });

  let transitionTimes: number[] = [];

  // Subscribe to FSM transition events
  const unsubscribeTransition = useEventBus('fsm:transition', (event: FSMTransitionEvent) => {
    if (event.id === fsmId) {
      const currentTime = Date.now();
      transitionTimes.push(currentTime);

      // Keep only last 100 transitions for average calculation
      if (transitionTimes.length > 100) {
        transitionTimes = transitionTimes.slice(-100);
      }

      setMetrics(current => ({
        ...current,
        transitionCount: current.transitionCount + 1,
        lastTransitionTime: currentTime
      }));
    }
  });

  // Subscribe to FSM error events
  const unsubscribeError = useEventBus('fsm:error', (event: FSMErrorEvent) => {
    if (event.id === fsmId) {
      setMetrics(current => ({
        ...current,
        errorCount: current.errorCount + 1
      }));
    }
  });

  // Cleanup on component unmount
  onCleanup(() => {
    unsubscribeTransition();
    unsubscribeError();
  });

  return metrics;
}

/**
 * FSM state machine hook with transition handlers
 *
 * Provides a complete interface for working with FSMs in UI components,
 * including support for custom transition handlers and side effects.
 *
 * @param fsm The FSM instance
 * @param handlers Optional transition handlers
 * @returns Complete FSM interface with reactive state
 */
export function useFSM<S extends string, E extends string>(
  fsm: FSM<S, E>,
  handlers?: Partial<Record<E, (from: S, to: S, event: E) => void>>
) {
  const fsmState = useFSMState(fsm);
  const fsmId = fsm.getId();

  // Track transition history
  const [history, setHistory] = createSignal<FSMTransitionEvent[]>([]);

  // Subscribe to transition events for history tracking
  const unsubscribeHistory = useEventBus('fsm:transition', (event: FSMTransitionEvent) => {
    if (event.id === fsmId) {
      setHistory(current => [...current, event].slice(-50)); // Keep last 50 transitions
    }
  });

  // Wrap transition method with handlers
  const transition = (event: E): S | null => {
    const fromState = fsm.getState();
    const toState = fsm.transition(event);

    if (toState && handlers?.[event]) {
      // Call custom handler after successful transition
      handlers[event](fromState, toState, event);
    }

    return toState;
  };

  // Cleanup on component unmount
  onCleanup(() => {
    unsubscribeHistory();
  });

  return {
    ...fsmState,
    history,
    transition,

    // Additional convenience methods
    inspect: () => fsm.inspect(),
    reset: (newState: S) => fsm.reset(newState),
    setEnabled: (enabled: boolean) => fsm.setEnabled(enabled)
  };
}

/**
 * Window FSM specific composable
 *
 * Pre-configured for window lifecycle FSMs with common window operations.
 *
 * @param windowId The window ID to observe
 * @returns Window-specific FSM interface
 */
export function useWindowFSM(windowId: string) {
  const fsm = getWindow(`window:${windowId}`);
  if (!fsm) {
    console.warn(`[WindowFSM] Window "${windowId}" not found`);
    // Return empty interface to prevent undefined access
    return {
      state: () => 'closed' as any,
      enabled: () => false,
      lastTransition: () => null,
      lastError: () => null,
      can: () => false,
      transition: () => null,
      getPossibleEvents: () => [],
      getContext: () => undefined,
      updateContext: () => {}
    };
  }

  return useFSM(fsm, {
    minimize: () => {
      // Auto-minimize animation logic could go here
    },
    maximize: () => {
      // Auto-maximize animation logic could go here
    },
    close: () => {
      // Auto-close animation logic could go here
    }
  });
}

/**
 * Plugin FSM specific composable
 *
 * Pre-configured for plugin lifecycle FSMs with common plugin operations.
 *
 * @param pluginId The plugin ID to observe
 * @returns Plugin-specific FSM interface
 */
export function usePluginFSM(pluginId: string) {
  const fsm = getPlugin(`plugin:${pluginId}`);
  if (!fsm) {
    console.warn(`[PluginFSM] Plugin "${pluginId}" not found`);
    // Return empty interface to prevent undefined access
    return {
      state: () => 'unloaded' as any,
      enabled: () => false,
      lastTransition: () => null,
      lastError: () => null,
      can: () => false,
      transition: () => null,
      getPossibleEvents: () => [],
      getContext: () => undefined,
      updateContext: () => {}
    };
  }

  return useFSM(fsm, {
    load: () => {
      // Show loading indicator
    },
    error: () => {
      // Show error notification
    },
    unload: () => {
      // Show unloading indicator
    }
  });
}

/**
 * FSM Registry composable
 *
 * Provides reactive access to the global FSM registry for debugging and diagnostics.
 *
 * @returns Registry interface with reactive data
 */
export function useFSMRegistry() {
  const [fsmList, setFsmList] = createSignal<string[]>([]);
  const [registryStats, setRegistryStats] = createSignal<any>(null);
  const [diagnostics, setDiagnostics] = createSignal<any>(null);

  // Subscribe to registry events
  const unsubscribeRegistered = useEventBus('fsm:registered', (event: any) => {
    setFsmList(current => [...current, event.id]);
  });

  const unsubscribeUnregistered = useEventBus('fsm:unregistered', (event: any) => {
    setFsmList(current => current.filter(id => id !== event.id));
  });

  // Fetch initial data
  onMount(async () => {
    const { fsmRegistry } = await import('./registry');

    // Set initial FSM list
    setFsmList(fsmRegistry.list());

    // Set initial stats
    setRegistryStats(fsmRegistry.getStats());

    // Set initial diagnostics
    setDiagnostics(fsmRegistry.getDiagnostics());
  });

  // Cleanup on component unmount
  onCleanup(() => {
    unsubscribeRegistered();
    unsubscribeUnregistered();
  });

  return {
    fsmList,
    registryStats,
    diagnostics,

    // Convenience methods
    refresh: async () => {
      const { fsmRegistry } = await import('./registry');
      setRegistryStats(fsmRegistry.getStats());
      setDiagnostics(fsmRegistry.getDiagnostics());
    },

    getFSM: async (id: string) => {
      const { getFSM } = await import('./registry');
      return getFSM(id);
    }
  };
}

/**
 * FSM Inspector composable
 *
 * Provides a developer-friendly interface for inspecting and debugging FSMs.
 * Perfect for devtools and debugging components.
 *
 * @returns Inspector interface with detailed FSM information
 */
export function useFSMInspector() {
  const [selectedFSM, setSelectedFSM] = createSignal<string | null>(null);
  const [selectedFSMData, setSelectedFSMData] = createSignal<any>(null);
  const registry = useFSMRegistry();

  // Select FSM to inspect
  const inspectFSM = async (fsmId: string) => {
    setSelectedFSM(fsmId);

    const fsm = await registry.getFSM(fsmId);
    if (fsm) {
      setSelectedFSMData(fsm.inspect());
    } else {
      setSelectedFSMData(null);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedFSM(null);
    setSelectedFSMData(null);
  };

  return {
    selectedFSM,
    selectedFSMData,
    registry,
    inspectFSM,
    clearSelection
  };
}