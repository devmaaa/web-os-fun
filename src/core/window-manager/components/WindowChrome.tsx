 import { Component } from 'solid-js';
 import { windowManager } from '../index';

interface WindowChromeProps {
  windowId: string;
  title: string;
  isFocused: boolean;
  isMaximized: boolean;
  onDoubleClick: () => void;
  onMouseDown?: (e: MouseEvent) => void;
}

const WindowChrome: Component<WindowChromeProps> = (props) => {
  // Define keyframes for control animation
  const keyframes = `
    @keyframes controlAppear {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
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
    <>
      <style>{keyframes}</style>
      <div class={`
        flex items-center justify-between h-8 px-3 select-none cursor-default transition-all duration-200 ease-in-out
        backdrop-blur-[20px] border-b
        md:h-7 md:px-2
        ${props.isFocused
          ? 'bg-white/95 border-black/10'
          : 'bg-white/80 border-black/5'
        }
        dark:${props.isFocused
          ? 'bg-gray-900 border-gray-700'
          : 'bg-gray-800 border-gray-600'
        }
      `}>
        {/* Traffic light controls */}
        <div class="flex items-center gap-3 relative z-20">
          <button
            class="w-5 h-5 min-w-5 min-h-5 rounded-full border-none cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out relative animate-[controlAppear_0.3s_ease-out] hover:scale-110 active:scale-95 bg-[#ff5f57] text-transparent hover:bg-[#ff3b30] hover:text-white md:w-4 md:h-4 md:min-w-4 md:min-h-4"
            onClick={handleClose}
            title="Close"
          >
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[16px] font-bold leading-none opacity-0 transition-opacity duration-200 ease-in-out hover:opacity-100 md:text-[14px]">×</span>
          </button>
          <button
            class="w-5 h-5 min-w-5 min-h-5 rounded-full border-none cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out relative animate-[controlAppear_0.3s_ease-out] hover:scale-110 active:scale-95 bg-[#ffbd2e] text-transparent hover:bg-[#ff9500] hover:text-white md:w-4 md:h-4 md:min-w-4 md:min-h-4"
            onClick={handleMinimize}
            title="Minimize"
          >
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[16px] font-bold leading-none opacity-0 transition-opacity duration-200 ease-in-out hover:opacity-100 md:text-[14px]">−</span>
          </button>
          <button
            class={`w-5 h-5 min-w-5 min-h-5 rounded-full border-none cursor-pointer flex items-center justify-center transition-all duration-200 ease-in-out relative animate-[controlAppear_0.3s_ease-out] hover:scale-110 active:scale-95 text-transparent hover:text-white md:w-4 md:h-4 md:min-w-4 md:min-h-4 ${
              props.isMaximized
                ? 'bg-[#28ca42] hover:bg-[#00c84d]'
                : 'bg-[#28ca42] hover:bg-[#00c84d]'
            }`}
            onClick={handleMaximize}
            title={props.isMaximized ? 'Restore' : 'Maximize'}
          >
            <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[16px] font-bold leading-none opacity-0 transition-opacity duration-200 ease-in-out hover:opacity-100 md:text-[14px]">{props.isMaximized ? '⧉' : '□'}</span>
          </button>
        </div>

        {/* Title bar - draggable area */}
        <div
          class="absolute left-1/2 -translate-x-1/2 text-[13px] font-medium text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px] text-black dark:text-white md:text-[12px] md:max-w-[200px]"
          onDblClick={props.onDoubleClick}
          onMouseDown={props.onMouseDown}
          style={{ cursor: 'grab' }}
        >
          {props.title}
        </div>

        {/* Right side - can be extended with additional controls */}
        <div class="flex items-center gap-2 min-w-[60px] justify-end">
          {/* Future: Add window actions like fullscreen, etc. */}
        </div>

        {/* Invisible drag overlay covering the entire title bar except traffic lights */}
        <div
          class="absolute inset-0 z-10"
          onDblClick={props.onDoubleClick}
          onMouseDown={props.onMouseDown}
          style={{
            cursor: 'grab',
            // Exclude the traffic light controls area from drag overlay
            clipPath: 'polygon(80px 0, 100% 0, 100% 100%, 80px 100%)'
          }}
        />
      </div>
    </>
  );
};

export default WindowChrome;