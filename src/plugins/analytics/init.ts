import { eventBus } from '../../core/event-bus';

export async function init() {
  console.log('Analytics plugin initializing...');
  eventBus.on('order:created', (order) => {
    console.log('Analytics: Tracking order:', order);
  }, { scope: '@dineapp/analytics' });

  eventBus.on('inventory:updated', (update) => {
    console.log('Analytics: Inventory updated:', update);
  }, { scope: '@dineapp/analytics' });

  eventBus.on('user:logged-in', (user) => {
    console.log('Analytics: User logged in:', user);
  }, { scope: '@dineapp/analytics' });

  console.log('Analytics plugin initialized');
}

export async function start() {}
export async function stop() {}
export async function unload() {
  eventBus.offAll('@dineapp/analytics');
}