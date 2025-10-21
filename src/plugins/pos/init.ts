import { eventBus } from '../../core/event-bus';

export async function init() {
  console.log('POS plugin initializing...');

  // Register event listeners for this plugin scope
  eventBus.on('order:created', (order) => {
    console.log('POS: New order received:', order);
    // Handle order creation
  }, { scope: '@dineapp/pos' });

  eventBus.on('window:minimized', (data) => {
    if (data.pluginId === '@dineapp/pos') {
      console.log('POS window minimized - pausing real-time updates');
      eventBus.emitSync('pos:background-mode', { active: true });
    }
  }, { scope: '@dineapp/pos' });

  eventBus.on('window:restored', (data) => {
    if (data.pluginId === '@dineapp/pos') {
      console.log('POS window restored - resuming real-time updates');
      eventBus.emitSync('pos:foreground-mode', { active: true });
    }
  }, { scope: '@dineapp/pos' });

  eventBus.on('window:focused', (data) => {
    if (data.pluginId === '@dineapp/pos') {
      console.log('POS window focused - user is active');
      eventBus.emitSync('pos:user-active', { timestamp: Date.now() });
    }
  }, { scope: '@dineapp/pos' });

  console.log('POS plugin initialized');
}

export async function start() {
  console.log('POS plugin starting...');
  // Plugin-specific startup logic
}

export async function stop() {
  console.log('POS plugin stopping...');
  // Plugin-specific cleanup logic
}

export async function unload() {
  console.log('POS plugin unloading...');
  // Clean up all listeners for this scope
  eventBus.offAll('@dineapp/pos');
}