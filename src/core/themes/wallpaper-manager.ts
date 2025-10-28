import { eventBus } from '@core/event-bus';
import { storageEngine } from '@core/storage-abstraction';
import type { WallpaperConfig } from './theme-schema';

/**
 * Wallpaper Manager - Handles desktop wallpaper functionality
 */

export interface WallpaperSource {
    id: string;
    name: string;
    type: 'built-in' | 'custom' | 'url';
    config: WallpaperConfig;
    thumbnail?: string;
    fileSize?: number;
    dimensions?: { width: number; height: number };
    tags?: string[];
    blobKey?: string;
    isValid?: boolean;
}

export interface WallpaperCache {
    url: string;
    blob: Blob;
    lastAccessed: number;
    expiresAt: number;
}

const STORAGE_KEYS = {
    CUSTOM_WALLPAPERS: 'dineapp-custom-wallpapers',
    WALLPAPER_CACHE: 'dineapp-wallpaper-cache'
} as const;

const CONSTANTS = {
    MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
    CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    THUMBNAIL_SIZE: 400, // Increased from 200 for better quality
    THUMBNAIL_QUALITY: 0.85 // Increased from 0.8
} as const;

class WallpaperManager {
    private cache: Map<string, WallpaperCache> = new Map();
    private blobUrlCache: Map<string, string> = new Map();

    constructor() {
        this.loadCacheFromStorage();
        this.setupEventListeners();
        this.startCacheCleanup();
    }

    /**
     * Get all available wallpapers (built-in + custom)
     */
    async getAvailableWallpapers(): Promise<WallpaperSource[]> {
        const builtIn = this.getBuiltInWallpapers();
        const custom = await this.getCustomWallpapers();

        console.log('[WallpaperManager] Total wallpapers:', builtIn.length + custom.length,
            '(built-in:', builtIn.length, 'custom:', custom.length, ')');

        return [...builtIn, ...custom];
    }

    /**
     * Get built-in wallpapers
     */
    private getBuiltInWallpapers(): WallpaperSource[] {
        return [
            {
                id: 'gradient-ocean',
                name: 'Ocean Blue',
                type: 'built-in',
                config: {
                    type: 'gradient',
                    value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'cover'
                },
                tags: ['gradient', 'blue', 'abstract']
            },
            {
                id: 'gradient-sunset',
                name: 'Sunset',
                type: 'built-in',
                config: {
                    type: 'gradient',
                    value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    position: 'cover'
                },
                tags: ['gradient', 'warm', 'sunset']
            },
            {
                id: 'gradient-forest',
                name: 'Forest',
                type: 'built-in',
                config: {
                    type: 'gradient',
                    value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
                    position: 'cover'
                },
                tags: ['gradient', 'green', 'nature']
            },
            {
                id: 'solid-dark',
                name: 'Dark',
                type: 'built-in',
                config: {
                    type: 'color',
                    value: '#1a1a1a'
                },
                tags: ['solid', 'dark', 'minimal']
            },
            {
                id: 'solid-light',
                name: 'Light Gray',
                type: 'built-in',
                config: {
                    type: 'color',
                    value: '#f5f5f5'
                },
                tags: ['solid', 'light', 'minimal']
            }
        ];
    }

    /**
     * Get custom wallpapers from storage
     */
    private async getCustomWallpapers(): Promise<WallpaperSource[]> {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_WALLPAPERS);
            if (!stored) {
                console.log('[WallpaperManager] No custom wallpapers found');
                return [];
            }

            const wallpapers = JSON.parse(stored) as WallpaperSource[];
            console.log('[WallpaperManager] Loaded', wallpapers.length, 'custom wallpapers from storage');

            // Validate wallpapers
            const validWallpapers: WallpaperSource[] = [];
            for (const wallpaper of wallpapers) {
                if (wallpaper.type === 'custom' && wallpaper.blobKey) {
                    const isValid = await this.validateWallpaper(wallpaper);
                    validWallpapers.push({ ...wallpaper, isValid });
                } else {
                    validWallpapers.push(wallpaper);
                }
            }

