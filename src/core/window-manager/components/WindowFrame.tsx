import { Component, JSX } from 'solid-js';
import type { Window } from '../types';

interface WindowFrameProps {
  window: Window;
  children: JSX.Element;
}

const WindowFrame: Component<WindowFrameProps> = (props) => {
  return (
    <div
      class={`window window-wrapper absolute border transition-all duration-200 ${
        props.window.state === 'minimizing' ? 'pointer-events-none' : ''
      } ${props.window.isDragging ? 'opacity-90' : ''} ${props.window.isPreview ? 'opacity-70' : ''} ${
        props.window.isResizing ? 'pointer-events-none' : ''
      }`}
      data-window-id={props.window.id}
      style={{
        left: `${props.window.x}px`,
        top: `${props.window.y}px`,
        width: `${props.window.width}px`,
        'min-width': `${props.window.width}px`,
        height: `${props.window.height}px`,
        'z-index': props.window.zIndex,
        'background-color': 'var(--color-bg-primary)',
        'border-color': 'var(--color-border-primary)',
        '--window-width': `${props.window.width}px`,
        '--window-height': `${props.window.height}px`,
        // GPU acceleration for dragging (spec requirement)
        transform: props.window.isDragging ? `translate3d(0, 0, 0)` : 'none',
        'will-change': props.window.isDragging ? 'transform' : 'auto'
      }}
      data-resizing={props.window.isResizing ? 'true' : 'false'}
    >
      {/* Resize handles are managed by resizeManager */}

      {props.children}
    </div>
  );
};

export default WindowFrame;