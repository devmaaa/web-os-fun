type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface Subscription {
  handler: EventHandler;
  once: boolean;
  scope?: string;
  priority: number;
  owner?: WeakRef<any>; // Actual WeakRef for automatic cleanup
}

interface EventBusOptions {
  enableBroadcastChannel?: boolean;
  enableDiagnostics?: boolean;
  enableWeakRefCleanup?: boolean;
}

class EventBus {
  private handlers = new Map<string, Set<Subscription>>();
  private scopes = new Map<string, Set<string>>(); // scope -> events
  private broadcastChannel?: BroadcastChannel;
  private diagnosticsEnabled = false;

  // WeakRef-based cleanup system
  private weakRefCleanupEnabled = false;
  private cleanupTimer?: number;
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds

  // Performance optimization: cache sorted arrays
  private sortedCache = new Map<string, Subscription[]>();

  // Error loop protection
  private errorRecursionDepth = 0;
  private readonly MAX_ERROR_RECURSION = 3;

  // Unique tab ID for BroadcastChannel
  private readonly tabId: string;

  constructor(options: EventBusOptions = {}) {
    // Generate unique tab ID for BroadcastChannel
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (options.enableBroadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel('dineapp_events');
        this.broadcastChannel.onmessage = (e) => {
          // Avoid echo by checking if we sent this
          if (e.data._source !== this.tabId) {
            this.emitSync(e.data.event, e.data.payload);
          }
        };
      } catch (error) {
        console.warn('[EventBus] BroadcastChannel not supported');
      }
    }

    this.diagnosticsEnabled = options.enableDiagnostics ?? false;
    this.weakRefCleanupEnabled = options.enableWeakRefCleanup ?? false;

