import { eventBus } from '@core/event-bus';
import type { EventHandler } from '@core/event-bus';
import type { FSMState, FSMEvent, FSMTransition, FSMConfig, FSMTransitionEvent, FSMErrorEvent } from './types';

/**
 * Finite State Machine Core Implementation
 *
 * Provides deterministic state transitions with EventBus integration
 * for observability and debugging capabilities.
 */
export class FSM<S extends string, E extends string> {
  private id: string;
  private initialState: S;
  private state: S;
  private transitions: Record<S, Partial<Record<E, S>>>;
  private config?: FSMConfig<S, E>;
  private context?: Record<string, any>;
  private metadata?: Record<string, any>;
  private enabled = true;

  // Performance optimization: transition and state caching
  private transitionCache = new Map<string, S | null>();
  private canCache = new Map<string, boolean>();
  private possibleEventsCache = new Map<string, E[]>();

  constructor(
    id: string,
    initialState: S,
    transitions: Record<S, Partial<Record<E, S>>>,
    config?: FSMConfig<S, E>
  ) {
    this.id = id;
    this.initialState = initialState;
    this.state = initialState;
    this.transitions = transitions;
    this.config = config;
    this.context = config?.context;
    this.metadata = config?.metadata;

    // Emit initial state event
    this.emitEvent('fsm:created', {
      id: this.id,
      state: this.state,
      timestamp: Date.now()
    });
  }

  /**
   * Get current state
   */
  getState(): S {
    return this.state;
  }

  /**
   * Get FSM identifier
   */
  getId(): string {
    return this.id;
  }

