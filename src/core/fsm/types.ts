/**
 * Core FSM Types
 */

/**
 * State type - extends string for type safety
 */
export type FSMState = string;

/**
 * Event type - extends string for type safety
 */
export type FSMEvent = string;

/**
 * Transition type - maps states to events to next states
 */
export type FSMTransition<S extends string, E extends string> = {
  [K in S]: Partial<Record<E, S>>;
};

/**
 * FSM Configuration options
 */
export interface FSMConfig<S extends string, E extends string> {
  /**
   * Optional context data attached to the FSM
   */
  context?: Record<string, any>;

  /**
   * Optional metadata for debugging and tooling
   */
  metadata?: Record<string, any>;

  /**
   * Custom transition validators
   */
  validators?: Partial<Record<E, (from: S, to: S, context?: any) => boolean>>;

  /**
   * Transition side effects
   */
  effects?: Partial<Record<E, (from: S, to: S, context?: any) => void>>;
}

/**
 * FSM Transition Event Emitted via EventBus
 */
export interface FSMTransitionEvent {
  id: string;
  from: string;
  to: string;
  event: string;
  timestamp: number;
}

/**
 * FSM Error Event Emitted via EventBus
 */
export interface FSMErrorEvent {
  id: string;
  from: string;
  event: string;
  error: string;
  timestamp: number;
}

/**
 * FSM Created Event Emitted via EventBus
 */
export interface FSMCreatedEvent {
  id: string;
  state: string;
  timestamp: number;
}

/**
 * FSM Reset Event Emitted via EventBus
 */
export interface FSMResetEvent {
  id: string;
  from: string;
  to: string;
  timestamp: number;
}

/**
 * FSM Inspection Snapshot
 */
export interface FSMInspection {
  id: string;
  state: string;
  enabled: boolean;
  possibleEvents: string[];
  allStates: string[];
  transitions: Record<string, Partial<Record<string, string>>>;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Predefined FSM States for Common Subsystems
 */

// Window Lifecycle States
export interface WindowLifecycleStates {
  CLOSED: 'closed';
  OPENING: 'opening';
  NORMAL: 'normal';
  MINIMIZING: 'minimizing';
  MINIMIZED: 'minimized';
  MAXIMIZING: 'maximizing';
  MAXIMIZED: 'maximized';
  RESTORING: 'restoring';
  CLOSING: 'closing';
}

// Window Lifecycle Events
export interface WindowLifecycleEvents {
  OPEN: 'open';
  MINIMIZE: 'minimize';
  MAXIMIZE: 'maximize';
  RESTORE: 'restore';
  CLOSE: 'close';
  FOCUS: 'focus';
  BLUR: 'blur';
  RESIZE_START: 'resize_start';
  RESIZE_END: 'resize_end';
}

// Plugin Lifecycle States
export interface PluginLifecycleStates {
  UNLOADED: 'unloaded';
  DISCOVERING: 'discovering';
  LOADING: 'loading';
  LOADED: 'loaded';
  INITIALIZING: 'initializing';
  READY: 'ready';
  ACTIVE: 'active';
  STOPPING: 'stopping';
  UNLOADING: 'unloading';
  ERROR: 'error';
}

// Plugin Lifecycle Events
export interface PluginLifecycleEvents {
  DISCOVER: 'discover';
  LOAD: 'load';
  INIT: 'init';
  START: 'start';
  STOP: 'stop';
  UNLOAD: 'unload';
  RECOVER: 'recover';
  ERROR: 'error';
}

// Network States
export interface NetworkStates {
  DISCONNECTED: 'disconnected';
  CONNECTING: 'connecting';
  CONNECTED: 'connected';
  RECONNECTING: 'reconnecting';
  FAILED: 'failed';
}

// Network Events
export interface NetworkEvents {
  CONNECT: 'connect';
  DISCONNECT: 'disconnect';
  RECONNECT: 'reconnect';
  ERROR: 'error';
}

// Storage States
export interface StorageStates {
  IDLE: 'idle';
  READING: 'reading';
  WRITING: 'writing';
  SYNCING: 'syncing';
  ERROR: 'error';
}

// Storage Events
export interface StorageEvents {
  READ: 'read';
  WRITE: 'write';
  SYNC: 'sync';
  ERROR: 'error';
}

// Auth States
export interface AuthStates {
  UNAUTHENTICATED: 'unauthenticated';
  VERIFYING: 'verifying';
  AUTHENTICATED: 'authenticated';
  EXPIRED: 'expired';
  ERROR: 'error';
}

// Auth Events
export interface AuthEvents {
  LOGIN: 'login';
  LOGOUT: 'logout';
  VERIFY: 'verify';
  REFRESH: 'refresh';
  EXPIRE: 'expire';
  ERROR: 'error';
}

// Usage Enforcement States
export interface UsageStates {
  ALLOWED: 'allowed';
  LIMITED: 'limited';
  BLOCKED: 'blocked';
  EXPIRED: 'expired';
}

// Usage Events
export interface UsageEvents {
  CHECK: 'check';
  LIMIT: 'limit';
  BLOCK: 'block';
  EXPIRE: 'expire';
  RESET: 'reset';
}

// Animation States (Optional)
export interface AnimationStates {
  IDLE: 'idle';
  PLAYING: 'playing';
  PAUSED: 'paused';
  FINISHED: 'finished';
  CANCELLED: 'cancelled';
}

// Animation Events
export interface AnimationEvents {
  PLAY: 'play';
  PAUSE: 'pause';
  FINISH: 'finish';
  CANCEL: 'cancel';
  RESTART: 'restart';
}

/**
 * FSM Registry Types
 */

/**
 * Registry for managing multiple FSMs
 */
export interface FSMRegistry {
  /**
   * Register an FSM
   */
  register<S extends string, E extends string>(fsm: FSM<S, E>): void;

  /**
   * Unregister an FSM
   */
  unregister(id: string): void;

  /**
   * Get an FSM by ID
   */
  get(id: string): FSM<any, any> | undefined;

  /**
   * List all registered FSM IDs
   */
  list(): string[];

  /**
   * Get inspection data for all FSMs
   */
  inspectAll(): Record<string, FSMInspection>;

  /**
   * Reset all FSMs (for kernel recovery)
   */
  resetAll(): void;

  /**
   * Disable all FSMs
   */
  disableAll(): void;

  /**
   * Enable all FSMs
   */
  enableAll(): void;
}

/**
 * Window FSM Context
 */
export interface WindowContext {
  windowId: string;
  pluginId?: string;
  title?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  resizable: boolean;
  maximizable: boolean;
  minimizable: boolean;
  focused: boolean;
  zOrder: number;
}

/**
 * Plugin FSM Context
 */
export interface PluginContext {
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
 * FSM Diagnostics Types
 */

/**
 * FSM Performance Metrics
 */
export interface FSMPerformanceMetrics {
  id: string;
  totalTransitions: number;
  averageTransitionTime: number;
  lastTransitionTime: number;
  errorCount: number;
  uptime: number;
}

/**
 * FSM Diagnostics Data
 */
export interface FSMDiagnostics {
  timestamp: number;
  fsmCount: number;
  activeFSMs: string[];
  performanceMetrics: Record<string, FSMPerformanceMetrics>;
  recentEvents: (FSMTransitionEvent | FSMErrorEvent)[];
  systemHealth: 'healthy' | 'degraded' | 'critical';
}