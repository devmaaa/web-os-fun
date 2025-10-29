import { Component } from 'solid-js';
import { windowManager } from '../index';
import { pluginComponents } from '../../../plugins';
import type { Window } from '../types';
import { cn } from '../../../utils/cn';

interface WindowContentProps {
  window: Window;
}

const WindowContent: Component<WindowContentProps> = (props) => {
  return (
    <div
      class={cn(
        'window-content overflow-auto scrollbar-thin',
        'h-[calc(100%-28px)] md:h-[calc(100%-30px)]', // macOS title bar height
        'rounded-b-xl backdrop-blur-[20px] border-t border-border',
        'bg-surface text-foreground'
      )}
    >
      {(() => {
        const PluginComponent = props.window.component || pluginComponents[props.window.pluginId];
        return PluginComponent ? <PluginComponent /> : (
            <div class="flex flex-col items-center justify-center p-4 min-h-[150px]">
              <div class="text-center max-w-full">
                <div class="text-3xl mb-2">📱</div>
                <p class="text-xs break-words mb-1 text-muted-foreground">Content for {props.window.title}</p>
                <p class="text-xs break-words mb-1 text-muted-foreground">Plugin ID: {props.window.pluginId}</p>
                <p class="text-xs break-words mb-2 text-muted-foreground">Window ID: {props.window.id}</p>
                <div class="text-xs space-y-1 text-muted">
                  <p>Size: {props.window.width}×{props.window.height}</p>
                  <p>State: {props.window.state}</p>
                  <p>FSM State: {windowManager.getFSMState?.(props.window.id) || 'N/A'}</p>
                  {props.window.isResizing && <p class="text-green-500 font-bold">🔄 Resizing...</p>}
                </div>

               {/* Interactive content to test resize behavior */}
               <div class="mt-3 p-2 border border-border rounded max-w-full bg-background">
                 <p class="text-xs mb-1 text-muted-foreground">🧪 Resize Test Area</p>
                 <div class="flex gap-1 justify-center flex-wrap">
                   <button
                     class="px-2 py-1 rounded text-xs transition-colors bg-accent text-accent-foreground hover:bg-accent/80"
                     onClick={() => alert('Button clicked!')}
                   >
                     Test Button
                   </button>
                   <div class="px-2 py-1 rounded text-xs bg-muted text-foreground">
                     {props.window.width}×{props.window.height}
                   </div>
                 </div>
               </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default WindowContent;