import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { ThemeAPI } from '@core/themes/theme-engine';
import { eventBus } from '@core/event-bus';
import type { ThemeSettings, WallpaperConfig } from '@core/themes/theme-schema';
import type { FontSizeScale } from '@core/themes/font-manager';
import ThemePicker from '../widgets/theme-picker';
import WallpaperGallery from '../widgets/wallpaper-gallery';
import FontControls from '../widgets/font-controls';

const AppearancePage: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'themes' | 'wallpaper' | 'fonts' | 'advanced'>('themes');
  const [themeSettings, setThemeSettings] = createSignal<ThemeSettings>();
  const [loading, setLoading] = createSignal(true);

  // Load theme settings on mount
  onMount(() => {
    try {
      const settings = ThemeAPI.getSettings();
      setThemeSettings(settings);
    } catch (error) {
      console.error('[AppearancePage] Failed to load settings:', error);
    } finally {
      setLoading(false);
    }

    // Listen to theme settings updates
    const handleSettingsUpdate = (event: any) => {
      setThemeSettings(ThemeAPI.getSettings());
    };

    eventBus.on('theme:settings:updated', handleSettingsUpdate, { scope: 'appearance-page' });
    eventBus.on('theme:changed', handleSettingsUpdate, { scope: 'appearance-page' });

    onCleanup(() => {
      eventBus.offAll('appearance-page');
    });
  });

  const handleThemeSelect = async (themeId: string) => {
    await ThemeAPI.updateSettings({ themeId });
    setThemeSettings(ThemeAPI.getSettings());
  };

  const handleWallpaperSelect = async (wallpaper: WallpaperConfig) => {
    await ThemeAPI.updateSettings({ wallpaperCustom: wallpaper });
    setThemeSettings(ThemeAPI.getSettings());
  };

  const handleFontSettingsChange = async (fontSettings: {
    fontSizeScale?: FontSizeScale;
    customFontFamily?: any;
    lineHeightScale?: number;
    letterSpacingScale?: number;
    wordSpacingScale?: number;
  }) => {
    // Update theme settings with font changes
    const currentSettings = ThemeAPI.getSettings();
    const updatedSettings = { ...currentSettings };

    if (fontSettings.fontSizeScale) {
      updatedSettings.fontSizeScale = fontSettings.fontSizeScale;
    }

    if (fontSettings.customFontFamily) {
      updatedSettings.customFontFamily = {
        ...currentSettings.customFontFamily,
        ...fontSettings.customFontFamily
      };
    }

    await ThemeAPI.updateSettings(updatedSettings);
    setThemeSettings(updatedSettings);
  };

  const handleAccessibilityToggle = async (setting: 'highContrast' | 'reduceMotion', value: boolean) => {
    await ThemeAPI.updateSettings({ [setting]: value });
    setThemeSettings(ThemeAPI.getSettings());
  };

  const handleResetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all appearance settings to defaults?')) {
      await ThemeAPI.resetToDefaults();
      setThemeSettings(ThemeAPI.getSettings());
    }
  };

  const exportSettings = () => {
    const settings = ThemeAPI.exportTheme();
    const blob = new Blob([settings], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dineapp-appearance-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const success = await ThemeAPI.importTheme(text);
          if (success) {
            setThemeSettings(ThemeAPI.getSettings());
          }
        } catch (error) {
          console.error('[AppearancePage] Failed to import settings:', error);
        }
      }
    };
    input.click();
  };

  return (
    <div class="h-full flex flex-col">
      {/* Tab Navigation */}
      <div class="px-4 pt-2 pb-4">
        <div class="p-1.5 max-w-md mx-auto flex space-x-1 rounded-lg bg-bg-secondary">
          {[
            { id: 'themes', label: 'Themes', icon: '🎨' },
            { id: 'wallpaper', label: 'Wallpaper', icon: '🖼️' },
            { id: 'fonts', label: 'Fonts', icon: '📝' },
            { id: 'advanced', label: 'Advanced', icon: '⚙️' }
          ].map((tab) => (
            <button
              class={`w-full flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab() === tab.id
                  ? 'bg-bg-primary text-accent shadow'
                  : 'text-text-secondary hover:bg-bg-primary/50'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <span class="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-auto p-4 bg-bg-tertiary">
        <Show when={loading()} fallback={
          <div class="max-w-6xl mx-auto">
            {/* Themes Tab */}
            <Show when={activeTab() === 'themes'}>
              <ThemePicker
                selectedThemeId={themeSettings()?.themeId}
                onThemeSelect={handleThemeSelect}
              />
            </Show>

            {/* Wallpaper Tab */}
            <Show when={activeTab() === 'wallpaper'}>
              <WallpaperGallery
                selectedWallpaper={themeSettings()?.wallpaperCustom}
                onWallpaperSelect={handleWallpaperSelect}
              />
            </Show>

            {/* Fonts Tab */}
            <Show when={activeTab() === 'fonts'}>
              <FontControls
                settings={{
                  fontSizeScale: themeSettings()?.fontSizeScale,
                  customFontFamily: themeSettings()?.customFontFamily,
                  lineHeightScale: 1, // These could be added to theme settings
                  letterSpacingScale: 1,
                  wordSpacingScale: 1
                }}
                onSettingsChange={handleFontSettingsChange}
              />
            </Show>

            {/* Advanced Tab */}
            <Show when={activeTab() === 'advanced'}>
              <div class="space-y-6">
                <h3 class="text-lg font-semibold">Advanced Settings</h3>

                {/* Accessibility Options */}
                <div class="bg-bg-primary p-4 rounded-lg border border-border-primary">
                  <h4 class="font-medium mb-4">Accessibility</h4>
                  <div class="space-y-3">
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={themeSettings()?.highContrast || false}
                        onChange={(e) => handleAccessibilityToggle('highContrast', e.target.checked)}
                        class="mr-3 h-4 w-4 text-accent focus:ring-accent border-border-primary rounded"
                      />
                      <div>
                        <span class="font-medium">High Contrast</span>
                        <p class="text-sm text-text-secondary">Increase contrast for better visibility</p>
                      </div>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={themeSettings()?.reduceMotion || false}
                        onChange={(e) => handleAccessibilityToggle('reduceMotion', e.target.checked)}
                        class="mr-3 h-4 w-4 text-accent focus:ring-accent border-border-primary rounded"
                      />
                      <div>
                        <span class="font-medium">Reduce Motion</span>
                        <p class="text-sm text-gray-500">Minimize animations and transitions</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Current Settings Summary */}
                <div class="bg-bg-primary p-4 rounded-lg border border-border-primary">
                  <h4 class="font-medium mb-4">Current Settings Summary</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="font-medium">Theme:</span> {themeSettings()?.themeId}
                    </div>
                    <div>
                      <span class="font-medium">Font Size:</span> {themeSettings()?.fontSizeScale}
                    </div>
                    <div>
                      <span class="font-medium">High Contrast:</span> {themeSettings()?.highContrast ? 'Enabled' : 'Disabled'}
                    </div>
                    <div>
                      <span class="font-medium">Reduce Motion:</span> {themeSettings()?.reduceMotion ? 'Enabled' : 'Disabled'}
                    </div>
                    <div>
                      <span class="font-medium">Custom Wallpaper:</span> {themeSettings()?.wallpaperCustom ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <span class="font-medium">Custom CSS:</span> {themeSettings()?.customCSS ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                {/* Import/Export */}
                <div class="bg-bg-primary p-4 rounded-lg border border-border-primary">
                  <h4 class="font-medium mb-4">Import/Export Settings</h4>
                  <div class="flex gap-2">
                    <button
                      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={exportSettings}
                    >
                      Export Settings
                    </button>
                    <button
                      class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      onClick={importSettings}
                    >
                      Import Settings
                    </button>
                  </div>
                </div>

                {/* Reset */}
                <div class="bg-white p-4 rounded-lg border border-red-200">
                  <h4 class="font-medium mb-4 text-red-700">Reset to Defaults</h4>
                  <p class="text-sm text-gray-600 mb-4">
                    This will reset all appearance settings to their default values. This action cannot be undone.
                  </p>
                  <button
                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={handleResetToDefaults}
                  >
                    Reset All Settings
                  </button>
                </div>
              </div>
            </Show>
          </div>
        }>
          <div class="flex items-center justify-center h-64">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p class="text-sm text-gray-500 mt-2">Loading settings...</p>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default AppearancePage;