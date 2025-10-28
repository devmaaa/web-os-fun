import type { FileItem, FileSystemError } from '../../entities/file';

export class NavigationAPI {
  private static instance: NavigationAPI;

  static getInstance(): NavigationAPI {
    if (!NavigationAPI.instance) {
      NavigationAPI.instance = new NavigationAPI();
    }
    return NavigationAPI.instance;
  }

  async navigateToPath(path: string): Promise<FileItem[]> {
    try {
      // Mock API call - in real implementation, this would call file system API
      await new Promise(resolve => setTimeout(resolve, 100));

      const mockFiles = this.getMockFiles(path);
      return mockFiles;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getParentPath(path: string): Promise<string> {
    if (path === '/' || path === '') return '/';
    const parts = path.split('/').filter(part => part !== '');
    parts.pop();
    return '/' + parts.join('/');
  }

  private getMockFiles(path: string): FileItem[] {
    // Mock file system data based on path
    const baseFiles: FileItem[] = [
      { name: 'Documents', type: 'folder', modified: '2024-01-15', path: `${path}/Documents` },
      { name: 'Downloads', type: 'folder', modified: '2024-01-14', path: `${path}/Downloads` },
      { name: 'Pictures', type: 'folder', modified: '2024-01-13', path: `${path}/Pictures` },
      { name: 'Music', type: 'folder', modified: '2024-01-12', path: `${path}/Music` },
      { name: 'Videos', type: 'folder', modified: '2024-01-11', path: `${path}/Videos` },
      { name: 'readme.txt', type: 'file', size: 1024, modified: '2024-01-10', path: `${path}/readme.txt`, extension: 'txt' },
      { name: 'config.json', type: 'file', size: 2048, modified: '2024-01-09', path: `${path}/config.json`, extension: 'json' },
      { name: 'app.log', type: 'file', size: 5120, modified: '2024-01-08', path: `${path}/app.log`, extension: 'log' },
    ];

    // Add special items for specific paths
    if (path === '/') {
      baseFiles.unshift(
        { name: 'home', type: 'folder', modified: '2024-01-16', path: '/home' },
        { name: 'usr', type: 'folder', modified: '2024-01-16', path: '/usr' },
        { name: 'etc', type: 'folder', modified: '2024-01-16', path: '/etc' }
      );
    }

    return baseFiles;
  }

  private handleError(error: unknown): FileSystemError {
    return {
      code: 'NAVIGATION_ERROR',
      message: error instanceof Error ? error.message : 'Failed to navigate to path',
      path: ''
    };
  }
}