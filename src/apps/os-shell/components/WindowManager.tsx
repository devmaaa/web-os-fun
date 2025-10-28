import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { windowManager } from '@core/window-manager';
import { WindowFrame, WindowChrome, WindowContent } from '@core/window-manager/components';
// Import resize-manager to initialize it
import { resizeManager } from '@core/window-manager/resize-manager';

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