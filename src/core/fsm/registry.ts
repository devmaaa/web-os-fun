import { FSM } from './fsm';
import { eventBus } from '../event-bus';
import type { FSMRegistry, FSMInspection, FSMPerformanceMetrics, FSMDiagnostics } from './types';

/**
 * Global FSM Registry
 *
 * Manages lifecycle and provides centralized access to all FSM instances.
 * Used by the kernel for recovery, diagnostics, and system-wide operations.
 */
class FSMRegistryImpl implements FSMRegistry {
  private fsms = new Map<string, FSM<any, any>>();
  private metrics = new Map<string, FSMPerformanceMetrics>();
  private recentEvents = new Set<any>();
  private maxRecentEvents = 100;
  private enabled = true;
  private fsmScopes = new Map<string, string>(); // fsmId -> scope name for cleanup

  /**
   * Register an FSM with the registry
   */
  register<S extends string, E extends string>(fsm: FSM<S, E>): void {
    const id = fsm.getId();

    if (this.fsms.has(id)) {
      console.warn(`[FSM Registry] FSM with ID "${id}" already exists. Overwriting.`);
      // Cleanup existing FSM before overwriting
      this.unregister(id);
    }

    this.fsms.set(id, fsm);
    this.metrics.set(id, {
      id,
      totalTransitions: 0,
      averageTransitionTime: 0,
      lastTransitionTime: Date.now(),
      errorCount: 0,
      uptime: Date.now()
    });

    // Subscribe to FSM events for metrics collection
    const scopeId = this.subscribeToFSMEvents(fsm);
    this.fsmScopes.set(id, scopeId);

    // Emit registration event
    this.emitEvent('fsm:registered', {
      id,
      timestamp: Date.now()
    });
  }

  /**
   * Unregister an FSM from the registry
   */
  unregister(id: string): void {
    const fsm = this.fsms.get(id);
    if (!fsm) {
      console.warn(`[FSM Registry] FSM with ID "${id}" not found.`);
      return;
    }

    // Cleanup event listeners
    const scopeId = this.fsmScopes.get(id);
    if (scopeId) {
      eventBus.offAll(scopeId);
      this.fsmScopes.delete(id);
    }

    this.fsms.delete(id);
    this.metrics.delete(id);

    // Emit unregistration event
    this.emitEvent('fsm:unregistered', {
      id,
      timestamp: Date.now()
    });
  }

  /**
   * Get an FSM by ID
   */
  get(id: string): FSM<any, any> | undefined {
    return this.fsms.get(id);
  }

  /**
   * List all registered FSM IDs
   */
  list(): string[] {
    return Array.from(this.fsms.keys());
  }

  /**
   * Get inspection data for all FSMs
   */
  inspectAll(): Record<string, FSMInspection> {
    const result: Record<string, FSMInspection> = {};

    for (const [id, fsm] of this.fsms) {
      result[id] = fsm.inspect();
    }

    return result;
  }

  /**
   * Reset all FSMs (used by kernel recovery)
   */
  resetAll(): void {
    for (const [id, fsm] of this.fsms) {
      const initialState = fsm.getInitialState();
      fsm.reset(initialState);
    }

    this.emitEvent('fsm:reset-all', {
      count: this.fsms.size,
      timestamp: Date.now()
    });
  }

  /**
   * Disable all FSMs
   */
  disableAll(): void {
    for (const fsm of this.fsms.values()) {
      fsm.setEnabled(false);
    }
    this.enabled = false;

    this.emitEvent('fsm:disabled-all', {
      count: this.fsms.size,
      timestamp: Date.now()
    });
  }

  /**
   * Enable all FSMs
   */
  enableAll(): void {
    for (const fsm of this.fsms.values()) {
      fsm.setEnabled(true);
    }
    this.enabled = true;

    this.emitEvent('fsm:enabled-all', {
      count: this.fsms.size,
      timestamp: Date.now()
    });
  }

  /**
   * Get performance metrics for an FSM
   */
  getMetrics(id: string): FSMPerformanceMetrics | undefined {
    return this.metrics.get(id);
  }

  /**
   * Get performance metrics for all FSMs
   */
  getAllMetrics(): Record<string, FSMPerformanceMetrics> {
    const result: Record<string, FSMPerformanceMetrics> = {};

    for (const [id, metrics] of this.metrics) {
      result[id] = { ...metrics };
    }

    return result;
  }

