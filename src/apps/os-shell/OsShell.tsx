import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';
import { loadPlugin, pluginComponents } from '../../plugins';
import { DesktopIcons } from './components/DesktopIcons';
import { WindowManager } from './components/WindowManager';
import { Taskbar } from './components/Taskbar';
import './OsShell.css';

const OsShell: Component = () => {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light');
  const [currentTime, setCurrentTime] = createSignal(new Date());

  const openApp = async (pluginId: string) => {
    // Load plugin on-demand if not already loaded
    let plugin = pluginLoader.getPlugin(pluginId);
    if (!plugin) {
      try {
        plugin = await loadPlugin(pluginId);
      } catch (error) {
        console.error(`Failed to load plugin ${pluginId}:`, error);
        return;
      }
    }

    if (plugin) {
      const component = pluginComponents[pluginId];
      if (component) {
        windowManager.openWindow(pluginId, plugin.manifest.displayName, {
          component
        });
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme() === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Initialize app
  onMount(async () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Update clock
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    onCleanup(() => {
      clearInterval(clockInterval);
    });
  });

  return (
    <div class="os-shell h-screen w-screen relative overflow-hidden" style={{ 'background-color': 'var(--bg-primary)' }}>
      {/* Desktop Icons */}
      <DesktopIcons onAppOpen={openApp} />

      {/* Windows */}
      <WindowManager />

      {/* Taskbar */}
      <Taskbar
        currentTime={currentTime()}
        theme={theme()}
        onThemeToggle={toggleTheme}
        onAppOpen={openApp}
      />
    </div>
  );
};

export default OsShell;