  /**
   * Check if transition is allowed from current state
   * Performance optimized with caching for O(1) lookup in hot paths
   */
  can(event: E): boolean {
    if (!this.enabled) return false;

    // Check cache first for O(1) lookup
    const cacheKey = `${this.state}:${event}`;
    if (this.canCache.has(cacheKey)) {
      return this.canCache.get(cacheKey)!;
    }

    // Compute and cache result
    const result = !!this.transitions[this.state]?.[event];
    this.canCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get all possible events from current state
   * Performance optimized with caching for frequently accessed states
   */
  getPossibleEvents(): E[] {
    if (!this.enabled) return [];

    // Check cache first
    if (this.possibleEventsCache.has(this.state)) {
      return this.possibleEventsCache.get(this.state)!;
    }

    // Compute and cache result
    const events = Object.keys(this.transitions[this.state] || {}) as E[];
    this.possibleEventsCache.set(this.state, events);
    return events;
  }

  /**
   * Get all states in the FSM
   */
  getAllStates(): S[] {
    return Object.keys(this.transitions) as S[];
  }

  /**
   * Execute state transition
   * Performance optimized with intelligent caching for repeated transitions
   */
  transition(event: E): S | null {
    if (!this.enabled) {
      this.emitError(event, new Error('FSM is disabled'));
      return null;
    }

    const fromState = this.state;
    const cacheKey = `${fromState}:${event}`;

    // Check transition cache for simple transitions (no validators)
    if (this.transitionCache.has(cacheKey) && !this.config?.validators?.[event]) {
      const cachedNextState = this.transitionCache.get(cacheKey);
      if (cachedNextState === null) {
        // Cached invalid transition
        this.emitError(event, new Error(`Invalid transition "${event}" from state "${fromState}"`));
        return null;
      }

      // Valid cached transition - update state and emit events
      this.state = cachedNextState;
      this.emitEvent('fsm:transition', {
        id: this.id,
        from: fromState,
        to: this.state,
        event,
        timestamp: Date.now()
      });

      // Execute transition effects if configured
      if (this.config?.effects?.[event]) {
        try {
          this.config.effects[event](fromState, this.state, this.context);
        } catch (error) {
          console.warn(`[FSM] Effect error for transition "${event}":`, error);
        }
      }

      return this.state;
    }

    // Full transition calculation for uncached or complex transitions
    const nextState = this.transitions[fromState]?.[event];

    if (!nextState) {
      // Cache invalid transition
      if (!this.config?.validators?.[event]) {
        this.transitionCache.set(cacheKey, null);
      }
      const error = new Error(`Invalid transition "${event}" from state "${fromState}"`);
      this.emitError(event, error);
      return null;
    }

    // Check transition validators if configured
    if (this.config?.validators?.[event]) {
      const isValid = this.config.validators[event](fromState, nextState, this.context);
      if (!isValid) {
        const error = new Error(`Transition "${event}" rejected by validator`);
        this.emitError(event, error);
        return null;
      }
      // Don't cache transitions with validators as they're context-dependent
    } else {
      // Cache valid simple transition
      this.transitionCache.set(cacheKey, nextState);
    }

    this.state = nextState;

    // Emit successful transition
    this.emitEvent('fsm:transition', {
      id: this.id,
      from: fromState,
      to: this.state,
      event,
      timestamp: Date.now()
    });

    // Execute transition effects if configured
    if (this.config?.effects?.[event]) {
      try {
        this.config.effects[event](fromState, this.state, this.context);
      } catch (error) {
        console.warn(`[FSM] Effect error for transition "${event}":`, error);
      }
    }

    return this.state;
  }

  /**
   * Force state reset (used by kernel recovery)
   * Performance optimized: clears relevant caches
   */
  reset(newState?: S): void {
    const fromState = this.state;
    this.state = newState ?? this.initialState;
    this.enabled = true;

    // Clear caches that depend on state
    this.clearStateDependentCaches();

    this.emitEvent('fsm:reset', {
      id: this.id,
      from: fromState,
      to: this.state,
      timestamp: Date.now()
    });
  }

  /**
   * Get initial state for deterministic reset
   */
  getInitialState(): S {
    return this.initialState;
  }

  /**
   * Enable/disable FSM
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if FSM is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Update context data
   */
  updateContext(updates: Partial<Record<string, any>>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Get context data
   */
  getContext(): Record<string, any> | undefined {
    return this.context;
  }

  /**
   * Get metadata
   */
  getMetadata(): Record<string, any> | undefined {
    return this.metadata;
  }

  /**
   * Get current transition table for inspection
   */
  getTransitions(): Record<S, Partial<Record<E, S>>> {
    return { ...this.transitions };
  }

  /**
   * Emit FSM event for diagnostics and observability
   */
  private emitEvent<T = any>(eventType: string, data: T): void {
    try {
      // Use emitSync for UI transitions, emit() for background FSM events
      const isUITransition = eventType === 'fsm:transition' &&
        (this.id.includes('window') || this.id.includes('interaction'));

      if (isUITransition) {
        eventBus.emitSync(eventType, data);
      } else {
        eventBus.emit(eventType, data);
      }
    } catch (err) {
      console.warn(`[FSM] Could not emit event "${eventType}":`, err);
    }
  }

  /**
   * Emit error event for invalid transitions
   */
  private emitError(event: E, error: Error): void {
    this.emitEvent('fsm:error', {
      id: this.id,
      from: this.state,
      event,
      error: error.message,
      timestamp: Date.now()
    });
  }

  /**
   * Clear state-dependent caches when state changes
   */
  private clearStateDependentCaches(): void {
    // Clear possible events cache for the new state will be rebuilt on next access
    // Note: We don't clear all caches to preserve performance benefits
    // The transition cache and can cache remain valid as they're key-based
  }

  /**
   * Clear all performance caches (useful for testing or memory management)
   */
  clearCaches(): void {
    this.transitionCache.clear();
    this.canCache.clear();
    this.possibleEventsCache.clear();
  }

  /**
   * Get cache statistics for performance monitoring
   */
  getCacheStats(): {
    transitionCacheSize: number;
    canCacheSize: number;
    possibleEventsCacheSize: number;
  } {
    return {
      transitionCacheSize: this.transitionCache.size,
      canCacheSize: this.canCache.size,
      possibleEventsCacheSize: this.possibleEventsCache.size
    };
  }

  /**
   * Create inspection snapshot for devtools
   * Performance optimized: includes cache statistics
   */
  inspect(): {
    id: string;
    state: S;
    enabled: boolean;
    possibleEvents: E[];
    allStates: S[];
    transitions: Record<S, Partial<Record<E, S>>>;
    context?: Record<string, any>;
    metadata?: Record<string, any>;
    cacheStats: {
      transitionCacheSize: number;
      canCacheSize: number;
      possibleEventsCacheSize: number;
    };
  } {
    return {
      id: this.id,
      state: this.state,
      enabled: this.enabled,
      possibleEvents: this.getPossibleEvents(),
      allStates: this.getAllStates(),
      transitions: this.getTransitions(),
      context: this.context,
      metadata: this.metadata,
      cacheStats: this.getCacheStats()
    };
  }
}

/**
 * Factory function for creating FSMs with proper typing
 */
export function createFSM<S extends string, E extends string>(
  id: string,
  initialState: S,
  transitions: Record<S, Partial<Record<E, S>>>,
  config?: FSMConfig<S, E>
): FSM<S, E> {
  return new FSM(id, initialState, transitions, config);
}

/**
 * Type guard for checking if a value is a valid FSM state
 */
export function isValidState<S extends string>(
  state: unknown,
  fsm: FSM<S, any>
): state is S {
  return typeof state === 'string' && fsm.getAllStates().includes(state as S);
}

/**
 * Type guard for checking if a value is a valid FSM event
 */
export function isValidEvent<E extends string>(
  event: unknown,
  currentState: string,
  transitions: Record<string, Partial<Record<E, string>>>
): event is E {
  if (typeof event !== 'string') return false;
  const stateEvents = Object.keys(transitions[currentState] || {});
  return stateEvents.includes(event);
}