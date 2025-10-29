import { Component, For, Show } from 'solid-js';
import { navigationModel } from '../../features/navigation';
import { fileOperationsModel } from '../../features/file-operations';
import Breadcrumb from '../breadcrumb';

// Import icons using unplugin-icons (Heroicons for macOS-style)
import IconBars3 from '~icons/heroicons-outline/bars-3';
import IconArrowLeft from '~icons/heroicons-outline/arrow-left';
import IconArrowRight from '~icons/heroicons-outline/arrow-right';
import IconMagnifyingGlass from '~icons/heroicons-outline/magnifying-glass';
import IconArrowPath from '~icons/heroicons-outline/arrow-path';
import IconSquares2X2 from '~icons/heroicons-outline/squares-2x2';
import IconFolderPlus from '~icons/heroicons-outline/folder-plus';
import IconDocumentPlus from '~icons/heroicons-outline/document-plus';


interface ToolbarProps {
  currentPath: string;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onRefresh: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  onToggleSidebar: () => void;
}

const Toolbar: Component<ToolbarProps> = (props) => {
  const handlePathChange = (path: string) => {
    navigationModel.navigateToPath(path);
  };

  return (
    <div class="flex items-center justify-between p-2 bg-muted/80 border-b border-border text-foreground">
      {/* Left section: Navigation buttons */}
      <div class="flex items-center gap-1">
        <button
          onClick={props.onToggleSidebar}
          class="p-1.5 rounded-md hover:bg-background/70 md:hidden transition-colors"
          title="Toggle Sidebar"
        >
          <IconBars3 class="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => navigationModel.goBack()}
          disabled={navigationModel.pathHistory().length <= 1}
          class="p-1.5 rounded-md hover:bg-background/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Back"
        >
          <IconArrowLeft class="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => console.log('Navigate forward')}
          disabled={true} // Implement forward history if needed
          class="p-1.5 rounded-md hover:bg-background/70 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Forward"
        >
          <IconArrowRight class="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Center section: Breadcrumbs and Search */}
      <div class="flex items-center flex-grow mx-4 gap-4">
        <Breadcrumb path={props.currentPath} onPathChange={handlePathChange} />
        <div class="relative flex-grow hidden sm:block">
          <input
            type="text"
            placeholder="Search"
            class="w-full pl-8 pr-2 py-1.5 text-sm bg-background/70 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            <IconMagnifyingGlass class="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Right section: View controls and other actions */}
      <div class="flex items-center gap-1">
        <button
          onClick={props.onRefresh}
          class="p-1.5 rounded-md hover:bg-background/70 transition-colors"
          title="Refresh"
        >
          <IconArrowPath class="w-[18px] h-[18px]" />
        </button>

        <div class="h-6 w-px bg-border mx-1 hidden sm:block"></div>

        <div class="hidden sm:flex items-center gap-1">
          <button
            onClick={() => props.onViewModeChange('list')}
            class={`p-1.5 rounded-md hover:bg-background/70 transition-colors ${
              props.viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="List View"
          >
            <IconBars3 class="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={() => props.onViewModeChange('grid')}
            class={`p-1.5 rounded-md hover:bg-background/70 transition-colors ${
              props.viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''
            }`}
            title="Grid View"
          >
            <IconSquares2X2 class="w-[18px] h-[18px]" />
          </button>
        </div>

        <div class="h-6 w-px bg-border mx-1"></div>

        <button
          onClick={props.onNewFolder}
          class="p-1.5 rounded-md hover:bg-background/70 transition-colors"
          title="New Folder"
        >
          <IconFolderPlus class="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={props.onNewFile}
          class="p-1.5 rounded-md hover:bg-background/70 transition-colors hidden sm:block"
          title="New File"
        >
          <IconDocumentPlus class="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
};

export { Toolbar };