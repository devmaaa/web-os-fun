import { Component } from 'solid-js';
import { windowManager } from '../index';
import { pluginComponents } from '../../../plugins';
import type { Window } from '../types';

interface WindowContentProps {
  window: Window;
}

const WindowContent: Component<WindowContentProps> = (props) => {
  return (
    <div
      class="window-content overflow-auto bg-bg-secondary text-text-primary rounded-b-lg"
      style={{
        height: `calc(${props.window.height}px - 40px)`, // 40px for title bar
      }}
    >
      {(() => {
        const PluginComponent = props.window.component || pluginComponents[props.window.pluginId];
        return PluginComponent ? <PluginComponent /> : (
          <div class="flex flex-col items-center justify-center p-4 min-h-[150px] box-border">
            <div class="text-center max-w-full box-border">
              <div class="text-3xl mb-2">📱</div>
              <p class="text-xs break-words mb-1" style={{ color: 'var(--text-secondary)' }}>Content for {props.window.title}</p>
              <p class="text-xs break-words mb-1" style={{ color: 'var(--text-secondary)' }}>Plugin ID: {props.window.pluginId}</p>
              <p class="text-xs break-words mb-2" style={{ color: 'var(--text-secondary)' }}>Window ID: {props.window.id}</p>
              <div class="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                <p>Size: {props.window.width}×{props.window.height}</p>
                <p>State: {props.window.state}</p>
                <p>FSM State: {windowManager.getFSMState?.(props.window.id) || 'N/A'}</p>
                {props.window.isResizing && <p class="text-green-500 font-bold">🔄 Resizing...</p>}
              </div>

              {/* Interactive content to test resize behavior */}
              <div class="mt-3 p-2 border rounded box-border" style={{
                'border-color': 'var(--color-border-primary)',
                'background-color': 'var(--color-bg-primary)',
                'max-width': '100%'
              }}>
                <p class="text-xs mb-1">🧪 Resize Test Area</p>
                <div class="flex gap-1 justify-center flex-wrap">
                  <button
                    class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                    onClick={() => alert('Button clicked!')}
                  >
                    Test Button
                  </button>
                  <div class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
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