            return validWallpapers;
        } catch (error) {
            console.error('[WallpaperManager] Failed to load custom wallpapers:', error);
            return [];
        }
    }

    /**
     * Add custom wallpaper from file
     */
    async addCustomWallpaper(file: File): Promise<WallpaperSource | null> {
        try {
            console.log('[WallpaperManager] Starting addCustomWallpaper:', {
                name: file.name,
                type: file.type,
                size: file.size
            });

            // Validate file type
            if (!this.isValidImageFile(file)) {
                throw new Error('Invalid image file type');
            }

            // Generate unique blob key
            const blobKey = `wallpaper-blob-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            console.log('[WallpaperManager] Generated blob key:', blobKey);

            // Store the blob in IndexedDB
            console.log('[WallpaperManager] Storing blob in IndexedDB...');
            await storageEngine.set(blobKey, file);
            console.log('[WallpaperManager] Blob stored successfully');

            // Generate thumbnail and get dimensions
            console.log('[WallpaperManager] Generating thumbnail...');
            const thumbnail = await this.generateThumbnail(file);
            console.log('[WallpaperManager] Thumbnail generated:', thumbnail ? 'success' : 'failed');

            console.log('[WallpaperManager] Getting image dimensions...');
            const dimensions = await this.getImageDimensions(file);
            console.log('[WallpaperManager] Dimensions:', dimensions);

            const wallpaper: WallpaperSource = {
                id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                type: 'custom',
                config: {
                    type: 'image',
                    value: blobKey,
                    position: 'cover'
                },
                thumbnail,
                fileSize: file.size,
                dimensions,
                tags: ['custom', 'user-added'],
                blobKey,
                isValid: true
            };

            console.log('[WallpaperManager] Created wallpaper object:', {
                id: wallpaper.id,
                name: wallpaper.name,
                hasThumbnail: !!wallpaper.thumbnail,
                dimensions: wallpaper.dimensions
            });

            // Save wallpaper metadata to storage
            await this.saveCustomWallpaper(wallpaper);
            console.log('[WallpaperManager] Wallpaper saved to storage');

            eventBus.emit('wallpaper:added', {
                wallpaper,
                timestamp: Date.now()
            });

            return wallpaper;
        } catch (error) {
            console.error('[WallpaperManager] Failed to add custom wallpaper:', error);
            return null;
        }
    }

    /**
     * Add wallpaper from URL
     */
    async addWallpaperFromURL(url: string, name?: string): Promise<WallpaperSource | null> {
        try {
            console.log('[WallpaperManager] Adding wallpaper from URL:', url);

            // Validate URL
            if (!this.isValidImageURL(url)) {
                throw new Error('Invalid image URL');
            }

            // Download and cache the image
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }

            const blob = await response.blob();
            const file = new File([blob], name || 'wallpaper', { type: blob.type });

            // Generate unique blob key
            const blobKey = `wallpaper-blob-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Store the blob
            await storageEngine.set(blobKey, file);

            const wallpaper: WallpaperSource = {
                id: `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: name || 'Web Wallpaper',
                type: 'url',
                config: {
                    type: 'image',
                    value: blobKey,
                    position: 'cover'
                },
                thumbnail: await this.generateThumbnail(file),
                fileSize: file.size,
                dimensions: await this.getImageDimensions(file),
                tags: ['web', 'downloaded'],
                blobKey,
                isValid: true
            };

            // Save wallpaper
            await this.saveCustomWallpaper(wallpaper);

            // Cache the image
            await this.cacheImage(url, file);

            eventBus.emit('wallpaper:added', {
                wallpaper,
                timestamp: Date.now()
            });

            return wallpaper;
        } catch (error) {
            console.error('[WallpaperManager] Failed to add wallpaper from URL:', error);
            return null;
        }
    }

    /**
     * Get blob URL for a wallpaper (creates on-demand with caching)
     */
    async getWallpaperBlobURL(wallpaper: WallpaperSource): Promise<string | null> {
        try {
            if (wallpaper.type === 'built-in') {
                return null;
            }

            if (!wallpaper.blobKey) {
                console.warn('[WallpaperManager] No blob key for wallpaper:', wallpaper.id);
                return null;
            }

            // Check cache first
            const cachedUrl = this.blobUrlCache.get(wallpaper.blobKey);
            if (cachedUrl) {
                console.log('[WallpaperManager] Using cached blob URL for:', wallpaper.blobKey);
                return cachedUrl;
            }

            console.log('[WallpaperManager] Creating new blob URL for:', wallpaper.blobKey);
            const blob = await storageEngine.get(wallpaper.blobKey) as Blob;

            if (!blob) {
                console.error('[WallpaperManager] Blob not found for key:', wallpaper.blobKey);
                return null;
            }

            if (!(blob instanceof Blob)) {
                console.error('[WallpaperManager] Retrieved data is not a Blob:', typeof blob);
                return null;
            }

            const blobUrl = URL.createObjectURL(blob);
            this.blobUrlCache.set(wallpaper.blobKey, blobUrl);
            console.log('[WallpaperManager] Created blob URL:', blobUrl);

            return blobUrl;
        } catch (error) {
            console.error('[WallpaperManager] Failed to get blob URL:', error);
            return null;
        }
    }

    /**
     * Validate wallpaper accessibility
     */
    async validateWallpaper(wallpaper: WallpaperSource): Promise<boolean> {
        try {
            if (wallpaper.type === 'built-in') {
                return true;
            }

            if (wallpaper.blobKey) {
                const blob = await storageEngine.get(wallpaper.blobKey);
                return blob instanceof Blob && blob.size > 0;
            }

            return false;
        } catch (error) {
            console.error('[WallpaperManager] Failed to validate wallpaper:', error);
            return false;
        }
    }

    /**
     * Remove custom wallpaper
     */
    async removeCustomWallpaper(wallpaperId: string): Promise<boolean> {
        try {
            console.log('[WallpaperManager] Removing wallpaper:', wallpaperId);

            const wallpapers = await this.getCustomWallpapers();
            const wallpaper = wallpapers.find(w => w.id === wallpaperId);

            if (wallpaper?.blobKey) {
                // Revoke blob URL if cached
                const cachedUrl = this.blobUrlCache.get(wallpaper.blobKey);
                if (cachedUrl) {
                    URL.revokeObjectURL(cachedUrl);
                    this.blobUrlCache.delete(wallpaper.blobKey);
                }

                // Remove blob from IndexedDB
                await storageEngine.delete(wallpaper.blobKey);
            }

            const filtered = wallpapers.filter(w => w.id !== wallpaperId);

            // Update storage
            localStorage.setItem(STORAGE_KEYS.CUSTOM_WALLPAPERS, JSON.stringify(filtered));

            // Remove from cache
            this.cache.delete(wallpaperId);

            eventBus.emit('wallpaper:removed', {
                wallpaperId,
                timestamp: Date.now()
            });

            console.log('[WallpaperManager] Wallpaper removed successfully');
            return true;
        } catch (error) {
            console.error('[WallpaperManager] Failed to remove wallpaper:', error);
            return false;
        }
    }

    /**
     * Apply wallpaper configuration
     */
    applyWallpaper(config: WallpaperConfig): void {
        eventBus.emit('wallpaper:apply', {
            config,
            timestamp: Date.now()
        });
    }

    /**
     * Cache image for offline use
     */
    private async cacheImage(url: string, file: File): Promise<void> {
        try {
            const cacheItem: WallpaperCache = {
                url,
                blob: file,
                lastAccessed: Date.now(),
                expiresAt: Date.now() + CONSTANTS.CACHE_EXPIRY
            };

            await this.ensureCacheSize();

            this.cache.set(url, cacheItem);
            this.saveCacheToStorage();

            console.log('[WallpaperManager] Cached image:', url);
        } catch (error) {
            console.error('[WallpaperManager] Failed to cache image:', error);
        }
    }

    /**
     * Get cached image
     */
    async getCachedImage(url: string): Promise<Blob | null> {
        const cached = this.cache.get(url);

        if (cached && cached.expiresAt > Date.now()) {
            cached.lastAccessed = Date.now();
            return cached.blob;
        }

        if (cached) {
            this.cache.delete(url);
            this.saveCacheToStorage();
        }

        return null;
    }

    /**
     * Ensure cache size doesn't exceed limit
     */
    private async ensureCacheSize(): Promise<void> {
        let totalSize = 0;
        const entries = Array.from(this.cache.entries());

        for (const [_, cache] of entries) {
            totalSize += cache.blob.size;
        }

        if (totalSize > CONSTANTS.MAX_CACHE_SIZE) {
            entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

            for (const [url, cache] of entries) {
                if (totalSize <= CONSTANTS.MAX_CACHE_SIZE * 0.8) break;
                this.cache.delete(url);
                totalSize -= cache.blob.size;
            }

            this.saveCacheToStorage();
        }
    }

    /**
     * Start periodic cache cleanup
     */
    private startCacheCleanup(): void {
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60 * 60 * 1000); // Run every hour
    }

    /**
     * Clean up expired cache entries
     */
    private cleanupExpiredCache(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [url, cache] of this.cache.entries()) {
            if (cache.expiresAt <= now) {
                this.cache.delete(url);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.saveCacheToStorage();
            console.log('[WallpaperManager] Cleaned up', cleaned, 'expired cache entries');
        }
    }

    /**
     * Save cache to localStorage
     */
    private saveCacheToStorage(): void {
        try {
            const cacheData: Record<string, Omit<WallpaperCache, 'blob'>> = {};

            for (const [url, cache] of this.cache.entries()) {
                cacheData[url] = {
                    url: cache.url,
                    lastAccessed: cache.lastAccessed,
                    expiresAt: cache.expiresAt
                };
            }

            localStorage.setItem(STORAGE_KEYS.WALLPAPER_CACHE, JSON.stringify(cacheData));
        } catch (error) {
            console.error('[WallpaperManager] Failed to save cache to storage:', error);
        }
    }

    /**
     * Load cache from localStorage
     */
    private loadCacheFromStorage(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.WALLPAPER_CACHE);
            if (!stored) return;

            const cacheData = JSON.parse(stored) as Record<string, Omit<WallpaperCache, 'blob'>>;

            for (const [url, data] of Object.entries(cacheData)) {
                if (data.expiresAt > Date.now()) {
                    this.cache.set(url, {
                        ...data,
                        blob: new Blob()
                    });
                }
            }
        } catch (error) {
            console.error('[WallpaperManager] Failed to load cache from storage:', error);
        }
    }

    /**
     * Save custom wallpaper to storage
     */
    private async saveCustomWallpaper(wallpaper: WallpaperSource): Promise<void> {
        try {
            const existing = await this.getCustomWallpapers();
            const filtered = existing.filter(w => w.id !== wallpaper.id);
            filtered.push(wallpaper);

            localStorage.setItem(STORAGE_KEYS.CUSTOM_WALLPAPERS, JSON.stringify(filtered));
            console.log('[WallpaperManager] Saved custom wallpaper to storage');
        } catch (error) {
            console.error('[WallpaperManager] Failed to save custom wallpaper:', error);
            throw error;
        }
    }

    /**
     * Generate thumbnail for image with better quality
     */
    private async generateThumbnail(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    const maxSize = CONSTANTS.THUMBNAIL_SIZE;
                    let width = img.width;
                    let height = img.height;

                    // Calculate aspect ratio
                    const aspectRatio = width / height;

                    if (width > height) {
                        if (width > maxSize) {
                            width = maxSize;
                            height = maxSize / aspectRatio;
                        }
                    } else {
                        if (height > maxSize) {
                            height = maxSize;
                            width = maxSize * aspectRatio;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Use better image smoothing
                    if (ctx) {
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                    }

                    const thumbnail = canvas.toDataURL('image/jpeg', CONSTANTS.THUMBNAIL_QUALITY);
                    console.log('[WallpaperManager] Generated thumbnail, size:', thumbnail.length, 'bytes');
                    resolve(thumbnail);
                } catch (error) {
                    console.error('[WallpaperManager] Error generating thumbnail:', error);
                    reject(error);
                } finally {
                    URL.revokeObjectURL(img.src);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(new Error('Failed to load image'));
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Get image dimensions
     */
    private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                resolve({ width: img.width, height: img.height });
                URL.revokeObjectURL(img.src);
            };

            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(new Error('Failed to load image'));
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Validate image file
     */
    private isValidImageFile(file: File): boolean {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const isValidType = validTypes.includes(file.type);
        const isValidSize = file.size <= CONSTANTS.MAX_FILE_SIZE;

        if (!isValidType) {
            console.error('[WallpaperManager] Invalid file type:', file.type);
        }
        if (!isValidSize) {
            console.error('[WallpaperManager] File too large:', file.size, 'bytes');
        }

        return isValidType && isValidSize;
    }

    /**
     * Validate image URL
     */
    private isValidImageURL(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            return validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
        } catch {
            return false;
        }
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        eventBus.on('wallpaper:apply', (event) => {
            console.log('[WallpaperManager] Applying wallpaper:', event.config.type);
        }, { scope: 'wallpaper-manager' });

        eventBus.on('wallpaper:added', (event) => {
            console.log('[WallpaperManager] Wallpaper added:', event.wallpaper.name);
        }, { scope: 'wallpaper-manager' });

        eventBus.on('wallpaper:removed', (event) => {
            console.log('[WallpaperManager] Wallpaper removed:', event.wallpaperId);
        }, { scope: 'wallpaper-manager' });
    }

    /**
     * Cleanup wallpaper manager
     */
    cleanup(): void {
        for (const blobUrl of this.blobUrlCache.values()) {
            URL.revokeObjectURL(blobUrl);
        }
        this.blobUrlCache.clear();
        this.cache.clear();
        eventBus.offAll('wallpaper-manager');
        console.log('[WallpaperManager] Cleaned up');
    }
}

// Singleton instance
export const wallpaperManager = new WallpaperManager();

// Export convenience functions
export const WallpaperAPI = {
    getAvailableWallpapers: () => wallpaperManager.getAvailableWallpapers(),
    addCustomWallpaper: (file: File) => wallpaperManager.addCustomWallpaper(file),
    addWallpaperFromURL: (url: string, name?: string) => wallpaperManager.addWallpaperFromURL(url, name),
    removeCustomWallpaper: (wallpaperId: string) => wallpaperManager.removeCustomWallpaper(wallpaperId),
    applyWallpaper: (config: WallpaperConfig) => wallpaperManager.applyWallpaper(config),
    getCachedImage: (url: string) => wallpaperManager.getCachedImage(url),
    getWallpaperBlobURL: (wallpaper: WallpaperSource) => wallpaperManager.getWallpaperBlobURL(wallpaper),
    validateWallpaper: (wallpaper: WallpaperSource) => wallpaperManager.validateWallpaper(wallpaper)
};