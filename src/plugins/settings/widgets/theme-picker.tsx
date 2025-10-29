import { Component, For, createSignal, Show, createEffect } from 'solid-js';
import { ThemeAPI } from '@core/themes/theme-engine';
import type { ThemeDefinition } from '@core/themes/theme-schema';

interface ThemePickerProps {
  selectedThemeId?: string;
  onThemeSelect: (themeId: string) => void;
}

const ThemePicker: Component<ThemePickerProps> = (props) => {
  const [themes, setThemes] = createSignal<ThemeDefinition[]>([]);
  const [loading, setLoading] = createSignal(true);

  const loadThemes = async () => {
    try {
      const availableThemes = ThemeAPI.getAllThemes();
      setThemes(availableThemes);
    } catch (error) {
      console.error('[ThemePicker] Failed to load themes:', error);
    } finally {
      setLoading(false);
    }
  };

  loadThemes();

  const handleThemeSelect = async (themeId: string) => {
    const success = await ThemeAPI.loadTheme(themeId);
    if (success) {
      props.onThemeSelect(themeId);
    }
  };

  return (
    <div class="space-y-4 sm:space-y-6">
      <div>
        <h3 class="text-lg font-semibold">Themes</h3>
        <p class="text-sm text-text-secondary mt-1">Select a theme to change the appearance of the application.</p>
      </div>

      <Show when={loading()} fallback={
        <div class="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto">
          <For each={themes()}>
            {(theme) => (
              <div
                class="cursor-pointer group"
                onClick={() => handleThemeSelect(theme.id)}
              >
                <div class={`relative rounded-lg border-2 overflow-hidden transition-all w-full aspect-square max-w-32 sm:max-w-40 ${
                  props.selectedThemeId === theme.id ? 'border-accent ring-2 ring-accent/50' : 'border-border-primary group-hover:border-accent'
                }`}>
                  <div class="h-full p-2 sm:p-3" style={{ 'background-color': theme.colors.bgPrimary }}>
                    <div class="h-2 w-1/3 rounded-sm mb-2" style={{ 'background-color': theme.colors.accent }}></div>
                    <div class="space-y-1">
                      <div class="h-1.5 w-4/5 rounded-full" style={{ 'background-color': theme.colors.textPrimary }}></div>
                      <div class="h-1.5 w-3/5 rounded-full" style={{ 'background-color': theme.colors.textSecondary }}></div>
                    </div>
                    <div class="absolute bottom-2 right-2 flex space-x-0.5">
                      <div class="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ 'background-color': theme.colors.primary }}></div>
                      <div class="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ 'background-color': theme.colors.accent }}></div>
                      <div class="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ 'background-color': theme.colors.bgSecondary }}></div>
                    </div>
                  </div>
                  <Show when={props.selectedThemeId === theme.id}>
                    <div class="absolute inset-0 bg-accent/10"></div>
                    <div class="absolute top-1 right-1 sm:top-2 sm:right-2 bg-accent text-text-inverse rounded-full p-0.5">
                        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                    </div>
                  </Show>
                </div>
                <div class="mt-2 text-center">
                    <h4 class="font-medium text-xs sm:text-sm">{theme.displayName}</h4>
                    <p class="text-xs text-text-secondary">{theme.isDark ? 'Dark' : 'Light'}</p>
                </div>
              </div>
            )}
          </For>
        </div>
      }>
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p class="text-sm text-text-secondary mt-2">Loading themes...</p>
        </div>
      </Show>

      <div class="border-t border-border-primary pt-4 mt-6">
        <h4 class="font-medium mb-2">Custom Theme</h4>
        <div class="flex gap-2">
          <input
            type="file"
            accept=".json"
            class="hidden"
            id="theme-upload"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  const text = await file.text();
                  const success = await ThemeAPI.importTheme(text);
                  if (success) {
                    loadThemes();
                  }
                } catch (error) {
                  console.error('[ThemePicker] Failed to import theme:', error);
                }
              }
            }}
          />
           <label
             for="theme-upload"
             class="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary rounded-md cursor-pointer text-sm font-medium"
           >
             Import Theme
           </label>
           <button
             class="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary rounded-md text-sm font-medium"
             onClick={() => {
              const themeData = ThemeAPI.exportTheme();
              const blob = new Blob([themeData], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'dineapp-theme-export.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export Themes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemePicker;