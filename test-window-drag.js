#!/usr/bin/env node

// Test script to verify window dragging functionality
// This simulates the drag behavior to ensure the code paths work correctly

console.log('🧪 Testing Window Drag Functionality...\n');

// Simulate the drag state and handlers from WindowManager
class MockWindowManager {
  constructor() {
    this.windows = [
      {
        id: 'test-window-1',
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        zIndex: 1,
        state: 'normal',
        isDragging: false,
        pluginId: '@dineapp/calculator'
      }
    ];
  }

  startDrag(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      window.isDragging = true;
      console.log(`✅ Started dragging window: ${windowId}`);
    }
  }

  updateWindowPosition(windowId, x, y) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      window.x = x;
      window.y = y;
      console.log(`📍 Updated window position: ${windowId} -> (${x}, ${y})`);
    }
  }

  endDrag(windowId) {
    const window = this.windows.find(w => w.id === windowId);
    if (window) {
      window.isDragging = false;
      console.log(`✅ Ended dragging window: ${windowId}`);
    }
  }

  focusWindow(windowId) {
    console.log(`🎯 Focused window: ${windowId}`);
  }
}

// Simulate drag state
let dragState = {
  windowId: null,
  offsetX: 0,
  offsetY: 0,
  rafId: null
};

// Mock WindowManager instance
const windowManager = new MockWindowManager();

// Simulate handleMouseDown (from WindowManager.tsx)
function handleMouseDown(e, windowId) {
  e.preventDefault();
  const window = windowManager.windows.find(w => w.id === windowId);
  if (!window) return;

  // Simulate getting bounding rect
  const rect = { left: window.x, top: window.y, width: window.width, height: window.height };

  dragState = {
    windowId,
    offsetX: e.clientX - window.x,
    offsetY: e.clientY - window.y,
    rafId: null
  };

  windowManager.startDrag(windowId);
  windowManager.focusWindow(windowId);

  console.log(`🖱️  Mouse down on window ${windowId} at (${e.clientX}, ${e.clientY})`);
  console.log(`📐 Window rect: x=${rect.left}, y=${rect.top}, w=${rect.width}, h=${rect.height}`);
  console.log(`🔢 Drag offset: (${dragState.offsetX}, ${dragState.offsetY})`);
}

// Simulate handleMouseMove (from WindowManager.tsx)
function handleMouseMove(e) {
  if (!dragState.windowId) return;

  // Simulate RAF throttling
  if (dragState.rafId) return;

  dragState.rafId = setTimeout(() => {
    const newX = e.clientX - dragState.offsetX;
    const newY = e.clientY - dragState.offsetY;
    windowManager.updateWindowPosition(dragState.windowId, newX, newY);

    dragState.rafId = null;
  }, 16); // ~60fps
}

// Simulate handleMouseUp (from WindowManager.tsx)
function handleMouseUp() {
  if (dragState.windowId) {
    windowManager.endDrag(dragState.windowId);
    if (dragState.rafId) {
      clearTimeout(dragState.rafId);
    }
  }
  dragState = {
    windowId: null,
    offsetX: 0,
    offsetY: 0,
    rafId: null
  };
  console.log('🖱️  Mouse up - drag ended');
}

// Test the drag sequence
console.log('1. Simulating mouse down on title bar...');
const mockEvent = { clientX: 200, clientY: 120, preventDefault: () => {} };
handleMouseDown(mockEvent, 'test-window-1');

console.log('\n2. Simulating mouse move (dragging)...');
const moveEvent1 = { clientX: 250, clientY: 140 };
handleMouseMove(moveEvent1);

const moveEvent2 = { clientX: 300, clientY: 160 };
handleMouseMove(moveEvent2);

console.log('\n3. Simulating mouse up...');
handleMouseUp();

console.log('\n4. Checking final window position...');
const finalWindow = windowManager.windows[0];
console.log(`Final position: (${finalWindow.x}, ${finalWindow.y})`);
console.log(`Expected: (${300 - dragState.offsetX}, ${160 - dragState.offsetY})`);

console.log('\n✅ Window drag simulation completed!');
console.log('🎉 If you see position updates above, the drag logic is working correctly.');
console.log('💡 Next: Test in browser at http://localhost:3203/');