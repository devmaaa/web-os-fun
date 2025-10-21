import { Component, createSignal, onMount, onCleanup, For, Show, createRoot } from 'solid-js';
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';
import { loadPlugins, pluginComponents } from '@plugins';
import { DesktopIcons } from '@apps/os-shell/components/DesktopIcons';
import { WindowManager } from '@apps/os-shell/components/WindowManager';
import { Taskbar } from '@apps/os-shell/components/Taskbar';
import './OsShell.css';

const OsShell: Component = () => {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light');
  const [currentTime, setCurrentTime] = createSignal(new Date());
  const [isLoading, setIsLoading] = createSignal(true);

  const openApp = async (pluginId: string) => {
    const plugin = pluginLoader.getPlugin(pluginId);
    if (plugin) {
      const component = pluginComponents[pluginId];
      windowManager.openWindow(pluginId, plugin.manifest.displayName, {
        component
      });
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

    // Load plugins within Solid context
    try {
      await createRoot(async () => {
        await loadPlugins();
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load plugins:', error);
      setIsLoading(false);
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
      {/* Loading Overlay */}
      <Show when={isLoading()}>
        <div class="absolute inset-0 z-50 flex items-center justify-center" style={{ 'background-color': 'var(--bg-primary)' }}>
          <div class="text-center">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading applications...</p>
          </div>
        </div>
      </Show>

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