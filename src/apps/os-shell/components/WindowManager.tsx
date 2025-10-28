import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';
import { pluginComponents } from '../../../plugins';

interface WindowManagerProps {}

const WindowManager: Component<WindowManagerProps> = () => {
  // Add CSS styles for resize handles that can't be done with Tailwind
  onMount(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Resize handles - positioning and cursor styles */
      .resize-handle {
        position: absolute;
        background: transparent;
        z-index: 1000;
        opacity: 0;
        transition: all 0.2s ease;
        pointer-events: auto;
      }

      .resize-handle:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(1px);
      }

      .resize-handle-bottom-left {
        bottom: 0;
        left: 0;
        width: 12px;
        height: 12px;
        border-radius: 0 0 0 8px;
        cursor: nesw-resize;
      }

      .resize-handle-bottom-right {
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 0 0 8px 0;
        cursor: nwse-resize;
      }

      .resize-handle-bottom {
        bottom: 0;
        left: 12px;
        right: 12px;
        height: 6px;
        cursor: ns-resize;
      }

      /* Corner handle hover - show L-shaped border */
      .resize-handle-bottom-left:hover {
        border-left: 1px solid rgba(255, 255, 255, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      }

      .resize-handle-bottom-right:hover {
        border-right: 1px solid rgba(255, 255, 255, 0.3);
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      }

      /* Edge handle hover - show line */
      .resize-handle-bottom:hover {
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      }

      /* Show handles when window is being resized */
      .window[data-resizing="true"] .resize-handle {
        opacity: 1;
        background: rgba(255, 255, 255, 0.08);
      }

      .window[data-resizing="true"] .resize-handle-bottom-left {
        border-left: 1px solid rgba(255, 255, 255, 0.5);
        border-bottom: 1px solid rgba(255, 255, 255, 0.5);
      }

      .window[data-resizing="true"] .resize-handle-bottom-right {
        border-right: 1px solid rgba(255, 255, 255, 0.5);
        border-bottom: 1px solid rgba(255, 255, 255, 0.5);
      }

      .window[data-resizing="true"] .resize-handle-bottom {
        border-bottom: 1px solid rgba(255, 255, 255, 0.5);
      }

      /* Custom scrollbar styling */
      .window-content::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      .window-content::-webkit-scrollbar-track {
        background: transparent;
      }

      .window-content::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }

      .window-content::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }

      /* Ensure content container fits properly */
      .window-content {
        box-sizing: border-box;
        overflow: auto;
        flex: 1;
        min-height: 0;
      }

      /* Prevent content interaction during resize */
      .window[data-resizing="true"] .window-content {
        pointer-events: none;
        user-select: none;
      }

      /* Ensure all content elements respect container bounds */
      .window-content > * {
        max-width: 100%;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  });
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
    console.log(`🖱️ handleMouseDown called for window ${windowId}`, { clientX: e.clientX, clientY: e.clientY });
    e.preventDefault();
    const window = windowManager.windows.find(w => w.id === windowId);
    if (!window) {
      console.log(`❌ Window ${windowId} not found`);
      return;
    }

    const rect = (e.target as HTMLElement).closest('.window')?.getBoundingClientRect();
    if (!rect) {
      console.log(`❌ Could not find window rect for ${windowId}`);
      return;
    }

    console.log(`📐 Window rect:`, rect);
    console.log(`📍 Window position: (${window.x}, ${window.y})`);

    setDragState({
      windowId,
      offsetX: e.clientX - window.x,
      offsetY: e.clientY - window.y,
      rafId: null
    });

    console.log(`🔢 Drag offset: (${dragState().offsetX}, ${dragState().offsetY})`);

    windowManager.startDrag(windowId);
    windowManager.focusWindow(windowId);
    console.log(`✅ Started dragging window ${windowId}`);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const state = dragState();
    if (!state.windowId) return;

    // Throttle using requestAnimationFrame for 60fps performance (spec requirement)
    if (state.rafId) return;

    const rafId = requestAnimationFrame(() => {
      const newX = e.clientX - state.offsetX;
      const newY = e.clientY - state.offsetY;
      console.log(`📍 Updating window position: ${state.windowId} -> (${newX}, ${newY})`);
      windowManager.updateWindowPosition(state.windowId!, newX, newY);

      setDragState(prev => ({ ...prev, rafId: null }));
    });

    setDragState(prev => ({ ...prev, rafId }));
  };

  const handleMouseUp = () => {
    const state = dragState();
    console.log(`🖱️ handleMouseUp called, ending drag for ${state.windowId}`);
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
        <Show when={window.state !== 'minimized' && window.state !== 'closing'}>
          <div
            class={`window window-wrapper absolute border transition-all duration-200 ${
              window.state === 'minimizing' ? 'pointer-events-none' : ''
            } ${window.isDragging ? 'opacity-90' : ''} ${window.isPreview ? 'opacity-70' : ''} ${
              window.isResizing ? 'pointer-events-none' : ''
            }`}
            data-window-id={window.id}
             style={{
               left: `${window.x}px`,
               top: `${window.y}px`,
               width: `${window.width}px`,
               'min-width': `${window.width}px`,
               height: `${window.height}px`,
               'z-index': window.zIndex,
               'background-color': 'var(--color-bg-primary)',
               'border-color': 'var(--color-border-primary)',
               '--window-width': `${window.width}px`,
               '--window-height': `${window.height}px`,
               // GPU acceleration for dragging (spec requirement)
               transform: window.isDragging ? `translate3d(0, 0, 0)` : 'none',
               'will-change': window.isDragging ? 'transform' : 'auto'
             }}
            data-resizing={window.isResizing ? 'true' : 'false'}
          >
            {/* Title Bar */}
            <div
              class={`flex justify-between items-center px-4 py-2 cursor-move select-none text-sm font-medium ${
                window.isResizing ? 'pointer-events-none' : ''
              }`}
              style={{
                'background': 'linear-gradient(to bottom, var(--color-bg-primary), var(--color-bg-secondary))',
                'border-bottom': '1px solid var(--color-border-primary)',
                'border-radius': '8px 8px 0 0',
                color: 'var(--text-primary)'
              }}
              onMouseDown={(e) => handleMouseDown(e, window.id)}
            >
              <div class="flex items-center gap-2">
                <div class="text-lg">
                  {pluginLoader.getPlugin(window.pluginId)?.manifest.icon || '📱'}
                </div>
                <span class="text-sm font-semibold select-none">{window.title}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  class="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[10px] font-black leading-none"
                  onClick={() => windowManager.minimizeWindow(window.id)}
                  disabled={!windowManager.canExecuteOperation?.(window.id, 'minimize')}
                  title={windowManager.canExecuteOperation?.(window.id, 'minimize') ? 'Minimize' : 'Cannot minimize in current state'}
                >
                  −
                </button>
                <button
                  class="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[10px] font-black leading-none"
                  onClick={() => windowManager.toggleMaximizeWindow(window.id)}
                  disabled={!windowManager.canExecuteOperation?.(window.id, 'maximize') && window.state !== 'maximized'}
                  title={windowManager.canExecuteOperation?.(window.id, 'maximize') || window.state === 'maximized' ? (window.state === 'maximized' ? 'Restore' : 'Maximize') : 'Cannot maximize in current state'}
                >
                  {window.state === 'maximized' ? '❐' : '□'}
                </button>
                <button
                  class="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[10px] font-black leading-none"
                  onClick={() => windowManager.closeWindow(window.id)}
                  disabled={!windowManager.canExecuteOperation?.(window.id, 'close')}
                  title={windowManager.canExecuteOperation?.(window.id, 'close') ? 'Close' : 'Cannot close in current state'}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              class="window-content overflow-auto bg-bg-secondary text-text-primary rounded-b-lg"
              style={{
                height: `calc(${window.height}px - 40px)`, // 40px for title bar
              }}
            >
              {(() => {
                const PluginComponent = window.component || pluginComponents[window.pluginId];
                return PluginComponent ? <PluginComponent /> : (
                  <div class="flex flex-col items-center justify-center p-4 min-h-[150px] box-border">
                    <div class="text-center max-w-full box-border">
                      <div class="text-3xl mb-2">📱</div>
                      <p class="text-xs break-words mb-1" style={{ color: 'var(--text-secondary)' }}>Content for {window.title}</p>
                      <p class="text-xs break-words mb-1" style={{ color: 'var(--text-secondary)' }}>Plugin ID: {window.pluginId}</p>
                      <p class="text-xs break-words mb-2" style={{ color: 'var(--text-secondary)' }}>Window ID: {window.id}</p>
                      <div class="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                        <p>Size: {window.width}×{window.height}</p>
                        <p>State: {window.state}</p>
                        <p>FSM State: {windowManager.getFSMState?.(window.id) || 'N/A'}</p>
                        {window.isResizing && <p class="text-green-500 font-bold">🔄 Resizing...</p>}
                      </div>

                      {/* Interactive content to test resize behavior */}
                      <div class="mt-3 p-2 border rounded box-border" style={{
                        'border-color': 'var(--color-border-primary)',
                        'background-color': 'var(--color-bg-primary)',
                        'max-width': '100%'
                      }}>
                        <p class="text-xs mb-1">🧪 Resize Test Area</p>
                        <div class="flex gap-1 justify-center flex-wrap">
                          <button
                            class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                            onClick={() => alert('Button clicked!')}
                          >
                            Test Button
                          </button>
                          <div class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                            {window.width}×{window.height}
                          </div>
                        </div>
                      </div>
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