import { fsmRegistry } from './registry';
import { eventBus } from '../event-bus';
import type { FSMInspection, FSMDiagnostics, FSMPerformanceMetrics } from './types';

/**
 * FSM Developer Tools
 *
 * Provides utilities for debugging, profiling, and inspecting FSMs.
 * Integrates with the EventBus diagnostics stream for real-time monitoring.
 */

/**
 * FSM Inspector - Visual FSM debugging interface
 */
export class FSMInspector {
  private enabled = false;
  private eventHistory: any[] = [];
  private maxHistorySize = 1000;
  private subscribers = new Set<(data: any) => void>();

  /**
   * Enable/disable inspector
   */
  enable(): void {
    if (this.enabled) return;

    this.enabled = true;
    this.subscribeToEvents();
    console.log('[FSM Inspector] Enabled - Start monitoring FSM transitions');

    // Emit inspector enabled event
    this.emitEvent('fsm:inspector:enabled', { timestamp: Date.now() });
  }

  /**
   * Disable inspector
   */
  disable(): void {
    if (!this.enabled) return;

    this.enabled = false;
    this.unsubscribeFromEvents();
    this.eventHistory = [];
    console.log('[FSM Inspector] Disabled');

    // Emit inspector disabled event
    this.emitEvent('fsm:inspector:disabled', { timestamp: Date.now() });
  }

  /**
   * Check if inspector is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get all registered FSMs
   */
  getFSMs(): Record<string, FSMInspection> {
    return fsmRegistry.inspectAll();
  }

  /**
   * Get inspection data for a specific FSM
   */
  getFSM(id: string): FSMInspection | null {
    const fsm = fsmRegistry.get(id);
    if (!fsm) return null;

    return fsm.inspect();
  }

