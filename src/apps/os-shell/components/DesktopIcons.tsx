import { Component, For } from 'solid-js';
import { pluginLoader } from '@core/plugin-loader';
import { pluginComponents } from '@plugins';

interface DesktopIconsProps {
  onAppOpen: (pluginId: string) => void;
}

const DesktopIcons: Component<DesktopIconsProps> = (props) => {
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
              onClick={() => props.onAppOpen(plugin.manifest.id)}
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
  );
};

export { DesktopIcons };