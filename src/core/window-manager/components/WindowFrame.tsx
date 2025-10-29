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
        'window window-wrapper absolute border transition-all duration-300 ease-out',
        // macOS-style rounded corners and backdrop blur
        'backdrop-blur-[20px] rounded-xl',
        // macOS-style shadows (multi-layer for depth)
        props.window.focused ? 'shadow-macos-focused' : 'shadow-macos-unfocused',
        // Window states
        props.window.state === 'minimizing' && 'pointer-events-none',
        props.window.isDragging && 'opacity-95 is-dragging',
        props.window.isPreview && 'opacity-70 is-preview',
        props.window.isResizing && 'pointer-events-none is-resizing',
        // Theme-aware colors using Tailwind semantic classes
        'border-border bg-surface'
      )}
      style={{
        // Position and sizing (keep as inline for dynamic values)
        left: `${props.window.x}px`,
        top: `${props.window.y}px`,
        width: `${props.window.width}px`,
        'min-width': `${props.window.minWidth}px`,
        height: `${props.window.height}px`,
        'z-index': props.window.zIndex,
        // Transform for dragging with GPU acceleration
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
      data-focused={props.window.focused ? 'true' : 'false'}
    >
      {/* Resize handles are managed by resizeManager */}

      {props.children}
    </div>
  );
};

export default WindowFrame;