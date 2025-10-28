/**
 * Theme Schema and Type Definitions
 *
 * Defines the structure and interfaces for themes following the configuration engine pattern.
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;

  // Secondary colors
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;

  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  borderFocus: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // System colors
  accent: string;
  highlight: string;
  shadow: string;
}

export interface ThemeTypography {
  // Font families
  fontFamilyPrimary: string;
  fontFamilySecondary: string;
  fontFamilyMonospace: string;

  // Font sizes (in rem)
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeBase: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSize2xl: string;
  fontSize3xl: string;

  // Font weights
  fontWeightLight: number;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightSemibold: number;
  fontWeightBold: number;

  // Line heights
  lineHeightTight: number;
  lineHeightNormal: number;
  lineHeightRelaxed: number;
}

export interface ThemeSpacing {
  // Spacing scale (in rem)
  space1: string;
  space2: string;
  space3: string;
  space4: string;
  space5: string;
  space6: string;
  space8: string;
  space10: string;
  space12: string;
  space16: string;
  space20: string;
  space24: string;
  space32: string;
}

export interface ThemeShadows {
  shadowSm: string;
  shadowBase: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadowInner: string;
}

export interface ThemeBorders {
  borderRadiusSm: string;
  borderRadiusBase: string;
  borderRadiusLg: string;
  borderRadiusXl: string;
  borderRadiusFull: string;
  borderWidth: string;
}

export interface WallpaperConfig {
  type: 'color' | 'gradient' | 'image' | 'pattern';
  value: string;
  position?: 'center' | 'cover' | 'stretch' | 'repeat';
  opacity?: number;
  blur?: number;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  version: string;
  author?: string;

  // Core theme properties
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  borders: ThemeBorders;

  // Desktop configuration
  wallpaper: WallpaperConfig;

  // Metadata
  isBuiltIn: boolean;
  isDark: boolean;
  tags?: string[];
  preview?: string;

  // Custom CSS overrides (optional)
  customCSS?: string;
}

export interface ThemeSettings {
  // Selected theme
  themeId: string;

  // Wallpaper settings
  wallpaperCustom?: WallpaperConfig;

  // Font size scaling
  fontSizeScale: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';

  // Custom font family overrides
  customFontFamily?: {
    primary?: string;
    secondary?: string;
    monospace?: string;
  };

  // Accessibility settings
  highContrast: boolean;
  reduceMotion: boolean;

  // Developer settings
  debugMode: boolean;
  customCSS?: string;
}

/**
 * Built-in theme definitions
 */
