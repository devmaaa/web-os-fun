import { Component, For } from 'solid-js';
import { pluginLoader } from '@core/plugin-loader';
import { pluginComponents, getAvailablePlugins } from '@plugins/index';
import { cn } from '../../../utils/cn';

// Import icons using unplugin-icons (Heroicons for macOS-style)
import IconCalculator from '~icons/heroicons-outline/calculator';
import IconFolder from '~icons/heroicons-outline/folder';
import IconSettings from '~icons/heroicons-outline/cog';
import IconTerminal from '~icons/heroicons-outline/command-line';

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

  const getPluginIcon = (iconName: string) => {
    switch (iconName) {
      case 'calculator':
        return <IconCalculator class="w-8 h-8" />;
      case 'folder':
        return <IconFolder class="w-8 h-8" />;
      case 'settings':
        return <IconSettings class="w-8 h-8" />;
      case 'terminal':
        return <IconTerminal class="w-8 h-8" />;
      default:
        return <IconFolder class="w-8 h-8" />; // fallback
    }
  };

  return (
    <div class="absolute inset-0 pointer-events-none">
      <div class="grid grid-cols-6 gap-4 p-8 pointer-events-auto">
        <For each={availablePlugins()}>
          {(plugin) => (
            <button
              class="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-secondary hover:bg-opacity-20 transition-colors cursor-pointer bg-transparent text-foreground"
              onClick={() => props.onAppOpen(plugin.id)}
              title={plugin.displayName}
            >
              <div class="mb-2">
                {getPluginIcon(plugin.icon)}
              </div>
               <div class="text-xs text-foreground text-center max-w-full break-words">
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