import { eventBus } from '@core/event-bus';
import type { ThemeSettings } from './theme-schema';

/**
 * Font Size Manager - Handles dynamic typography system
 *
 * Features:
 * - Global font size scaling
 * - Per-application font overrides
 * - System-wide font family management
 * - Accessibility compliance
 * - Real-time font size updates
 */

export type FontSizeScale = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface FontFamily {
  primary: string;
  secondary: string;
  monospace: string;
}

export interface FontSettings {
  fontSizeScale: FontSizeScale;
  customFontFamily?: Partial<FontFamily>;
  lineHeightScale: number;
  letterSpacingScale: number;
  wordSpacingScale: number;
}

export interface ApplicationFontSettings {
  appId: string;
  fontSizeScale?: FontSizeScale;
  fontFamily?: Partial<FontFamily>;
  customCSS?: string;
}

class FontManager {
  private currentSettings: FontSettings = {
    fontSizeScale: 'base',
    lineHeightScale: 1,
    letterSpacingScale: 1,
    wordSpacingScale: 1
  };

  private applicationSettings: Map<string, ApplicationFontSettings> = new Map();
  private readonly storageKey = 'dineapp-font-settings';
  private readonly appSettingsKey = 'dineapp-app-font-settings';

  // Font size scale factors
  private readonly fontSizeFactors: Record<FontSizeScale, number> = {
    xs: 0.75,
    sm: 0.875,
    base: 1,
    lg: 1.125,
    xl: 1.25,
    '2xl': 1.5
  };

  // Accessibility limits
  private readonly minScaleFactor = 0.5;
  private readonly maxScaleFactor = 2.0;

  constructor() {
    this.loadSettings();
    this.setupEventListeners();
    this.applySystemFonts();
  }

  /**
   * Apply system-wide font settings
   */
  applySystemFonts(): void {
    const root = document.documentElement;
    const scaleFactor = this.fontSizeFactors[this.currentSettings.fontSizeScale];

    // Apply font size scale
    root.style.setProperty('--font-size-scale', scaleFactor.toString());
    root.style.setProperty('--font-size-scale-percent', `${(scaleFactor * 100).toFixed(0)}%`);

    // Apply line height scale
    root.style.setProperty('--line-height-scale', this.currentSettings.lineHeightScale.toString());

    // Apply letter spacing scale
    root.style.setProperty('--letter-spacing-scale', this.currentSettings.letterSpacingScale.toString());

    // Apply word spacing scale
    root.style.setProperty('--word-spacing-scale', this.currentSettings.wordSpacingScale.toString());

    // Apply custom font families if set
    if (this.currentSettings.customFontFamily) {
      this.applyFontFamilies(this.currentSettings.customFontFamily);
    }

    // Set data attributes for CSS targeting
    root.setAttribute('data-font-size', this.currentSettings.fontSizeScale);
    root.setAttribute('data-font-scale', scaleFactor.toString());

    console.log(`[FontManager] Applied system fonts: scale=${this.currentSettings.fontSizeScale} (${scaleFactor}x)`);
  }

  /**
   * Apply font families
   */
  private applyFontFamilies(fontFamily: Partial<FontFamily>): void {
    const root = document.documentElement;

    if (fontFamily.primary) {
      root.style.setProperty('--font-family-primary', fontFamily.primary);
    }

    if (fontFamily.secondary) {
      root.style.setProperty('--font-family-secondary', fontFamily.secondary);
    }

    if (fontFamily.monospace) {
      root.style.setProperty('--font-family-monospace', fontFamily.monospace);
    }
  }

  /**
   * Set font size scale
   */
  setFontSizeScale(scale: FontSizeScale): void {
    this.currentSettings.fontSizeScale = scale;
    this.saveSettings();
    this.applySystemFonts();

    eventBus.emit('font:size:changed', {
      scale,
      factor: this.fontSizeFactors[scale],
      timestamp: Date.now()
    });
  }

  /**
   * Get current font size scale
   */
  getFontSizeScale(): FontSizeScale {
    return this.currentSettings.fontSizeScale;
  }

