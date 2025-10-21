import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';
import { pluginComponents } from '@plugins';

interface WindowManagerProps {}

const WindowManager: Component<WindowManagerProps> = () => {
  // Drag state following spec requirements
  const [dragState, setDragState] = createSignal<{
    windowId: string | null;
    offsetX: number;
    offsetY: number;
    rafId: number | null;
  }>({
    windowId: null,
    offsetX: 0,
    offsetY: 0,
    rafId: null
  });

  // Drag handling following spec requirements
  const handleMouseDown = (e: MouseEvent, windowId: string) => {
    e.preventDefault();
    const window = windowManager.windows.find(w => w.id === windowId);
    if (!window) return;

    const rect = (e.target as HTMLElement).closest('.window')?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      windowId,
      offsetX: e.clientX - window.x,
      offsetY: e.clientY - window.y,
      rafId: null
    });

    windowManager.startDrag(windowId);
    windowManager.focusWindow(windowId);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const state = dragState();
    if (!state.windowId) return;

    // Throttle using requestAnimationFrame for 60fps performance (spec requirement)
    if (state.rafId) return;

    const rafId = requestAnimationFrame(() => {
      const newX = e.clientX - state.offsetX;
      const newY = e.clientY - state.offsetY;
      windowManager.updateWindowPosition(state.windowId!, newX, newY);

      setDragState(prev => ({ ...prev, rafId: null }));
    });

    setDragState(prev => ({ ...prev, rafId }));
  };

  const handleMouseUp = () => {
    const state = dragState();
    if (state.windowId) {
      windowManager.endDrag(state.windowId);
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
    }
    setDragState({
      windowId: null,
      offsetX: 0,
      offsetY: 0,
      rafId: null
    });
  };

  // Global event listeners for drag
  onMount(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    const state = dragState();
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
  });

  return (
    <For each={windowManager.windows}>
      {(window) => (
        <Show when={window.state !== 'minimized'}>
          <div
            class="window absolute rounded-lg overflow-hidden border"
            style={{
              left: `${window.x}px`,
              top: `${window.y}px`,
              width: `${window.width}px`,
              height: `${window.height}px`,
              'z-index': window.zIndex,
              'background-color': 'var(--bg-primary)',
              'border-color': 'var(--border-color)',
              // GPU acceleration for dragging (spec requirement)
              transform: window.isDragging ? `translate3d(0, 0, 0)` : 'none',
              willChange: window.isDragging ? 'transform' : 'auto',
              // Visual feedback for drag state
              opacity: window.isDragging ? 0.8 : (window.isPreview ? 0.7 : 1),
              transition: window.isDragging ? 'none' : 'opacity 0.2s ease'
            }}
          >
            {/* Title Bar */}
            <div
              class="flex justify-between items-center px-3 py-2 cursor-move border-b"
              style={{
                'background-color': 'var(--bg-secondary)',
                'border-color': 'var(--border-color)',
                color: 'var(--text-primary)',
                'user-select': 'none'
              }}
              onMouseDown={(e) => handleMouseDown(e, window.id)}
            >
              <div class="flex items-center gap-2">
                <div class="text-lg">
                  {pluginLoader.getPlugin(window.pluginId)?.manifest.icon || '📱'}
                </div>
                <span class="text-sm font-semibold select-none">{window.title}</span>
              </div>
              <div class="flex space-x-1">
                <button
                  class="w-6 h-6 rounded bg-yellow-500 text-white text-xs"
                  onClick={() => windowManager.minimizeWindow(window.id)}
                >
                  −
                </button>
                <button
                  class="w-6 h-6 rounded bg-green-500 text-white text-xs"
                  onClick={() => windowManager.toggleMaximizeWindow(window.id)}
                >
                  {window.state === 'maximized' ? '❐' : '□'}
                </button>
                <button
                  class="w-6 h-6 rounded bg-red-500 text-white text-xs"
                  onClick={() => windowManager.closeWindow(window.id)}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              class="p-4 h-full overflow-auto"
              style={{
                'background-color': 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
            >
              {(() => {
                const PluginComponent = window.component || pluginComponents[window.pluginId];
                return PluginComponent ? <PluginComponent /> : (
                  <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                      <div class="text-6xl mb-4">📱</div>
                      <p style={{ color: 'var(--text-secondary)' }}>Content for {window.title}</p>
                      <p style={{ color: 'var(--text-secondary)' }}>Plugin ID: {window.pluginId}</p>
                      <p style={{ color: 'var(--text-secondary)' }}>Window ID: {window.id}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Show>
      )}
    </For>
  );
};

export { WindowManager };