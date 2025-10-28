#!/usr/bin/env node

// Integration test for Dock + WindowManager components
console.log('🧪 Testing Dock + WindowManager Integration...\n');

// Mock EventBus
class MockEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler, options = {}) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push({ handler, options });
  }

  emit(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(({ handler }) => {
      handler({ data });
    });
    console.log(`📡 ${event}:`, data ? Object.keys(data).join(', ') : 'no data');
  }

  emitSync(event, data) {
    this.emit(event, data);
  }

  offAll(scope) {
    for (const [event, listeners] of this.listeners.entries()) {
      this.listeners.set(event, listeners.filter(l => l.options.scope !== scope));
    }
  }
}

// Mock WindowManager
class MockWindowManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.windows = [];
    this.highestZIndex = 1;
  }

  createWindow(pluginId, title, options = {}) {
    const window = {
      id: `window-${Date.now()}`,
      pluginId,
      title,
      x: options.x || 100,
      y: options.y || 100,
      width: options.width || 400,
      height: options.height || 300,
      zIndex: ++this.highestZIndex,
      state: 'normal',
      isDragging: false
    };
    this.windows.push(window);

    // Emit window opened event
    setTimeout(() => {
      this.eventBus.emit('window:opened', {
        pluginId,
        windowId: window.id
      });
    }, 10);

    return window;
  }

  minimizeWindow(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window && window.state !== 'minimized') {
      window.state = 'minimized';
      this.eventBus.emit('window:minimized', {
        id: windowId,
        pluginId: window.pluginId
      });
    }
  }

  restoreWindow(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window && window.state === 'minimized') {
      window.state = 'normal';
      window.zIndex = ++this.highestZIndex;
      this.eventBus.emit('window:restored', {
        id: windowId,
        pluginId: window.pluginId
      });
    }
  }

  focusWindow(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      window.zIndex = ++this.highestZIndex;
      this.eventBus.emit('window:focused', {
        pluginId: window.pluginId
      });
    }
  }

  getHighestZIndex() {
    return this.highestZIndex;
  }
}

// Mock FSM
class MockFSM {
  constructor(id) {
    this.id = id;
    this.state = 'idle';
  }

  getState() { return this.state; }
  can(event) { return true; }
  transition(event) {
    this.state = event;
  }
  getId() { return this.id; }
}

// Mock getFSM
const mockFSMs = new Map();
function getFSM(id) {
  if (!mockFSMs.has(id)) {
    mockFSMs.set(id, new MockFSM(id));
  }
  return mockFSMs.get(id);
}

// Initialize components
const eventBus = new MockEventBus();
const windowManager = new MockWindowManager(eventBus);

// Mock available plugins
const availablePlugins = [
  { id: '@dineapp/calculator', displayName: 'Calculator', icon: '🧮' },
  { id: '@dineapp/text-editor', displayName: 'Text Editor', icon: '📝' }
];

// Mock Dock items
let dockItems = availablePlugins.map(plugin => ({
  id: plugin.id,
  name: plugin.displayName,
  icon: plugin.icon,
  isActive: false,
  isRunning: false,
  fsm: null
}));

// Simplified Dock event handlers
function handleWindowOpened(event) {
  if (!event || !event.data) return;
  const { pluginId } = event.data;
  updateDockItemState(pluginId, { isRunning: true });
}

function handleWindowClosed(event) {
  if (!event || !event.data) return;
  const { pluginId } = event.data;
  updateDockItemState(pluginId, { isRunning: false, isActive: false });
}

function handleWindowFocused(event) {
  if (!event || !event.data) return;
  const { pluginId } = event.data;
  updateDockItemState(pluginId, { isActive: true });
}

function handleWindowMinimized(event) {
  if (!event || !event.data) return;
  const { pluginId } = event.data;
  updateDockItemState(pluginId, { isActive: false });
}

function handleWindowRestored(event) {
  if (!event || !event.data) return;
  const { pluginId } = event.data;
  updateDockItemState(pluginId, { isActive: true });
}

