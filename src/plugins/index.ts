import { pluginLoader } from '../core/plugin-loader';
import type { PluginManifest } from '../core/plugin-loader';

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

export const loadPlugins = async () => {
  try {
    // Create and register POS plugin
    const posPlugin = await pluginLoader.loadPlugin(posManifest);
    pluginLoader.updatePlugin(posPlugin.manifest.id, {
      lifecycle: {
        onInit: posInit,
        onStart: async () => {},
        onStop: async () => {},
        onUnload: async () => {}
      }
    });

    // Create and register KDS plugin
    const kdsPlugin = await pluginLoader.loadPlugin(kdsManifest);
    pluginLoader.updatePlugin(kdsPlugin.manifest.id, {
      lifecycle: {
        onInit: kdsInit,
        onStart: async () => {},
        onStop: async () => {},
        onUnload: async () => {}
      }
    });

    // Create and register Inventory plugin
    const inventoryPlugin = await pluginLoader.loadPlugin(inventoryManifest);
    pluginLoader.updatePlugin(inventoryPlugin.manifest.id, {
      lifecycle: {
        onInit: inventoryInit,
        onStart: async () => {},
        onStop: async () => {},
        onUnload: async () => {}
      }
    });

    // Create and register Analytics plugin
    const analyticsPlugin = await pluginLoader.loadPlugin(analyticsManifest);
    pluginLoader.updatePlugin(analyticsPlugin.manifest.id, {
      lifecycle: {
        onInit: analyticsInit,
        onStart: async () => {},
        onStop: async () => {},
        onUnload: async () => {}
      }
    });

    // Create and register Menu plugin
    const menuPlugin = await pluginLoader.loadPlugin(menuManifest);
    pluginLoader.updatePlugin(menuPlugin.manifest.id, {
      lifecycle: {
        onInit: menuInit,
        onStart: async () => {},
        onStop: async () => {},
        onUnload: async () => {}
      }
    });

    // Create and register Settings plugin
    const settingsPlugin = await pluginLoader.loadPlugin(settingsManifest);
    pluginLoader.updatePlugin(settingsPlugin.manifest.id, {
      lifecycle: {
        onInit: settingsInit,
        onStart: async () => {},
        onStop: async () => {},
        onUnload: async () => {}
      }
    });

    // Start all plugins to initialize their event listeners
    for (const plugin of pluginLoader.plugins) {
      await pluginLoader.startPlugin(plugin.manifest.id);
    }
  } catch (error) {
    console.error('Failed to load plugins:', error);
    throw error;
  }
};