export const builtInThemes: Record<string, ThemeDefinition> = {
  'light': {
    id: 'light',
    name: 'light',
    displayName: 'Light',
    description: 'Clean light theme with high contrast',
    version: '1.0.0',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryActive: '#1d4ed8',
      secondary: '#6b7280',
      secondaryHover: '#4b5563',
      secondaryActive: '#374151',
      bgPrimary: '#ffffff',
      bgSecondary: '#f9fafb',
      bgTertiary: '#f3f4f6',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textTertiary: '#6b7280',
      textInverse: '#ffffff',
      borderPrimary: '#e5e7eb',
      borderSecondary: '#d1d5db',
      borderFocus: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      accent: '#8b5cf6',
      highlight: '#fef3c7',
      shadow: 'rgba(0, 0, 0, 0.1)'
    },
    typography: {
      fontFamilyPrimary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontFamilySecondary: 'Georgia, "Times New Roman", serif',
      fontFamilyMonospace: '"SF Mono", Monaco, "Cascadia Code", monospace',
      fontSizeXs: '0.75rem',
      fontSizeSm: '0.875rem',
      fontSizeBase: '1rem',
      fontSizeLg: '1.125rem',
      fontSizeXl: '1.25rem',
      fontSize2xl: '1.5rem',
      fontSize3xl: '1.875rem',
      fontWeightLight: 300,
      fontWeightNormal: 400,
      fontWeightMedium: 500,
      fontWeightSemibold: 600,
      fontWeightBold: 700,
      lineHeightTight: 1.25,
      lineHeightNormal: 1.5,
      lineHeightRelaxed: 1.75
    },
    spacing: {
      space1: '0.25rem',
      space2: '0.5rem',
      space3: '0.75rem',
      space4: '1rem',
      space5: '1.25rem',
      space6: '1.5rem',
      space8: '2rem',
      space10: '2.5rem',
      space12: '3rem',
      space16: '4rem',
      space20: '5rem',
      space24: '6rem',
      space32: '8rem'
    },
    shadows: {
      shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      shadowBase: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      shadowInner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
    },
    borders: {
      borderRadiusSm: '0.125rem',
      borderRadiusBase: '0.25rem',
      borderRadiusLg: '0.5rem',
      borderRadiusXl: '0.75rem',
      borderRadiusFull: '9999px',
      borderWidth: '1px'
    },
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'cover',
      opacity: 1
    },
    isBuiltIn: true,
    isDark: false,
    tags: ['light', 'default', 'high-contrast']
  },

  'dark': {
    id: 'dark',
    name: 'dark',
    displayName: 'Dark',
    description: 'Dark theme optimized for low-light environments',
    version: '1.0.0',
    colors: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      primaryActive: '#2563eb',
      secondary: '#9ca3af',
      secondaryHover: '#6b7280',
      secondaryActive: '#4b5563',
      bgPrimary: '#111827',
      bgSecondary: '#1f2937',
      bgTertiary: '#374151',
      textPrimary: '#f9fafb',
      textSecondary: '#d1d5db',
      textTertiary: '#9ca3af',
      textInverse: '#111827',
      borderPrimary: '#374151',
      borderSecondary: '#4b5563',
      borderFocus: '#60a5fa',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      accent: '#a78bfa',
      highlight: '#78350f',
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    typography: {
      fontFamilyPrimary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontFamilySecondary: 'Georgia, "Times New Roman", serif',
      fontFamilyMonospace: '"SF Mono", Monaco, "Cascadia Code", monospace',
      fontSizeXs: '0.75rem',
      fontSizeSm: '0.875rem',
      fontSizeBase: '1rem',
      fontSizeLg: '1.125rem',
      fontSizeXl: '1.25rem',
      fontSize2xl: '1.5rem',
      fontSize3xl: '1.875rem',
      fontWeightLight: 300,
      fontWeightNormal: 400,
      fontWeightMedium: 500,
      fontWeightSemibold: 600,
      fontWeightBold: 700,
      lineHeightTight: 1.25,
      lineHeightNormal: 1.5,
      lineHeightRelaxed: 1.75
    },
    spacing: {
      space1: '0.25rem',
      space2: '0.5rem',
      space3: '0.75rem',
      space4: '1rem',
      space5: '1.25rem',
      space6: '1.5rem',
      space8: '2rem',
      space10: '2.5rem',
      space12: '3rem',
      space16: '4rem',
      space20: '5rem',
      space24: '6rem',
      space32: '8rem'
    },
    shadows: {
      shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      shadowBase: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
      shadowInner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)'
    },
    borders: {
      borderRadiusSm: '0.125rem',
      borderRadiusBase: '0.25rem',
      borderRadiusLg: '0.5rem',
      borderRadiusXl: '0.75rem',
      borderRadiusFull: '9999px',
      borderWidth: '1px'
    },
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      position: 'cover',
      opacity: 1
    },
    isBuiltIn: true,
    isDark: true,
    tags: ['dark', 'default', 'low-light']
  }
};

/**
 * Default theme settings
 */
export const defaultThemeSettings: ThemeSettings = {
  themeId: 'light',
  fontSizeScale: 'base',
  highContrast: false,
  reduceMotion: false,
  debugMode: false
};

/**
 * Theme validation utilities
 */
export function validateTheme(theme: Partial<ThemeDefinition>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!theme.id || theme.id.trim() === '') {
    errors.push('Theme ID is required');
  }

  if (!theme.name || theme.name.trim() === '') {
    errors.push('Theme name is required');
  }

  if (!theme.displayName || theme.displayName.trim() === '') {
    errors.push('Theme display name is required');
  }

  if (!theme.colors) {
    errors.push('Theme colors are required');
  } else {
    // Validate required color fields
    const requiredColors = ['primary', 'bgPrimary', 'textPrimary'] as const;
    for (const color of requiredColors) {
      if (!theme.colors[color] || !isValidColor(theme.colors[color])) {
        errors.push(`Invalid or missing color: ${color}`);
      }
    }
  }

  if (!theme.typography) {
    errors.push('Theme typography is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidColor(color: string): boolean {
  // Simple color validation - can be enhanced
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
}

/**
 * Generate CSS custom properties from theme
 */
export function generateCSSProperties(theme: ThemeDefinition): Record<string, string> {
  const properties: Record<string, string> = {};

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    properties[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });

  // Typography
  Object.entries(theme.typography).forEach(([key, value]) => {
    properties[`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = String(value);
  });

  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    properties[`--space-${key.replace(/space/g, '').toLowerCase()}`] = value;
  });

  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    properties[`--shadow-${key.replace('shadow', '').toLowerCase()}`] = value;
  });

  // Borders
  Object.entries(theme.borders).forEach(([key, value]) => {
    properties[`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });

  return properties;
}