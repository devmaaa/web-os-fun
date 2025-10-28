type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface Subscription {
  handler: EventHandler;
  once: boolean;
  scope?: string;
  priority: number;
}

interface EventBusOptions {
  enableBroadcastChannel?: boolean;
  enableDiagnostics?: boolean;
}

class EventBus {
  private handlers = new Map<string, Set<Subscription>>();
  private scopes = new Map<string, Set<string>>(); // scope -> events
  private broadcastChannel?: BroadcastChannel;
  private diagnosticsEnabled = false;

  constructor(options: EventBusOptions = {}) {
    if (options.enableBroadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel('dineapp_events');
        this.broadcastChannel.onmessage = (e) => {
          // Avoid echo by checking if we sent this
          if (e.data._source !== 'local') {
            this.emitSync(e.data.event, e.data.payload);
          }
        };
      } catch (error) {
        console.warn('[EventBus] BroadcastChannel not supported');
      }
    }

    this.diagnosticsEnabled = options.enableDiagnostics ?? false;
  }

  on<T = any>(
    event: string,
    handler: EventHandler<T>,
    options: { once?: boolean; scope?: string; priority?: number } = {}
  ): () => void {
    const subscription: Subscription = {
      handler,
      once: options.once ?? false,
      scope: options.scope,
      priority: options.priority ?? 0
    };

    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(subscription);

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

    // Sort by priority (higher priority first)
    const sortedSubs = Array.from(subs).sort((a, b) => b.priority - a.priority);

    const toRemove: Subscription[] = [];

    for (const sub of sortedSubs) {
      try {
        await sub.handler(data);
        if (sub.once) toRemove.push(sub);
      } catch (error) {
        console.error(`[EventBus] Error in "${event}" handler:`, error);

        // Emit error event
        this.emitSync('__error', {
          event,
          error,
          scope: sub.scope,
          timestamp: Date.now()
        });
      }
    }

    toRemove.forEach(sub => subs.delete(sub));

    // Broadcast to other tabs if enabled
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        event,
        payload: data,
        _source: 'local'
      });
    }
  }

  emitSync<T = any>(event: string, data: T): void {
    const subs = this.handlers.get(event);
    if (!subs || subs.size === 0) return;

    // Sort by priority (higher priority first)
    const sortedSubs = Array.from(subs).sort((a, b) => b.priority - a.priority);

    const toRemove: Subscription[] = [];

    for (const sub of sortedSubs) {
      try {
        sub.handler(data);
        if (sub.once) toRemove.push(sub);
      } catch (error) {
        console.error(`[EventBus] Error in "${event}" handler:`, error);

        // Emit error event
        this.emitSync('__error', {
          event,
          error,
          scope: sub.scope,
          timestamp: Date.now()
        });
      }
    }

    toRemove.forEach(sub => subs.delete(sub));

    // Broadcast to other tabs if enabled
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        event,
        payload: data,
        _source: 'local'
      });
    }
  }

  clear(): void {
    this.handlers.clear();
    this.scopes.clear();
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
  } {
    const events: Record<string, number> = {};
    const scopes: Record<string, number> = {};

    for (const [event, subs] of this.handlers) {
      events[event] = subs.size;
    }

    for (const [scope, events] of this.scopes) {
      scopes[scope] = events.size;
    }

    return {
      totalEvents: this.handlers.size,
      totalHandlers: Array.from(this.handlers.values()).reduce((sum, subs) => sum + subs.size, 0),
      events,
      scopes
    };
  }
}

// Initialize with limited diagnostics for memory efficiency
const isDev = import.meta.env.DEV;
export const eventBus = new EventBus({
  enableBroadcastChannel: false, // Enable for multi-tab support
  enableDiagnostics: isDev && false // Disable diagnostics even in dev for memory efficiency
});

// Add inspect method to window for debugging
if (isDev && typeof window !== 'undefined') {
  (window as any).eventBusInspect = () => eventBus.inspect();
}

export type { EventHandler, EventBusOptions };