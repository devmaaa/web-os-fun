import { Component, createSignal, For, createEffect, onMount, onCleanup, Show } from 'solid-js';
import { getAvailablePlugins } from '../../../../plugins';
import { windowManager } from '@core/window-manager';
import { eventBus } from '@core/event-bus';
import { getFSM } from '@core/fsm';
import type { PluginManifest } from '@core/plugin-loader';
import type { FSMState, FSMEvent } from '@core/fsm';
// Dock theming is now handled globally in index.css

interface DockItem {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
  isRunning: boolean;
  badge?: string | number;
  fsm?: any; // Window FSM instance (observed, not controlled)
}

// Dock item states - following FSM architecture specification
type DockItemState = 'idle' | 'launching' | 'running' | 'active' | 'minimized' | 'quitting';

// Dock item events - following domain:action naming convention
type DockItemEvent = 'click' | 'launch' | 'quit' | 'activate' | 'deactivate' | 'focus' | 'minimize' | 'restore' | 'success' | 'error' | 'complete';

interface DockProps {
  onAppOpen: (pluginId: string) => Promise<void>;
}

function Dock(props: DockProps) {
  const [dockItems, setDockItems] = createSignal<DockItem[]>([]);
  const [hoveredItem, setHoveredItem] = createSignal<string | null>(null);
  const [magnification, setMagnification] = createSignal<Record<string, number>>({});
  const [dynamicGap, setDynamicGap] = createSignal(12); // Base gap in pixels - will use CSS variables
  const [isAnimating, setIsAnimating] = createSignal(false);

  const availablePlugins = getAvailablePlugins();

  // Development mode flag - properly defined in component scope
  const isDevMode = import.meta.env.DEV;

  // FSM validation helper
  const isValidFSM = (fsm: any): boolean => {
    return fsm && typeof fsm === 'object' &&
           typeof fsm.getState === 'function' &&
           typeof fsm.can === 'function' &&
           typeof fsm.transition === 'function';
  };

  onMount(() => {
    initializeDockItems();
    setupEventBusIntegration();
    setupFSMIntegration();

    onCleanup(() => {
      cleanupEventBusIntegration();
      cleanupFSMIntegration();
    });
  });
  const handleMouseLeave = () => {
    // Animate back to normal smoothly
    requestAnimationFrame(() => {
      setMagnification({});
      setDynamicGap(12); // Reset to base gap
      setHoveredItem(null);
      setIsAnimating(false);
    });
  };

  const cleanupEventBusIntegration = () => {
    eventBus.offAll('dock');
  };

  const setupEventBusIntegration = () => {
    // Listen to window manager events
    eventBus.on('window:opened', handleWindowOpened, { scope: 'dock' });
    eventBus.on('window:closed', handleWindowClosed, { scope: 'dock' });
    eventBus.on('window:focused', handleWindowFocused, { scope: 'dock' });
    eventBus.on('window:blurred', handleWindowBlurred, { scope: 'dock' });
    eventBus.on('window:minimized', handleWindowMinimized, { scope: 'dock' });
    eventBus.on('window:restored', handleWindowRestored, { scope: 'dock' });

    // Listen to plugin events
    eventBus.on('plugin:loaded', handlePluginLoaded, { scope: 'dock' });
    eventBus.on('plugin:unloaded', handlePluginUnloaded, { scope: 'dock' });
  };

  const setupFSMIntegration = () => {
    // Listen to FSM events for debugging
    eventBus.on('fsm:transition', handleFSMTransition, { scope: 'dock' });
  };

  const getWindowFSM = (pluginId: string) => {
    // Get FSM for window management - observe only, don't control
    return getFSM(`window:${pluginId}`);
  };

  const cleanupFSMIntegration = () => {
    // No cleanup needed for observed FSMs - they are managed by window manager
  };

  // EventBus event handlers - following event naming conventions
  const handleWindowOpened = (event: any) => {
    // Guard against undefined event structure
    if (!event || !event.data) return;

    const { pluginId, windowId } = event.data;
    if (!pluginId) return;

    console.log(`[Dock] Window opened: ${pluginId} (${windowId})`);

    updateDockItemState(pluginId, {
      isRunning: true
    });
    // Don't control FSM - just observe window state changes

    // Emit dock event following domain:action convention
    eventBus.emitSync('dock:item:launched', {
      pluginId,
      windowId,
      timestamp: Date.now()
    });
  };

  const handleWindowClosed = (event: any) => {
    // Guard against undefined event structure
    if (!event || !event.data) return;

    const { pluginId, windowId } = event.data;
    if (!pluginId) return;

    console.log(`[Dock] Window closed: ${pluginId} (${windowId})`);

    updateDockItemState(pluginId, {
      isRunning: false,
      isActive: false
    });
    // Transition FSM separately
    const item = dockItems().find(item => item.id === pluginId);
    if (item?.fsm && typeof item.fsm.transition === 'function' && item.fsm.can('complete')) {
      item.fsm.transition('complete');
    }

    // Emit dock event following domain:action convention
    eventBus.emitSync('dock:item:closed', {
      pluginId,
      windowId,
      timestamp: Date.now()
    });
  };

  const handleWindowFocused = (event: any) => {
    // Guard against undefined event structure
    if (!event || !event.data) return;

    const { pluginId } = event.data;
    if (!pluginId) return;

    console.log(`[Dock] Window focused: ${pluginId}`);

    updateDockItemState(pluginId, {
      isActive: true
    });
    // Don't control FSM - window manager handles focus

    eventBus.emitSync('dock:item:focused', {
      pluginId,
      timestamp: Date.now()
    });
  };

  const handleWindowBlurred = (event: any) => {
    // Guard against undefined event structure
    if (!event || !event.data) return;

    const { pluginId } = event.data;
    if (!pluginId) return;

    console.log(`[Dock] Window blurred: ${pluginId}`);

    updateDockItemState(pluginId, {
      isActive: false
    });
    // Don't control FSM - window manager handles blur

    eventBus.emitSync('dock:item:blurred', {
      pluginId,
      timestamp: Date.now()
    });
  };

  const handlePluginLoaded = (event: any) => {
    // Guard against undefined event structure
    if (!event || !event.data) return;

    const { pluginId } = event.data;
    if (!pluginId) return;

    console.log(`[Dock] Plugin loaded: ${pluginId}`);

    eventBus.emit('dock:plugin-loaded', {
      pluginId,
      timestamp: Date.now()
    });
  };

  const handlePluginUnloaded = (event: any) => {
    // Guard against undefined event structure
    if (!event || !event.data) return;

    const { pluginId } = event.data;
    if (!pluginId) return;

    console.log(`[Dock] Plugin unloaded: ${pluginId}`);

    updateDockItemState(pluginId, {
      isRunning: false,
      isActive: false
    });
    // Don't control FSM - window manager handles this

    eventBus.emit('dock:plugin-unloaded', {
      pluginId,
      timestamp: Date.now()
    });
  };

  const handleWindowMinimized = (event: any) => {
    // Guard against undefined event structure
    if (!event || !event.data) return;

    const { id, pluginId } = event.data;
    if (!pluginId) return;

    console.log(`[Dock] Window minimized: ${pluginId} (${id})`);

    updateDockItemState(pluginId, {
      isActive: false
    });
    // Don't control FSM - window manager handles minimization

    eventBus.emitSync('dock:item:minimized', {
      pluginId,
      windowId: id,
      timestamp: Date.now()
    });
  };

  
  const handleWindowRestored = (event: any) => {
    // Guard against undefined event structure
    if (!event || !event.data) return;

    const { id, pluginId } = event.data;
    if (!pluginId) return;

    console.log(`[Dock] Window restored: ${pluginId} (${id})`);

    updateDockItemState(pluginId, {
      isActive: true
    });
    // Don't control FSM - window manager handles restoration

    eventBus.emitSync('dock:item:restored', {
      pluginId,
      windowId: id,
      timestamp: Date.now()
    });
  };

  const handleFSMTransition = (event: any) => {
    // Guard against undefined event structure
    if (!event || !event.data) return;

    const { fsmId, from, to, event: transitionEvent, timestamp } = event.data;
    if (fsmId && typeof fsmId === 'string' && fsmId.startsWith('dock:item:')) {
      console.log(`[Dock] FSM Transition: ${fsmId} ${from} → ${to} via ${transitionEvent}`);
    }
  };

  const updateDockItemState = (pluginId: string, updates: Partial<DockItem>) => {
    setDockItems(prev => prev.map(item => {
      if (item.id === pluginId) {
        const updatedItem = { ...item, ...updates };

        // Apply FSM transition if provided
        if (updates.fsm && item.fsm) {
          updates.fsm(item.fsm);
        }

        return updatedItem;
      }
      return item;
    }));
  };

  const updateRunningApps = () => {
    const runningPluginIds = new Set();
    const minimizedPluginIds = new Set();
    const activePluginId = windowManager.windows.find(w => w.zIndex === windowManager.getHighestZIndex())?.pluginId;

    // Get all windows and track which plugins are running/minimized
    const windows = windowManager.windows;
    for (const window of windows) {
      if (window.pluginId) {
        runningPluginIds.add(window.pluginId);
        if (window.state === 'minimized') {
          minimizedPluginIds.add(window.pluginId);
        }
      }
    }

    setDockItems(prev => prev.map(item => {
      const updatedItem = {
        ...item,
        isRunning: runningPluginIds.has(item.id),
        isActive: activePluginId === item.id,
        // Refresh FSM reference in case window was created/destroyed
        fsm: getWindowFSM(item.id)
      };

      return updatedItem;
    }));
  };

  const initializeDockItems = () => {
    const items: DockItem[] = availablePlugins.map(plugin => ({
      id: plugin.id,
      name: plugin.displayName,
      icon: plugin.icon,
      isActive: false,
      isRunning: false,
      fsm: getWindowFSM(plugin.id) // Observe window FSM instead of creating dock FSM
    }));

    // Add system items that are actual plugins
    const systemItems: DockItem[] = [];

    // Add file manager as a "finder-like" system app if it exists
    const fileManagerPlugin = availablePlugins.find(p => p.id === '@dineapp/file-manager');
    if (fileManagerPlugin) {
      // Mark file manager as initially running (system app)
      const fileManagerIndex = items.findIndex(item => item.id === '@dineapp/file-manager');
      if (fileManagerIndex >= 0) {
        items[fileManagerIndex].isActive = true;
        items[fileManagerIndex].isRunning = true;
      }
    }

    setDockItems([...systemItems, ...items]);

    // Emit dock initialized event following domain:action convention
    eventBus.emitSync('dock:initialized', {
      itemCount: systemItems.length + items.length,
      timestamp: Date.now(),
      fsmIds: [...systemItems, ...items].map(item => isValidFSM(item.fsm) ? item.fsm.getId() : null).filter(Boolean)
    });
  };

  const handleDockItemClick = async (pluginId: string) => {
    console.log(`Launch app: ${pluginId}`);

    try {
      // Find existing window for this plugin
      const window = windowManager.windows.find(w => w.pluginId === pluginId);

      if (window) {
        // Window exists - handle based on its current state
        if (window.state === 'minimized') {
          // Restore minimized window
          windowManager.restoreWindow(window.id);
        } else {
          // Focus existing window
          windowManager.focusWindow(window.id);
        }
      } else {
        // No window exists - launch the app
        try {
          await props.onAppOpen(pluginId);
          // Update running apps after successful launch
          setTimeout(updateRunningApps, 100);
        } catch (error) {
          console.error(`Failed to launch app ${pluginId}:`, error);
        }
      }

      // Emit dock click event
      eventBus.emitSync('dock:item:clicked', {
        pluginId,
        action: window ? (window.state === 'minimized' ? 'restore' : 'focus') : 'launch',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`[Dock] Unexpected error handling click for ${pluginId}:`, error);
      // Reset dock item to safe state
      updateDockItemState(pluginId, {
        isRunning: false,
        isActive: false
      });
    }
  };

  const handleSystemItemClick = (systemId: string) => {
    console.log(`System item: ${systemId}`);
    // Handle system items like Finder, Trash, etc.
    // For now, we don't have any non-plugin system items
  };

  const handleMouseMove = (event: MouseEvent) => {
    // Throttle updates to prevent performance issues
    if (isAnimating()) return;

    setIsAnimating(true);

    const dock = event.currentTarget as HTMLElement;
    const rect = dock.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    const newMagnification: Record<string, number> = {};
    const items = dock.querySelectorAll(".dock-item");

    // Find the closest item to mouse position
    let closestItem: Element | null = null;
    let minDistance = Infinity;
    let closestIndex = -1;

    items.forEach((item, index) => {
      const itemRect = item.getBoundingClientRect();
      const itemCenterX = itemRect.left + itemRect.width / 2 - rect.left;
      const distance = Math.abs(mouseX - itemCenterX);

      if (distance < minDistance) {
        minDistance = distance;
        closestItem = item;
        closestIndex = index;
      }
    });

    // Apply Gaussian magnification to nearby items (macOS-style)
    const affectedRange = 3; // items on each side of closest (wider range)
    const maxScale = 1.6; // maximum magnification (slightly reduced for comfort)
    const sigma = 80; // Gaussian spread parameter (wider spread)

    items.forEach((item, index) => {
      const distanceFromClosest = Math.abs(index - closestIndex);
      const itemId = (item as HTMLElement).dataset.itemId || item.id;

      if (distanceFromClosest <= affectedRange && closestIndex >= 0) {
        // Calculate Gaussian scaling based on pixel distance from mouse
        const itemRect = item.getBoundingClientRect();
        const itemCenterX = itemRect.left + itemRect.width / 2 - rect.left;
        const pixelDistance = Math.abs(mouseX - itemCenterX);

        // Gaussian bell curve: exp(-x^2 / (2*sigma^2))
        const gaussianScale = Math.exp(-(pixelDistance * pixelDistance) / (2 * sigma * sigma));
        const magnification = 1 + (maxScale - 1) * gaussianScale;

        newMagnification[itemId] = Math.max(1, Math.min(maxScale, magnification));
      } else {
        newMagnification[itemId] = 1;
      }
    });

    // Calculate dynamic spacing based on magnification
    const avgMagnification = Object.values(newMagnification).reduce((sum, scale) => sum + scale, 0) / Object.values(newMagnification).length;
    const newGap = Math.round(12 + (avgMagnification - 1) * 20); // Base 12px + up to 20px extra

    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      setMagnification(newMagnification);
      setDynamicGap(newGap);
      // Reset animation flag after a short delay
      setTimeout(() => setIsAnimating(false), 16); // ~60fps
    });
  };
  const getItemScale = (itemId: string) => {
    return magnification()[itemId] || 1;
  };

  const getItemScaleClass = (itemId: string) => {
    const scale = getItemScale(itemId);
    // Convert scale to CSS class
    const scaleRounded = Math.round(scale * 10) / 10; // Round to 1 decimal place
    return `dock-item-scale-${scaleRounded.toString().replace('.', '-')}`;
  };

  return (
    <div class="dock">
      <div
        class={`dock-background ${dynamicGap() !== 12 ? 'gap-[var(--dock-gap)]' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ '--dock-gap': `${dynamicGap()}px` }}
      >
        <For each={dockItems()}>
          {(item, index) => {
            // Use reactive FSM state following architecture patterns
            const fsmState = isValidFSM(item.fsm) ? item.fsm.getState() : 'idle';
            const possibleEvents = isValidFSM(item.fsm) ? item.fsm.getPossibleEvents() : [];

            // Development diagnostics - show FSM metadata
            const fsmMetadata = isValidFSM(item.fsm) ? item.fsm.getMetadata() : undefined;

            return (
              <div
                class={`dock-item
                  ${item.isActive ? 'active' : ''}
                  ${item.isRunning ? 'running' : ''}
                  ${fsmState === 'launching' ? 'launching' : ''}
                  ${fsmState === 'quitting' ? 'quitting' : ''}
                  ${fsmState === 'active' ? 'fsm-active' : ''}
                  ${fsmState === 'minimized' ? 'minimized' : ''}
                  ${getItemScaleClass(item.id)}
                `}
                  data-item-id={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleDockItemClick(item.id)}
                title={`${item.name} (${fsmState})${isDevMode && isValidFSM(item.fsm) ? ` | FSM: ${item.fsm.getId()}` : ''}`}
                data-fsm-state={fsmState}
                data-fsm-id={isValidFSM(item.fsm) ? item.fsm.getId() : undefined}
                data-plugin-id={item.id}
                data-possible-events={possibleEvents.join(',')}
              >
                <div class="dock-item-icon">
                  {item.icon}
                </div>

                {/* Running indicator with state-based animation */}
                <Show when={item.isRunning}>
                  <div class={`dock-indicator ${fsmState === 'active' ? 'pulse' : ''}`}></div>
                </Show>

                {/* Badge */}
                <Show when={item.badge}>
                  <div class="dock-badge">{item.badge}</div>
                </Show>

                {/* Launching animation overlay */}
                <Show when={fsmState === 'launching'}>
                  <div class="dock-launching-overlay">
                    <div class="dock-launching-spinner"></div>
                  </div>
                </Show>

                {/* Error state indicator */}
                <Show when={fsmState === 'idle' && possibleEvents.includes('error')}>
                  <div class="dock-error-indicator" title="Launch failed">⚠️</div>
                </Show>

                {/* Enhanced tooltip with FSM diagnostics */}
                <Show when={hoveredItem() === item.id}>
                  <div class="dock-tooltip">
                    <div class="dock-tooltip-name">{item.name}</div>
                    <div class="dock-tooltip-state">State: {fsmState}</div>
                    <div class="dock-tooltip-events">
                      Actions: {possibleEvents.length > 0 ? possibleEvents.join(', ') : 'none'}
                    </div>
                    <Show when={isDevMode && fsmMetadata}>
                      <div class="dock-tooltip-debug">
                        FSM: {isValidFSM(item.fsm) ? item.fsm.getId() : 'invalid'}
                      </div>
                    </Show>
                    <Show when={item.isRunning}>
                      <div class="dock-tooltip-status">Running</div>
                    </Show>
                  </div>
                </Show>

                {/* Development mode FSM inspector button */}
                <Show when={isDevMode}>
                  <div
                    class="dock-fsm-inspector"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`[Dock] FSM Inspector for ${item.id}:`, isValidFSM(item.fsm) ? item.fsm.inspect() : 'Invalid FSM');
                      }}
                    title="Inspect FSM (Dev Mode)"
                  >
                    🔍
                  </div>
                </Show>
              </div>
            );
          }}
        </For>

        {/* Development mode dock diagnostics */}
        <Show when={isDevMode}>
          <div class="dock-diagnostics">
            <div class="dock-diagnostic-item">
              FSMs: {dockItems().filter(item => item.fsm).length}/{dockItems().length}
            </div>
            <div
              class="dock-diagnostic-item"
              onClick={() => console.log('[Dock] All FSM States:', dockItems().map(item => ({
                id: item.id,
                state: isValidFSM(item.fsm) ? item.fsm.getState() : 'invalid',
                possible: isValidFSM(item.fsm) ? item.fsm.getPossibleEvents() : []
              })))}
              title="Log all FSM states"
            >
              📊
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Dock;