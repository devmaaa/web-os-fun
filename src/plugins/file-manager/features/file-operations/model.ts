import { createSignal } from 'solid-js';
import type { FileItem, FileSystemError } from '../../entities/file';

export interface FileOperation {
  type: 'copy' | 'move' | 'delete' | 'create' | 'rename';
  source: string;
  destination?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress?: number;
  error?: FileSystemError;
}

export interface FileOperationsState {
  operations: FileOperation[];
  clipboard: {
    items: string[];
    operation: 'copy' | 'cut' | null;
  };
}

const [operations, setOperations] = createSignal<FileOperation[]>([]);
const [clipboard, setClipboard] = createSignal<FileOperationsState['clipboard']>({
  items: [],
  operation: null
});

export const fileOperationsModel = {
  operations,
  setOperations,
  clipboard,
  setClipboard,

  copyToClipboard: (paths: string[]) => {
    setClipboard({ items: paths, operation: 'copy' });
  },

  cutToClipboard: (paths: string[]) => {
    setClipboard({ items: paths, operation: 'cut' });
  },

  clearClipboard: () => {
    setClipboard({ items: [], operation: null });
  },

  addOperation: (operation: Omit<FileOperation, 'status'>) => {
    const newOperation: FileOperation = {
      ...operation,
      status: 'pending'
    };
    setOperations(prev => [...prev, newOperation]);
    return newOperation;
  },

  updateOperation: (id: string, updates: Partial<FileOperation>) => {
    setOperations(prev =>
      prev.map(op =>
        op.source === id ? { ...op, ...updates } : op
      )
    );
  },

  removeOperation: (id: string) => {
    setOperations(prev => prev.filter(op => op.source !== id));
  }
};