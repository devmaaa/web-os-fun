import type { FileItem, FileSystemError } from '../../entities/file';

export class FileOperationsAPI {
  private static instance: FileOperationsAPI;

  static getInstance(): FileOperationsAPI {
    if (!FileOperationsAPI.instance) {
      FileOperationsAPI.instance = new FileOperationsAPI();
    }
    return FileOperationsAPI.instance;
  }

  async createFolder(parentPath: string, name: string): Promise<FileItem> {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const newFolder: FileItem = {
        name,
        type: 'folder',
        path: `${parentPath}/${name}`,
        modified: new Date().toISOString().split('T')[0],
        permissions: {
          read: true,
          write: true,
          execute: true
        }
      };

      return newFolder;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createFile(parentPath: string, name: string): Promise<FileItem> {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const extension = name.split('.').pop();
      const newFile: FileItem = {
        name,
        type: 'file',
        path: `${parentPath}/${name}`,
        size: 0,
        modified: new Date().toISOString().split('T')[0],
        extension,
        permissions: {
          read: true,
          write: true,
          execute: false
        }
      };

      return newFile;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteItem(path: string): Promise<void> {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      // In real implementation, this would call file system API
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async renameItem(path: string, newName: string): Promise<FileItem> {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 200));

      const parentPath = path.substring(0, path.lastIndexOf('/'));
      const renamedItem: FileItem = {
        name: newName,
        type: path.endsWith('/') ? 'folder' : 'file',
        path: `${parentPath}/${newName}`,
        modified: new Date().toISOString().split('T')[0],
        permissions: {
          read: true,
          write: true,
          execute: path.endsWith('/')
        }
      };

      return renamedItem;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async copyItems(sourcePaths: string[], destinationPath: string): Promise<FileItem[]> {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock copied items
      const copiedItems: FileItem[] = sourcePaths.map(path => {
        const name = path.split('/').pop() || '';
        return {
          name,
          type: 'file', // Simplified for mock
          path: `${destinationPath}/${name}`,
          size: 1024,
          modified: new Date().toISOString().split('T')[0],
          permissions: {
            read: true,
            write: true,
            execute: false
          }
        };
      });

      return copiedItems;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async moveItems(sourcePaths: string[], destinationPath: string): Promise<FileItem[]> {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock moved items
      const movedItems: FileItem[] = sourcePaths.map(path => {
        const name = path.split('/').pop() || '';
        return {
          name,
          type: 'file', // Simplified for mock
          path: `${destinationPath}/${name}`,
          modified: new Date().toISOString().split('T')[0],
          permissions: {
            read: true,
            write: true,
            execute: false
          }
        };
      });

      return movedItems;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): FileSystemError {
    return {
      code: 'FILE_OPERATION_ERROR',
      message: error instanceof Error ? error.message : 'File operation failed',
      path: ''
    };
  }
}