  /**
   * Get font size factor
   */
  getFontSizeFactor(): number {
    return this.fontSizeFactors[this.currentSettings.fontSizeScale];
  }

  /**
   * Increase font size
   */
  increaseFontSize(): boolean {
    const scales: FontSizeScale[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];
    const currentIndex = scales.indexOf(this.currentSettings.fontSizeScale);

    if (currentIndex < scales.length - 1) {
      this.setFontSizeScale(scales[currentIndex + 1]);
      return true;
    }

    return false;
  }

  /**
   * Decrease font size
   */
  decreaseFontSize(): boolean {
    const scales: FontSizeScale[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];
    const currentIndex = scales.indexOf(this.currentSettings.fontSizeScale);

    if (currentIndex > 0) {
      this.setFontSizeScale(scales[currentIndex - 1]);
      return true;
    }

    return false;
  }

  /**
   * Reset font size to default
   */
  resetFontSize(): void {
    this.setFontSizeScale('base');
  }

  /**
   * Set custom font families
   */
  setCustomFontFamilies(fontFamily: Partial<FontFamily>): void {
    this.currentSettings.customFontFamily = { ...this.currentSettings.customFontFamily, ...fontFamily };
    this.saveSettings();
    this.applySystemFonts();

    eventBus.emit('font:families:changed', {
      families: this.currentSettings.customFontFamily,
      timestamp: Date.now()
    });
  }

  /**
   * Get custom font families
   */
  getCustomFontFamilies(): Partial<FontFamily> | undefined {
    return this.currentSettings.customFontFamily;
  }

  /**
   * Set line height scale
   */
  setLineHeightScale(scale: number): void {
    const clampedScale = Math.max(0.5, Math.min(2.0, scale));
    this.currentSettings.lineHeightScale = clampedScale;
    this.saveSettings();
    this.applySystemFonts();

    eventBus.emit('font:line-height:changed', {
      scale: clampedScale,
      timestamp: Date.now()
    });
  }

  /**
   * Set letter spacing scale
   */
  setLetterSpacingScale(scale: number): void {
    const clampedScale = Math.max(0.5, Math.min(2.0, scale));
    this.currentSettings.letterSpacingScale = clampedScale;
    this.saveSettings();
    this.applySystemFonts();

    eventBus.emit('font:letter-spacing:changed', {
      scale: clampedScale,
      timestamp: Date.now()
    });
  }

  /**
   * Set word spacing scale
   */
  setWordSpacingScale(scale: number): void {
    const clampedScale = Math.max(0.5, Math.min(2.0, scale));
    this.currentSettings.wordSpacingScale = clampedScale;
    this.saveSettings();
    this.applySystemFonts();

    eventBus.emit('font:word-spacing:changed', {
      scale: clampedScale,
      timestamp: Date.now()
    });
  }

  /**
   * Get current font settings
   */
  getFontSettings(): FontSettings {
    return { ...this.currentSettings };
  }

  /**
   * Set application-specific font settings
   */
  setApplicationFontSettings(appId: string, settings: ApplicationFontSettings): void {
    this.applicationSettings.set(appId, settings);
    this.saveApplicationSettings();
    this.applyApplicationFontSettings(appId);

    eventBus.emit('font:app-settings:changed', {
      appId,
      settings,
      timestamp: Date.now()
    });
  }

  /**
   * Get application-specific font settings
   */
  getApplicationFontSettings(appId: string): ApplicationFontSettings | undefined {
    return this.applicationSettings.get(appId);
  }

  /**
   * Remove application-specific font settings
   */
  removeApplicationFontSettings(appId: string): void {
    this.applicationSettings.delete(appId);
    this.saveApplicationSettings();

    eventBus.emit('font:app-settings:removed', {
      appId,
      timestamp: Date.now()
    });
  }

