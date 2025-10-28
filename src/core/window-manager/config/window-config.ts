import type { PluginManifest } from '@core/plugin-loader';

/**
 * Window Configuration - Single source of truth for window defaults
 */
export interface WindowConfig {
  id: string;
  pluginId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable: boolean;
  maximizable: boolean;
  minimizable: boolean;
  alwaysOnTop: boolean;
}

/**
 * Window Creation Options - External API for creating windows
 */
export interface WindowCreationOptions {
  component?: any;
  props?: Record<string, any>;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  alwaysOnTop?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
  minimizable?: boolean;
}

/**
 * Validated and resolved window configuration
 */
export interface ResolvedWindowConfig extends WindowConfig {
  resolvedAt: number;
  source: 'manifest' | 'options' | 'defaults';
}

/**
 * Configuration defaults and constraints
 */
export const WINDOW_DEFAULTS = {
  // Position defaults
  x: 100,
  y: 100,

  // Size defaults - the FIX for your issue
  width: 650,  // Changed from 600 to match manifests
  height: 500, // Changed from 300 to match manifests

  // Minimum constraints
  minWidth: 200,
  minHeight: 150,

  // Maximum constraints
  maxWidth: window?.innerWidth || 1920,
  maxHeight: window?.innerHeight || 1080,

  // Behavioral defaults
  resizable: true,
  maximizable: true,
  minimizable: true,
  alwaysOnTop: false,
} as const;

/**
 * Configuration merger and validator
 */
export class WindowConfigResolver {
  /**
   * Resolve window configuration from multiple sources with proper precedence
   *
   * Precedence order:
   * 1. Explicit options (highest priority)
   * 2. Plugin manifest configuration
   * 3. System defaults (lowest priority)
   */
  static resolve(
    pluginId: string,
    title: string,
    windowId: string,
    options: WindowCreationOptions = {},
    manifest?: PluginManifest
  ): ResolvedWindowConfig {
    // Get manifest window configuration if available
    const manifestWindowConfig = manifest?.windows?.[0];

    // Apply cascading configuration with proper precedence
    const config: WindowConfig = {
      id: windowId,
      pluginId,
      title,

      // Position: options > manifest > defaults
      x: options.x ?? manifestWindowConfig?.defaultX ?? WINDOW_DEFAULTS.x,
      y: options.y ?? manifestWindowConfig?.defaultY ?? WINDOW_DEFAULTS.y,

      // Size: options > manifest > defaults (THE FIX)
      width: this.constrainDimension(
        options.width ?? manifestWindowConfig?.defaultWidth ?? WINDOW_DEFAULTS.width,
        'width',
        options.minWidth ?? manifestWindowConfig?.minWidth ?? WINDOW_DEFAULTS.minWidth,
        options.maxWidth ?? manifestWindowConfig?.maxWidth ?? WINDOW_DEFAULTS.maxWidth
      ),

      height: this.constrainDimension(
        options.height ?? manifestWindowConfig?.defaultHeight ?? WINDOW_DEFAULTS.height,
        'height',
        options.minHeight ?? manifestWindowConfig?.minHeight ?? WINDOW_DEFAULTS.minHeight,
        options.maxHeight ?? manifestWindowConfig?.maxHeight ?? WINDOW_DEFAULTS.maxHeight
      ),

      // Constraints: options > manifest > defaults
      minWidth: options.minWidth ?? manifestWindowConfig?.minWidth ?? WINDOW_DEFAULTS.minWidth,
      minHeight: options.minHeight ?? manifestWindowConfig?.minHeight ?? WINDOW_DEFAULTS.minHeight,
      maxWidth: options.maxWidth ?? manifestWindowConfig?.maxWidth ?? WINDOW_DEFAULTS.maxWidth,
      maxHeight: options.maxHeight ?? manifestWindowConfig?.maxHeight ?? WINDOW_DEFAULTS.maxHeight,

      // Behavior: options > manifest > defaults
      resizable: options.resizable ?? manifestWindowConfig?.resizable ?? WINDOW_DEFAULTS.resizable,
      maximizable: options.maximizable ?? manifestWindowConfig?.maximizable ?? WINDOW_DEFAULTS.maximizable,
      minimizable: options.minimizable ?? manifestWindowConfig?.minimizable ?? WINDOW_DEFAULTS.minimizable,
      alwaysOnTop: options.alwaysOnTop ?? WINDOW_DEFAULTS.alwaysOnTop,
    };

    // Determine configuration source for debugging
    const source = options.width ? 'options' : manifestWindowConfig ? 'manifest' : 'defaults';

    return {
      ...config,
      resolvedAt: Date.now(),
      source
    };
  }

  /**
   * Constrain dimension within min/max bounds
   */
  private static constrainDimension(
    value: number,
    dimension: 'width' | 'height',
    min: number,
    max: number
  ): number {
    // Ensure minimum constraint is respected
    const constrainedValue = Math.max(value, min);

    // Apply maximum constraint if specified
    const finalValue = max ? Math.min(constrainedValue, max) : constrainedValue;

    // Validate against screen bounds as final safety check
    const screenBounds = this.getScreenBounds();
    const maxScreenDimension = dimension === 'width' ? screenBounds.width : screenBounds.height;

    return Math.min(finalValue, maxScreenDimension - 50); // Leave some margin
  }

  /**
   * Get current screen bounds
   */
  private static getScreenBounds() {
    if (typeof window !== 'undefined' && window.visualViewport) {
      const vv = window.visualViewport;
      return {
        width: vv.width,
        height: vv.height,
        offsetLeft: vv.offsetLeft || 0,
        offsetTop: vv.offsetTop || 0
      };
    }

    return {
      width: typeof window !== 'undefined' ? window.innerWidth : 1920,
      height: typeof window !== 'undefined' ? window.innerHeight : 1080,
      offsetLeft: 0,
      offsetTop: 0
    };
  }

  /**
   * Validate a complete window configuration
   */
  static validate(config: WindowConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!config.id || config.id.trim() === '') {
      errors.push('Window ID is required');
    }

    if (!config.pluginId || config.pluginId.trim() === '') {
      errors.push('Plugin ID is required');
    }

    if (!config.title || config.title.trim() === '') {
      errors.push('Window title is required');
    }

    // Dimension validation
    if (config.width < config.minWidth) {
      errors.push(`Width (${config.width}) cannot be less than minimum width (${config.minWidth})`);
    }

    if (config.height < config.minHeight) {
      errors.push(`Height (${config.height}) cannot be less than minimum height (${config.minHeight})`);
    }

    if (config.maxWidth && config.width > config.maxWidth) {
      errors.push(`Width (${config.width}) cannot exceed maximum width (${config.maxWidth})`);
    }

    if (config.maxHeight && config.height > config.maxHeight) {
      errors.push(`Height (${config.height}) cannot exceed maximum height (${config.maxHeight})`);
    }

    // Position validation
    if (config.x < 0) {
      errors.push('X position cannot be negative');
    }

    if (config.y < 0) {
      errors.push('Y position cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}