import { eventBus } from '../../core/event-bus';

export async function init() {
  console.log('Menu plugin initializing...');
  eventBus.on('menu:updated', (data) => {
    console.log('Menu updated:', data);
  }, { scope: '@dineapp/menu' });
  console.log('Menu plugin initialized');
}

export async function start() {}
export async function stop() {}
export async function unload() {
  eventBus.offAll('@dineapp/menu');
}