import { eventBus } from '../../core/event-bus';

export async function init() {
  console.log('Settings plugin initializing...');
  eventBus.on('settings:changed', (data) => {
    console.log('Settings changed:', data);
  }, { scope: '@dineapp/settings' });
  console.log('Settings plugin initialized');
}

export async function start() {}
export async function stop() {}
export async function unload() {
  eventBus.offAll('@dineapp/settings');
}