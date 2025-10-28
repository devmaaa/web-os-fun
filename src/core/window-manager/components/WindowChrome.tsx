import { Component } from 'solid-js';
import { windowManager } from '../index';
import './WindowChrome.css';

interface WindowChromeProps {
  windowId: string;
  title: string;
  isFocused: boolean;
  isMaximized: boolean;
  onDoubleClick: () => void;
  onMouseDown?: (e: MouseEvent) => void;
}

const WindowChrome: Component<WindowChromeProps> = (props) => {
  const handleClose = () => {
    windowManager.closeWindow(props.windowId);
  };

  const handleMinimize = () => {
    windowManager.minimizeWindow(props.windowId);
  };

  const handleMaximize = () => {
    if (props.isMaximized) {
      windowManager.restoreWindow(props.windowId);
    } else {
      windowManager.maximizeWindow(props.windowId);
    }
  };

  return (
    <div class={`window-chrome ${props.isFocused ? 'focused' : ''}`}>
      {/* Traffic light controls */}
      <div class="window-controls">
        <button
          class="window-control close"
          onClick={handleClose}
          title="Close"
        >
          <span class="control-icon">×</span>
        </button>
        <button
          class="window-control minimize"
          onClick={handleMinimize}
          title="Minimize"
        >
          <span class="control-icon">−</span>
        </button>
        <button
          class={`window-control maximize ${props.isMaximized ? 'maximized' : ''}`}
          onClick={handleMaximize}
          title={props.isMaximized ? 'Restore' : 'Maximize'}
        >
          <span class="control-icon">{props.isMaximized ? '⧉' : '□'}</span>
        </button>
      </div>

      {/* Title bar */}
      <div
        class="window-title"
        onDblClick={props.onDoubleClick}
        onMouseDown={props.onMouseDown}
        style={{ cursor: 'grab' }}
      >
        {props.title}
      </div>

      {/* Right side - can be extended with additional controls */}
      <div class="window-actions">
        {/* Future: Add window actions like fullscreen, etc. */}
      </div>
    </div>
  );
};

export default WindowChrome;