// Theme schema and types
export {
  builtInThemes,
  defaultThemeSettings,
  type ThemeDefinition,
  type ThemeSettings,
  type ThemeColors,
  type ThemeTypography,
  type ThemeSpacing,
  type ThemeShadows,
  type ThemeBorders,
  type WallpaperConfig,
  generateCSSProperties,
  validateTheme
} from './theme-schema';

// Core theme system exports
export { themeEngine, ThemeAPI } from './theme-engine';
export { themeFSM, ThemeManager } from './theme-fsm';
export { wallpaperManager, WallpaperAPI } from './wallpaper-manager';
export { fontManager, FontAPI } from './font-manager';

// Font manager types
export {
  type FontSizeScale,
  type FontWeight,
  type FontFamily,
  type FontSettings,
  type ApplicationFontSettings
} from './font-manager';

// Wallpaper manager types
export {
  type WallpaperSource
} from './wallpaper-manager';

// Legacy exports for backward compatibility
import { builtInThemes } from './theme-schema';
import { themeEngine } from './theme-engine';
export const themes = builtInThemes;
export const currentTheme = () => themeEngine.getCurrentTheme()?.id || 'light';