import { pluginLoader } from '@core/plugin-loader';
import type { PluginManifest } from '@core/plugin-loader';

// Import plugin UI components and init functions
import POSUI from './pos/app';
import { init as posInit } from './pos/init';
import KDSUI from './kds/app';
import { init as kdsInit } from './kds/init';
import InventoryUI from './inventory/app';
import { init as inventoryInit } from './inventory/init';
import AnalyticsUI from './analytics/app';
import { init as analyticsInit } from './analytics/init';
import MenuUI from './menu/app';
import { init as menuInit } from './menu/init';
import SettingsUI from './settings/app';
import { init as settingsInit } from './settings/init';

// Map of plugin components
export const pluginComponents: Record<string, any> = {
  '@dineapp/pos': POSUI,
  '@dineapp/kds': KDSUI,
  '@dineapp/inventory': InventoryUI,
  '@dineapp/analytics': AnalyticsUI,
  '@dineapp/menu': MenuUI,
  '@dineapp/settings': SettingsUI,
};

// Define plugin manifests manually
const posManifest: PluginManifest = {
  id: "@dineapp/pos",
  displayName: "POS Terminal",
  version: "1.0.0",
  description: "Point of Sale interface for order taking and payment processing",
  icon: "💰",
  entry: "./index.tsx",
  permissions: [
    "order.read",
    "order.create", 
    "order.update",
    "menu.read",
    "table.read",
    "table.update",
    "payment.process"
  ],
  dependencies: [],
  configSchema: "./config/schema.json",
  windows: [
    {
      id: "pos-main",
      title: "POS Terminal",
      defaultWidth: 800,
      defaultHeight: 600,
      minWidth: 600,
      minHeight: 400
    }
  ]
};

const kdsManifest: PluginManifest = {
  id: "@dineapp/kds",
  displayName: "Kitchen Display System",
  version: "1.0.0",
  description: "Kitchen order management and display system",
  icon: "👨‍🍳",
  entry: "./index.tsx",
  permissions: [
    "order.read",
    "order.update",
    "kitchen.manage"
  ],
  dependencies: [],
  windows: [
    {
      id: "kds-main",
      title: "Kitchen Display",
      defaultWidth: 1200,
      defaultHeight: 800,
      minWidth: 800,
      minHeight: 600
    }
  ]
};

const inventoryManifest: PluginManifest = {
  id: "@dineapp/inventory",
  displayName: "Inventory Management",
  version: "1.0.0",
  description: "Inventory tracking and management system",
  icon: "📦",
  entry: "./index.tsx",
  permissions: [
    "inventory.read",
    "inventory.create",
    "inventory.update",
    "inventory.delete"
  ],
  dependencies: [],
  windows: [
    {
      id: "inventory-main",
      title: "Inventory",
      defaultWidth: 1000,
      defaultHeight: 700,
      minWidth: 600,
      minHeight: 400
    }
  ]
};

const analyticsManifest: PluginManifest = {
  id: "@dineapp/analytics",
  displayName: "Analytics Dashboard",
  version: "1.0.0",
  description: "Business analytics and reporting dashboard",
  icon: "📊",
  entry: "./index.tsx",
  permissions: [
    "analytics.read",
    "reports.generate"
  ],
  dependencies: [],
  windows: [
    {
      id: "analytics-main",
      title: "Analytics",
      defaultWidth: 1200,
      defaultHeight: 800,
      minWidth: 800,
      minHeight: 600
    }
  ]
};

const menuManifest: PluginManifest = {
  id: "@dineapp/menu",
  displayName: "Menu Management",
  version: "1.0.0",
  description: "Menu item management and configuration",
  icon: "📋",
  entry: "./index.tsx",
  permissions: [
    "menu.read",
    "menu.create",
    "menu.update",
    "menu.delete"
  ],
  dependencies: [],
  windows: [
    {
      id: "menu-main",
      title: "Menu Management",
      defaultWidth: 900,
      defaultHeight: 700,
      minWidth: 600,
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
      defaultWidth: 800,
      defaultHeight: 600,
      minWidth: 500,
      minHeight: 400
    }
  ]
};

// Plugin manifests and init functions mapping
const pluginConfigs: Record<string, { manifest: PluginManifest; init: () => Promise<void> }> = {
  '@dineapp/pos': { manifest: posManifest, init: posInit },
  '@dineapp/kds': { manifest: kdsManifest, init: kdsInit },
  '@dineapp/inventory': { manifest: inventoryManifest, init: inventoryInit },
  '@dineapp/analytics': { manifest: analyticsManifest, init: analyticsInit },
  '@dineapp/menu': { manifest: menuManifest, init: menuInit },
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