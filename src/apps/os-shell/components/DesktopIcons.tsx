import { Component, For } from 'solid-js';
import { pluginLoader } from '@core/plugin-loader';
import { pluginComponents, getAvailablePlugins } from '@plugins/index';

interface DesktopIconsProps {
  onAppOpen: (pluginId: string) => void;
}

const DesktopIcons: Component<DesktopIconsProps> = (props) => {
  const availablePlugins = () => {
    // Get all available plugin manifests
    const allPlugins = getAvailablePlugins();

    // Filter plugins that have UI components
    return allPlugins.filter(plugin => !!pluginComponents[plugin.id]);
  };

  return (
    <div class="absolute inset-0 pointer-events-none">
      <div class="grid grid-cols-6 gap-4 p-8 pointer-events-auto">
        <For each={availablePlugins()}>
          {(plugin) => (
            <button
              class="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-opacity-20 hover:bg-gray-500 transition-colors cursor-pointer"
              style={{
                'background-color': 'transparent',
                color: 'var(--text-primary)'
              }}
              onClick={() => props.onAppOpen(plugin.id)}
              title={plugin.displayName}
            >
              <div class="text-4xl mb-2">
                {plugin.icon}
              </div>
              <div class="text-xs text-center max-w-full break-words">
                {plugin.displayName}
              </div>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export { DesktopIcons };