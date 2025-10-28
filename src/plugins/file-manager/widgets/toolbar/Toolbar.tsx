import { Component, For, Show } from 'solid-js';
import { navigationModel } from '../../features/navigation';
import { fileOperationsModel } from '../../features/file-operations';
import Breadcrumb from '../breadcrumb';
import './Toolbar.css'; // Keep for custom scrollbar if needed, otherwise remove

interface ToolbarProps {
  currentPath: string;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onRefresh: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
}

const Toolbar: Component<ToolbarProps> = (props) => {
  const handlePathChange = (path: string) => {
    navigationModel.navigateToPath(path);
  };

  return (
    <div class="flex items-center justify-between p-2 bg-gray-100/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700/60 text-gray-700 dark:text-gray-200">
      {/* Left section: Navigation buttons */}
      <div class="flex items-center gap-1">
        <button
          onClick={() => navigationModel.goBack()}
          disabled={navigationModel.pathHistory().length <= 1}
          class="p-1.5 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <button
          onClick={() => console.log('Navigate forward')}
          disabled={true} // Implement forward history if needed
          class="p-1.5 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Forward"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right"><path d="m5 12 7-7 7 7"/><path d="M19 12H5"/></svg>
        </button>
      </div>

      {/* Center section: Breadcrumbs and Search */}
      <div class="flex items-center flex-grow mx-4 gap-4">
        <Breadcrumb path={props.currentPath} onPathChange={handlePathChange} />
        <div class="relative flex-grow">
          <input
            type="text"
            placeholder="Search"
            class="w-full pl-8 pr-2 py-1.5 text-sm bg-gray-200/70 dark:bg-gray-700/70 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
        </div>
      </div>

      {/* Right section: View controls and other actions */}
      <div class="flex items-center gap-1">
        <button
          onClick={props.onRefresh}
          class="p-1.5 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors"
          title="Refresh"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-cw"><path d="M21 12a9 9 0 0 0-9-9c-7.27 0-9 1.8-9 9s1.8 9 9 9c3.63 0 6.7-1.25 9-3"/><path d="M17 22v-5h5"/></svg>
        </button>

        <div class="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          onClick={() => props.onViewModeChange('list')}
          class={`p-1.5 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors ${
            props.viewMode === 'list' ? 'bg-blue-500 text-white' : ''
          }`}
          title="List View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
        </button>
        <button
          onClick={() => props.onViewModeChange('grid')}
          class={`p-1.5 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors ${
            props.viewMode === 'grid' ? 'bg-blue-500 text-white' : ''
          }`}
          title="Grid View"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grid"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </button>

        <div class="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <button
          onClick={props.onNewFolder}
          class="p-1.5 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors"
          title="New Folder"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-plus"><path d="M12 10v6"/><path d="M15 13h-6"/><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.23A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
        </button>
        <button
          onClick={props.onNewFile}
          class="p-1.5 rounded-md hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors"
          title="New File"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-plus"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;