  /**
   * Apply application-specific font settings
   */
  private applyApplicationFontSettings(appId: string): void {
    const settings = this.applicationSettings.get(appId);
    if (!settings) return;

    // Apply styles to application root element
    const appElement = document.querySelector(`[data-app-id="${appId}"]`);
    if (!appElement) return;

    const root = appElement as HTMLElement;

    // Apply font size scale if different from system
    if (settings.fontSizeScale && settings.fontSizeScale !== this.currentSettings.fontSizeScale) {
      const scaleFactor = this.fontSizeFactors[settings.fontSizeScale];
      root.style.setProperty('--font-size-scale', scaleFactor.toString());
      root.setAttribute('data-font-size', settings.fontSizeScale);
    }

    // Apply custom font families if set
    if (settings.fontFamily) {
      if (settings.fontFamily.primary) {
        root.style.setProperty('--font-family-primary', settings.fontFamily.primary);
      }
      if (settings.fontFamily.secondary) {
        root.style.setProperty('--font-family-secondary', settings.fontFamily.secondary);
      }
      if (settings.fontFamily.monospace) {
        root.style.setProperty('--font-family-monospace', settings.fontFamily.monospace);
      }
    }

    // Apply custom CSS if provided
    if (settings.customCSS) {
      let styleElement = document.getElementById(`font-custom-${appId}`) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = `font-custom-${appId}`;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = settings.customCSS;
    }
  }

  /**
   * Get recommended font size for accessibility
   */
  getRecommendedFontSize(userPreferences: {
    hasVisionImpairment?: boolean;
    prefersLargeText?: boolean;
    age?: number;
  }): FontSizeScale {
    if (userPreferences.hasVisionImpairment) {
      return 'xl';
    }

    if (userPreferences.prefersLargeText) {
      return 'lg';
    }

    if (userPreferences.age && userPreferences.age > 65) {
      return 'lg';
    }

    return 'base';
  }

  /**
   * Check if current font settings meet accessibility guidelines
   */
  checkAccessibility(): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const scaleFactor = this.fontSizeFactors[this.currentSettings.fontSizeScale];

    // WCAG guidelines: at least 1.2x for normal text, 1.5x for large text
    if (scaleFactor < 1.2) {
      issues.push('Font size is smaller than WCAG recommended minimum (1.2x)');
      recommendations.push('Consider using "lg" or larger font size for better accessibility');
    }

