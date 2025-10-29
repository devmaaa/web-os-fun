import { Component, For, Show } from 'solid-js';
import type { FileItem } from '../../entities/file';
import { navigationModel } from '../../features/navigation';

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
      return <IconFolder class="w-6 h-6 text-brand-primary" />;
    }

    const extension = file.extension?.toLowerCase();
    switch (extension) {
      case 'txt':
        return <IconFileText class="w-6 h-6 text-foreground" />;
      case 'json':
        return <IconFileCode class="w-6 h-6 text-success" />;
      case 'log':
        return <IconFileWarning class="w-6 h-6 text-warning" />;
      case 'jpg':
      case 'png':
      case 'gif':
        return <IconImage class="w-6 h-6 text-info" />;
      case 'mp4':
      case 'avi':
      case 'mkv':
        return <IconVideo class="w-6 h-6 text-error" />;
      case 'mp3':
      case 'wav':
        return <IconMusic class="w-6 h-6 text-brand-primary" />;
      default:
        return <IconFile class="w-6 h-6 text-muted-foreground" />;
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
    <div class="h-full overflow-auto p-4 text-foreground">
      <Show when={props.viewMode === 'list'}>
        <table class="min-w-full divide-y divide-border">
          <thead class="bg-surface">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Modified</th>
            </tr>
          </thead>
          <tbody class="bg-background divide-y divide-border">
            <For each={props.files}>
              {(file) => (
                <tr
                  class={`hover:bg-muted/50 ${
                    navigationModel.selectedItems().includes(file.path) ? 'bg-brand-primary/10 border-l-2 border-brand-primary' : ''
                  }`}
                  onClick={(e) => handleItemClick(file, e)}
                  onDblClick={() => handleItemDoubleClick(file)}
                >
                  <td class="px-6 py-3 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                    <span class="flex-shrink-0 w-6 h-6">{getFileIcon(file)}</span>
                    <span>{file.name}</span>
                  </td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {file.type === 'folder' ? '--' : formatFileSize(file.size)}
                  </td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-muted-foreground">
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
                    ? 'bg-brand-primary/10 border-brand-primary'
                    : 'hover:bg-muted/50'
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

export { FileList };