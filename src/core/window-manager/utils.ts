import { ScreenBounds } from './types';

// VisualViewport API for accurate positioning
export function getScreenBounds(): ScreenBounds {
  if (window.visualViewport) {
    return {
      width: window.visualViewport.width,
      height: window.visualViewport.height,
      offsetLeft: window.visualViewport.offsetLeft,
      offsetTop: window.visualViewport.offsetTop,
    };
  }
  return {
    width: window.innerWidth || 1920,
    height: window.innerHeight || 1080,
    offsetLeft: 0,
    offsetTop: 0,
  };
}

export function constrainPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const bounds = getScreenBounds();
  return {
    x: Math.max(bounds.offsetLeft, Math.min(x, bounds.offsetLeft + bounds.width - width)),
    y: Math.max(bounds.offsetTop, Math.min(y, bounds.offsetTop + bounds.height - height)),
  };
}

export function animateWindowMinimize(windowElement: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const animation = windowElement.animate([
      {
        transform: 'scale(1)',
        opacity: 1
      },
      {
        transform: 'scale(0.1)',
        opacity: 0.5,
        offset: 0.7
      },
      {
        transform: 'scale(0) translate(-50%, 50%)',
        opacity: 0
      }
    ], {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards'
    });

    animation.addEventListener('finish', () => resolve());
  });
}

export function findWindowElement(id: string): HTMLElement | null {
  return document.querySelector(`[data-window-id="${id}"]`) as HTMLElement;
}

export function createResizeObserver(callback: (entries: ResizeObserverEntry[]) => void): ResizeObserver {
  return new ResizeObserver(callback);
}

export function requestAnimationFrameThrottled(callback: () => void): void {
  requestAnimationFrame(callback);
}