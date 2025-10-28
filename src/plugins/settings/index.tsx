import { Component } from 'solid-js';
import { PluginManifest } from '../../core/plugin-loader';

const SettingsUI: Component = () => {
  return (
    <div>
      <h2>Settings</h2>
      <p>System configuration</p>
    </div>
  );
};

export const settingsPlugin: PluginManifest = {
  id: 'settings',
  displayName: 'Settings',
  version: '1.0.0',
  description: 'System settings',
  icon: '⚙️',
  permissions: ['settings.edit'],
  ui: SettingsUI,
};