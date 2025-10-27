/**
 * Reusable Resize Calculation Hook
 *
 * Provides unified resize calculations for different resize handles.
 * Ensures consistent behavior across all resize directions.
 */

export interface ResizeStartState {
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLeft: number;
  startTop: number;
}

export interface ResizeResult {
  newWidth: number;
  newHeight: number;
  newX: number;
  newY: number;
  changedX: boolean;
  changedY: boolean;
}

export interface ResizeConstraints {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export type ResizeHandle = 'bottom-left' | 'bottom-right' | 'bottom' | 'top-left' | 'top-right' | 'top' | 'left' | 'right';

/**
 * Calculate new window dimensions and position during resize
 *
 * @param handle - The resize handle being dragged
 * @param currentState - Current mouse position and window state
 * @param constraints - Size constraints for the window
 * @returns New dimensions and position
 */
export function calculateResize(
  handle: ResizeHandle,
  currentState: {
    mouseX: number;
    mouseY: number;
    windowState: ResizeStartState;
  },
  constraints: ResizeConstraints = {}
): ResizeResult {
  const { mouseX, mouseY, windowState } = currentState;
  const { startX, startY, startWidth, startHeight, startLeft, startTop } = windowState;
  const { minWidth = 100, minHeight = 100, maxWidth = Infinity, maxHeight = Infinity } = constraints;

  // Calculate mouse delta
  const deltaX = mouseX - startX;
  const deltaY = mouseY - startY;

  let newWidth = startWidth;
  let newHeight = startHeight;
  let newX = startLeft;
  let newY = startTop;
  let changedX = false;
  let changedY = false;

  // Calculate based on handle type
  switch (handle) {
    case 'bottom-right':
      // Expand from bottom-right corner
      newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
      break;

    case 'bottom-left':
      // Expand from bottom-left corner (move left as width increases)
      newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth - deltaX));
      newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));

      // When width changes, move left to keep right edge in place
      if (newWidth !== startWidth) {
        newX = startLeft + (startWidth - newWidth);
        changedX = true;
      }
      break;

    case 'bottom':
      // Resize only height from bottom
      newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
      break;

    case 'top-right':
      // Expand from top-right corner (move up as height increases)
      newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight - deltaY));

      // When height changes, move up to keep bottom edge in place
      if (newHeight !== startHeight) {
        newY = startTop + (startHeight - newHeight);
        changedY = true;
      }
      break;

    case 'top-left':
      // Expand from top-left corner (move up and left as size increases)
      newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth - deltaX));
      newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight - deltaY));

      if (newWidth !== startWidth) {
        newX = startLeft + (startWidth - newWidth);
        changedX = true;
      }
      if (newHeight !== startHeight) {
        newY = startTop + (startHeight - newHeight);
        changedY = true;
      }
      break;

    case 'top':
      // Resize only height from top (move up as height increases)
      newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight - deltaY));

      if (newHeight !== startHeight) {
        newY = startTop + (startHeight - newHeight);
        changedY = true;
      }
      break;

    case 'left':
      // Resize only width from left (move left as width increases)
      newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth - deltaX));

      if (newWidth !== startWidth) {
        newX = startLeft + (startWidth - newWidth);
        changedX = true;
      }
      break;

    case 'right':
      // Resize only width from right
      newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      break;
  }

  return {
    newWidth,
    newHeight,
    newX,
    newY,
    changedX,
    changedY
  };
}

/**
 * Get cursor style for a resize handle
 */
export function getCursorForHandle(handle: ResizeHandle): string {
  const cursorMap: Record<ResizeHandle, string> = {
    'bottom-right': 'nwse-resize',
    'bottom-left': 'nesw-resize',
    'bottom': 'ns-resize',
    'top-right': 'nesw-resize',
    'top-left': 'nwse-resize',
    'top': 'ns-resize',
    'left': 'ew-resize',
    'right': 'ew-resize'
  };

  return cursorMap[handle] || 'default';
}

/**
 * Check if a handle should resize both width and height
 */
export function resizesBothDimensions(handle: ResizeHandle): boolean {
  const cornerHandles: ResizeHandle[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
  return cornerHandles.includes(handle);
}

/**
 * Check if a handle should move the window position during resize
 */
export function movesWindowDuringResize(handle: ResizeHandle): boolean {
  const movingHandles: ResizeHandle[] = ['bottom-left', 'top-left', 'top-right', 'top', 'left'];
  return movingHandles.includes(handle);
}

/**
 * Get the opposite handle (useful for snap-to-edge functionality)
 */
export function getOppositeHandle(handle: ResizeHandle): ResizeHandle | null {
  const opposites: Record<ResizeHandle, ResizeHandle | null> = {
    'bottom-right': 'top-left',
    'bottom-left': 'top-right',
    'bottom': 'top',
    'top-right': 'bottom-left',
    'top-left': 'bottom-right',
    'top': 'bottom',
    'left': 'right',
    'right': 'left'
  };

  return opposites[handle] || null;
}

/**
 * Resize hook for use in resize handlers
 *
 * @param handle - The resize handle type
 * @param initialRect - Initial window rectangle
 * @param constraints - Size constraints
 * @returns Resize calculation function
 */
export function useResizeCalculation(
  handle: ResizeHandle,
  initialRect: { x: number; y: number; width: number; height: number },
  constraints: ResizeConstraints = {}
) {
  const startState: ResizeStartState = {
    startX: 0,
    startY: 0,
    startWidth: initialRect.width,
    startHeight: initialRect.height,
    startLeft: initialRect.x,
    startTop: initialRect.y
  };

  /**
   * Start a resize operation
   * @param mouseX - Starting mouse X position
   * @param mouseY - Starting mouse Y position
   */
  const startResize = (mouseX: number, mouseY: number): void => {
    startState.startX = mouseX;
    startState.startY = mouseY;
  };

  /**
   * Calculate new dimensions during resize
   * @param mouseX - Current mouse X position
   * @param mouseY - Current mouse Y position
   * @returns New dimensions and position
   */
  const calculate = (mouseX: number, mouseY: number): ResizeResult => {
    return calculateResize(handle, {
      mouseX,
      mouseY,
      windowState: startState
    }, constraints);
  };

  return {
    startResize,
    calculate,
    handle,
    cursor: getCursorForHandle(handle),
    resizesBoth: resizesBothDimensions(handle),
    movesWindow: movesWindowDuringResize(handle)
  };
}