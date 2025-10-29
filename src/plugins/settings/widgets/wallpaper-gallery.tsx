import { Component, For, createSignal, Show, onMount, onCleanup, batch, createEffect } from 'solid-js';
import { WallpaperAPI } from '@core/themes/wallpaper-manager';
import type { WallpaperSource } from '@core/themes/wallpaper-manager';
import type { WallpaperConfig } from '@core/themes/theme-schema';

interface WallpaperGalleryProps {
    selectedWallpaper?: WallpaperConfig;
    onWallpaperSelect: (wallpaper: WallpaperConfig) => void;
}

console.log('[WallpaperGallery] Module loaded');

const WallpaperGallery: Component<WallpaperGalleryProps> = (props) => {
    const [wallpapers, setWallpapers] = createSignal<WallpaperSource[]>([]);
    const [loading, setLoading] = createSignal(true);
    const [uploadState, setUploadState] = createSignal({ isUploading: false, error: null as string | null });
    const [wallpaperPreviews, setWallpaperPreviews] = createSignal<Map<string, string>>(new Map());

    let cleanupUrls: string[] = [];

    const loadWallpapers = async () => {
        setLoading(true);
        try {
            const availableWallpapers = await WallpaperAPI.getAvailableWallpapers();
            setWallpapers(availableWallpapers);
            await loadWallpaperPreviews(availableWallpapers);
        } catch (error) {
            console.error('[WallpaperGallery] Failed to load wallpapers:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWallpaperPreviews = async (wallpapers: WallpaperSource[]) => {
        const previews = new Map<string, string>();
        const newUrls: string[] = [];
        for (const wallpaper of wallpapers) {
            if (wallpaper.type === 'custom' && wallpaper.blobKey) {
                if (wallpaper.thumbnail) {
                    previews.set(wallpaper.id, wallpaper.thumbnail);
                } else {
                    try {
                        const blobUrl = await WallpaperAPI.getWallpaperBlobURL(wallpaper);
                        if (blobUrl) {
                            previews.set(wallpaper.id, blobUrl);
                            newUrls.push(blobUrl);
                        }
                    } catch (error) {
                        console.error('[WallpaperGallery] Failed to load preview for:', wallpaper.id, error);
                    }
                }
            }
        }
        setWallpaperPreviews(new Map([...wallpaperPreviews(), ...previews]));
        cleanupUrls = [...cleanupUrls, ...newUrls];
    };

    onMount(() => {
        loadWallpapers();
    });

    onCleanup(() => {
        cleanupUrls.forEach(url => URL.revokeObjectURL(url));
    });

    const handleWallpaperSelect = (wallpaper: WallpaperSource) => {
        props.onWallpaperSelect(wallpaper.config);
    };

    const handleRemoveWallpaper = async (wallpaperId: string, e: Event) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to remove this wallpaper?')) return;
        try {
            await WallpaperAPI.removeCustomWallpaper(wallpaperId);
            loadWallpapers();
        } catch (error) {
            console.error('[WallpaperGallery] Failed to remove wallpaper:', error);
        }
    };

    const handleFileChange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
            setUploadState({ isUploading: false, error: 'Invalid file. Must be an image under 10MB.' });
            setTimeout(() => setUploadState({ isUploading: false, error: null }), 3000);
            return;
        }

        setUploadState({ isUploading: true, error: null });
        try {
            const newWallpaper = await WallpaperAPI.addCustomWallpaper(file);
            if (newWallpaper) {
                await loadWallpapers();
            }
        } catch (error) {
            setUploadState({ isUploading: false, error: 'Upload failed.' });
            setTimeout(() => setUploadState({ isUploading: false, error: null }), 3000);
        } finally {
            setUploadState({ isUploading: false, error: null });
        }
    };

    const getWallpaperPreview = (wallpaper: WallpaperSource): string | undefined => {
        if (wallpaper.config.type === 'image') {
            return wallpaperPreviews().get(wallpaper.id) || wallpaper.thumbnail;
        }
        return undefined;
    };

    const isSelected = (wallpaper: WallpaperSource) => {
        if (!props.selectedWallpaper) return false;
        return props.selectedWallpaper.value === wallpaper.config.value;
    };

    const selectedWallpaperSource = () => wallpapers().find(isSelected);

    return (
        <div class="space-y-6">
            <Show when={selectedWallpaperSource()} keyed>
                {source => (
                    <div>
                        <h3 class="text-lg font-semibold mb-2">Current Wallpaper</h3>
                        <div class="rounded-lg overflow-hidden border-2 border-accent aspect-video">
                            <Show when={source.config.type === 'image' && getWallpaperPreview(source)} keyed>
                                {previewUrl => <img src={previewUrl} alt={source.name} class="w-full h-full object-cover" />}
                            </Show>
                            <Show when={source.config.type === 'color' || source.config.type === 'gradient'}>
                                <div class="w-full h-full" style={{ background: source.config.value }} />
                            </Show>
                        </div>
                    </div>
                )}
            </Show>

            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold">Gallery</h3>
                <div class="flex gap-2">
                    <input type="file" accept="image/*" class="hidden" id="wallpaper-upload" onChange={handleFileChange} />
                    <label for="wallpaper-upload" class="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary rounded-md cursor-pointer text-sm font-medium">
                        {uploadState().isUploading ? 'Uploading...' : 'Upload'}
                    </label>
                </div>
            </div>

            <Show when={loading()}>
                <div class="text-center py-8">...</div>
            </Show>

            <div class="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <For each={wallpapers()}>
                    {(wallpaper) => (
                        <div
                            class="relative group rounded-md overflow-hidden border-2 transition-all hover:shadow-md cursor-pointer flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
                            classList={{
                                'border-accent ring-2 ring-accent/50': isSelected(wallpaper),
                                'border-border-primary hover:border-accent': !isSelected(wallpaper),
                            }}
                            onClick={() => handleWallpaperSelect(wallpaper)}
                        >
                            <Show when={getWallpaperPreview(wallpaper)} keyed>
                                {previewUrl => <img src={previewUrl} alt={wallpaper.name} class="w-full h-full object-cover" loading="lazy" />}
                            </Show>
                            <Show when={!getWallpaperPreview(wallpaper)}>
                                <div class="w-full h-full" style={{ background: wallpaper.config.value }} />
                            </Show>
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1 sm:p-2">
                                <p class="text-white text-xs font-medium truncate">{wallpaper.name}</p>
                            </div>
                            {(wallpaper.type === 'custom' || wallpaper.type === 'url') && (
                                <button
                                    class="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => handleRemoveWallpaper(wallpaper.id, e)}
                                >
                                    <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg>
                                </button>
                            )}
                        </div>
                    )}
                </For>
            </div>

            <Show when={props.selectedWallpaper?.type === 'image'}>
                <div class="border-t border-border-primary pt-4">
                    <h4 class="font-medium mb-3">Image Position</h4>
                    <div class="flex flex-wrap gap-2">
                        <For each={['cover', 'center', 'stretch', 'repeat'] as const}>
                            {(position) => (
                                <button
                                    class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    classList={{
                                        'bg-accent text-text-inverse': props.selectedWallpaper?.position === position,
                                        'bg-bg-secondary hover:bg-bg-tertiary': props.selectedWallpaper?.position !== position
                                    }}
                                    onClick={() => props.onWallpaperSelect({ ...props.selectedWallpaper!, position })}
                                >
                                    {position.charAt(0).toUpperCase() + position.slice(1)}
                                </button>
                            )}
                        </For>
                    </div>
                </div>
            </Show>
        </div>
    );
};

export default WallpaperGallery;