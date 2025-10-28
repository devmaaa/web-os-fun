import { eventBus } from '@core/event-bus';

const scope = '@dineapp/terminal';

export async function init() {
  // Register scoped event listeners
  eventBus.on('command:executed', handleCommandExecuted, { scope });
  eventBus.on('terminal:cleared', handleTerminalCleared, { scope });

  // Emit plugin loaded event
  eventBus.emit('plugin:loaded', {
    pluginId: '@dineapp/terminal',
    timestamp: Date.now()
  });

  return () => {
    // Cleanup function
    eventBus.offAll(scope);
  };
}

function handleCommandExecuted(event: any) {
  console.log('Command executed:', event.data);
}

function handleTerminalCleared(event: any) {
  console.log('Terminal cleared:', event.data);
}