    if (this.currentSettings.lineHeightScale < 1.4) {
      issues.push('Line height is smaller than WCAG recommended minimum (1.4x)');
      recommendations.push('Increase line height to 1.5x for better readability');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Load fonts from Google Fonts or other sources
   */
  async loadWebFont(fontFamily: string, source: 'google' | 'custom' = 'google'): Promise<boolean> {
    try {
      if (source === 'google') {
        // Load from Google Fonts
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}&display=swap`;
        document.head.appendChild(link);

        // Wait for font to load
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Font load timeout')), 5000);

          link.onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };

          link.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Font load failed'));
          };
        });
      }

      eventBus.emit('font:loaded', {
        fontFamily,
        source,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('[FontManager] Failed to load web font:', error);
      return false;
    }
  }

  /**
   * Get system fonts
   */
  getSystemFonts(): FontFamily {
    const computedStyle = getComputedStyle(document.documentElement);

    return {
      primary: computedStyle.getPropertyValue('--font-family-primary').trim() || 'system-ui',
      secondary: computedStyle.getPropertyValue('--font-family-secondary').trim() || 'system-ui',
      monospace: computedStyle.getPropertyValue('--font-family-monospace').trim() || 'monospace'
    };
  }

  /**
   * Load settings from storage
   */
  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const settings = JSON.parse(stored);
        this.currentSettings = { ...this.currentSettings, ...settings };
      }

      // Load application settings
      const appStored = localStorage.getItem(this.appSettingsKey);
      if (appStored) {
        const appSettings = JSON.parse(appStored);
        this.applicationSettings = new Map(Object.entries(appSettings));
      }
    } catch (error) {
      console.error('[FontManager] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentSettings));
    } catch (error) {
      console.error('[FontManager] Failed to save settings:', error);
    }
  }

  /**
   * Save application settings to storage
   */
  private saveApplicationSettings(): void {
    try {
      const appSettings = Object.fromEntries(this.applicationSettings);
      localStorage.setItem(this.appSettingsKey, JSON.stringify(appSettings));
    } catch (error) {
      console.error('[FontManager] Failed to save application settings:', error);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to theme changes to re-apply fonts
    eventBus.on('theme:changed', () => {
      this.applySystemFonts();
    }, { scope: 'font-manager' });

    // Listen to application focus to apply app-specific settings
    eventBus.on('window:focused', (event) => {
      if (event.pluginId) {
        this.applyApplicationFontSettings(event.pluginId);
      }
    }, { scope: 'font-manager' });

    // Listen to system accessibility settings
    eventBus.on('accessibility:changed', (event) => {
      if (event.prefersLargeText) {
        this.setFontSizeScale('lg');
      }
    }, { scope: 'font-manager' });
  }

  /**
   * Generate CSS variables for current font settings
   */
  generateCSSVariables(): Record<string, string> {
    const scaleFactor = this.fontSizeFactors[this.currentSettings.fontSizeScale];

    return {
      '--font-size-scale': scaleFactor.toString(),
      '--font-size-scale-percent': `${(scaleFactor * 100).toFixed(0)}%`,
      '--line-height-scale': this.currentSettings.lineHeightScale.toString(),
      '--letter-spacing-scale': this.currentSettings.letterSpacingScale.toString(),
      '--word-spacing-scale': this.currentSettings.wordSpacingScale.toString(),
      ...(this.currentSettings.customFontFamily?.primary && {
        '--font-family-primary': this.currentSettings.customFontFamily.primary
      }),
      ...(this.currentSettings.customFontFamily?.secondary && {
        '--font-family-secondary': this.currentSettings.customFontFamily.secondary
      }),
      ...(this.currentSettings.customFontFamily?.monospace && {
        '--font-family-monospace': this.currentSettings.customFontFamily.monospace
      })
    };
  }

  /**
   * Reset all font settings to defaults
   */
  resetToDefaults(): void {
    this.currentSettings = {
      fontSizeScale: 'base',
      lineHeightScale: 1,
      letterSpacingScale: 1,
      wordSpacingScale: 1
    };

    this.applicationSettings.clear();
    this.saveSettings();
    this.saveApplicationSettings();
    this.applySystemFonts();

    eventBus.emit('font:reset', {
      timestamp: Date.now()
    });
  }

  /**
   * Cleanup font manager
   */
  cleanup(): void {
    eventBus.offAll('font-manager');
    console.log('[FontManager] Cleaned up');
  }
}

// Singleton instance
export const fontManager = new FontManager();

// Export convenience functions
export const FontAPI = {
  setFontSizeScale: (scale: FontSizeScale) => fontManager.setFontSizeScale(scale),
  getFontSizeScale: () => fontManager.getFontSizeScale(),
  increaseFontSize: () => fontManager.increaseFontSize(),
  decreaseFontSize: () => fontManager.decreaseFontSize(),
  resetFontSize: () => fontManager.resetFontSize(),
  setCustomFontFamilies: (families: Partial<FontFamily>) => fontManager.setCustomFontFamilies(families),
  setLineHeightScale: (scale: number) => fontManager.setLineHeightScale(scale),
  setLetterSpacingScale: (scale: number) => fontManager.setLetterSpacingScale(scale),
  setWordSpacingScale: (scale: number) => fontManager.setWordSpacingScale(scale),
  setApplicationFontSettings: (appId: string, settings: ApplicationFontSettings) =>
    fontManager.setApplicationFontSettings(appId, settings),
  getApplicationFontSettings: (appId: string) => fontManager.getApplicationFontSettings(appId),
  removeApplicationFontSettings: (appId: string) => fontManager.removeApplicationFontSettings(appId),
  loadWebFont: (fontFamily: string, source?: 'google' | 'custom') => fontManager.loadWebFont(fontFamily, source),
  checkAccessibility: () => fontManager.checkAccessibility(),
  getRecommendedFontSize: (preferences: any) => fontManager.getRecommendedFontSize(preferences),
  resetToDefaults: () => fontManager.resetToDefaults()
};