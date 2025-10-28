import { Component, For } from 'solid-js';
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';

interface TaskbarProps {
  currentTime: Date;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onAppOpen: (pluginId: string) => void;
}

const Taskbar: Component<TaskbarProps> = (props) => {
  return (
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
            props.onAppOpen(firstPlugin.manifest.id);
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
                data-window-id={window.id}
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
          onClick={props.onThemeToggle}
        >
          {props.theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Clock */}
        <div
          class="px-3 py-1 rounded text-sm font-medium"
          style={{
            'background-color': 'var(--bg-tertiary)',
            color: 'var(--text-primary)'
          }}
        >
          {props.currentTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export { Taskbar };