  /**
   * Get comprehensive diagnostics data
   */
  getDiagnostics(): FSMDiagnostics {
    const activeFSMs = this.list();
    const performanceMetrics = this.getAllMetrics();
    const totalErrors = Object.values(performanceMetrics)
      .reduce((sum, metrics) => sum + metrics.errorCount, 0);

    let systemHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (totalErrors > 10 || activeFSMs.length === 0) {
      systemHealth = 'critical';
    } else if (totalErrors > 3) {
      systemHealth = 'degraded';
    }

    return {
      timestamp: Date.now(),
      fsmCount: activeFSMs.length,
      activeFSMs,
      performanceMetrics,
      recentEvents: [...this.recentEvents],
      systemHealth
    };
  }

  /**
   * Clear recent events log
   */
  clearRecentEvents(): void {
    this.recentEvents = [];
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalFSMs: number;
    enabledFSMs: number;
    disabledFSMs: number;
    totalTransitions: number;
    totalErrors: number;
  } {
    let enabledFSMs = 0;
    let disabledFSMs = 0;
    let totalTransitions = 0;
    let totalErrors = 0;

    for (const [id, fsm] of this.fsms) {
      if (fsm.isEnabled()) {
        enabledFSMs++;
      } else {
        disabledFSMs++;
      }

      const metrics = this.metrics.get(id);
      if (metrics) {
        totalTransitions += metrics.totalTransitions;
        totalErrors += metrics.errorCount;
      }
    }

    return {
      totalFSMs: this.fsms.size,
      enabledFSMs,
      disabledFSMs,
      totalTransitions,
      totalErrors
    };
  }

  /**
   * Subscribe to FSM events for metrics collection
   */
  private subscribeToFSMEvents(fsm: FSM<any, any>): string {
    const id = fsm.getId();
    const scopeId = `fsm-registry-${id}`;

    // Subscribe to transition events
    eventBus.on('fsm:transition', (event: any) => {
      if (event.id === id) {
        this.updateTransitionMetrics(id);
        this.addRecentEvent(event);
      }
    }, { scope: scopeId });

    eventBus.on('fsm:error', (event: any) => {
      if (event.id === id) {
        this.updateErrorMetrics(id);
        this.addRecentEvent(event);
      }
    }, { scope: scopeId });

    return scopeId;
  }

  /**
   * Update transition metrics for an FSM
   */
  private updateTransitionMetrics(id: string): void {
    const metrics = this.metrics.get(id);
    if (!metrics) return;

    const now = Date.now();
    const transitionTime = now - metrics.lastTransitionTime;

    // Update rolling average
    const totalTransitions = metrics.totalTransitions + 1;
    const newAverage = (
      (metrics.averageTransitionTime * metrics.totalTransitions + transitionTime) /
      totalTransitions
    );

    this.metrics.set(id, {
      ...metrics,
      totalTransitions,
      averageTransitionTime: newAverage,
      lastTransitionTime: now
    });
  }

  /**
   * Update error metrics for an FSM
   */
  private updateErrorMetrics(id: string): void {
    const metrics = this.metrics.get(id);
    if (!metrics) return;

    this.metrics.set(id, {
      ...metrics,
      errorCount: metrics.errorCount + 1
    });
  }

  /**
   * Add event to recent events log (with size limit)
   */
  private addRecentEvent(event: any): void {
    const eventWithTimestamp = {
      ...event,
      loggedAt: Date.now()
    };

    this.recentEvents.add(eventWithTimestamp);

    // Maintain size limit - convert to array and back to Set
    if (this.recentEvents.size > this.maxRecentEvents) {
      const events = Array.from(this.recentEvents)
        .sort((a, b) => a.loggedAt - b.loggedAt)
        .slice(-this.maxRecentEvents);
      this.recentEvents = new Set(events);
    }
  }

  /**
   * Get recent events as array
   */
  getRecentEvents(): any[] {
    return Array.from(this.recentEvents)
      .sort((a, b) => b.loggedAt - a.loggedAt);
  }

  /**
   * Emit registry-level events
   */
  private emitEvent(eventType: string, data: any): void {
    try {
      eventBus.emitSync(eventType, data);
    } catch (err) {
      console.warn(`[FSM Registry] Could not emit event "${eventType}":`, err);
    }
  }
}

/**
 * Global FSM Registry instance
 */
export const fsmRegistry = new FSMRegistryImpl();

/**
 * Export registry type for external usage
 */
export type { FSMRegistry };

/**
 * Convenience function to register an FSM
 */
export function registerFSM<S extends string, E extends string>(fsm: FSM<S, E>): void {
  fsmRegistry.register(fsm);
}

/**
 * Convenience function to unregister an FSM
 */
export function unregisterFSM(id: string): void {
  fsmRegistry.unregister(id);
}

/**
 * Convenience function to get an FSM by ID
 */
export function getFSM(id: string): FSM<any, any> | undefined {
  return fsmRegistry.get(id);
}