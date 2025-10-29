import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { windowManager } from '@core/window-manager';
import { WindowFrame, WindowChrome, WindowContent } from '@core/window-manager/components';
// Import resize-manager to initialize it
import { resizeManager } from '@core/window-manager/resize-manager';

// Function to apply window positioning and sizing using data attributes
const applyWindowStyles = (element: HTMLElement) => {
  const x = element.getAttribute('data-x');
  const y = element.getAttribute('data-y');
  const width = element.getAttribute('data-width');
  const height = element.getAttribute('data-height');
  const minWidth = element.getAttribute('data-min-width');
  const zIndex = element.getAttribute('data-z-index');

  if (x) element.style.setProperty('--x', `${x}px`);
  if (y) element.style.setProperty('--y', `${y}px`);
  if (width) element.style.setProperty('--width', `${width}px`);
  if (height) element.style.setProperty('--height', `${height}px`);
  if (minWidth) element.style.setProperty('--min-width', `${minWidth}px`);
  if (zIndex) element.style.zIndex = parseInt(zIndex);
};

interface WindowManagerProps {}

const WindowManager: Component<WindowManagerProps> = () => {
  // Drag state following spec requirements
  const [dragState, setDragState] = createSignal<{
    windowId: string | null;
    initialMouseX: number;
    initialMouseY: number;
    initialWindowX: number;
    initialWindowY: number;
    rafId: number | null;
  }>({
    windowId: null,
    initialMouseX: 0,
    initialMouseY: 0,
    initialWindowX: 0,
    initialWindowY: 0,
    rafId: null
  });

  // Drag handling following spec requirements
  const handleMouseDown = (e: MouseEvent, windowId: string) => {
    e.preventDefault();
    const window = windowManager.windows.find(w => w.id === windowId);
    if (!window) {
      return;
    }

    const rect = (e.target as HTMLElement).closest('.window')?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setDragState({
      windowId,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      initialWindowX: window.x,
      initialWindowY: window.y,
      rafId: null
    });

    windowManager.startDrag(windowId);
    windowManager.focusWindow(windowId);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const state = dragState();
    if (!state.windowId) return;

    // Throttle using requestAnimationFrame for 60fps performance (spec requirement)
    if (state.rafId) return;

    const rafId = requestAnimationFrame(() => {
      const deltaX = e.clientX - state.initialMouseX;
      const deltaY = e.clientY - state.initialMouseY;
      const newX = state.initialWindowX + deltaX;
      const newY = state.initialWindowY + deltaY;
      windowManager.updateWindowPosition(state.windowId!, newX, newY);

      setDragState(prev => ({ ...prev, rafId: null }));
    });

    setDragState(prev => ({ ...prev, rafId }));
  };

  const handleMouseUp = () => {
    const state = dragState();
    if (state.windowId) {
      windowManager.endDrag(state.windowId);
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
    }
    setDragState({
      windowId: null,
      initialMouseX: 0,
      initialMouseY: 0,
      initialWindowX: 0,
      initialWindowY: 0,
      rafId: null
    });
  };

  // Fix memory leak: store bound references outside mount/cleanup
  let boundHandleMouseMove: (e: MouseEvent) => void;
  let boundHandleMouseUp: (e: MouseEvent) => void;

  // Global event listeners for drag
  onMount(() => {
    // Create bound handlers once
    boundHandleMouseMove = handleMouseMove.bind(windowManager);
    boundHandleMouseUp = handleMouseUp.bind(windowManager);

    document.addEventListener('mousemove', boundHandleMouseMove);
    document.addEventListener('mouseup', boundHandleMouseUp);

    // Apply window styles using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element.classList.contains('window-wrapper')) {
              applyWindowStyles(element);
            }
            // Also check child elements
            const windowElements = element.querySelectorAll('.window-wrapper');
            windowElements.forEach(applyWindowStyles);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-x', 'data-y', 'data-width', 'data-height', 'data-min-width', 'data-z-index']
    });

    // Also apply styles to existing windows and set up an interval for updates
    const updateAllWindows = () => {
      const windows = document.querySelectorAll('.window-wrapper');
      windows.forEach(applyWindowStyles);
    };

    // Initial update
    updateAllWindows();

    // Set up reactive updates for window position/size changes
    const updateInterval = setInterval(updateAllWindows, 16); // ~60fps

    onCleanup(() => {
      observer.disconnect();
      clearInterval(updateInterval);
    });
  });

  onCleanup(() => {
    // Use the same bound references for proper cleanup
    if (boundHandleMouseMove) {
      document.removeEventListener('mousemove', boundHandleMouseMove);
    }
    if (boundHandleMouseUp) {
      document.removeEventListener('mouseup', boundHandleMouseUp);
    }
    const state = dragState();
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
  });

  return (
    <For each={windowManager.windows}>
      {(window) => (
        <Show when={window.state !== 'minimized' && window.state !== 'closing'}>
          <WindowFrame window={window}>
            <WindowChrome
              windowId={window.id}
              title={window.title}
              isFocused={window.focused}
              isMaximized={window.state === 'maximized'}
              onDoubleClick={() => windowManager.toggleMaximizeWindow(window.id)}
              onMouseDown={(e) => handleMouseDown(e, window.id)}
            />
            <WindowContent window={window} />
          </WindowFrame>
        </Show>
      )}
    </For>
  );
};

export { WindowManager };