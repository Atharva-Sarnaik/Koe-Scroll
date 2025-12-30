import localforage from 'localforage';
import type { Manga } from '../types/manga';

// Configure storage instances
const metadataStore = localforage.createInstance({
    name: 'KoeScroll',
    storeName: 'metadata'
});

const fileStore = localforage.createInstance({
    name: 'KoeScroll',
    storeName: 'files' // For large PDF blobs
});

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Helper: Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Remove data URL prefix (e.g. "data:application/pdf;base64,")
            resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Helper: Base64 to Blob
const base64ToBlob = (base64: string, type = 'application/pdf'): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
};

export const storageService = {
    // --- Metadata (Library) ---
    async saveLibrary(library: Manga[]): Promise<void> {
        await metadataStore.setItem('user_library', library);
    },

    async loadLibrary(): Promise<Manga[]> {
        const library = await metadataStore.getItem<Manga[]>('user_library');
        return library || [];
    },

    // --- File Storage (PDFs) ---
    async saveFile(id: string, file: Blob): Promise<void> {
        if (Capacitor.isNativePlatform()) {
            try {
                const base64 = await blobToBase64(file);
                await Filesystem.writeFile({
                    path: `manga-${id}.pdf`,
                    data: base64,
                    directory: Directory.Data
                });
            } catch (e) {
                console.error('Native saveFile failed', e);
                // Fallback or throw? Throw to handle upstream
                throw e;
            }
        } else {
            await fileStore.setItem(id, file);
        }
    },

    async getFile(id: string): Promise<Blob | null> {
        if (Capacitor.isNativePlatform()) {
            try {
                const file = await Filesystem.readFile({
                    path: `manga-${id}.pdf`,
                    directory: Directory.Data
                });
                // file.data is a string (base64)
                return base64ToBlob(file.data as string);
            } catch (e) {
                console.warn('Native getFile failed (file might not exist)', e);
                return null;
            }
        } else {
            return await fileStore.getItem<Blob>(id);
        }
    },

    async removeFile(id: string): Promise<void> {
        if (Capacitor.isNativePlatform()) {
            try {
                await Filesystem.deleteFile({
                    path: `manga-${id}.pdf`,
                    directory: Directory.Data
                });
            } catch (e) {
                // Ignore if not found
            }
        } else {
            await fileStore.removeItem(id);
        }
    },

    async hasFile(id: string): Promise<boolean> {
        if (Capacitor.isNativePlatform()) {
            try {
                await Filesystem.stat({
                    path: `manga-${id}.pdf`,
                    directory: Directory.Data
                });
                return true;
            } catch {
                return false;
            }
        } else {
            const keys = await fileStore.keys();
            return keys.includes(id);
        }
    },

    // --- Dictionary (Pronunciation) ---
    async saveDictionary(dictionary: Array<{ id: number; original: string; phonetic: string }>): Promise<void> {
        await metadataStore.setItem('user_dictionary', dictionary);
    },

    async loadDictionary(): Promise<Array<{ id: number; original: string; phonetic: string }>> {
        const dict = await metadataStore.getItem<Array<{ id: number; original: string; phonetic: string }>>('user_dictionary');
        return dict || [
            { id: 1, original: 'Sowaka', phonetic: 'So-wah-ka' },
            { id: 2, original: 'Ryōiki', phonetic: 'Ryo-ee-kee' },
        ];
    }
};
