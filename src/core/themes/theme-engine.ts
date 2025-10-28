import { eventBus } from '@core/event-bus';
import { storageEngine } from '@core/storage-abstraction';
import { themeFSM, ThemeManager } from './theme-fsm';
import { builtInThemes, type ThemeDefinition, type ThemeSettings, defaultThemeSettings, generateCSSProperties, validateTheme } from './theme-schema';
import { WallpaperAPI } from './wallpaper-manager';

/**
 * Theme Engine - Centralized theme management following microkernel pattern
 *
 * Responsibilities:
 * - Theme loading and validation
 * - CSS property generation and application
 * - Theme settings persistence
 * - Event emission for theme changes
 * - Integration with FSM for deterministic state management
 */
class ThemeEngine {
  private currentTheme: ThemeDefinition | null = null;
  private currentSettings: ThemeSettings = { ...defaultThemeSettings };
  private customThemes: Map<string, ThemeDefinition> = new Map();
  private readonly storageKey = 'dineapp-theme-settings';

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    await this.loadSettings();
    this.setupEventListeners();
  }

  /**
   * Initialize theme engine with system startup
   */
  async initialize(): Promise<void> {
    try {
      await this.initializeEngine();
      const themeId = this.currentSettings.themeId;

      // Load initial theme
      const success = await this.loadTheme(themeId);

      if (!success) {
        console.warn('[ThemeEngine] Failed to load initial theme, falling back to default');
        await this.loadTheme('light');
      }
    } catch (error) {
      console.error('[ThemeEngine] Failed to initialize:', error);
      // Fallback to light theme
      await this.loadTheme('light');
    }
  }

  /**
   * Load a theme by ID
   */
  async loadTheme(themeId: string): Promise<boolean> {
    const theme = this.getTheme(themeId);
    if (!theme) {
      console.error(`[ThemeEngine] Theme not found: ${themeId}`);
      return false;
    }

    // Validate theme
    const validation = validateTheme(theme);
    if (!validation.isValid) {
      console.error('[ThemeEngine] Invalid theme:', validation.errors);
      return false;
    }

    try {
      // Start FSM transition
      if (!themeFSM.can('load')) {
        console.warn('[ThemeEngine] Cannot load theme in current state:', themeFSM.getState());
        return false;
      }

      themeFSM.transition('load');
      themeFSM.updateContext({ themeId });

      // Apply theme
      this.currentTheme = theme;
      await this.applyTheme(theme);
      this.updateSettings({ themeId });

      // Complete FSM transition
      themeFSM.transition('loaded');

      return true;
    } catch (error) {
      console.error('[ThemeEngine] Failed to load theme:', error);
      themeFSM.transition('error');
      return false;
    }
  }

  /**
   * Apply theme CSS properties to document
   */
  private async applyTheme(theme: ThemeDefinition): Promise<void> {
    const root = document.documentElement;
    const properties = generateCSSProperties(theme);

    // Apply CSS custom properties
    Object.entries(properties).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply font size scaling
    this.applyFontSizeScale();

    // Apply wallpaper
    await this.applyWallpaper(theme.wallpaper);

    // Apply custom CSS if present
    if (theme.customCSS) {
      this.applyCustomCSS(theme.customCSS);
    }

    // Set data attributes for CSS targeting
    root.setAttribute('data-theme', theme.id);
    root.setAttribute('data-theme-mode', theme.isDark ? 'dark' : 'light');

    console.log(`[ThemeEngine] Applied theme: ${theme.displayName}`);
  }

  /**
   * Apply font size scaling
   */
  private applyFontSizeScale(): void {
    const scale = this.currentSettings.fontSizeScale;
    const scaleFactors = {
      xs: 0.75,
      sm: 0.875,
      base: 1,
      lg: 1.125,
      xl: 1.25,
      '2xl': 1.5
    };

    const factor = scaleFactors[scale];
    document.documentElement.style.setProperty('--font-size-scale', factor.toString());

    eventBus.emit('font:size:changed', {
      scale,
      factor,
      timestamp: Date.now()
    });
  }

  /**
   * Apply wallpaper to desktop using CSS variables
   */
  private async applyWallpaper(wallpaper: ThemeDefinition['wallpaper']): Promise<void> {
    const customWallpaper = this.currentSettings.wallpaperCustom;
    const finalWallpaper = customWallpaper || wallpaper;
    const root = document.documentElement;

    // Set CSS custom properties for wallpaper
    switch (finalWallpaper.type) {
      case 'color':
        root.style.setProperty('--wallpaper-background', finalWallpaper.value);
        root.style.setProperty('--wallpaper-size', 'cover');
        root.style.setProperty('--wallpaper-position', 'center');
        root.style.setProperty('--wallpaper-repeat', 'no-repeat');
        break;

      case 'gradient':
        root.style.setProperty('--wallpaper-background', finalWallpaper.value);
        root.style.setProperty('--wallpaper-size', 'cover');
        root.style.setProperty('--wallpaper-position', 'center');
        root.style.setProperty('--wallpaper-repeat', 'no-repeat');
        break;

      case 'image':
        // For image wallpapers, we need to get the blob URL from the blob key
        let imageUrl = finalWallpaper.value;
        if (finalWallpaper.value && finalWallpaper.value.startsWith('wallpaper-blob-')) {
          // This is a blob key, get the actual blob URL
          // Create a minimal wallpaper source to get the blob URL
          const wallpaperSource = {
            id: 'temp',
            name: 'temp',
            type: 'custom' as const,
            config: finalWallpaper,
            blobKey: finalWallpaper.value
          };
          const blobUrl = await WallpaperAPI.getWallpaperBlobURL(wallpaperSource);
          if (blobUrl) {
            imageUrl = blobUrl;
          } else {
            console.warn('[ThemeEngine] Failed to get blob URL for wallpaper:', finalWallpaper.value);
          }
        }
        root.style.setProperty('--wallpaper-background', `url(${imageUrl})`);
        root.style.setProperty('--wallpaper-size', this.getBackgroundSize(finalWallpaper.position));
        root.style.setProperty('--wallpaper-position', 'center');
        root.style.setProperty('--wallpaper-repeat', 'no-repeat');
        break;

      case 'pattern':
        root.style.setProperty('--wallpaper-background', finalWallpaper.value);
        root.style.setProperty('--wallpaper-repeat', 'repeat');
        root.style.setProperty('--wallpaper-size', 'auto');
        break;
    }

    // Apply opacity and blur
    if (finalWallpaper.opacity !== undefined) {
      root.style.setProperty('--wallpaper-opacity', finalWallpaper.opacity.toString());
    }

    if (finalWallpaper.blur !== undefined) {
      root.style.setProperty('--wallpaper-blur', `blur(${finalWallpaper.blur}px)`);
    }

    eventBus.emit('wallpaper:changed', {
      wallpaper: finalWallpaper,
      timestamp: Date.now()
    });
  }

  private getBackgroundSize(position?: string): string {
    switch (position) {
      case 'center': return 'auto';
      case 'stretch': return '100% 100%';
      case 'repeat': return 'auto';
      case 'cover':
      default: return 'cover';
    }
  }

  /**
   * Apply custom CSS
   */
  private applyCustomCSS(css: string): void {
    let customStyleElement = document.getElementById('theme-custom-css') as HTMLStyleElement;

    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.id = 'theme-custom-css';
      document.head.appendChild(customStyleElement);
    }

    customStyleElement.textContent = css;
  }

  /**
   * Get theme by ID (built-in or custom)
   */
  getTheme(themeId: string): ThemeDefinition | null {
    // Check built-in themes first
    if (builtInThemes[themeId]) {
      return builtInThemes[themeId];
    }

    // Check custom themes
    return this.customThemes.get(themeId) || null;
  }

  /**
   * Get all available themes
   */
  getAllThemes(): ThemeDefinition[] {
    return [
      ...Object.values(builtInThemes),
      ...Array.from(this.customThemes.values())
    ];
  }

  /**
   * Register a custom theme
   */
  registerCustomTheme(theme: ThemeDefinition): boolean {
    const validation = validateTheme(theme);
    if (!validation.isValid) {
      console.error('[ThemeEngine] Invalid custom theme:', validation.errors);
      return false;
    }

    this.customThemes.set(theme.id, { ...theme, isBuiltIn: false });

    eventBus.emit('theme:registered', {
      themeId: theme.id,
      theme,
      timestamp: Date.now()
    });

    return true;
  }

  /**
    * Update theme settings
    */
   async updateSettings(updates: Partial<ThemeSettings>): Promise<void> {
     this.currentSettings = { ...this.currentSettings, ...updates };
     await this.saveSettings();

     // Apply immediate updates for certain settings
     if (updates.fontSizeScale) {
       this.applyFontSizeScale();
     }

     // Always apply wallpaper updates, regardless of current theme state
     if (updates.wallpaperCustom) {
       await this.applyWallpaper(updates.wallpaperCustom);
     }

     if (updates.customCSS) {
       this.applyCustomCSS(updates.customCSS);
     }

     if (updates.highContrast !== undefined) {
       document.documentElement.setAttribute('data-high-contrast', updates.highContrast.toString());
     }

     if (updates.reduceMotion !== undefined) {
       document.documentElement.setAttribute('data-reduce-motion', updates.reduceMotion.toString());
     }

     eventBus.emit('theme:settings:updated', {
       settings: this.currentSettings,
       updates,
       timestamp: Date.now()
     });
   }

  /**
   * Get current theme settings
   */
  getSettings(): ThemeSettings {
    return { ...this.currentSettings };
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): ThemeDefinition | null {
    return this.currentTheme;
  }

  /**
   * Reset to default settings
   */
  async resetToDefaults(): Promise<void> {
    this.currentSettings = { ...defaultThemeSettings };
    await this.saveSettings();

    // Reload default theme
    await this.loadTheme('light');

    eventBus.emit('theme:reset', {
      timestamp: Date.now()
    });
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await storageEngine.get(this.storageKey);
      if (stored) {
        this.currentSettings = { ...defaultThemeSettings, ...stored };
      }
    } catch (error) {
      console.error('[ThemeEngine] Failed to load settings:', error);
      this.currentSettings = { ...defaultThemeSettings };
    }
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await storageEngine.set(this.storageKey, this.currentSettings);
    } catch (error) {
      console.error('[ThemeEngine] Failed to save settings:', error);
    }
  }

  /**
   * Setup event bus listeners
   */
  private setupEventListeners(): void {
    // Listen to FSM events for debugging
    eventBus.on('fsm:transition', (event) => {
      if (event.id === 'theme-manager') {
        console.log('[ThemeEngine] FSM transition:', event.from, '→', event.to, 'via', event.event);
      }
    }, { scope: 'theme-engine' });

    // Listen to theme loading events
    eventBus.on('theme:loading', (event) => {
      console.log('[ThemeEngine] Loading theme:', event.themeId);
    }, { scope: 'theme-engine' });

    eventBus.on('theme:changed', (event) => {
      console.log('[ThemeEngine] Theme changed to:', event.themeId, `(${event.loadTime}ms)`);
    }, { scope: 'theme-engine' });

    eventBus.on('theme:error', (event) => {
      console.error('[ThemeEngine] Theme error:', event.error);
    }, { scope: 'theme-engine' });
  }

  /**
   * Export current theme configuration
   */
  exportTheme(): string {
    const exportData = {
      settings: this.currentSettings,
      customThemes: Array.from(this.customThemes.values()),
      timestamp: Date.now(),
      version: '1.0.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import theme configuration
   */
  async importTheme(data: string): Promise<boolean> {
    try {
      const importData = JSON.parse(data);

      if (importData.settings) {
        this.updateSettings(importData.settings);
      }

      if (importData.customThemes && Array.isArray(importData.customThemes)) {
        for (const theme of importData.customThemes) {
          this.registerCustomTheme(theme);
        }
      }

      // Reload current theme with new settings
      if (this.currentTheme) {
        await this.loadTheme(this.currentTheme.id);
      }

      eventBus.emit('theme:imported', {
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('[ThemeEngine] Failed to import theme:', error);
      return false;
    }
  }

  /**
   * Cleanup theme engine
   */
  cleanup(): void {
    ThemeManager.unloadTheme();
    eventBus.offAll('theme-engine');
    console.log('[ThemeEngine] Cleaned up');
  }
}

// Singleton instance
export const themeEngine = new ThemeEngine();

// Export convenience functions
export const ThemeAPI = {
  loadTheme: (themeId: string) => themeEngine.loadTheme(themeId),
  updateSettings: (settings: Partial<ThemeSettings>) => themeEngine.updateSettings(settings),
  getSettings: () => themeEngine.getSettings(),
  getCurrentTheme: () => themeEngine.getCurrentTheme(),
  getAllThemes: () => themeEngine.getAllThemes(),
  registerCustomTheme: (theme: ThemeDefinition) => themeEngine.registerCustomTheme(theme),
  resetToDefaults: () => themeEngine.resetToDefaults(),
  exportTheme: () => themeEngine.exportTheme(),
  importTheme: (data: string) => themeEngine.importTheme(data)
};