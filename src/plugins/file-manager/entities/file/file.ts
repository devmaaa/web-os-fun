export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  path: string;
  extension?: string;
  permissions?: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
}

export interface FileSystemError {
  code: string;
  message: string;
  path?: string;
}

export interface FileSystemStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
}