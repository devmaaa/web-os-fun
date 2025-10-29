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
      primary: '#3b82f6',        // Matches primitive-blue-500
      primaryHover: '#2563eb',   // Matches primitive-blue-600
      primaryActive: '#1d4ed8',  // Matches primitive-blue-700
      secondary: '#6b7280',      // Matches primitive-slate-500
      secondaryHover: '#4b5563', // Matches primitive-slate-600
      secondaryActive: '#374151', // Matches primitive-slate-700
      bgPrimary: '#f8fafc',      // Matches primitive-slate-50
      bgSecondary: '#f1f5f9',    // Matches primitive-slate-100
      bgTertiary: '#e2e8f0',     // Matches primitive-slate-200
      textPrimary: '#0f172a',    // Matches primitive-slate-950
      textSecondary: '#475569',  // Matches primitive-slate-600
      textTertiary: '#64748b',   // Matches primitive-slate-500
      textInverse: '#ffffff',    // Pure white
      borderPrimary: '#e2e8f0',  // Matches primitive-slate-200
      borderSecondary: '#cbd5e1', // Matches primitive-slate-300
      borderFocus: '#3b82f6',    // Matches primitive-blue-500
      success: '#22c55e',        // Matches primitive-green-500
      warning: '#eab308',        // Matches primitive-yellow-500
      error: '#ef4444',          // Matches primitive-red-500
      info: '#3b82f6',           // Matches primitive-blue-500
      accent: '#3b82f6',         // Matches primitive-blue-500
      highlight: '#fef3c7',      // Warm yellow
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
      primary: '#60a5fa',        // Matches primitive-blue-400
      primaryHover: '#3b82f6',   // Matches primitive-blue-500
      primaryActive: '#2563eb',  // Matches primitive-blue-600
      secondary: '#9ca3af',      // Matches primitive-slate-400
      secondaryHover: '#6b7280', // Matches primitive-slate-500
      secondaryActive: '#4b5563', // Matches primitive-slate-600
      bgPrimary: '#020617',      // Matches primitive-slate-950
      bgSecondary: '#0f172a',    // Matches primitive-slate-900
      bgTertiary: '#1e293b',     // Matches primitive-slate-800
      textPrimary: '#f8fafc',    // Matches primitive-slate-50
      textSecondary: '#cbd5e1',  // Matches primitive-slate-400
      textTertiary: '#94a3b8',   // Matches primitive-slate-500
      textInverse: '#020617',    // Matches primitive-slate-950
      borderPrimary: '#334155',  // Matches primitive-slate-700
      borderSecondary: '#475569', // Matches primitive-slate-600
      borderFocus: '#60a5fa',    // Matches primitive-blue-400
      success: '#22c55e',        // Matches primitive-green-500
      warning: '#eab308',        // Matches primitive-yellow-500
      error: '#ef4444',          // Matches primitive-red-500
      info: '#60a5fa',           // Matches primitive-blue-400
      accent: '#60a5fa',         // Matches primitive-blue-400
      highlight: '#78350f',      // Dark yellow
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
 * Maps theme colors to primitive tokens to preserve semantic token architecture
 */
export function generateCSSProperties(theme: ThemeDefinition): Record<string, string> {
  const properties: Record<string, string> = {};

  // Convert hex colors to RGB space-separated format for primitive tokens
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      : hex;
  };

  // Map theme colors to PRIMITIVE tokens (not semantic ones)
  // This preserves our 3-layer architecture: primitive → semantic → component
  const colorMappings: Record<string, string> = {
    // Map primary colors to blue primitives
    'primary': 'primitive-blue-500',
    'primary-hover': 'primitive-blue-600',
    'primary-active': 'primitive-blue-700',

    // Map secondary colors to slate primitives
    'secondary': 'primitive-slate-500',
    'secondary-hover': 'primitive-slate-600',
    'secondary-active': 'primitive-slate-700',

    // Map background colors to slate primitives
    'bg-primary': 'primitive-slate-50',      // Light mode background
    'bg-secondary': 'primitive-slate-100',   // Light mode secondary
    'bg-tertiary': 'primitive-slate-200',    // Light mode tertiary

    // Map text colors to slate primitives
    'text-primary': 'primitive-slate-950',   // Light mode text
    'text-secondary': 'primitive-slate-600',  // Light mode secondary text
    'text-tertiary': 'primitive-slate-500',   // Light mode tertiary text
    'text-inverse': '255 255 255',           // Pure white for inverse text

    // Map border colors to slate primitives
    'border-primary': 'primitive-slate-200',
    'border-secondary': 'primitive-slate-300',
    'border-focus': 'primitive-blue-500',

    // Map status colors to existing primitives
    'success': 'primitive-green-500',
    'warning': 'primitive-yellow-500',
    'error': 'primitive-red-500',
    'info': 'primitive-blue-500',

    // Map system colors
    'accent': 'primitive-blue-500',
    'highlight': '254 243 199',  // Warm yellow
    'shadow': '0 0 0'           // Black for shadows
  };

  // Apply dark mode overrides for dark themes
  if (theme.isDark) {
    Object.assign(colorMappings, {
      'bg-primary': 'primitive-slate-950',      // Dark mode background
      'bg-secondary': 'primitive-slate-900',   // Dark mode secondary
      'bg-tertiary': 'primitive-slate-800',    // Dark mode tertiary

      'text-primary': 'primitive-slate-50',    // Dark mode text
      'text-secondary': 'primitive-slate-400', // Dark mode secondary text
      'text-tertiary': 'primitive-slate-500',  // Dark mode tertiary text
      'text-inverse': '2 6 23',               // Dark mode inverse (slate-950)

      'border-primary': 'primitive-slate-700',
      'border-secondary': 'primitive-slate-600',

      'primary': 'primitive-blue-400',         // Lighter blue for dark mode
      'accent': 'primitive-blue-400',
      'highlight': '120 53 15'                // Dark yellow for dark mode
    });
  }

  // Generate CSS properties for primitive tokens only
  Object.entries(colorMappings).forEach(([themeKey, primitiveKey]) => {
    const themeValue = theme.colors[themeKey as keyof ThemeColors];
    if (themeValue) {
      properties[`--${primitiveKey}`] = hexToRgb(themeValue);
    }
  });

  // Typography, spacing, shadows, borders (non-color properties can be set directly)
  Object.entries(theme.typography).forEach(([key, value]) => {
    properties[`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = String(value);
  });

  Object.entries(theme.spacing).forEach(([key, value]) => {
    properties[`--space-${key.replace(/space/g, '').toLowerCase()}`] = value;
  });

  Object.entries(theme.shadows).forEach(([key, value]) => {
    properties[`--shadow-${key.replace('shadow', '').toLowerCase()}`] = value;
  });

  Object.entries(theme.borders).forEach(([key, value]) => {
    properties[`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });

  return properties;
}