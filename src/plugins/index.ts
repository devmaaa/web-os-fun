import { pluginLoader } from '@core/plugin-loader';
import type { PluginManifest } from '@core/plugin-loader';

// Import plugin UI components and init functions
import FileManagerUI from './file-manager/app';
import { init as fileManagerInit } from './file-manager/init';
import TerminalUI from './terminal/app';
import { init as terminalInit } from './terminal/init';
import CalculatorUI from './calculator/app';
import { init as calculatorInit } from './calculator/init';
import SettingsUI from './settings/app';
import { init as settingsInit } from './settings/init';

// Map of plugin components
export const pluginComponents: Record<string, any> = {
  '@dineapp/file-manager': FileManagerUI,
  '@dineapp/terminal': TerminalUI,
  '@dineapp/calculator': CalculatorUI,
  '@dineapp/settings': SettingsUI,
};


// Define plugin manifests manually
const fileManagerManifest: PluginManifest = {
  id: "@dineapp/file-manager",
  displayName: "File Manager",
  version: "1.0.0",
  description: "File system browser and manager",
  icon: "📁",
  entry: "./index.tsx",
  permissions: [
    "fs.read",
    "fs.write",
    "fs.execute"
  ],
  dependencies: [],
   windows: [
     {
       id: "file-manager-main",
       title: "File Manager",
       defaultWidth: 650,
       defaultHeight: 700,
       minWidth: 400,
       minHeight: 300
     }
   ]
};


const terminalManifest: PluginManifest = {
  id: "@dineapp/terminal",
  displayName: "Terminal",
  version: "1.0.0",
  description: "Command line terminal emulator",
  icon: "💻",
  entry: "./index.tsx",
  permissions: [
    "fs.read",
    "fs.write",
    "fs.execute"
  ],
  dependencies: [],
   windows: [
     {
       id: "terminal-main",
       title: "Terminal",
       defaultWidth: 650,
       defaultHeight: 500,
       minWidth: 400,
       minHeight: 300
     }
   ]
};

const calculatorManifest: PluginManifest = {
  id: "@dineapp/calculator",
  displayName: "Calculator",
  version: "1.0.0",
  description: "Basic and scientific calculator",
  icon: "🧮",
  entry: "./index.tsx",
  permissions: [],
  dependencies: [],
   windows: [
     {
       id: "calculator-main",
       title: "Calculator",
       defaultWidth: 650,
       defaultHeight: 500,
       minWidth: 300,
       minHeight: 400
     }
   ]
};



const settingsManifest: PluginManifest = {
  id: "@dineapp/settings",
  displayName: "Settings",
  version: "1.0.0",
  description: "Application settings and configuration",
  icon: "⚙️",
  entry: "./index.tsx",
  permissions: [
    "settings.read",
    "settings.update"
  ],
  dependencies: [],
   windows: [
     {
       id: "settings-main",
       title: "Settings",
       defaultWidth: 650,
       defaultHeight: 600,
       minWidth: 500,
       minHeight: 400
     }
   ]
};

// Plugin manifests and init functions mapping
const pluginConfigs: Record<string, { manifest: PluginManifest; init: () => Promise<void> }> = {
  '@dineapp/file-manager': { manifest: fileManagerManifest, init: fileManagerInit },
  '@dineapp/terminal': { manifest: terminalManifest, init: terminalInit },
  '@dineapp/calculator': { manifest: calculatorManifest, init: calculatorInit },
  '@dineapp/settings': { manifest: settingsManifest, init: settingsInit }
};

// Lazy load individual plugin
export const loadPlugin = async (pluginId: string) => {
  const config = pluginConfigs[pluginId];
  if (!config) {
    throw new Error(`Plugin ${pluginId} not found`);
  }

  try {
    // Create and register plugin
    const plugin = await pluginLoader.loadPlugin(config.manifest);
    pluginLoader.updatePlugin(plugin.manifest.id, {
      lifecycle: {
        onInit: config.init,
        onStart: async () => {},
        onStop: async () => {},
        onUnload: async () => {}
      }
    });

    // Start the plugin to initialize event listeners
    await pluginLoader.startPlugin(plugin.manifest.id);

    return plugin;
  } catch (error) {
    console.error(`Failed to load plugin ${pluginId}:`, error);
    throw error;
  }
};

// Load all plugins (kept for backward compatibility)
export const loadPlugins = async () => {
  try {
    const pluginIds = Object.keys(pluginConfigs);
    for (const pluginId of pluginIds) {
      await loadPlugin(pluginId);
    }
  } catch (error) {
    console.error('Failed to load plugins:', error);
    throw error;
  }
};

// Get all available plugin manifests (for displaying icons)
export const getAvailablePlugins = () => {
  return Object.values(pluginConfigs).map(config => config.manifest);
};
