import { Component, For, Show } from 'solid-js';
import type { FileItem } from '../../entities/file';
import { navigationModel } from '../../features/navigation';
import './FileList.css';

interface FileListProps {
  files: FileItem[];
  viewMode: 'list' | 'grid';
  onFileDoubleClick: (file: FileItem) => void;
  onFileSelect: (file: FileItem, multiSelect: boolean) => void;
}

const FileList: Component<FileListProps> = (props) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '--';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder text-blue-500"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.23A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
      );
    }

    const extension = file.extension?.toLowerCase();
    switch (extension) {
      case 'txt':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>;
      case 'json':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-code"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M9 18l-2-2 2-2"/><path d="m15 14 2 2-2 2"/></svg>;
      case 'log':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-warning"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 10v4"/><path d="M12 18h.01"/></svg>;
      case 'jpg':
      case 'png':
      case 'gif':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
      case 'mp4':
      case 'avi':
      case 'mkv':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-video"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="8" width="14" height="8" rx="2" ry="2"/></svg>;
      case 'mp3':
      case 'wav':
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>;
    }
  };

  const handleItemClick = (file: FileItem, event: MouseEvent) => {
    const multiSelect = event.ctrlKey || event.metaKey;
    props.onFileSelect(file, multiSelect);
  };

  const handleItemDoubleClick = (file: FileItem) => {
    props.onFileDoubleClick(file);
  };

  return (
    <div class="h-full overflow-auto p-4 text-gray-700 dark:text-gray-200">
      <Show when={props.viewMode === 'list'}>
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Size</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Modified</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <For each={props.files}>
              {(file) => (
                <tr
                  class={`hover:bg-gray-100 dark:hover:bg-gray-700/50 ${
                    navigationModel.selectedItems().includes(file.path) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                  }`}
                  onClick={(e) => handleItemClick(file, e)}
                  onDblClick={() => handleItemDoubleClick(file)}
                >
                  <td class="px-6 py-3 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                    <span class="flex-shrink-0 w-6 h-6">{getFileIcon(file)}</span>
                    <span>{file.name}</span>
                  </td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {file.type === 'folder' ? '--' : formatFileSize(file.size)}
                  </td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {file.modified || '--'}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>

      <Show when={props.viewMode === 'grid'}>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <For each={props.files}>
            {(file) => (
              <div
                class={`flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all duration-200 ease-in-out border-2 border-transparent ${
                  navigationModel.selectedItems().includes(file.path)
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
                onClick={(e) => handleItemClick(file, e)}
                onDblClick={() => handleItemDoubleClick(file)}
              >
                <div class="flex-shrink-0 w-12 h-12 mb-2">{getFileIcon(file)}</div>
                <div class="text-xs text-center break-all leading-tight">{file.name}</div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default FileList;