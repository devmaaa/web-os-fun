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
        'window-content overflow-auto rounded-b-lg',
        'h-[calc(100%-40px)]' // 40px for title bar
      )}
      style={{
        'background-color': 'var(--color-bg-secondary)',
        'color': 'var(--color-text-primary)'
      }}
    >
      {(() => {
        const PluginComponent = props.window.component || pluginComponents[props.window.pluginId];
        return PluginComponent ? <PluginComponent /> : (
          <div class="flex flex-col items-center justify-center p-4 min-h-[150px] box-border">
            <div class="text-center max-w-full box-border">
              <div class="text-3xl mb-2">📱</div>
              <p class="text-xs break-words mb-1" style={{ color: 'var(--color-text-secondary)' }}>Content for {props.window.title}</p>
              <p class="text-xs break-words mb-1" style={{ color: 'var(--color-text-secondary)' }}>Plugin ID: {props.window.pluginId}</p>
              <p class="text-xs break-words mb-2" style={{ color: 'var(--color-text-secondary)' }}>Window ID: {props.window.id}</p>
              <div class="text-xs space-y-1" style={{ color: 'var(--color-text-tertiary)' }}>
                <p>Size: {props.window.width}×{props.window.height}</p>
                <p>State: {props.window.state}</p>
                <p>FSM State: {windowManager.getFSMState?.(props.window.id) || 'N/A'}</p>
                {props.window.isResizing && <p class="text-green-500 font-bold">🔄 Resizing...</p>}
              </div>

              {/* Interactive content to test resize behavior */}
              <div
                class="mt-3 p-2 border rounded box-border"
                style={{
                  'border-color': 'var(--color-border-primary)',
                  'background-color': 'var(--color-bg-primary)',
                  'max-width': '100%'
                }}
              >
                <p class="text-xs mb-1">🧪 Resize Test Area</p>
                <div class="flex gap-1 justify-center flex-wrap">
                  <button
                    class="px-2 py-1 rounded text-xs transition-colors"
                    style={{
                      'background-color': 'var(--color-accent)',
                      'color': 'var(--color-text-inverse)'
                    }}
                    onClick={() => alert('Button clicked!')}
                  >
                    Test Button
                  </button>
                  <div
                    class="px-2 py-1 rounded text-xs"
                    style={{
                      'background-color': 'var(--color-bg-tertiary)',
                      'color': 'var(--color-text-primary)'
                    }}
                  >
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