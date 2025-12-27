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
        await fileStore.setItem(id, file);
    },

    async getFile(id: string): Promise<Blob | null> {
        return await fileStore.getItem<Blob>(id);
    },

    async removeFile(id: string): Promise<void> {
        await fileStore.removeItem(id);
    },

    async hasFile(id: string): Promise<boolean> {
        const keys = await fileStore.keys();
        return keys.includes(id);
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
