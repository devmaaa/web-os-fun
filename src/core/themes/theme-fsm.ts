import { createFSM, type FSM } from '@core/fsm';
import { eventBus } from '@core/event-bus';

export type ThemeState = 'unloaded' | 'loading' | 'active' | 'changing' | 'error';
export type ThemeEvent = 'load' | 'apply' | 'loaded' | 'error' | 'reset' | 'unload';

export interface ThemeContext {
  themeId?: string;
  error?: Error;
  loadStartTime?: number;
}

/**
 * Theme FSM Manager - Manages theme lifecycle deterministically
 *
 * States:
 * - unloaded: No theme loaded, initial state
 * - loading: Theme is being loaded and validated
 * - active: Theme is successfully loaded and applied
 * - changing: Theme is in process of changing to another
 * - error: Theme loading or application failed
 *
 * Events:
 * - load: Start loading a theme
 * - apply: Apply a loaded theme
 * - loaded: Theme loading completed successfully
 * - error: Theme loading or application failed
 * - reset: Reset to default theme
 * - unload: Unload current theme
 */
export function createThemeFSM(): FSM<ThemeState, ThemeEvent> {
  const transitions: Record<ThemeState, Partial<Record<ThemeEvent, ThemeState>>> = {
    unloaded: {
      load: 'loading'
    },
    loading: {
      loaded: 'active',
      error: 'error',
      unload: 'unloaded'
    },
    active: {
      apply: 'changing',
      load: 'loading',
      unload: 'unloaded'
    },
    changing: {
      loaded: 'active',
      error: 'error',
      apply: 'changing', // Allow re-application while changing
      load: 'loading', // Allow new load requests while changing
      unload: 'unloaded'
    },
    error: {
      load: 'loading',
      reset: 'loading',
      unload: 'unloaded'
    }
  };

  const context: ThemeContext = {};

  const fsm = createFSM('theme-manager', 'unloaded', transitions, {
    context,
    metadata: {
      type: 'theme-manager',
      version: '1.0.0'
    },
    effects: {
      load: (from, to) => {
        context.loadStartTime = Date.now();
        context.error = undefined;
        eventBus.emit('theme:loading', {
          themeId: context.themeId,
          timestamp: Date.now()
        });
      },
      loaded: (from, to) => {
        context.error = undefined;
        eventBus.emitSync('theme:changed', {
          themeId: context.themeId,
          loadTime: context.loadStartTime ? Date.now() - context.loadStartTime : undefined,
          timestamp: Date.now()
        });
      },
      error: (from, to) => {
        context.error = new Error('Theme operation failed');
        eventBus.emitSync('theme:error', {
          themeId: context.themeId,
          error: context.error?.message,
          timestamp: Date.now()
        });
      },
      unload: (from, to) => {
        eventBus.emitSync('theme:unloaded', {
          previousThemeId: context.themeId,
          timestamp: Date.now()
        });
        // Reset context on unload
        Object.keys(context).forEach(key => delete context[key as keyof ThemeContext]);
      }
    }
  });

  return fsm;
}

// Singleton instance for global theme management
export const themeFSM = createThemeFSM();

// Register with global FSM registry for diagnostics
import { registerFSM } from '@core/fsm';
registerFSM(themeFSM);

// Helper functions for common operations
export const ThemeManager = {
  /**
   * Load and apply a theme
   */
  async loadTheme(themeId: string): Promise<boolean> {
    const currentState = themeFSM.getState();

    // If we're in changing state, we can still load a new theme
    if (currentState === 'changing') {
      // Reset to loading state to allow new theme load
      themeFSM.transition('load');
    } else if (!themeFSM.can('load')) {
      console.warn('[ThemeManager] Cannot load theme in current state:', currentState);
      return false;
    } else {
      themeFSM.transition('load');
    }

    // Update context using FSM's built-in method
    themeFSM.updateContext({ themeId });

    try {
      // Simulate theme loading (will be implemented in theme-engine)
      await new Promise(resolve => setTimeout(resolve, 100));

      themeFSM.transition('loaded');
      themeFSM.transition('apply');

      return true;
    } catch (error) {
      themeFSM.transition('error');
      console.error('[ThemeManager] Failed to load theme:', error);
      return false;
    }
  },

  /**
   * Get current theme information
   */
  getCurrentTheme(): { state: ThemeState; themeId?: string; error?: Error } {
    const context = themeFSM.getContext() as ThemeContext;
    return {
      state: themeFSM.getState(),
      themeId: context?.themeId,
      error: context?.error
    };
  },

  /**
   * Reset to default theme
   */
  async resetTheme(): Promise<boolean> {
    if (!themeFSM.can('reset')) {
      console.warn('[ThemeManager] Cannot reset theme in current state:', themeFSM.getState());
      return false;
    }

    themeFSM.transition('reset');
    return await this.loadTheme('default-light');
  },

  /**
   * Unload current theme
   */
  unloadTheme(): boolean {
    if (!themeFSM.can('unload')) {
      console.warn('[ThemeManager] Cannot unload theme in current state:', themeFSM.getState());
      return false;
    }

    themeFSM.transition('unload');
    return true;
  }
};