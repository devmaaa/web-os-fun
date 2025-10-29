 import { Component } from 'solid-js';
 import { windowManager } from '../index';
 import { cn } from '../../../utils/cn';

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
    <div
      class={cn(
        // macOS-style chrome classes
        'flex items-center justify-between h-7 px-3 select-none cursor-default transition-all duration-200 ease-out',
        'backdrop-blur-[20px] rounded-t-xl',
        'md:h-[30px] md:px-2',
        // Theme-aware background using semantic classes
        'bg-surface',
        // Focus state affects border
        props.isFocused
          ? 'border-b border-border/20'
          : 'border-b border-border/10'
      )}
    >
        {/* macOS-style Traffic light controls */}
        <div class="flex items-center gap-2.5 relative z-20">
          <button
            class="group w-3 h-3 min-w-[12px] min-h-[12px] rounded-full border border-black/10 cursor-pointer flex items-center justify-center transition-all duration-150 ease-out relative shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.2)] bg-macos-red hover:bg-macos-red-hover md:w-2.5 md:h-2.5 md:min-w-[10px] md:min-h-[10px] animate-macos-control-appear"
            onClick={handleClose}
            title="Close"
          >
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold leading-none opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 text-white md:text-[8px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">×</span>
          </button>
          <button
            class="group w-3 h-3 min-w-[12px] min-h-[12px] rounded-full border border-black/10 cursor-pointer flex items-center justify-center transition-all duration-150 ease-out relative shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.2)] bg-macos-yellow hover:bg-macos-yellow-hover md:w-2.5 md:h-2.5 md:min-w-[10px] md:min-h-[10px] animate-[controlAppear_0.3s_ease-out_0.05s]"
            onClick={handleMinimize}
            title="Minimize"
          >
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold leading-none opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 text-white md:text-[8px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">−</span>
          </button>
          <button
            class="group w-3 h-3 min-w-[12px] min-h-[12px] rounded-full border border-black/10 cursor-pointer flex items-center justify-center transition-all duration-150 ease-out relative shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.2)] bg-macos-green hover:bg-macos-green-hover md:w-2.5 md:h-2.5 md:min-w-[10px] md:min-h-[10px] animate-[controlAppear_0.3s_ease-out_0.1s]"
            onClick={handleMaximize}
            title={props.isMaximized ? 'Restore' : 'Maximize'}
          >
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold leading-none opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 text-white md:text-[8px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">{props.isMaximized ? '−' : '+'}</span>
          </button>
        </div>

        {/* Title bar - draggable area */}
        <div
          class={cn(
            "absolute left-1/2 -translate-x-1/2 text-[13px] font-medium text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[400px] md:text-[12px] md:max-w-[300px] pointer-events-none select-none tracking-wide",
            props.isFocused
              ? "text-foreground drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
              : "text-muted-foreground"
          )}
          onDblClick={props.onDoubleClick}
          onMouseDown={props.onMouseDown}
        >
          {props.title}
        </div>

        {/* Right side - can be extended with additional controls */}
        <div class="flex items-center gap-2 min-w-[60px] justify-end">
          {/* Future: Add window actions like fullscreen, etc. */}
        </div>

        {/* Invisible drag overlay covering the entire title bar except traffic lights */}
        <div
          class="absolute inset-0 z-10 cursor-grab"
          onDblClick={props.onDoubleClick}
          onMouseDown={props.onMouseDown}
          style={{
            // Exclude the traffic light controls area from drag overlay (adjusted for smaller buttons)
            'clip-path': 'polygon(60px 0, 100% 0, 100% 100%, 60px 100%)'
          }}
        />
      </div>
  );
};

export default WindowChrome;