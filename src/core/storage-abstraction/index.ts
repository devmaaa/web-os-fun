import { eventBus } from '../event-bus';

export interface StorageAdapter {
  name: string;
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
  size: () => Promise<number>;
}

export interface StorageEngine {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => Promise<string[]>;
  size: () => Promise<number>;
  getAdapter: () => StorageAdapter;
  setAdapter: (adapter: StorageAdapter) => void;
  sync: () => Promise<void>;
  backup: () => Promise<string>;
  restore: (backup: string) => Promise<void>;
}

// IndexedDB Adapter
class IndexedDBAdapter implements StorageAdapter {
  name = 'indexeddb';
  private dbName = 'dineapp_os';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage');
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async get(key: string): Promise<any> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async set(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<string[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }
}

// LocalStorage Adapter (fallback)
class LocalStorageAdapter implements StorageAdapter {
  name = 'localstorage';

  async get(key: string): Promise<any> {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return localStorage.getItem(key);
    }
  }

  async set(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }

  async keys(): Promise<string[]> {
    return Object.keys(localStorage);
  }

  async size(): Promise<number> {
    return this.keys().then(keys => keys.length);
  }
}

// Memory Adapter (for testing)
class MemoryAdapter implements StorageAdapter {
  name = 'memory';
  private data: Map<string, any> = new Map();

  async get(key: string): Promise<any> {
    return this.data.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async size(): Promise<number> {
    return this.data.size;
  }
}

// Storage Engine Implementation
class StorageEngineImpl implements StorageEngine {
  private adapter: StorageAdapter;
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;

  constructor() {
    // Choose adapter based on browser support
    if (typeof indexedDB !== 'undefined') {
      this.adapter = new IndexedDBAdapter();
    } else if (typeof localStorage !== 'undefined') {
      this.adapter = new LocalStorageAdapter();
    } else {
      this.adapter = new MemoryAdapter();
    }
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.adapter.get(key);
      eventBus.emitSync('storage:get', { key, value });
      return value;
    } catch (error) {
      eventBus.emitSync('storage:error', { operation: 'get', key, error });
      throw error;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      await this.adapter.set(key, value);
      eventBus.emitSync('storage:set', { key, value });
      
      // Queue for sync if needed
      this.queueSync();
    } catch (error) {
      eventBus.emitSync('storage:error', { operation: 'set', key, error });
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.adapter.delete(key);
      eventBus.emitSync('storage:delete', { key });
      this.queueSync();
    } catch (error) {
      eventBus.emitSync('storage:error', { operation: 'delete', key, error });
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.adapter.clear();
      eventBus.emitSync('storage:clear', {});
      this.queueSync();
    } catch (error) {
      eventBus.emitSync('storage:error', { operation: 'clear', error });
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys = await this.adapter.keys();
      eventBus.emitSync('storage:keys', { keys });
      return keys;
    } catch (error) {
      eventBus.emitSync('storage:error', { operation: 'keys', error });
      throw error;
    }
  }

  async size(): Promise<number> {
    try {
      const size = await this.adapter.size();
      eventBus.emitSync('storage:size', { size });
      return size;
    } catch (error) {
      eventBus.emitSync('storage:error', { operation: 'size', error });
      throw error;
    }
  }

  getAdapter(): StorageAdapter {
    return this.adapter;
  }

  async setAdapter(adapter: StorageAdapter): Promise<void> {
    // Migrate data from old adapter to new adapter
    if (this.adapter.name !== adapter.name) {
      const oldKeys = await this.adapter.keys();
      for (const key of oldKeys) {
        const value = await this.adapter.get(key);
        await adapter.set(key, value);
      }
    }
    
    this.adapter = adapter;
    eventBus.emitSync('storage:adapter-changed', { adapter: adapter.name });
  }

  async sync(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    eventBus.emitSync('storage:sync-start', {});

    try {
      const operations = [...this.syncQueue];
      this.syncQueue = [];

      for (const operation of operations) {
        await operation();
      }

      eventBus.emitSync('storage:sync-complete', { operations: operations.length });
    } catch (error) {
      eventBus.emitSync('storage:sync-error', { error });
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  async backup(): Promise<string> {
    const keys = await this.adapter.keys();
    const backup: Record<string, any> = {};
    
    for (const key of keys) {
      backup[key] = await this.adapter.get(key);
    }
    
    const backupString = JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      adapter: this.adapter.name,
      data: backup
    });
    
    eventBus.emitSync('storage:backup-created', { size: backupString.length });
    return backupString;
  }

  async restore(backup: string): Promise<void> {
    try {
      const backupData = JSON.parse(backup);
      
      if (!backupData.data) {
        throw new Error('Invalid backup format');
      }

      await this.clear();
      
      for (const [key, value] of Object.entries(backupData.data)) {
        await this.adapter.set(key, value);
      }
      
      eventBus.emitSync('storage:restore-complete', { 
        keys: Object.keys(backupData.data).length,
        timestamp: backupData.timestamp
      });
    } catch (error) {
      eventBus.emitSync('storage:restore-error', { error });
      throw error;
    }
  }

  private queueSync(): void {
    // In a real implementation, this would queue for server sync
    // For now, we'll just emit a sync event
    setTimeout(() => {
      if (!this.isSyncing) {
        this.sync();
      }
    }, 1000);
  }
}

// Export singleton instance
export const storageEngine: StorageEngine = new StorageEngineImpl();

// Export adapters for testing or advanced usage
export { IndexedDBAdapter, LocalStorageAdapter, MemoryAdapter };

// Utility functions for common patterns
export const createEntityStore = <T>(entityName: string) => ({
  async getAll(): Promise<T[]> {
    const items = await storageEngine.get(`${entityName}_list`) || [];
    return items;
  },
  
  async getById(id: string): Promise<T | null> {
    return await storageEngine.get(`${entityName}_${id}`);
  },
  
  async create(item: T & { id?: string }): Promise<T> {
    const id = (item as any).id || Date.now().toString();
    const itemWithId = { ...item, id };
    
    await storageEngine.set(`${entityName}_${id}`, itemWithId);
    
    const list = await this.getAll();
    list.push(itemWithId);
    await storageEngine.set(`${entityName}_list`, list);
    
    eventBus.emitSync(`${entityName}:created`, { item: itemWithId });
    return itemWithId;
  },
  
  async update(id: string, updates: Partial<T>): Promise<T> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`${entityName} with id ${id} not found`);
    }
    
    const updated = { ...existing, ...updates };
    await storageEngine.set(`${entityName}_${id}`, updated);
    
    const list = await this.getAll();
    const index = list.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      list[index] = updated;
      await storageEngine.set(`${entityName}_list`, list);
    }
    
    eventBus.emitSync(`${entityName}:updated`, { id, item: updated });
    return updated;
  },
  
  async delete(id: string): Promise<void> {
    await storageEngine.delete(`${entityName}_${id}`);
    
    const list = await this.getAll();
    const filtered = list.filter((item: any) => item.id !== id);
    await storageEngine.set(`${entityName}_list`, filtered);
    
    eventBus.emitSync(`${entityName}:deleted`, { id });
  }
});