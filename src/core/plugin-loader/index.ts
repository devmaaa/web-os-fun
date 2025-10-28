import { createStore } from 'solid-js/store';
import { Component } from 'solid-js';
import { eventBus } from '../event-bus';

export interface PluginWindow {
  id: string;
  title: string;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface PluginManifest {
  id: string;
  displayName: string;
  version: string;
  description: string;
  icon: string;
  entry: string;
  permissions: string[];
  dependencies?: string[];
  configSchema?: string;
  windows?: PluginWindow[];
}

export interface PluginLifecycle {
  onLoad?: () => Promise<void> | void;
  onInit?: () => Promise<void> | void;
  onStart?: () => Promise<void> | void;
  onStop?: () => Promise<void> | void;
  onUnload?: () => Promise<void> | void;
}

export interface Plugin {
  manifest: PluginManifest;
  ui?: Component;
  services?: Record<string, any>;
  lifecycle?: PluginLifecycle;
  isLoaded: boolean;
  isInitialized: boolean;
  isStarted: boolean;
}

export interface PluginLoader {
  plugins: Plugin[];
  loadPlugin: (manifest: PluginManifest) => Promise<Plugin>;
  register: (plugin: Plugin) => void;
  unregister: (pluginId: string) => void;
  getPlugin: (id: string) => Plugin | undefined;
  getPluginsWithUI: () => Plugin[];
  startPlugin: (pluginId: string) => Promise<void>;
  stopPlugin: (pluginId: string) => Promise<void>;
  unloadPlugin: (pluginId: string) => Promise<void>;
  checkDependencies: (manifest: PluginManifest) => boolean;
  updatePlugin: (pluginId: string, updates: Partial<Plugin>) => void;
}

const [plugins, setPlugins] = createStore<Plugin[]>([]);

export const pluginLoader: PluginLoader = {
  get plugins() { return plugins; },
  
  async loadPlugin(manifest: PluginManifest): Promise<Plugin> {
    // Check if plugin already exists
    const existing = plugins.find(p => p.manifest.id === manifest.id);
    if (existing) {
      return existing;
    }

    // Check dependencies
    if (!this.checkDependencies(manifest)) {
      throw new Error(`Plugin ${manifest.id} has unmet dependencies`);
    }

    // Create plugin instance
    const plugin: Plugin = {
      manifest,
      isLoaded: false,
      isInitialized: false,
      isStarted: false
    };

    try {
      // Load phase
      if (plugin.lifecycle?.onLoad) {
        await plugin.lifecycle.onLoad();
      }
      plugin.isLoaded = true;

      // Emit plugin loaded event
      eventBus.emitSync('plugin:loaded', {
        pluginId: manifest.id,
        displayName: manifest.displayName
      });

      // Add to store AFTER all properties are set
      setPlugins(p => [...p, plugin]);
      return plugin;
    } catch (error) {
      eventBus.emitSync('plugin:load-error', {
        pluginId: manifest.id,
        error
      });
      throw error;
    }
  },

  register(plugin: Plugin) {
    const existing = plugins.find(p => p.manifest.id === plugin.manifest.id);
    if (existing) {
      console.warn(`Plugin ${plugin.manifest.id} already registered`);
      return;
    }

    setPlugins(p => [...p, plugin]);
    
    eventBus.emitSync('plugin:registered', {
      pluginId: plugin.manifest.id,
      displayName: plugin.manifest.displayName
    });
  },

  unregister(pluginId: string) {
    const plugin = plugins.find(p => p.manifest.id === pluginId);
    if (!plugin) {
      return;
    }

    // Stop and unload if running
    if (plugin.isStarted) {
      this.stopPlugin(pluginId);
    }
    if (plugin.isLoaded) {
      this.unloadPlugin(pluginId);
    }

    setPlugins(p => p.filter(pl => pl.manifest.id !== pluginId));
    
    eventBus.emitSync('plugin:unregistered', {
      pluginId,
      displayName: plugin.manifest.displayName
    });
  },

  getPlugin(id: string): Plugin | undefined {
    return plugins.find(p => p.manifest.id === id);
  },

  getPluginsWithUI(): Plugin[] {
    return plugins.filter(p => p.ui);
  },

  async startPlugin(pluginId: string): Promise<void> {
    const plugin = plugins.find(p => p.manifest.id === pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.isStarted) {
      return;
    }

    try {
      // Initialize phase
      if (!plugin.isInitialized && plugin.lifecycle?.onInit) {
        await plugin.lifecycle.onInit();
        setPlugins(p => p.manifest.id === pluginId, 'isInitialized', true);
      }

      // Start phase
      if (plugin.lifecycle?.onStart) {
        await plugin.lifecycle.onStart();
      }
      setPlugins(p => p.manifest.id === pluginId, 'isStarted', true);

      // Emit plugin started event
      eventBus.emitSync('plugin:started', {
        pluginId,
        displayName: plugin.manifest.displayName
      });
    } catch (error) {
      eventBus.emitSync('plugin:start-error', {
        pluginId,
        error
      });
      throw error;
    }
  },

  async stopPlugin(pluginId: string): Promise<void> {
    const plugin = plugins.find(p => p.manifest.id === pluginId);
    if (!plugin || !plugin.isStarted) {
      return;
    }

    try {
      // Stop phase
      if (plugin.lifecycle?.onStop) {
        await plugin.lifecycle.onStop();
      }
      setPlugins(p => p.manifest.id === pluginId, 'isStarted', false);

      // Emit plugin stopped event
      eventBus.emitSync('plugin:stopped', {
        pluginId,
        displayName: plugin.manifest.displayName
      });
    } catch (error) {
      eventBus.emitSync('plugin:stop-error', {
        pluginId,
        error
      });
      throw error;
    }
  },

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = plugins.find(p => p.manifest.id === pluginId);
    if (!plugin || !plugin.isLoaded) {
      return;
    }

    try {
      // Stop if running
      if (plugin.isStarted) {
        await this.stopPlugin(pluginId);
      }

      // Cleanup event listeners for this plugin scope
      eventBus.offAll(pluginId);

      // Unload phase
      if (plugin.lifecycle?.onUnload) {
        await plugin.lifecycle.onUnload();
      }
      setPlugins(p => p.manifest.id === pluginId, 'isLoaded', false);
      setPlugins(p => p.manifest.id === pluginId, 'isInitialized', false);

      // Emit plugin unloaded event
      eventBus.emitSync('plugin:unloaded', {
        pluginId,
        displayName: plugin.manifest.displayName
      });
    } catch (error) {
      eventBus.emitSync('plugin:unload-error', {
        pluginId,
        error
      });
      throw error;
    }
  },

  checkDependencies(manifest: PluginManifest): boolean {
    if (!manifest.dependencies || manifest.dependencies.length === 0) {
      return true;
    }

    return manifest.dependencies.every(depId => {
      const dep = plugins.find(p => p.manifest.id === depId);
      return dep && dep.isLoaded;
    });
  },

  updatePlugin(pluginId: string, updates: Partial<Plugin>): void {
    const pluginIndex = plugins.findIndex(p => p.manifest.id === pluginId);
    if (pluginIndex === -1) {
      console.warn(`Plugin ${pluginId} not found for update`);
      return;
    }

    // Update the plugin in the store using SolidJS store update pattern
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      setPlugins(pluginIndex, key as any, value);
    });
  }
};