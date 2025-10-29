import { eventBus } from '@core/event-bus';

const scope = '@dineapp/calculator';

export async function init() {
  // Register scoped event listeners
  eventBus.on('calculation:performed', handleCalculationPerformed, { scope });

  // Emit plugin loaded event
  eventBus.emit('plugin:loaded', {
    pluginId: '@dineapp/calculator',
    timestamp: Date.now()
  });
}

function handleCalculationPerformed(event: any) {
  console.log('Calculation performed:', event.data);
}