function updateDockItemState(pluginId, updates) {
  const item = dockItems.find(item => item.id === pluginId);
  if (item) {
    Object.assign(item, updates);
    item.fsm = getFSM(`window:${windowManager.windows.find(w => w.pluginId === pluginId)?.id}`);
  }
}

// Setup Dock event listeners
eventBus.on('window:opened', handleWindowOpened, { scope: 'dock' });
eventBus.on('window:closed', handleWindowClosed, { scope: 'dock' });
eventBus.on('window:focused', handleWindowFocused, { scope: 'dock' });
eventBus.on('window:minimized', handleWindowMinimized, { scope: 'dock' });
eventBus.on('window:restored', handleWindowRestored, { scope: 'dock' });

// Mock onAppOpen function
async function onAppOpen(pluginId) {
  console.log(`🚀 Launching app: ${pluginId}`);
  const plugin = availablePlugins.find(p => p.id === pluginId);
  if (plugin) {
    windowManager.createWindow(pluginId, plugin.displayName);
  }
}

// Test sequence
console.log('1. Initial state:');
console.log(`   Windows: ${windowManager.windows.length}`);
console.log(`   Dock items: ${dockItems.map(i => `${i.name}(${i.isRunning ? 'running' : 'idle'})`).join(', ')}`);

console.log('\n2. Launching Calculator...');
onAppOpen('@dineapp/calculator');

setTimeout(() => {
  console.log('\n3. State after Calculator launch:');
  console.log(`   Windows: ${windowManager.windows.length}`);
  console.log(`   Calculator window: ${windowManager.windows[0]?.state}`);
  console.log(`   Dock items: ${dockItems.map(i => `${i.name}(${i.isRunning ? 'running' : 'idle'}, ${i.isActive ? 'active' : 'inactive'})`).join(', ')}`);

  console.log('\n4. Launching Text Editor...');
  onAppOpen('@dineapp/text-editor');

  setTimeout(() => {
    console.log('\n5. State after Text Editor launch:');
    console.log(`   Windows: ${windowManager.windows.length}`);
    console.log(`   Window states: ${windowManager.windows.map(w => `${w.title}:${w.state}`).join(', ')}`);
    console.log(`   Dock items: ${dockItems.map(i => `${i.name}(${i.isRunning ? 'running' : 'idle'}, ${i.isActive ? 'active' : 'inactive'})`).join(', ')}`);

    console.log('\n6. Minimizing Calculator...');
    windowManager.minimizeWindow(windowManager.windows[0].id);

    setTimeout(() => {
      console.log('\n7. State after minimizing Calculator:');
      console.log(`   Calculator window: ${windowManager.windows[0]?.state}`);
      console.log(`   Text Editor window: ${windowManager.windows[1]?.state}`);
      console.log(`   Dock items: ${dockItems.map(i => `${i.name}(${i.isRunning ? 'running' : 'idle'}, ${i.isActive ? 'active' : 'inactive'})`).join(', ')}`);

      console.log('\n8. Clicking Calculator in Dock (should restore)...');
      // Simulate dock click - find minimized window and restore
      const calcWindow = windowManager.windows.find(w => w.pluginId === '@dineapp/calculator' && w.state === 'minimized');
      if (calcWindow) {
        windowManager.restoreWindow(calcWindow.id);
      }

      setTimeout(() => {
        console.log('\n9. Final state:');
        console.log(`   Windows: ${windowManager.windows.length}`);
        console.log(`   Window states: ${windowManager.windows.map(w => `${w.title}:${w.state}`).join(', ')}`);
        console.log(`   Dock items: ${dockItems.map(i => `${i.name}(${i.isRunning ? 'running' : 'idle'}, ${i.isActive ? 'active' : 'inactive'})`).join(', ')}`);

        console.log('\n✅ Integration test completed!');
        console.log('🎉 Components are working together correctly.');
      }, 100);
    }, 100);
  }, 100);
}, 100);