import { eventBus } from '../../core/event-bus';

export async function init() {
  console.log('Inventory plugin initializing...');
  eventBus.on('inventory:updated', (data) => {
    console.log('Inventory updated:', data);
  }, { scope: '@dineapp/inventory' });
  console.log('Inventory plugin initialized');
}

export async function start() {}
export async function stop() {}
export async function unload() {
  eventBus.offAll('@dineapp/inventory');
}