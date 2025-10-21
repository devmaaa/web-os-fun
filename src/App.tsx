import { Component, createSignal, onMount, onCleanup, For, Show, createRoot, createEffect } from 'solid-js';
import { windowManager } from './core/window-manager';
import { pluginLoader } from './core/plugin-loader';
import { loadPlugins, pluginComponents } from './plugins';
import './index.css';

interface DesktopIcon {
  id: string;
  name: string;
  icon: string;
  pluginId: string;
}

const App: Component = () => {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light');
  const [currentTime, setCurrentTime] = createSignal(new Date());
  const [isLoading, setIsLoading] = createSignal(true);

  // Drag state
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

  const openApp = async (pluginId: string) => {
    const plugin = pluginLoader.getPlugin(pluginId);
    if (plugin) {
      const component = pluginComponents[pluginId];
      windowManager.openWindow(pluginId, plugin.manifest.displayName, {
        component
      });
    }
  };

  const toggleTheme = () => {
    const newTheme = theme() === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Initialize app
  onMount(async () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Load plugins within Solid context
    try {
      await createRoot(async () => {
        await loadPlugins();
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load plugins:', error);
      setIsLoading(false);
    }

    // Update clock
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    onCleanup(() => {
      clearInterval(clockInterval);
    });
  });



  const pluginsWithUI = () => {
    // Access plugins directly from the store
    const allPlugins = pluginLoader.plugins;

    // Check if plugin has a UI component in the pluginComponents map
    const plugins = [];
    for (let i = 0; i < allPlugins.length; i++) {
      const plugin = allPlugins[i];
      const pluginId = plugin.manifest.id;
      const hasUI = !!pluginComponents[pluginId];
      if (hasUI) {
        plugins.push(plugin);
      }
    }

    return plugins;
  };

  return (
    <div class="h-screen w-screen relative overflow-hidden" style={{ 'background-color': 'var(--bg-primary)' }}>
      {/* Loading Overlay */}
      <Show when={isLoading()}>
        <div class="absolute inset-0 z-50 flex items-center justify-center" style={{ 'background-color': 'var(--bg-primary)' }}>
          <div class="text-center">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading applications...</p>
          </div>
        </div>
      </Show>



      {/* Desktop Icons */}
      <div class="absolute inset-0 pointer-events-none">
        <div class="grid grid-cols-6 gap-4 p-8 pointer-events-auto">
          <For each={pluginsWithUI()}>
            {(plugin) => (
              <button
                class="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-opacity-20 hover:bg-gray-500 transition-colors cursor-pointer"
                style={{
                  'background-color': 'transparent',
                  color: 'var(--text-primary)'
                }}
                onClick={() => openApp(plugin.manifest.id)}
                title={plugin.manifest.displayName}
              >
                <div class="text-4xl mb-2">
                  {plugin.manifest.icon}
                </div>
                <div class="text-xs text-center max-w-full break-words">
                  {plugin.manifest.displayName}
                </div>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Windows */}
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
                opacity: window.state === 'ghost' ? 0.8 : 1,
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
                    onClick={() => {
                      if (window.state === 'maximized') {
                        windowManager.restoreWindow(window.id);
                      } else {
                        windowManager.maximizeWindow(window.id);
                      }
                    }}
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

      {/* Taskbar */}
      <div class="taskbar absolute bottom-0 left-0 right-0 flex items-center px-2 shadow-lg">
        {/* Start Button */}
        <button 
          class="px-4 py-2 rounded mr-4 font-semibold"
          style={{ 
            'background-color': 'var(--accent-color)', 
            color: 'white'
          }}
          onClick={() => {
            const allPlugins = pluginLoader.plugins;
            const firstPlugin = allPlugins[0];
            if (firstPlugin) {
              openApp(firstPlugin.manifest.id);
            }
          }}
        >
          🍽️ DineApp
        </button>
        
        {/* Window Taskbar Items */}
        <div class="flex space-x-1 flex-1">
          <For each={windowManager.windows}>
            {(window) => (
              <button
                class="px-3 py-2 rounded text-sm"
                style={{
                  'background-color': window.focused ? 'var(--accent-color)' : 'transparent',
                  color: window.focused ? 'white' : 'var(--text-primary)'
                }}
                onClick={() => {
                  if (window.state === 'minimized') {
                    windowManager.restoreWindow(window.id);
                    windowManager.focusWindow(window.id);
                  } else {
                    windowManager.focusWindow(window.id);
                  }
                }}
              >
                <div class="flex items-center gap-2">
                  <span class="text-base">
                    {pluginLoader.getPlugin(window.pluginId)?.manifest.icon || '📱'}
                  </span>
                  <span class="truncate max-w-24">{window.title}</span>
                </div>
              </button>
            )}
          </For>
        </div>
        
        {/* System Tray */}
        <div class="flex items-center gap-3 ml-4">
          {/* Theme Toggle */}
          <button
            class="p-2 rounded"
            style={{ 
              'background-color': 'transparent',
              color: 'var(--text-primary)'
            }}
            onClick={toggleTheme}
          >
            {theme() === 'light' ? '🌙' : '☀️'}
          </button>
          
          {/* Clock */}
          <div 
            class="px-3 py-1 rounded text-sm font-medium"
            style={{ 
              'background-color': 'var(--bg-tertiary)',
              color: 'var(--text-primary)'
            }}
          >
            {currentTime().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;