// utils/genie.ts
// Simple Genie (Option A) - performant, visually close to macOS without heavy clip-path math
// Exports:
// - getScreenBounds()
// - constrainPosition(x,y,width,height)
// - animateWindowMinimize(windowElement)
// - animateWindowGenieLamp(windowElement, windowId?)
// - animateWindowGenieReverse(windowElement, windowId?)
// - getTaskbarIconPosition(windowId)
// - findWindowElement(id)
// - createResizeObserver(callback)
// - requestAnimationFrameThrottled(cb)

import type { ScreenBounds } from './types';

/* ----------------------------- Screen helpers ---------------------------- */
export function getScreenBounds(): ScreenBounds {
    if ((window as any).visualViewport) {
        const vv = (window as any).visualViewport;
        return {
            width: vv.width,
            height: vv.height,
            offsetLeft: vv.offsetLeft || 0,
            offsetTop: vv.offsetTop || 0
        };
    }
    return {
        width: window.innerWidth || 1920,
        height: window.innerHeight || 1080,
        offsetLeft: 0,
        offsetTop: 0
    };
}

/**
 * Constrain a window's position so it stays on-screen.
 * This is the original geometry utility your window-service expects.
 */
export function constrainPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
    const bounds = getScreenBounds();
    const minX = bounds.offsetLeft;
    const minY = bounds.offsetTop;
    const maxX = bounds.offsetLeft + bounds.width - width;
    const maxY = bounds.offsetTop + bounds.height - height;
    return {
        x: Math.max(minX, Math.min(x, maxX)),
        y: Math.max(minY, Math.min(y, maxY))
    };
}

/* ----------------------------- Taskbar helpers ---------------------------- */
export function getTaskbarIconPosition(windowId: string): { x: number; y: number } | null {
    const taskbarButton = document.querySelector(`.taskbar button[data-window-id="${windowId}"]`) as HTMLElement | null;
    if (taskbarButton) {
        const rect = taskbarButton.getBoundingClientRect();
        // return icon center (works for dock-like UI)
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    const sb = getScreenBounds();
    // fallback: center bottom above an assumed taskbar height (24px)
    return { x: sb.offsetLeft + sb.width / 2, y: sb.offsetTop + sb.height - 24 };
}

/* ----------------------------- Small utilities --------------------------- */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* ----------------------------- Simple Minimize --------------------------- */
/**
 * Very simple minimize (scale down + fade) — kept for backwards compatibility.
 * Duration short (250ms) — quick feedback. Use `animateWindowGenieLamp` for nicer effect.
 */
export function animateWindowMinimize(windowElement: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
        const animation = windowElement.animate([
            { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
            { transform: 'translate3d(0,8px,0) scale(0.9)', opacity: 0.85, offset: 0.5 },
            { transform: 'translate3d(0,18px,0) scale(0.05)', opacity: 0 },
        ], {
            duration: 250,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
        });
        animation.addEventListener('finish', () => resolve());
        animation.addEventListener('cancel', () => resolve());
    });
}

/* ----------------------------- Genie (Simple) ---------------------------- */
/**
 * Simple "Genie" effect — not full mesh-warp, but uses:
 * - staged scale + translate
 * - subtle clip-path change to hint funneling
 * - final touch: keep rope thicker than 1px by using a small scale/clip at end
 *
 * Behavior (macOS-like R1 approximated):
 *  - 0..40% : bottom visually compresses (clip-path trapezoid)
 *  - 40..75%: scale + translate toward target
 *  - 75..88%: rope touches dock (pause moment)
 *  - 88..100%: snap to dot (scale down + fade)
 */
export function animateWindowGenieLamp(windowElement: HTMLElement, windowId?: string): Promise<void> {
    return new Promise((resolve) => {
        const rect = windowElement.getBoundingClientRect();
        let target = windowId ? getTaskbarIconPosition(windowId) : null;
        if (!target) {
            const sb = getScreenBounds();
            target = { x: sb.offsetLeft + sb.width / 2, y: sb.offsetTop + sb.height - 24 };
        }

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = target.x - centerX;
        const deltaY = target.y - centerY;

        // Small safety clamps (avoid huge trans)
        const safeDeltaX = clamp(deltaX, -2000, 2000);
        const safeDeltaY = clamp(deltaY, -2000, 2000);

        // Prepare element for animation
        windowElement.style.willChange = 'transform, clip-path, opacity';
        windowElement.style.transformOrigin = '50% 0%';
        windowElement.style.pointerEvents = 'none';
        windowElement.style.backfaceVisibility = 'hidden';

        // Duration & easing (macOS-like: slower, smoother)
        const duration = 850;
        const easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        // macOS-like keyframes: gradual funneling, curved motion, proper timing
        const frames: Keyframe[] = [
            // full window (slight pause)
            {
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                transform: `translate3d(0px,0px,0) scale(1)`,
                opacity: '1',
                offset: 0
            },
            // begin subtle funneling (later start for more natural feel)
            {
                clipPath: 'polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)',
                transform: `translate3d(0px,0px,0) scale(0.98)`,
                opacity: '1',
                offset: 0.15
            },
            // deeper compression with slight downward curve
            {
                clipPath: 'polygon(0% 0%, 100% 0%, 75% 100%, 25% 100%)',
                transform: `translate3d(${safeDeltaX * 0.15}px, ${safeDeltaY * 0.2}px,0) scale(0.88)`,
                opacity: '1',
                offset: 0.35
            },
            // rope forming + accelerating toward dock with curve
            {
                clipPath: 'polygon(15% 0%, 85% 0%, 55% 100%, 45% 100%)',
                transform: `translate3d(${safeDeltaX * 0.45}px, ${safeDeltaY * 0.6}px,0) scale(0.55)`,
                opacity: '1',
                offset: 0.65
            },
            // rope at dock - pause moment (thicker rope, slight overshoot then settle)
            {
                clipPath: 'polygon(40% 0%, 60% 0%, 52% 100%, 48% 100%)',
                transform: `translate3d(${safeDeltaX * 1.02}px, ${safeDeltaY * 1.02}px,0) scale(0.25)`,
                opacity: '1',
                offset: 0.82
            },
            // settle and shrink to final dot
            {
                clipPath: 'polygon(45% 0%, 55% 0%, 50% 100%, 50% 100%)',
                transform: `translate3d(${safeDeltaX}px, ${safeDeltaY}px,0) scale(0.05)`,
                opacity: '0',
                offset: 1
            }
        ];

        const animation = windowElement.animate(frames, {
            duration,
            easing,
            fill: 'forwards'
        });

        const cleanup = () => {
            windowElement.style.willChange = 'auto';
            windowElement.style.pointerEvents = '';
            // leave element hidden/managed by caller; clear transforms/clip so DOM is clean
            windowElement.style.clipPath = '';
            windowElement.style.transform = '';
            windowElement.style.opacity = '';
        };

        animation.addEventListener('finish', () => {
            cleanup();
            resolve();
        });
        animation.addEventListener('cancel', () => {
            cleanup();
            resolve();
        });
    });
}

