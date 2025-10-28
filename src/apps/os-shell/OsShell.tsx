import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { windowManager } from '@core/window-manager';
import { pluginLoader } from '@core/plugin-loader';
import { themeEngine, ThemeAPI } from '@core/themes';
import { eventBus } from '@core/event-bus';
import { loadPlugin, pluginComponents } from '../../plugins';
import { DesktopIcons } from './components/DesktopIcons';
import { WindowManager } from './components/WindowManager';
import Dock from './components/Dock';
import MenuBar from './components/MenuBar';
import './OsShell.css';

const OsShell: Component = () => {
  const [currentTime, setCurrentTime] = createSignal(new Date());
  const [themeInitialized, setThemeInitialized] = createSignal(false);
  const [backgroundColor, setBackgroundColor] = createSignal('var(--color-bg-primary)');
  const [wallpaperBackground, setWallpaperBackground] = createSignal('none');
  const [wallpaperSize, setWallpaperSize] = createSignal('cover');
  const [wallpaperPosition, setWallpaperPosition] = createSignal('center');
  const [wallpaperRepeat, setWallpaperRepeat] = createSignal('no-repeat');
  const [wallpaperOpacity, setWallpaperOpacity] = createSignal('1');
  const [wallpaperBlur, setWallpaperBlur] = createSignal('none');

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
        // Get window configuration from manifest
        const windowConfig = plugin.manifest.windows?.[0];
        windowManager.openWindow(pluginId, plugin.manifest.displayName, {
          component,
          width: windowConfig?.defaultWidth,
          height: windowConfig?.defaultHeight,
          minWidth: windowConfig?.minWidth,
          minHeight: windowConfig?.minHeight
        });
      }
    }
  };

  const toggleTheme = () => {
    // Use new theme engine for theme switching
    const currentTheme = themeEngine.getCurrentTheme();
    const newThemeId = currentTheme?.isDark ? 'light' : 'dark';
    ThemeAPI.loadTheme(newThemeId);
  };

  // Initialize app
  onMount(async () => {
    // Initialize theme system
    try {
      await themeEngine.initialize();
      console.log('[OsShell] Theme system initialized');
      setThemeInitialized(true);
    } catch (error) {
      console.error('[OsShell] Failed to initialize theme system:', error);
      setThemeInitialized(true); // Still show the UI even if theme fails
    }

    // Update clock
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Listen to theme changes to update background styles
    const handleThemeChange = () => {
      setBackgroundColor('var(--color-bg-primary)');
      setWallpaperBackground('var(--wallpaper-background, none)');
      setWallpaperSize('var(--wallpaper-size, cover)');
      setWallpaperPosition('var(--wallpaper-position, center)');
      setWallpaperRepeat('var(--wallpaper-repeat, no-repeat)');
      setWallpaperOpacity('var(--wallpaper-opacity, 1)');
      setWallpaperBlur('var(--wallpaper-blur, none)');
    };

    eventBus.on('theme:changed', handleThemeChange, { scope: 'os-shell' });
    eventBus.on('wallpaper:changed', handleThemeChange, { scope: 'os-shell' });

    // Initial theme update
    handleThemeChange();

    onCleanup(() => {
      clearInterval(clockInterval);
      eventBus.offAll('os-shell');
      // Cleanup theme system
      themeEngine.cleanup();
    });
  });

  return (
    <Show when={themeInitialized()} fallback={
      <div class="os-shell h-screen w-screen relative overflow-hidden flex items-center justify-center bg-gray-900">
        <div class="text-center text-white">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <h2 class="text-xl font-semibold mb-2">Loading DineApp</h2>
          <p class="text-gray-300">Initializing theme system...</p>
        </div>
      </div>
    }>
      <div class="os-shell h-screen w-screen relative overflow-hidden" style={{
        'background-color': backgroundColor(),
        'background-image': wallpaperBackground(),
        'background-size': wallpaperSize(),
        'background-position': wallpaperPosition(),
        'background-repeat': wallpaperRepeat(),
        'opacity': wallpaperOpacity(),
        'filter': wallpaperBlur()
      }}>
        {/* Menu Bar */}
        <MenuBar />

        {/* Desktop Icons */}
        <DesktopIcons onAppOpen={openApp} />

        {/* Windows */}
        <WindowManager />

        {/* Dock */}
        <Dock onAppOpen={openApp} />
      </div>
    </Show>
  );
};

export default OsShell;