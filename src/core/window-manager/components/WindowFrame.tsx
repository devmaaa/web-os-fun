import { Component, JSX } from 'solid-js';
import type { Window } from '../types';
import { cn } from '../../../utils/cn';

interface WindowFrameProps {
  window: Window;
  children: JSX.Element;
}

const WindowFrame: Component<WindowFrameProps> = (props) => {
  return (
    <div
      class={cn(
        // Base window classes
        'window window-wrapper absolute border transition-all duration-200',
        // Theme-aware colors using CSS custom properties
        'shadow-lg backdrop-blur-sm',
        // Focus state with theme-aware ring
        props.window.focused && 'ring-2 shadow-xl',
        // Window states
        props.window.state === 'minimizing' && 'pointer-events-none',
        props.window.isDragging && 'opacity-90 is-dragging',
        props.window.isPreview && 'opacity-70 is-preview',
        props.window.isResizing && 'pointer-events-none is-resizing'
      )}
      style={{
        // Position and sizing
        left: 'var(--x, 0px)',
        top: 'var(--y, 0px)',
        width: 'var(--width, 800px)',
        minWidth: 'var(--min-width, 400px)',
        height: 'var(--height, 600px)',
        // Theme-aware colors using CSS custom properties
        'background-color': 'var(--color-bg-primary)',
        'border-color': 'var(--color-border-primary)',
        'box-shadow': 'var(--shadow-lg)',
        // Ring color for focused state
        '--tw-ring-color': props.window.focused ? 'var(--color-accent)' : 'transparent',
        // Transform for dragging
        transform: props.window.isDragging ? 'translate3d(0, 0, 0)' : 'none',
        'will-change': props.window.isDragging ? 'transform' : 'auto'
      }}
      data-window-id={props.window.id}
      data-x={props.window.x}
      data-y={props.window.y}
      data-width={props.window.width}
      data-height={props.window.height}
      data-min-width={props.window.minWidth}
      data-min-height={props.window.minHeight}
      data-z-index={props.window.zIndex}
      data-resizing={props.window.isResizing ? 'true' : 'false'}
    >
      {/* Resize handles are managed by resizeManager */}

      {props.children}
    </div>
  );
};

export default WindowFrame;