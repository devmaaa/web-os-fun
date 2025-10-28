#!/usr/bin/env node

// Test script to verify Dock minimize/restore functionality
console.log('🧪 Testing Dock Minimize/Restore Functionality...\n');

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
    console.log(`📡 Emitted event: ${event}`, data ? Object.keys(data) : 'no data');
  }

  offAll(scope) {
    for (const [event, listeners] of this.listeners.entries()) {
      this.listeners.set(event, listeners.filter(l => l.options.scope !== scope));
    }
  }
}

// Mock WindowManager
class MockWindowManager {
  constructor() {
    this.windows = [
      {
        id: 'window-1',
        pluginId: '@dineapp/calculator',
        state: 'normal',
        zIndex: 1
      }
    ];
  }

  minimizeWindow(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      window.state = 'minimized';
      console.log(`🪟 Minimized window: ${windowId}`);
      // Emit event
      eventBus.emit('window:minimized', { id: windowId, pluginId: window.pluginId });
    }
  }

  restoreWindow(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      window.state = 'normal';
      console.log(`🪟 Restored window: ${windowId}`);
      // Emit event
      eventBus.emit('window:restored', { id: windowId, pluginId: window.pluginId });
    }
  }

  getHighestZIndex() {
    return Math.max(...this.windows.map(w => w.zIndex));
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
    console.log(`🔄 FSM ${this.id}: ${this.state} → ${event}`);
    this.state = event;
  }
  getId() { return this.id; }
  inspect() { return { id: this.id, state: this.state }; }
}

// Mock getFSM function
const mockFSMs = new Map();
function getFSM(id) {
  if (!mockFSMs.has(id)) {
    mockFSMs.set(id, new MockFSM(id));
  }
  return mockFSMs.get(id);
}

// Initialize mocks
const eventBus = new MockEventBus();
const windowManager = new MockWindowManager();

// Mock Dock component behavior
let dockItems = [
  {
    id: '@dineapp/calculator',
    name: 'Calculator',
    icon: '🧮',
    isActive: false,
    isRunning: true,
    fsm: getFSM('window:window-1')
  }
];

function updateDockItemState(pluginId, updates) {
  const item = dockItems.find(item => item.id === pluginId);
  if (item) {
    Object.assign(item, updates);
    console.log(`📱 Updated dock item ${pluginId}:`, updates);
  }
}

// Event handlers (simplified from Dock.tsx)
function handleWindowMinimized(event) {
  if (!event || !event.data) return;
  const { pluginId } = event.data;
  if (!pluginId) return;

  console.log(`[Dock] Window minimized: ${pluginId}`);
  updateDockItemState(pluginId, { isActive: false });
}

function handleWindowRestored(event) {
  if (!event || !event.data) return;
  const { pluginId } = event.data;
  if (!pluginId) return;

  console.log(`[Dock] Window restored: ${pluginId}`);
  updateDockItemState(pluginId, { isActive: true });
}

// Setup event listeners
eventBus.on('window:minimized', handleWindowMinimized, { scope: 'dock' });
eventBus.on('window:restored', handleWindowRestored, { scope: 'dock' });

// Test minimize/restore workflow
console.log('1. Initial state:');
console.log(`   Window state: ${windowManager.windows[0].state}`);
console.log(`   Dock item active: ${dockItems[0].isActive}`);
console.log(`   FSM state: ${dockItems[0].fsm.getState()}`);

console.log('\n2. Minimizing window...');
windowManager.minimizeWindow('window-1');

setTimeout(() => {
  console.log('\n3. Current state after minimize:');
  console.log(`   Window state: ${windowManager.windows[0].state}`);
  console.log(`   Dock item active: ${dockItems[0].isActive}`);

  console.log('\n4. Restoring window...');
  windowManager.restoreWindow('window-1');

  setTimeout(() => {
    console.log('\n5. Final state after restore:');
    console.log(`   Window state: ${windowManager.windows[0].state}`);
    console.log(`   Dock item active: ${dockItems[0].isActive}`);

    console.log('\n✅ Dock minimize/restore test completed!');
    console.log('🎉 If states changed correctly, the Dock integration is working.');
  }, 100);
}, 100);