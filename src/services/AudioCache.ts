import localforage from 'localforage';

// Configure localforage instance for audio
const audioStorage = localforage.createInstance({
    name: 'KoeScroll',
    storeName: 'audio_cache',
    description: 'Cache for generated generated audio files'
});

export const AudioCache = {
    /**
     * Generates a unique key for the audio segment.
     */
    generateKey(text: string, voiceId: string, stability: number, style: number): string {
        // Simple hash-like string. For production, a real hash (SHA-256) is better, 
        // but for MVP this is sufficient uniqueness.
        // Normalize text to prevent cache misses on whitespace differences
        const cleanText = text.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return `audio_v1_${voiceId}_${stability}_${style}_${cleanText}`;
    },

    /**
     * Retrieves cached audio data (ArrayBuffer) if available.
     */
    async getAudio(key: string): Promise<ArrayBuffer | null> {
        try {
            const cached = await audioStorage.getItem<ArrayBuffer>(key);
            if (cached) {
                console.log(`[AudioCache] Hit: ${key}`);
                return cached;
            }
        } catch (e) {
            console.warn('[AudioCache] Read failed', e);
        }
        return null;
    },

    /**
     * Saves audio data (ArrayBuffer) to cache.
     */
    async saveAudio(key: string, data: ArrayBuffer): Promise<void> {
        try {
            await audioStorage.setItem(key, data);
            // console.log(`[AudioCache] Saved: ${key}`);
        } catch (e) {
            console.warn('[AudioCache] Write failed', e);
        }
    },

    /**
     * Clears the entire audio cache.
     */
    async clear(): Promise<void> {
        await audioStorage.clear();
    }
};
