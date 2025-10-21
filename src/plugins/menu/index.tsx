import { Component } from 'solid-js';
import { PluginManifest } from '../../core/plugin-loader';

const MenuUI: Component = () => {
  return (
    <div>
      <h2>Menu Editor</h2>
      <p>Manage menu items and categories</p>
    </div>
  );
};

export const menuPlugin: PluginManifest = {
  id: 'menu',
  displayName: 'Menu',
  version: '1.0.0',
  description: 'Menu editor',
  icon: '🍽️',
  permissions: ['menu.edit'],
  ui: MenuUI,
};