  /**
   * Get event history
   */
  getEventHistory(limit?: number): any[] {
    const history = [...this.eventHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get diagnostics for all FSMs
   */
  getDiagnostics(): FSMDiagnostics {
    return fsmRegistry.getDiagnostics();
  }

  /**
   * Get performance metrics for all FSMs
   */
  getPerformanceMetrics(): Record<string, FSMPerformanceMetrics> {
    return fsmRegistry.getAllMetrics();
  }

  /**
   * Force transition an FSM (for debugging)
   */
  forceTransition(fsmId: string, event: string): boolean {
    const fsm = fsmRegistry.get(fsmId);
    if (!fsm) {
      console.error(`[FSM Inspector] FSM "${fsmId}" not found`);
      return false;
    }

    const currentState = fsm.getState();
    const result = fsm.transition(event as any);

    if (result) {
      console.log(`[FSM Inspector] Forced transition: ${fsmId} ${currentState} -> ${result} via ${event}`);
      this.emitEvent('fsm:inspector:force-transition', {
        fsmId,
        from: currentState,
        to: result,
        event,
        timestamp: Date.now()
      });
    } else {
      console.warn(`[FSM Inspector] Failed to force transition: ${fsmId} from ${currentState} via ${event}`);
    }

    return result !== null;
  }

  /**
   * Reset an FSM (for debugging)
   */
  resetFSM(fsmId: string, targetState?: string): boolean {
    const fsm = fsmRegistry.get(fsmId);
    if (!fsm) {
      console.error(`[FSM Inspector] FSM "${fsmId}" not found`);
      return false;
    }

    const currentState = fsm.getState();
    const allStates = fsm.getAllStates();
    const resetState = targetState || allStates[0];

    fsm.reset(resetState as any);

    console.log(`[FSM Inspector] Reset FSM: ${fsmId} from ${currentState} to ${resetState}`);

    this.emitEvent('fsm:inspector:reset', {
      fsmId,
      from: currentState,
      to: resetState,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Disable/enable an FSM (for debugging)
   */
  toggleFSM(fsmId: string, enabled?: boolean): boolean {
    const fsm = fsmRegistry.get(fsmId);
    if (!fsm) {
      console.error(`[FSM Inspector] FSM "${fsmId}" not found`);
      return false;
    }

    const newState = enabled !== undefined ? enabled : !fsm.isEnabled();
    fsm.setEnabled(newState);

    console.log(`[FSM Inspector] ${newState ? 'Enabled' : 'Disabled'} FSM: ${fsmId}`);

    this.emitEvent('fsm:inspector:toggle', {
      fsmId,
      enabled: newState,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Get FSM transition graph (for visualization)
   */
  getTransitionGraph(fsmId: string): {
    nodes: Array<{ id: string; label: string; state?: string }>;
    edges: Array<{ from: string; to: string; label: string }>;
  } | null {
    const fsm = fsmRegistry.get(fsmId);
    if (!fsm) return null;

    const inspection = fsm.inspect();
    const transitions = inspection.transitions;

    const nodes = inspection.allStates.map(state => ({
      id: state,
      label: state,
      state: state === inspection.state ? 'current' : state === 'error' ? 'error' : 'normal'
    }));

    const edges: Array<{ from: string; to: string; label: string }> = [];

    for (const [fromState, stateTransitions] of Object.entries(transitions)) {
      for (const [event, toState] of Object.entries(stateTransitions)) {
        edges.push({
          from: fromState,
          to: toState,
          label: event
        });
      }
    }

    return { nodes, edges };
  }

  /**
   * Export FSM data for analysis
   */
  exportData(): {
    timestamp: number;
    version: string;
    diagnostics: FSMDiagnostics;
    fsms: Record<string, FSMInspection>;
    metrics: Record<string, FSMPerformanceMetrics>;
    eventHistory: any[];
  } {
    return {
      timestamp: Date.now(),
      version: '1.0.0',
      diagnostics: this.getDiagnostics(),
      fsms: this.getFSMs(),
      metrics: this.getPerformanceMetrics(),
      eventHistory: this.getEventHistory()
    };
  }

  /**
   * Import FSM data (for analysis/replay)
   */
  importData(data: any): void {
    console.log('[FSM Inspector] Imported data:', data);
    // Implementation would depend on specific use case
  }

  /**
   * Subscribe to inspector updates
   */
  subscribe(callback: (data: any) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers of data changes
   */
  private notifySubscribers(data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[FSM Inspector] Subscriber error:', error);
      }
    });
  }

  /**
   * Subscribe to FSM events for monitoring
   */
  private subscribeToEvents(): void {
    // Subscribe to transition events
    eventBus.on('fsm:transition', (event: any) => {
      this.addEventToHistory('transition', event);
      this.notifySubscribers({ type: 'transition', event });
    }, { scope: 'fsm-inspector' });

    // Subscribe to error events
    eventBus.on('fsm:error', (event: any) => {
      this.addEventToHistory('error', event);
      this.notifySubscribers({ type: 'error', event });
    }, { scope: 'fsm-inspector' });

    // Subscribe to registry events
    eventBus.on('fsm:registered', (event: any) => {
      this.addEventToHistory('registered', event);
      this.notifySubscribers({ type: 'registered', event });
    }, { scope: 'fsm-inspector' });

    eventBus.on('fsm:unregistered', (event: any) => {
      this.addEventToHistory('unregistered', event);
      this.notifySubscribers({ type: 'unregistered', event });
    }, { scope: 'fsm-inspector' });

    // Subscribe to reset events
    eventBus.on('fsm:reset', (event: any) => {
      this.addEventToHistory('reset', event);
      this.notifySubscribers({ type: 'reset', event });
    }, { scope: 'fsm-inspector' });
  }

  /**
   * Unsubscribe from FSM events
   */
  private unsubscribeFromEvents(): void {
    eventBus.offAll('fsm-inspector');
  }

  /**
   * Add event to history with size limit
   */
  private addEventToHistory(type: string, event: any): void {
    this.eventHistory.push({
      type,
      event,
      timestamp: Date.now()
    });

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Emit inspector events
   */
  private emitEvent(eventType: string, data: any): void {
    try {
      eventBus.emitSync(eventType, data);
    } catch (err) {
      console.error('[FSM Inspector] Could not emit event:', err);
    }
  }
}

/**
 * Global FSM Inspector instance
 */
export const fsmInspector = new FSMInspector();

/**
 * FSM Profiler - Performance analysis tool
 */
export class FSMProfiler {
  private enabled = false;
  private profiles = new Map<string, any>();

  /**
   * Enable profiler
   */
  enable(): void {
    if (this.enabled) return;

    this.enabled = true;
    console.log('[FSM Profiler] Enabled - Start profiling FSM performance');

    eventBus.on('fsm:transition', this.handleTransition.bind(this), { scope: 'fsm-profiler' });
  }

  /**
   * Disable profiler
   */
  disable(): void {
    if (!this.enabled) return;

    this.enabled = false;
    console.log('[FSM Profiler] Disabled');

    eventBus.offAll('fsm-profiler');
  }

  /**
   * Handle transition events for profiling
   */
  private handleTransition(event: any): void {
    const fsmId = event.id;
    const timestamp = Date.now();

    if (!this.profiles.has(fsmId)) {
      this.profiles.set(fsmId, {
        transitions: [],
        totalTransitions: 0,
        totalTransitionTime: 0,
        errors: 0,
        startTime: timestamp
      });
    }

    const profile = this.profiles.get(fsmId);
    profile.transitions.push({
      from: event.from,
      to: event.to,
      event: event.event,
      timestamp
    });
    profile.totalTransitions++;
  }

  /**
   * Get profiling data
   */
  getProfiles(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [fsmId, profile] of this.profiles) {
      result[fsmId] = {
        ...profile,
        averageTransitionsPerSecond: profile.totalTransitions / ((Date.now() - profile.startTime) / 1000),
        transitionRate: profile.transitions.length / ((Date.now() - profile.startTime) / 1000)
      };
    }

    return result;
  }

  /**
   * Reset profiling data
   */
  reset(): void {
    this.profiles.clear();
    console.log('[FSM Profiler] Data reset');
  }
}

/**
 * Global FSM Profiler instance
 */
export const fsmProfiler = new FSMProfiler();

/**
 * Development utilities for FSM debugging
 */
export const FSMDevUtils = {
  /**
   * Create FSM trace file for debugging
   */
  createTraceFile(): string {
    const data = fsmInspector.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fsm-trace-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return url;
  },

  /**
   * Print FSM statistics to console
   */
  printStats(): void {
    const diagnostics = fsmInspector.getDiagnostics();
    const metrics = fsmInspector.getPerformanceMetrics();

    console.group('🔧 FSM Statistics');
    console.log('Total FSMs:', diagnostics.fsmCount);
    console.log('Active FSMs:', diagnostics.activeFSMs.join(', '));
    console.log('System Health:', diagnostics.systemHealth);

    console.group('Performance Metrics');
    for (const [id, metric] of Object.entries(metrics)) {
      console.log(`${id}:`, {
        transitions: metric.totalTransitions,
        errors: metric.errorCount,
        avgTime: `${metric.averageTransitionTime.toFixed(2)}ms`
      });
    }
    console.groupEnd();

    console.groupEnd();
  },

  /**
   * Validate FSM configuration
   */
  validateFSM(fsmId: string): {
    valid: boolean;
    issues: string[];
  } {
    const fsm = fsmRegistry.get(fsmId);
    if (!fsm) {
      return {
        valid: false,
        issues: [`FSM "${fsmId}" not found`]
      };
    }

    const inspection = fsm.inspect();
    const issues: string[] = [];

    // Check for unreachable states
    const reachableStates = new Set<string>();
    reachableStates.add(inspection.state);

    // Simple reachability check (not comprehensive)
    const transitions = inspection.transitions;
    let changed = true;
    while (changed) {
      changed = false;
      for (const from of Array.from(reachableStates)) {
        for (const to of Object.values(transitions[from] || {})) {
          if (!reachableStates.has(to)) {
            reachableStates.add(to);
            changed = true;
          }
        }
      }
    }

    const unreachableStates = inspection.allStates.filter(s => !reachableStates.has(s));
    if (unreachableStates.length > 0) {
      issues.push(`Unreachable states: ${unreachableStates.join(', ')}`);
    }

    // Check for dead-end states (no outgoing transitions)
    const deadEndStates = inspection.allStates.filter(s =>
      Object.keys(transitions[s] || {}).length === 0
    );
    if (deadEndStates.length > 0) {
      issues.push(`Dead-end states: ${deadEndStates.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
};

/**
 * Auto-enable inspector in development mode
 */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Enable FSM inspector automatically in development
  fsmInspector.enable();

  // Add global utilities to window for debugging
  (window as any).fsmInspector = fsmInspector;
  (window as any).fsmProfiler = fsmProfiler;
  (window as any).fsmDevUtils = FSMDevUtils;

  console.log('🔧 FSM Developer Tools enabled in development mode');
  console.log('  - window.fsmInspector: Visual FSM debugging');
  console.log('  - window.fsmProfiler: Performance profiling');
  console.log('  - window.fsmDevUtils: Debug utilities');
}