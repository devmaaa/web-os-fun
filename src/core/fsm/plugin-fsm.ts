import { createFSM, registerFSM } from './index';
import type { PluginLifecycleStates, PluginLifecycleEvents } from './types';
import type { FSM } from './types';

/**
 * Plugin Lifecycle FSM Implementation
 *
 * Manages deterministic plugin state transitions for the PluginLoader.
 * Ensures safe startup, operation, and shutdown of plugins with proper cleanup.
 */

// Type-safe plugin states
type PluginState = PluginLifecycleStates[keyof PluginLifecycleStates];

// Type-safe plugin events
type PluginEvent = PluginLifecycleEvents[keyof PluginLifecycleEvents];

// Plugin FSM context
interface PluginContext {
  pluginId: string;
  displayName?: string;
  version?: string;
  manifest?: any;
  entryPath?: string;
  permissions?: string[];
  dependencies?: string[];
  startTime?: number;
  loadTime?: number;
  initTime?: number;
  errorCount?: number;
  lastError?: Error;
  metrics?: {
    memoryUsage?: number;
    eventListeners?: number;
    windowCount?: number;
  };
}

/**
 * Plugin transition table - defines all valid state transitions
 */
const PLUGIN_TRANSITIONS: Record<PluginState, Partial<Record<PluginEvent, PluginState>>> = {
  // Unloaded plugin can be discovered
  unloaded: {
    discover: 'discovering'
  },

  // Discovering plugin transitions to loading or back to unloaded
  discovering: {
    load: 'loading',
    recover: 'unloaded'
  },

  // Loading plugin transitions to loaded or error
  loading: {
    load: 'loaded',
    error: 'error',
    recover: 'unloaded'
  },

  // Loaded plugin can be initialized or unloaded
  loaded: {
    init: 'initializing',
    unload: 'unloading'
  },

  // Initializing plugin transitions to ready or error
  initializing: {
    init: 'ready',
    error: 'error',
    unload: 'unloading'
  },

  // Ready plugin can be started, stopped, or unloaded
  ready: {
    start: 'active',
    stop: 'ready', // Self-transition for stop operation
    unload: 'unloading'
  },

  // Active plugin is fully operational
  active: {
    stop: 'ready',
    unload: 'unloading',
    error: 'error'
  },

  // Unloading is a transitional state
  unloading: {
    unload: 'unloaded',
    error: 'error'
  },

  // Error state can be recovered or unloaded
  error: {
    recover: 'unloaded',
    unload: 'unloading'
  }
};

/**
 * Create a Plugin FSM instance
 *
 * @param pluginId Unique identifier for the plugin
 * @param initialContext Initial plugin context data
 * @returns FSM instance for the plugin
 */
export function createPluginFSM(
  pluginId: string,
  initialContext: Partial<PluginContext> = {}
): FSM<PluginState, PluginEvent> {
  // Ensure required context fields have defaults
  const context: PluginContext = {
    pluginId,
    errorCount: 0,
    metrics: {
      memoryUsage: 0,
      eventListeners: 0,
      windowCount: 0
    },
    ...initialContext
  };

  const fsm = createFSM<PluginState, PluginEvent>(
    `plugin:${pluginId}`,
    'unloaded',
    PLUGIN_TRANSITIONS,
    {
      context,
      metadata: {
        type: 'plugin',
        createdAt: Date.now()
      }
    }
  );

  // Register with the global FSM registry
  registerFSM(fsm);

  return fsm;
}

/**
 * Plugin FSM Manager - handles multiple plugin FSM instances
 */
export class PluginFSMManager {
  private plugins = new Map<string, FSM<PluginState, PluginEvent>>();
  private loadingPromises = new Map<string, Promise<void>>();
  private transitionLocks = new Map<string, Promise<void>>();