    if (this.weakRefCleanupEnabled) {
      this.startPeriodicCleanup();
    }
  }

  on<T = any>(
    event: string,
    handler: EventHandler<T>,
    options: { once?: boolean; scope?: string; priority?: number; owner?: any } = {}
  ): () => void {
    // Check for duplicate handler registration
    const existingSubs = this.handlers.get(event);
    if (existingSubs) {
      for (const sub of existingSubs) {
        if (sub.handler === handler && sub.scope === options.scope) {
          console.warn(`[EventBus] Handler already registered for event "${event}" with scope "${options.scope || 'default'}"`);
          return () => this.off(event, handler);
        }
      }
    }

    const subscription: Subscription = {
      handler,
      once: options.once ?? false,
      scope: options.scope,
      priority: options.priority ?? 0,
      owner: options.owner && this.weakRefCleanupEnabled ? new WeakRef(options.owner) : undefined
    };

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(subscription);

    // Invalidate cache when subscriptions change
    this.sortedCache.delete(event);

    // Track scope -> events mapping
    if (options.scope) {
      if (!this.scopes.has(options.scope)) {
        this.scopes.set(options.scope, new Set());
      }
      this.scopes.get(options.scope)!.add(event);
    }

    if (this.diagnosticsEnabled) {
      console.log(`[EventBus] Registered handler for "${event}"${options.scope ? ` (scope: ${options.scope})` : ''}`);
      this.emitSync('__diagnostics', this.inspect());
    }

    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    const subs = this.handlers.get(event);
    if (!subs) return;

    for (const sub of subs) {
      if (sub.handler === handler) {
        subs.delete(sub);
        // Invalidate cache when subscriptions change
        this.sortedCache.delete(event);
        break;
      }
    }

    if (subs.size === 0) {
      this.handlers.delete(event);
    }

    if (this.diagnosticsEnabled) {
      this.emitSync('__diagnostics', this.inspect());
    }
  }

  offAll(scopeId: string): void {
    const events = this.scopes.get(scopeId);
    if (!events) return;

    for (const event of events) {
      const subs = this.handlers.get(event);
      if (subs) {
        // Remove all subscriptions with this scope
        for (const sub of Array.from(subs)) {
          if (sub.scope === scopeId) {
            subs.delete(sub);
            // Invalidate cache when subscriptions change
            this.sortedCache.delete(event);
          }
        }
        if (subs.size === 0) {
          this.handlers.delete(event);
        }
      }
    }

    this.scopes.delete(scopeId);

    if (this.diagnosticsEnabled) {
      console.log(`[EventBus] Cleaned up scope "${scopeId}"`);
      this.emitSync('__diagnostics', this.inspect());
    }
  }

  async emit<T = any>(event: string, data: T): Promise<void> {
    const subs = this.handlers.get(event);
    if (!subs || subs.size === 0) return;

    // Use cached sorted array or create and cache it
    let sortedSubs = this.sortedCache.get(event);
    if (!sortedSubs) {
      sortedSubs = Array.from(subs).sort((a, b) => b.priority - a.priority);
      this.sortedCache.set(event, sortedSubs);
    }

    const toRemove: Subscription[] = [];

    for (const sub of sortedSubs) {
      try {
        await sub.handler(data);
        if (sub.once) toRemove.push(sub);
      } catch (error) {
        console.error(`[EventBus] Error in "${event}" handler:`, error);

        // Emit error event with recursion protection
        if (this.errorRecursionDepth < this.MAX_ERROR_RECURSION) {
          this.errorRecursionDepth++;
          this.emitSync('__error', {
            event,
            error,
            scope: sub.scope,
            timestamp: Date.now()
          });
          this.errorRecursionDepth--;
        } else {
          console.error('[EventBus] Max error recursion depth reached, stopping error emission');
        }
      }
    }

    toRemove.forEach(sub => {
      subs.delete(sub);
      // Invalidate cache when subscriptions change
      this.sortedCache.delete(event);
    });

    // Broadcast to other tabs if enabled
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        event,
        payload: data,
        _source: this.tabId
      });
    }
  }

  emitSync<T = any>(event: string, data: T): void {
    const subs = this.handlers.get(event);
    if (!subs || subs.size === 0) return;

    // Use cached sorted array or create and cache it
    let sortedSubs = this.sortedCache.get(event);
    if (!sortedSubs) {
      sortedSubs = Array.from(subs).sort((a, b) => b.priority - a.priority);
      this.sortedCache.set(event, sortedSubs);
    }

    const toRemove: Subscription[] = [];

    for (const sub of sortedSubs) {
      try {
        sub.handler(data);
        if (sub.once) toRemove.push(sub);
      } catch (error) {
        console.error(`[EventBus] Error in "${event}" handler:`, error);

        // Emit error event with recursion protection
        if (this.errorRecursionDepth < this.MAX_ERROR_RECURSION) {
          this.errorRecursionDepth++;
          this.emitSync('__error', {
            event,
            error,
            scope: sub.scope,
            timestamp: Date.now()
          });
          this.errorRecursionDepth--;
        } else {
          console.error('[EventBus] Max error recursion depth reached, stopping error emission');
        }
      }
    }

    toRemove.forEach(sub => {
      subs.delete(sub);
      // Invalidate cache when subscriptions change
      this.sortedCache.delete(event);
    });

    // Broadcast to other tabs if enabled
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        event,
        payload: data,
        _source: this.tabId
      });
    }
  }

  /**
   * Start periodic cleanup of dead listeners (when WeakRef cleanup is enabled)
   */
  private startPeriodicCleanup(): void {
    // Handle both browser and Node.js environments
    const globalObj = typeof window !== 'undefined' ? window : global;
    this.cleanupTimer = globalObj.setInterval(() => {
      this.performMemoryCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop periodic cleanup
   */
  private stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      const globalObj = typeof window !== 'undefined' ? window : global;
      globalObj.clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Perform cleanup of listeners whose owners have been garbage collected
   */
  performMemoryCleanup(): void {
    if (!this.weakRefCleanupEnabled) return;

    let cleanedCount = 0;
    const eventsToRemove: string[] = [];

    for (const [event, subs] of this.handlers) {
      const validSubs = new Set<Subscription>();

      for (const sub of subs) {
        // Check if handler has an owner using actual WeakRef
        if (sub.owner) {
          const ownerRef = sub.owner.deref();
          if (ownerRef !== undefined) {
            // Owner still exists
            validSubs.add(sub);
          } else {
            // Owner was garbage collected
            cleanedCount++;
            // Invalidate cache since subscriptions changed
            this.sortedCache.delete(event);
          }
        } else {
          // No owner, keep the subscription
          validSubs.add(sub);
        }
      }

      if (validSubs.size === 0) {
        eventsToRemove.push(event);
        // Invalidate cache since event is being removed
        this.sortedCache.delete(event);
      } else if (validSubs.size !== subs.size) {
        // Update with cleaned subscriptions
        this.handlers.set(event, validSubs);
        // Invalidate cache since subscriptions changed
        this.sortedCache.delete(event);
      }
    }

    // Remove empty event handlers
    for (const event of eventsToRemove) {
      this.handlers.delete(event);
    }

    if (cleanedCount > 0 && this.diagnosticsEnabled) {
      console.log(`[EventBus] Memory cleanup: removed ${cleanedCount} dead listeners, ${eventsToRemove.length} empty events`);
      this.emitSync('__diagnostics', this.inspect());
    }
  }

  /**
   * Get memory usage statistics for the WeakRef cleanup system
   */
  getWeakRefStats(): {
    enabled: boolean;
    totalHandlers: number;
    handlersWithOwners: number;
    cleanupInterval: number;
  } {
    let handlersWithOwners = 0;
    let totalHandlers = 0;

    for (const subs of this.handlers.values()) {
      for (const sub of subs) {
        totalHandlers++;
        if (sub.owner) handlersWithOwners++;
      }
    }

    return {
      enabled: this.weakRefCleanupEnabled,
      totalHandlers,
      handlersWithOwners,
      cleanupInterval: this.CLEANUP_INTERVAL
    };
  }

  clear(): void {
    this.handlers.clear();
    this.scopes.clear();
    this.sortedCache.clear();

    // Stop cleanup timer
    this.stopPeriodicCleanup();
  }

  /**
   * Destroy the EventBus and clean up all resources
   */
  destroy(): void {
    this.clear();

    // Clean up BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = undefined;
    }
  }

  getListenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  getAllEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  inspect(): {
    totalEvents: number;
    totalHandlers: number;
    events: Record<string, number>;
    scopes: Record<string, number>;
    weakRefStats?: ReturnType<EventBus['getWeakRefStats']>;
  } {
    const events: Record<string, number> = {};
    const scopes: Record<string, number> = {};

    for (const [event, subs] of this.handlers) {
      events[event] = subs.size;
    }

    for (const [scope, events] of this.scopes) {
      scopes[scope] = events.size;
    }

    const result = {
      totalEvents: this.handlers.size,
      totalHandlers: Array.from(this.handlers.values()).reduce((sum, subs) => sum + subs.size, 0),
      events,
      scopes
    };

    // Add WeakRef stats if enabled
    if (this.weakRefCleanupEnabled) {
      return {
        ...result,
        weakRefStats: this.getWeakRefStats()
      };
    }

    return result;
  }
}

// Initialize with limited diagnostics for memory efficiency
const isDev = typeof import.meta?.env?.DEV !== 'undefined' ? import.meta.env.DEV : process.env.NODE_ENV === 'development';
export const eventBus = new EventBus({
  enableBroadcastChannel: false, // Enable for multi-tab support
  enableDiagnostics: isDev && false, // Disable diagnostics even in dev for memory efficiency
  enableWeakRefCleanup: true // Enable WeakRef cleanup for production testing
});

// Add debugging methods to window for development
if (isDev && typeof window !== 'undefined') {
  (window as any).eventBusInspect = () => eventBus.inspect();
  (window as any).eventBusCleanup = () => eventBus.performMemoryCleanup();
  (window as any).eventBusWeakRefStats = () => eventBus.getWeakRefStats();

  // Create a test component to demonstrate WeakRef functionality
  (window as any).testWeakRefCleanup = () => {
    console.log('Testing WeakRef cleanup functionality...');

    // Create a test object that will be garbage collected
    const testComponent = {
      id: 'test-component',
      data: 'some data',
      cleanup: () => console.log('Component cleaned up')
    };

    // Register event listener with test component as owner
    const unsubscribe = eventBus.on('test-event', () => {
      console.log('Test event handler called');
    }, {
      owner: testComponent,
      scope: 'test-scope'
    });

    console.log('Registered listener with WeakRef owner');
    console.log('Current stats:', eventBus.getWeakRefStats());

    // Remove reference to testComponent (making it eligible for GC)
    // In a real scenario, the component would be unmounted/destroyed
    setTimeout(() => {
      // Clear the reference
      (window as any).testComponent = null;

      // Force cleanup (in real scenario, this would happen automatically)
      eventBus.performMemoryCleanup();

      console.log('After cleanup:', eventBus.getWeakRefStats());
      console.log('WeakRef cleanup test completed');
    }, 1000);

    return unsubscribe;
  };
}

export type { EventHandler, EventBusOptions };