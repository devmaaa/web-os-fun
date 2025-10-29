import { eventBus } from '@core/event-bus';

const scope = '@dineapp/file-manager';

export async function init() {
  // Register scoped event listeners
  eventBus.on('file:selected', handleFileSelected, { scope });
  eventBus.on('folder:navigated', handleFolderNavigated, { scope });

  // Emit plugin loaded event
  eventBus.emit('plugin:loaded', {
    pluginId: '@dineapp/file-manager',
    timestamp: Date.now()
  });
}

function handleFileSelected(event: any) {
  console.log('File selected:', event.data);
}

function handleFolderNavigated(event: any) {
  console.log('Folder navigated to:', event.data);
}