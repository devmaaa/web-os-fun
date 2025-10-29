import { Component, For, Show } from 'solid-js';
import type { FileItem } from '../../entities/file';
import { navigationModel } from '../../features/navigation';
import './FileList.css';

// Import icons using unplugin-icons (Heroicons for macOS-style)
import IconFolder from '~icons/heroicons-outline/folder';
import IconFileText from '~icons/heroicons-outline/document-text';
import IconFileCode from '~icons/heroicons-outline/code';
import IconFileWarning from '~icons/heroicons-outline/exclamation';
import IconImage from '~icons/heroicons-outline/photograph';
import IconVideo from '~icons/heroicons-outline/film';
import IconMusic from '~icons/heroicons-outline/music-note';
import IconFile from '~icons/heroicons-outline/document';

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
      return <IconFolder class="w-6 h-6 text-blue-500" />;
    }

    const extension = file.extension?.toLowerCase();
    switch (extension) {
      case 'txt':
        return <IconFileText class="w-6 h-6" />;
      case 'json':
        return <IconFileCode class="w-6 h-6" />;
      case 'log':
        return <IconFileWarning class="w-6 h-6" />;
      case 'jpg':
      case 'png':
      case 'gif':
        return <IconImage class="w-6 h-6" />;
      case 'mp4':
      case 'avi':
      case 'mkv':
        return <IconVideo class="w-6 h-6" />;
      case 'mp3':
      case 'wav':
        return <IconMusic class="w-6 h-6" />;
      default:
        return <IconFile class="w-6 h-6" />;
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