  /**
   * Create a new plugin FSM
   */
  createPlugin(
    pluginId: string,
    initialContext: Partial<PluginContext> = {}
  ): FSM<PluginState, PluginEvent> {
    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin FSM with ID "${pluginId}" already exists`);
    }

    const fsm = createPluginFSM(pluginId, initialContext);
    this.plugins.set(pluginId, fsm);

    // Emit plugin:created event
    import('@core/event-bus').then(({ eventBus }) => {
      eventBus.emit('plugin:created', {
        pluginId,
        state: fsm.getState(),
        context: fsm.getContext(),
        timestamp: Date.now()
      });
    });

    return fsm;
  }

  /**
   * Get a plugin FSM by ID
   */
  getPlugin(pluginId: string): FSM<PluginState, PluginEvent> | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Remove a plugin FSM
   */
  destroyPlugin(pluginId: string): void {
    const fsm = this.plugins.get(pluginId);
    if (!fsm) {
      console.warn(`[PluginFSM] Plugin "${pluginId}" not found`);
      return;
    }

    // Ensure plugin is unloaded before destroying
    if (fsm.getState() !== 'unloaded') {
      this.unloadPlugin(pluginId);
    }

    this.plugins.delete(pluginId);
    this.loadingPromises.delete(pluginId);

    // Unregister from global FSM registry
    import('./registry').then(({ unregisterFSM }) => {
      unregisterFSM(`plugin:${pluginId}`);
    });

    // Emit plugin:destroyed event
    import('@core/event-bus').then(({ eventBus }) => {
      eventBus.emit('plugin:destroyed', {
        pluginId,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Discover a plugin
   */
  async discoverPlugin(
    pluginId: string,
    manifest?: any
  ): Promise<boolean> {
    const fsm = this.getPlugin(pluginId) || this.createPlugin(pluginId, { manifest });

    if (!fsm.can('discover')) {
      console.warn(`[PluginFSM] Cannot discover plugin "${pluginId}" - not discoverable in current state`);
      return false;
    }

    // Update context with discovery time
    const context = fsm.getContext() as PluginContext;
    fsm.updateContext({
      ...context,
      manifest,
      discoveryTime: Date.now()
    });

    const result = fsm.transition('discover') !== null;

    if (result) {
      // Auto-load after discovery
      this.loadPlugin(pluginId);
    }

    return result;
  }

  /**
   * Execute operation with async lock to prevent race conditions
   */
  private async withLock<T>(pluginId: string, operation: () => Promise<T>): Promise<T> {
    const existingLock = this.transitionLocks.get(pluginId);

    const lockPromise = (async () => {
      if (existingLock) {
        await existingLock;
      }
      return await operation();
    })();

    this.transitionLocks.set(pluginId, lockPromise);

    try {
      return await lockPromise;
    } finally {
      this.transitionLocks.delete(pluginId);
    }
  }

  /**
   * Load a plugin
   */
  async loadPlugin(pluginId: string): Promise<boolean> {
    return this.withLock(pluginId, async () => {
      if (this.loadingPromises.has(pluginId)) {
        console.log(`[PluginFSM] Plugin "${pluginId}" is already loading`);
        return await this.loadingPromises.get(pluginId)!;
      }

      const fsm = this.getPlugin(pluginId);
      if (!fsm) {
        console.error(`[PluginFSM] Cannot load plugin "${pluginId}" - not found`);
        return false;
      }

      if (!fsm.can('load')) {
        console.warn(`[PluginFSM] Cannot load plugin "${pluginId}" - not loadable in current state`);
        return false;
      }

      const loadPromise = this.performLoad(pluginId, fsm);
      this.loadingPromises.set(pluginId, loadPromise);

      try {
        return await loadPromise;
      } finally {
        this.loadingPromises.delete(pluginId);
      }
    });
  }

  /**
   * Perform the actual loading operation
   */
  private async performLoad(pluginId: string, fsm: FSM<PluginState, PluginEvent>): Promise<boolean> {
    const startTime = Date.now();

    // Update context
    const context = fsm.getContext() as PluginContext;
    fsm.updateContext({
      ...context,
      loadTime: startTime
    });

    // Start loading transition
    const transitionResult = fsm.transition('load') !== null;
    if (!transitionResult) return false;

    try {
      // Simulate loading time (in real implementation, this would load the plugin bundle)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update metrics
      const loadEndTime = Date.now();
      const loadDuration = loadEndTime - startTime;

      fsm.updateContext({
        ...fsm.getContext(),
        loadTime: loadDuration,
        metrics: {
          ...context.metrics,
          memoryUsage: Math.random() * 10 // Simulated memory usage
        }
      });

      // Complete loading transition
      fsm.transition('load');

      // Emit plugin:loaded event
      import('@core/event-bus').then(({ eventBus }) => {
        eventBus.emit('plugin:loaded', {
          pluginId,
          loadTime: loadDuration,
          timestamp: Date.now()
        });
      });

      return true;
    } catch (error) {
      console.error(`[PluginFSM] Failed to load plugin "${pluginId}":`, error);

      // Update context with error
      const errorCount = ((fsm.getContext() as PluginContext).errorCount || 0) + 1;
      fsm.updateContext({
        ...fsm.getContext(),
        lastError: error as Error,
        errorCount
      });

      // Transition to error state
      fsm.transition('error');

      // Emit structured error event
      import('@core/event-bus').then(({ eventBus }) => {
        eventBus.emitSync('plugin:error', {
          pluginId,
          error: (error as Error).message,
          stack: (error as Error).stack,
          context: fsm.getContext(),
          timestamp: Date.now()
        });
      }).catch(err => {
        console.warn(`[PluginFSM] Could not emit plugin error event:`, err);
      });

      return false;
    }
  }

  /**
   * Initialize a plugin
   */
  async initializePlugin(pluginId: string): Promise<boolean> {
    const fsm = this.getPlugin(pluginId);
    if (!fsm) {
      console.error(`[PluginFSM] Cannot initialize plugin "${pluginId}" - not found`);
      return false;
    }

    if (!fsm.can('init')) {
      console.warn(`[PluginFSM] Cannot initialize plugin "${pluginId}" - not initializable in current state`);
      return false;
    }

    const startTime = Date.now();

    // Update context
    const context = fsm.getContext() as PluginContext;
    fsm.updateContext({
      ...context,
      initTime: startTime
    });

    // Start initializing transition
    const transitionResult = fsm.transition('init') !== null;
    if (!transitionResult) return false;

    try {
      // Simulate initialization time
      await new Promise(resolve => setTimeout(resolve, 50));

      const initEndTime = Date.now();
      const initDuration = initEndTime - startTime;

      fsm.updateContext({
        ...fsm.getContext(),
        initTime: initDuration
      });

      // Complete initialization transition
      fsm.transition('init');

      // Emit plugin:initialized event
      import('@core/event-bus').then(({ eventBus }) => {
        eventBus.emit('plugin:initialized', {
          pluginId,
          initTime: initDuration,
          timestamp: Date.now()
        });
      });

      return true;
    } catch (error) {
      console.error(`[PluginFSM] Failed to initialize plugin "${pluginId}":`, error);

      // Update context with error
      fsm.updateContext({
        ...fsm.getContext(),
        lastError: error as Error,
        errorCount: ((fsm.getContext() as PluginContext).errorCount || 0) + 1
      });

      // Transition to error state
      fsm.transition('error');

      return false;
    }
  }

  /**
   * Start a plugin
   */
  async startPlugin(pluginId: string): Promise<boolean> {
    const fsm = this.getPlugin(pluginId);
    if (!fsm) {
      console.error(`[PluginFSM] Cannot start plugin "${pluginId}" - not found`);
      return false;
    }

    if (!fsm.can('start')) {
      console.warn(`[PluginFSM] Cannot start plugin "${pluginId}" - not startable in current state`);
      return false;
    }

    const startTime = Date.now();

    // Update context
    fsm.updateContext({
      ...fsm.getContext(),
      startTime
    });

    const result = fsm.transition('start') !== null;

    if (result) {
      // Emit plugin:started event
      import('@core/event-bus').then(({ eventBus }) => {
        eventBus.emit('plugin:started', {
          pluginId,
          startTime,
          timestamp: Date.now()
        });
      });
    }

    return result;
  }

  /**
   * Stop a plugin
   */
  async stopPlugin(pluginId: string): Promise<boolean> {
    const fsm = this.getPlugin(pluginId);
    if (!fsm) {
      console.error(`[PluginFSM] Cannot stop plugin "${pluginId}" - not found`);
      return false;
    }

    if (!fsm.can('stop')) {
      console.warn(`[PluginFSM] Cannot stop plugin "${pluginId}" - not stoppable in current state`);
      return false;
    }

    const result = fsm.transition('stop') !== null;

    if (result) {
      // Emit plugin:stopped event
      import('@core/event-bus').then(({ eventBus }) => {
        eventBus.emit('plugin:stopped', {
          pluginId,
          timestamp: Date.now()
        });
      });
    }

    return result;
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    const fsm = this.getPlugin(pluginId);
    if (!fsm) {
      console.error(`[PluginFSM] Cannot unload plugin "${pluginId}" - not found`);
      return false;
    }

    if (!fsm.can('unload')) {
      console.warn(`[PluginFSM] Cannot unload plugin "${pluginId}" - not unloadable in current state`);
      return false;
    }

    // Start unloading transition
    const transitionResult = fsm.transition('unload') !== null;
    if (!transitionResult) return false;

    try {
      // Simulate cleanup time
      await new Promise(resolve => setTimeout(resolve, 50));

      // Complete unloading transition
      fsm.transition('unload');

      // Emit plugin:unloaded event
      import('@core/event-bus').then(({ eventBus }) => {
        eventBus.emit('plugin:unloaded', {
          pluginId,
          timestamp: Date.now()
        });
      });

      return true;
    } catch (error) {
      console.error(`[PluginFSM] Failed to unload plugin "${pluginId}":`, error);

      // Update context with error
      fsm.updateContext({
        ...fsm.getContext(),
        lastError: error as Error,
        errorCount: ((fsm.getContext() as PluginContext).errorCount || 0) + 1
      });

      // Transition to error state
      fsm.transition('error');

      return false;
    }
  }

  /**
   * Recover a plugin from error state
   */
  async recoverPlugin(pluginId: string): Promise<boolean> {
    const fsm = this.getPlugin(pluginId);
    if (!fsm) {
      console.error(`[PluginFSM] Cannot recover plugin "${pluginId}" - not found`);
      return false;
    }

    if (!fsm.can('recover')) {
      console.warn(`[PluginFSM] Cannot recover plugin "${pluginId}" - not recoverable in current state`);
      return false;
    }

    const result = fsm.transition('recover') !== null;

    if (result) {
      // Emit plugin:recovered event
      import('@core/event-bus').then(({ eventBus }) => {
        eventBus.emit('plugin:recovered', {
          pluginId,
          timestamp: Date.now()
        });
      });
    }

    return result;
  }

  /**
   * Get plugins in a specific state
   */
  getPluginsInState(state: PluginState): FSM<PluginState, PluginEvent>[] {
    const result: FSM<PluginState, PluginEvent>[] = [];

    for (const fsm of this.plugins.values()) {
      if (fsm.getState() === state) {
        result.push(fsm);
      }
    }

    return result;
  }

  /**
   * Get diagnostics for all plugins
   */
  getDiagnostics() {
    const pluginStates: Record<string, any> = {};

    for (const [id, fsm] of this.plugins) {
      pluginStates[id] = {
        ...fsm.inspect(),
        context: fsm.getContext()
      };
    }

    return {
      pluginCount: this.plugins.length,
      loadingPlugins: this.loadingPromises.size,
      pluginStates,
      timestamp: Date.now()
    };
  }

  /**
   * Unload all plugins
   */
  async unloadAllPlugins(): Promise<void> {
    const pluginIds = Array.from(this.plugins.keys());

    for (const pluginId of pluginIds) {
      await this.unloadPlugin(pluginId);
    }
  }
}

/**
 * Global Plugin FSM Manager instance
 */
export const pluginFSMManager = new PluginFSMManager();

/**
 * Convenience function to create a plugin FSM
 */
export function createPlugin(pluginId: string, context?: Partial<PluginContext>): FSM<PluginState, PluginEvent> {
  return pluginFSMManager.createPlugin(pluginId, context);
}

/**
 * Convenience function to get a plugin FSM
 */
export function getPlugin(pluginId: string): FSM<PluginState, PluginEvent> | undefined {
  return pluginFSMManager.getPlugin(pluginId);
}

/**
 * Convenience function to destroy a plugin FSM
 */
export function destroyPlugin(pluginId: string): void {
  pluginFSMManager.destroyPlugin(pluginId);
}