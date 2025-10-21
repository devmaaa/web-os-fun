import { eventBus } from '../../core/event-bus';

export async function init() {
  console.log('KDS plugin initializing...');

  eventBus.on('order:created', (order) => {
    console.log('KDS: New order received:', order);
  }, { scope: '@dineapp/kds' });

  eventBus.on('order:updated', (update) => {
    console.log('KDS: Order updated:', update);
  }, { scope: '@dineapp/kds' });

  eventBus.on('window:focused', (data) => {
    if (data.pluginId === '@dineapp/kds') {
      console.log('KDS window focused');
    }
  }, { scope: '@dineapp/kds' });

  console.log('KDS plugin initialized');
}

export async function start() {
  console.log('KDS plugin starting...');
}

export async function stop() {
  console.log('KDS plugin stopping...');
}

export async function unload() {
  console.log('KDS plugin unloading...');
  eventBus.offAll('@dineapp/kds');
}