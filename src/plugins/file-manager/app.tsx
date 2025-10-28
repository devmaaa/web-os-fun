import { Component, createSignal, onMount, createEffect, Show } from 'solid-js';
import { navigationModel } from './features/navigation';
import { NavigationAPI } from './features/navigation';
import { FileOperationsAPI } from './features/file-operations';
import { fileOperationsModel } from './features/file-operations';
import FileList from './widgets/file-list';
import Toolbar from './widgets/toolbar';
import Sidebar from './widgets/sidebar';
import type { FileItem } from './entities/file';
import './FileManager.css';

const FileManager: Component = () => {
  const [files, setFiles] = createSignal<FileItem[]>([]);
  const [viewMode, setViewMode] = createSignal<'list' | 'grid'>('grid');
  const [isLoading, setIsLoading] = createSignal(false);

  const navigationAPI = NavigationAPI.getInstance();
  const fileOpsAPI = FileOperationsAPI.getInstance();

  // Load files when current path changes
  createEffect(async () => {
    const path = navigationModel.currentPath();
    await loadFiles(path);
  });

  const loadFiles = async (path: string) => {
    setIsLoading(true);
    try {
      const fileItems = await navigationAPI.navigateToPath(path);
      setFiles(fileItems);
    } catch (error) {
      console.error('Failed to load files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: FileItem, multiSelect: boolean) => {
    navigationModel.selectItem(file.path, multiSelect);
  };

  const handleFileDoubleClick = async (file: FileItem) => {
    if (file.type === 'folder') {
      navigationModel.navigateToPath(file.path);
    } else {
      // Handle file opening - would integrate with other apps
      console.log('Open file:', file.path);
    }
  };

  const handleRefresh = async () => {
    await loadFiles(navigationModel.currentPath());
  };

  const handleNewFolder = async () => {
    const name = prompt('Enter folder name:');
    if (name) {
      try {
        await fileOpsAPI.createFolder(navigationModel.currentPath(), name);
        await handleRefresh();
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    }
  };

  const handleNewFile = async () => {
    const name = prompt('Enter file name:');
    if (name) {
      try {
        await fileOpsAPI.createFile(navigationModel.currentPath(), name);
        await handleRefresh();
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
  };

  return (
    <div class="file-manager h-full flex bg-white dark:bg-gray-800">
      <Sidebar />
      <main class="flex-1 flex flex-col">
        {/* Toolbar */}
        <Toolbar
          currentPath={navigationModel.currentPath()}
          viewMode={viewMode()}
          onViewModeChange={setViewMode}
          onRefresh={handleRefresh}
          onNewFolder={handleNewFolder}
          onNewFile={handleNewFile}
        />

        {/* File List */}
        <div class="flex-1 overflow-auto">
          <Show when={isLoading()}>
            <div class="flex items-center justify-center h-full">
              <div class="animate-spin text-2xl">⚡</div>
            </div>
          </Show>
          <Show when={!isLoading()}>
            <FileList
              files={files()}
              viewMode={viewMode()}
              onFileSelect={handleFileSelect}
              onFileDoubleClick={handleFileDoubleClick}
            />
          </Show>
        </div>
      </main>
    </div>
  );
};

export default FileManager;