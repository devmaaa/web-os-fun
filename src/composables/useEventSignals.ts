import { createSignal, onCleanup } from 'solid-js';
import { eventBus } from '../core/event-bus';

export function createEventSignal<T>(event: string, initialValue: T) {
  const [value, setValue] = createSignal<T>(initialValue);

  const unsubscribe = eventBus.on(event, (payload: T) => {
    setValue(() => payload);
  });

  onCleanup(unsubscribe);

  return value;
}

export function createEventAccumulator<T>(event: string, initialValue: T[] = []) {
  const [values, setValues] = createSignal<T[]>(initialValue);

  const unsubscribe = eventBus.on(event, (payload: T) => {
    setValues(prev => [...prev, payload]);
  });

  onCleanup(unsubscribe);

  return [values, () => setValues(initialValue)] as const;
}

// More advanced: Event-driven store
export function createEventStore<T>(event: string, initialValue: T) {
  const [value, setValue] = createSignal<T>(initialValue);

  const unsubscribe = eventBus.on(event, (payload: T) => {
    setValue(() => payload);
  });

  onCleanup(unsubscribe);

  return [value, setValue] as const;
}