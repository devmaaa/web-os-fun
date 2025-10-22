import { onCleanup } from 'solid-js';
import { eventBus } from '@core/event-bus';
import type { EventHandler } from '@core/event-bus';

export function useEventBus<T = any>(
  event: string,
  handler: EventHandler<T>,
  options: { once?: boolean; scope?: string; priority?: number } = {}
) {
  const unsubscribe = eventBus.on(event, handler, options);
  onCleanup(unsubscribe);
  return unsubscribe;
}

export function useEmit() {
  return {
    emit: eventBus.emit.bind(eventBus),
    emitSync: eventBus.emitSync.bind(eventBus)
  };
}

// Plugin-level event bus utilities
export function createScopedEventBus(scopeId: string) {
  return {
    on: <T = any>(event: string, handler: EventHandler<T>, options: { once?: boolean; priority?: number } = {}) => {
      return eventBus.on(event, handler, { ...options, scope: scopeId });
    },
    emit: <T = any>(event: string, data: T) => eventBus.emit(event, data),
    emitSync: <T = any>(event: string, data: T) => eventBus.emitSync(event, data),
    offAll: () => eventBus.offAll(scopeId)
  };
}