/* --------------------------- Genie Reverse (Simple) ---------------------- */
/**
 * Reverse the simple genie: expand from dot -> rope -> window.
 * Reverse intentionally not a perfect invert (for nicer visual).
 */
export function animateWindowGenieReverse(windowElement: HTMLElement, windowId?: string): Promise<void> {
    return new Promise((resolve) => {
        console.log('[GenieAnimation] Starting reverse genie animation');

        const rect = windowElement.getBoundingClientRect();
        let targetPos = windowId ? getTaskbarIconPosition(windowId) : null;

        if (!targetPos) {
            const screenBounds = getScreenBounds();
            targetPos = { x: screenBounds.offsetLeft + screenBounds.width / 2, y: screenBounds.offsetTop + screenBounds.height - 24 };
        }

        const windowCenterX = rect.left + rect.width / 2;
        const windowCenterY = rect.top + rect.height / 2;
        const deltaX = targetPos.x - windowCenterX;
        const deltaY = targetPos.y - windowCenterY;

        windowElement.style.visibility = 'visible';
        windowElement.style.display = 'block';
        windowElement.style.willChange = 'transform, opacity';
        windowElement.style.transformOrigin = '50% 50%';
        windowElement.style.pointerEvents = 'none';

        // Reverse keyframes - expand from point to vertical line to full window
        const keyframes = [
            { transform: `translate(${deltaX}px, ${deltaY}px) scaleX(0.02) scaleY(0.05)`, opacity: '0', offset: 0 },
            { transform: `translate(${deltaX * 0.8}px, ${deltaY * 0.88}px) scaleX(0.04) scaleY(0.2)`, opacity: '0.5', offset: 0.12 },
            { transform: `translate(${deltaX * 0.55}px, ${deltaY * 0.65}px) scaleX(0.06) scaleY(0.5)`, opacity: '0.85', offset: 0.3 },
            { transform: `translate(${deltaX * 0.25}px, ${deltaY * 0.35}px) scaleX(0.08) scaleY(0.85)`, opacity: '0.95', offset: 0.45 },
            { transform: `translate(0px, 0px) scaleX(0.08) scaleY(1.08)`, opacity: '1', offset: 0.6 },
            { transform: `translate(0px, 0px) scaleX(0.25) scaleY(1.05)`, opacity: '1', offset: 0.72 },
            { transform: `translate(0px, 0px) scaleX(0.6) scaleY(1)`, opacity: '1', offset: 0.85 },
            { transform: `translate(0px, 0px) scaleX(1) scaleY(1)`, opacity: '1', offset: 1 }
        ];

        const animation = windowElement.animate(keyframes, {
            duration: 500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });

        animation.addEventListener('finish', () => {
            console.log('[GenieAnimation] Reverse animation finished');
            windowElement.style.willChange = 'auto';
            windowElement.style.pointerEvents = 'auto';
            windowElement.style.transform = '';
            windowElement.style.opacity = '';
            resolve();
        });

        animation.addEventListener('cancel', () => {
            console.log('[GenieAnimation] Reverse animation cancelled');
            windowElement.style.willChange = 'auto';
            windowElement.style.pointerEvents = 'auto';
            resolve();
        });
    });
}

/* ----------------------------- Small helpers ---------------------------- */
export function findWindowElement(id: string): HTMLElement | null {
    return document.querySelector(`.window[data-window-id="${id}"]`) as HTMLElement | null;
}

export function createResizeObserver(callback: (entries: ResizeObserverEntry[]) => void): ResizeObserver {
    return new ResizeObserver(callback);
}

export function requestAnimationFrameThrottled(callback: () => void): void {
    requestAnimationFrame(callback);
}
